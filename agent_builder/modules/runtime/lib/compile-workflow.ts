import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { BuilderDefinition } from "@/modules/workflows/lib/schema";
import { runAgentNode } from "./run-agent-node";
import type { RunEvent } from "./run-agent";
import { validateGraph } from "./validate-graph";

const WorkflowState = Annotation.Root({
  userMessage: Annotation<string>,
  history: Annotation<{ role: string; content: string }[]>,
  output: Annotation<string>,
  stepCount: Annotation<number>,
});

export type WorkflowContext = {
  userId: string;
  onEvent: (event: RunEvent) => void;
};

export function compileWorkflow(def: BuilderDefinition, ctx: WorkflowContext) {
  validateGraph(def);

  // Our node names come from the saved graph, so they are plain strings.
  // The last type argument (`string`) tells LangGraph any string is a valid node name.
  const builder = new StateGraph<
    typeof WorkflowState,
    typeof WorkflowState.State,
    typeof WorkflowState.Update,
    string
  >(WorkflowState);

  for (const node of def.nodes) {
    if (node.type === "start") {
      builder.addNode(node.id, async (state) => ({
        stepCount: (state.stepCount ?? 0) + 1,
      }));
    }

    if (node.type === "agent") {
      builder.addNode(node.id, async (state) => {
        if ((state.stepCount ?? 0) >= def.limits.maxGraphSteps) {
          throw new Error("Too many workflow steps");
        }

        const text = await runAgentNode({
          config: node.config,
          history: state.history ?? [],
          userMessage: state.userMessage,
          userId: ctx.userId,
          maxToolCalls: def.limits.maxToolCalls,
          onEvent: ctx.onEvent,
        });

        return {
          output: text,
          stepCount: (state.stepCount ?? 0) + 1,
        };
      });
    }

    if (node.type === "end") {
      builder.addNode(node.id, async (state) => ({
        output: state.output ?? "",
        stepCount: (state.stepCount ?? 0) + 1,
      }));
    }
  }

  for (const edge of def.edges) {
    builder.addEdge(edge.source, edge.target);
  }

  const startNode = def.nodes.find((n) => n.type === "start")!;
  const endNode = def.nodes.find((n) => n.type === "end")!;

  builder.addEdge(START, startNode.id);
  builder.addEdge(endNode.id, END);

  return builder.compile();
}
