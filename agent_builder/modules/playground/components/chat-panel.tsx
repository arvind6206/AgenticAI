"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/modules/builder/store/canvas-store";
import { getToolLabel } from "@/modules/builder/lib/tools-catalog";
import { streamAgentRun } from "@/modules/playground/lib/stream-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Input } from "@/components/ui/input";
import { Message, MessageContent, MessageGroup } from "@/components/ui/message";
import { Spinner } from "@/components/ui/spinner";

type ToolStatus = { tool: string; status: "running" | "done" };

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  tools?: ToolStatus[];
  isError?: boolean;
};

export function ChatPanel({
  agentId,
  welcomeMessage,
  starterPrompts,
}: {
  agentId: string;
  welcomeMessage?: string;
  starterPrompts?: string[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [isRunning, setIsRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Replace the last message (the assistant reply we are building).
  function updateLastMessage(patch: Partial<ChatMessage>) {
    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { ...copy[copy.length - 1], ...patch };
      return copy;
    });
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isRunning) return;

    setInput("");
    setIsRunning(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", tools: [] },
    ]);

    let assistantText = "";
    const tools: ToolStatus[] = [];

    // Read the canvas right now, so the test uses your latest (even unsaved) changes.
    const definition = useCanvasStore.getState().getDefinition();

    await streamAgentRun(agentId, { message: text, conversationId, definition }, (event) => {
      if (event.type === "text_delta") {
        assistantText += event.text;
        updateLastMessage({ content: assistantText });
      }

      if (event.type === "tool_started") {
        tools.push({ tool: event.tool, status: "running" });
        updateLastMessage({ tools: [...tools] });
      }

      if (event.type === "tool_completed") {
        const running = tools.find((t) => t.tool === event.tool && t.status === "running");
        if (running) running.status = "done";
        updateLastMessage({ tools: [...tools] });
      }

      if (event.type === "run_completed") {
        setConversationId(event.conversationId);
      }

      if (event.type === "run_failed") {
        if (event.conversationId) setConversationId(event.conversationId);
        updateLastMessage({ content: event.error, isError: true });
      }
    });

    setIsRunning(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {welcomeMessage || "Send a message to test your agent."}
            </p>
            <div className="flex flex-wrap gap-2">
              {(starterPrompts ?? []).map((prompt) => (
                <Button key={prompt} variant="outline" size="sm" onClick={() => sendMessage(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        <MessageGroup>
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1;
            const variant = msg.role === "user" ? "default" : msg.isError ? "destructive" : "muted";

            return (
              <Message key={i} align={msg.role === "user" ? "end" : "start"}>
                <MessageContent>
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {msg.tools.map((t, j) => (
                        <Badge key={j} variant="outline">
                          {getToolLabel(t.tool)} {t.status === "running" ? "…" : "✓"}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Bubble variant={variant}>
                    <BubbleContent className="whitespace-pre-wrap">
                      {msg.content || (isRunning && isLast ? <Spinner /> : "")}
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            );
          })}
        </MessageGroup>

        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your agent..."
          disabled={isRunning}
        />
        <Button type="submit" disabled={isRunning || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
