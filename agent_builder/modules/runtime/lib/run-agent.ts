import type { BuilderDefinition } from "@/modules/workflows/lib/schema";
import { compileWorkflow } from "./compile-workflow";

export type RunEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_started"; tool: string; input: unknown }
  | { type: "tool_completed"; tool: string; output: string };

export async function runAgentStream(
  definition: BuilderDefinition,
  history: { role: string; content: string }[],
  userMessage: string,
  userId: string,
  onEvent: (event: RunEvent) => void
) {
  const graph = compileWorkflow(definition, { userId, onEvent });

  const result = await graph.invoke(
    {
      userMessage,
      // Memory on = the agent sees earlier messages. Memory off = every message starts fresh.
      history: definition.memory.enabled ? history : [],
      output: "",
      stepCount: 0,
    },
    // Stop the whole run if it takes longer than the agent's time limit.
    { signal: AbortSignal.timeout(definition.limits.timeoutMs) }
  );

  return result.output;
}
