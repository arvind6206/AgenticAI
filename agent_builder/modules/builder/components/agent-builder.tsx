"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaveAgent } from "@/modules/agents/hooks/use-agents";
import { AgentCanvas } from "@/modules/builder/components/agent-canvas";
import { NodeSettingsPanel } from "@/modules/builder/components/node-settings-panel";
import { useCanvasStore } from "@/modules/builder/store/canvas-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { ToolPicker } from "./tool-picker";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ChatPanel } from "@/modules/playground/components/chat-panel";

type AgentBuilderProps = {
  agent: {
    id: string;
    name: string;
    description: string;
    icon: string;
    draftDefinition: unknown;
    canvas: unknown;
    welcomeMessage?: string;
    starterPrompts?: unknown;
  };
};

export function AgentBuilder({ agent }: AgentBuilderProps) {
  const init = useCanvasStore((s) => s.init);
  const isCanvasDirty = useCanvasStore((s) => s.isDirty);
  const settingsOpen = useCanvasStore((s) => s.settingsOpen);
  const setSettingsOpen = useCanvasStore((s) => s.setSettingsOpen);
  const getDefinition = useCanvasStore((s) => s.getDefinition);
  const getCanvas = useCanvasStore((s) => s.getCanvas);
  const markClean = useCanvasStore((s) => s.markClean);

  const saveAgent = useSaveAgent(agent.id);

  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const hasUnsavedChanges =
    isCanvasDirty || name !== agent.name || description !== agent.description;

  // Load this agent's saved graph into the canvas.
  // We only re-run this when you open a different agent, not after every save,
  // so your selection and open drawers don't reset.
  useEffect(() => {
    init(agent.draftDefinition, agent.canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  // Warn before closing the tab or refreshing with unsaved work.
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  function handleSave() {
    saveAgent.mutate(
      {
        name: name.trim() || "Untitled Agent",
        description,
        draftDefinition: getDefinition(),
        canvas: getCanvas(),
      },
      {
        onSuccess: () => {
          markClean();
          toast.add({ title: "Agent saved", type: "success" });
        },
        onError: (error) => {
          toast.add({ title: "Could not save agent", description: error.message, type: "error" });
        },
      }
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
            {agent.icon}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-lg font-semibold">{name || "Untitled Agent"}</h1>
            <p className="text-muted-foreground text-xs">
              Visual builder {hasUnsavedChanges ? "· unsaved changes" : "· saved"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setToolsOpen(true)}>
            Tools
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => setChatOpen(true)}>
            Test Chat
          </Button>
          <Button onClick={handleSave} disabled={saveAgent.isPending || !hasUnsavedChanges}>
            {saveAgent.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href="/agents"
                onClick={(event) => {
                  if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Leave anyway?")) {
                    event.preventDefault();
                  }
                }}
              />
            }
          >
            Back
          </Button>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 bg-muted/20">
        <AgentCanvas />
      </main>

      {/* Hide the tools drawer while settings are open (e.g. right after adding a custom tool). */}
      <Drawer open={toolsOpen && !settingsOpen} onOpenChange={setToolsOpen} swipeDirection="left">
        <DrawerContent className="max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Add capabilities</DrawerTitle>
            <DrawerDescription>Pick tools and memory for this agent.</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <ToolPicker />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={chatOpen} onOpenChange={setChatOpen} swipeDirection="up">
        <DrawerContent className="h-[70vh] max-h-[70vh]">
          <DrawerHeader>
            <DrawerTitle>Test chat</DrawerTitle>
            <DrawerDescription>
              Try your agent with the current canvas. Unsaved changes are included.
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatPanel
              agentId={agent.id}
              welcomeMessage={agent.welcomeMessage}
              starterPrompts={(agent.starterPrompts as string[]) ?? []}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={settingsOpen} onOpenChange={setSettingsOpen} swipeDirection="right">
        <DrawerContent className="max-w-md">
          <DrawerHeader>
            <DrawerTitle>Agent settings</DrawerTitle>
            <DrawerDescription>Edit agent info and the selected node.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-6 overflow-y-auto px-4 pb-6">
            <div className="space-y-3">
              <h2 className="text-sm font-medium">Agent info</h2>
              <div className="space-y-2">
                <Label htmlFor="agent-name">Name</Label>
                <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-desc">Description</Label>
                <Input
                  id="agent-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <NodeSettingsPanel />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
