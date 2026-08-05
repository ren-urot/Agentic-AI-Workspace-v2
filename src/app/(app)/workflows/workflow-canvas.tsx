"use client";

import { useCallback, useState } from "react";
import { useTheme } from "next-themes";
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NODE_PALETTE: { type: string; label: string }[] = [
  { type: "trigger", label: "Trigger" },
  { type: "ai-decision", label: "AI Decision" },
  { type: "api-call", label: "API Call" },
  { type: "approval", label: "Approval" },
  { type: "notification", label: "Notification" },
  { type: "task-completion", label: "Task Completion" },
];

const INITIAL_NODES: Node[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "Trigger" }, type: "input" },
  { id: "2", position: { x: 0, y: 120 }, data: { label: "AI Decision" } },
  { id: "3", position: { x: 0, y: 240 }, data: { label: "API Call" } },
  { id: "4", position: { x: 0, y: 360 }, data: { label: "Approval" } },
  { id: "5", position: { x: 0, y: 480 }, data: { label: "Notification" } },
  { id: "6", position: { x: 0, y: 600 }, data: { label: "Task Completion" }, type: "output" },
];

const INITIAL_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
  { id: "e5-6", source: "5", target: "6" },
];

let nodeIdCounter = INITIAL_NODES.length + 1;

export function WorkflowCanvas({ onSave }: { onSave: (name: string) => void }) {
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [name, setName] = useState("");

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const addNode = (label: string) => {
    const id = String(nodeIdCounter++);
    setNodes((nds) => [
      ...nds,
      { id, position: { x: 260, y: Math.random() * 400 }, data: { label } },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Workflow name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-[38px] bg-white sm:max-w-xs dark:bg-input/30"
        />
        <Button
          className="h-auto py-2 px-3"
          disabled={!name.trim()}
          onClick={() => {
            onSave(name.trim());
            setName("");
          }}
        >
          Save workflow
        </Button>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="w-full p-3 lg:w-48 lg:shrink-0">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Node palette</p>
          <div className="space-y-2">
            {NODE_PALETTE.map((item) => (
              <button
                key={item.type}
                onClick={() => addNode(item.label)}
                className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {item.label}
              </button>
            ))}
          </div>
        </Card>
        <div className="h-[600px] lg:flex-1 rounded-md border">
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
    </div>
  );
}
