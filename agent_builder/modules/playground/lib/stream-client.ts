export type StreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_started"; tool: string; input: unknown }
  | { type: "tool_completed"; tool: string; output: string }
  | { type: "run_completed"; conversationId: string }
  | { type: "run_failed"; error: string; conversationId?: string };

export async function streamAgentRun(
  agentId: string,
  body: { message: string; conversationId?: string; definition: unknown },
  onEvent: (event: StreamEvent) => void
) {
  try {
    const res = await fetch(`/api/agents/${agentId}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      const text = await res.text();
      onEvent({ type: "run_failed", error: text || `Request failed (${res.status})` });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Server-sent events look like "data: {...}\n\n".
      // A network chunk can end in the middle of a line, so we keep the leftover in `buffer`.
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        onEvent(JSON.parse(line.slice(6)) as StreamEvent);
      }
    }
  } catch {
    onEvent({ type: "run_failed", error: "Could not reach the server. Please try again." });
  }
}
