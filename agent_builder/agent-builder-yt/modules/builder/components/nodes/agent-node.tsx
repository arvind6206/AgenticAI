"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AppIcon } from "@/components/app-icon";
import { isCustomToolConfig } from "@/modules/builder/lib/custom-tool";
import { getToolIcon, getToolLabel } from "@/modules/builder/lib/tools-catalog";
import { useCanvasStore } from "@/modules/builder/store/canvas-store";

type ToolEntry = { toolId: string; config?: unknown };

export function AgentNode({ id, data }: NodeProps) {
  const selectNode = useCanvasStore((s) => s.selectNode);
  const selectTool = useCanvasStore((s) => s.selectTool);
  const tools = (data.tools as ToolEntry[] | undefined) ?? [];

  return (
    <div className="min-w-[180px] max-w-[240px] rounded-xl border-2 border-primary bg-card px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <AppIcon name="bot" className="size-3.5" />
        Agent
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{(data.label as string) ?? "Main agent"}</p>
      {tools.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tools.map((tool, index) => (
            <button
              key={`${tool.toolId}-${index}`}
              type="button"
              className="nodrag nopan inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-1.5 py-0.5 text-[10px] leading-tight text-foreground"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                if (isCustomToolConfig(tool.config)) {
                  selectTool(index);
                  return;
                }
                selectNode(id);
              }}
            >
              <AppIcon name={getToolIcon(tool.toolId, tool.config)} className="size-3" />
              {getToolLabel(tool.toolId, tool.config)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
