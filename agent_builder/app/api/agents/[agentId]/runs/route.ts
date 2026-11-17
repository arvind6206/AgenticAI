import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { auth } from "@/lib/auth";
import { runAgentStream } from "@/modules/runtime/lib/run-agent";
import { builderDefinitionSchema } from "@/modules/workflows/lib/schema";
import { loadBuilderDefinition } from "@/modules/workflows/lib/migrate-v1";

// What the chat panel sends us. `definition` is the (maybe unsaved) canvas.
// If it is missing we fall back to the agent's saved draft.
const runRequestSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty"),
  conversationId: z.string().optional(),
  definition: builderDefinitionSchema.optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { agentId } = await params;

  const parsed = runRequestSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return new Response(parsed.error.issues[0]?.message ?? "Invalid request", {
      status: 400,
    });
  }

  const { message, conversationId } = parsed.data;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: session.user.id },
  });

  if (!agent) {
    return new Response("Not found", { status: 404 });
  }

  const definition =
    parsed.data.definition ?? loadBuilderDefinition(agent.draftDefinition);

  let conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, userId: session.user.id, agentId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        agentId,
        title: message.slice(0, 60),
      },
      include: { messages: true },
    });
  }

  const conversationIdToUse = conversation.id;

  const history = conversation.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  await prisma.message.create({
    data: {
      conversationId: conversationIdToUse,
      role: "user",
      content: message,
    },
  });

  const toolEvents: { tool: string; status: string; input?: unknown; output?: string }[] = [];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const assistantText = await runAgentStream(
          definition,
          history,
          message,
          session.user.id,
          (event) => {
            if (event.type === "tool_started") {
              toolEvents.push({ tool: event.tool, input: event.input, status: "started" });
            }
            if (event.type === "tool_completed") {
              toolEvents.push({ tool: event.tool, output: event.output, status: "completed" });
            }
            send(event);
          },
        );

        await prisma.message.create({
          data: {
            conversationId: conversationIdToUse,
            role: "assistant",
            content: assistantText || "No response",
            toolEvents: toolEvents as Prisma.InputJsonValue,
          },
        });

        send({ type: "run_completed", conversationId: conversationIdToUse });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Run failed";
        send({ type: "run_failed", error, conversationId: conversationIdToUse });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
