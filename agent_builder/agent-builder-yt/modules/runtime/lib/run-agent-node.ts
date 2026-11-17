import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import type { AgentNodeConfig } from "@/modules/workflows/lib/schema";
import { getToolsForAgent } from "@/modules/tools/lib/registry";
import type { RunEvent } from "./run-agent";

type RunAgentNodeOptions = {
  config: AgentNodeConfig;
  history: { role: string; content: string }[];
  userMessage: string;
  userId: string;
  maxToolCalls: number;
  onEvent: (event: RunEvent) => void;
};

export async function runAgentNode({
  config,
  history,
  userMessage,
  userId,
  maxToolCalls,
  onEvent,
}: RunAgentNodeOptions) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Add OPENAI_API_KEY to .env");
  }

  const tools = await getToolsForAgent(config, userId);
  const model = new ChatOpenAI({
    model: config.modelId,
    apiKey,
  });

  const modelWithTools = tools.length > 0 ? model.bindTools(tools) : model;

  const messages: BaseMessage[] = [
    new SystemMessage(config.instructions),
    ...history.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
    new HumanMessage(userMessage),
  ];

  let toolCallCount = 0;
  let finalText = "";

  while (true) {
    // Stream the reply so the user sees text as it is generated.
    // Each chunk is a small piece; we join them into one full message.
    let response: AIMessageChunk | undefined;

    for await (const chunk of await modelWithTools.stream(messages)) {
      response = response ? response.concat(chunk) : chunk;

      if (chunk.text) {
        finalText += chunk.text;
        onEvent({ type: "text_delta", text: chunk.text });
      }
    }

    if (!response) {
      throw new Error("The model returned an empty response");
    }

    messages.push(response);

    const toolCalls = response.tool_calls ?? [];

    // No tool calls means the model is done answering.
    if (toolCalls.length === 0) {
      return finalText;
    }

    for (const call of toolCalls) {
      toolCallCount++;

      if (toolCallCount > maxToolCalls) {
        throw new Error(`Too many tool calls (limit is ${maxToolCalls})`);
      }

      onEvent({ type: "tool_started", tool: call.name, input: call.args });

      const matchedTool = tools.find((t) => t.name === call.name);
      let output = "Tool not found";

      if (matchedTool) {
        try {
          output = String(await matchedTool.invoke(call.args));
        } catch (err) {
          output = err instanceof Error ? err.message : "Tool failed";
        }
      }

      onEvent({ type: "tool_completed", tool: call.name, output });

      messages.push(
        new ToolMessage({
          content: output,
          tool_call_id: call.id ?? call.name,
        })
      );
    }
  }
}
