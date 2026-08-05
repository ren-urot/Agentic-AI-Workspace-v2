"use client";

import { useTheme } from "next-themes";
import { Background, Controls, ReactFlow, type Edge, type Node, type OnConnect, type OnEdgesChange, type OnNodesChange } from "@xyflow/react";
import { Card } from "@/components/ui/card";

const NODE_PALETTE: { type: string; label: string }[] = [
  { type: "trigger", label: "Trigger" },
  { type: "ai-decision", label: "AI Decision" },
  { type: "api-call", label: "API Call" },
  { type: "approval", label: "Approval" },
  { type: "notification", label: "Notification" },
  { type: "task-completion", label: "Task Completion" },
];

export function WizardStepBuild({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onAddNode: (label: string) => void;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Card className="w-full p-3 lg:w-48 lg:shrink-0">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Node palette</p>
        <div className="space-y-2">
          {NODE_PALETTE.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onAddNode(item.label)}
              className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>
      <div className="h-[420px] rounded-md border lg:flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          colorMode={resolvedTheme === "dark" ? "dark" : "light"}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
