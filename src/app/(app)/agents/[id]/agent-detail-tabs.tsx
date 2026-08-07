"use client";

import { useState, useTransition } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DragScrollX } from "@/components/shared/drag-scroll-x";
import { toast } from "@/lib/toast";
import { updateAgentPrompt, updateAgentTools, updateAgentMemory } from "./actions";
import type { Agent } from "@/lib/mock-data/types";

export function AgentDetailTabs({ agent }: { agent: Agent }) {
  const [, startTransition] = useTransition();
  const [prompt, setPrompt] = useState(agent.systemPrompt);
  const [saved, setSaved] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [clearSessionOpen, setClearSessionOpen] = useState(false);
  const [resetMemoryOpen, setResetMemoryOpen] = useState(false);

  return (
    <Tabs defaultValue="prompt" className="w-full">
      <DragScrollX>
        <TabsList>
          <TabsTrigger value="prompt">Prompt Configuration</TabsTrigger>
          <TabsTrigger value="tools">Tool Permissions</TabsTrigger>
          <TabsTrigger value="memory">Memory Management</TabsTrigger>
          <TabsTrigger value="performance">Performance Monitoring</TabsTrigger>
        </TabsList>
      </DragScrollX>

      <TabsContent value="prompt" className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setSaved(false);
            if (promptError) setPromptError(null);
          }}
          rows={8}
          aria-invalid={promptError ? true : undefined}
        />
        {promptError && <p className="text-xs text-destructive">{promptError}</p>}
        <Button
          onClick={() => {
            if (!prompt.trim()) {
              setPromptError("System prompt can't be empty.");
              toast.error("Couldn't save prompt", "System prompt can't be empty.");
              return;
            }
            startTransition(async () => {
              try {
                await updateAgentPrompt(agent.id, prompt);
                setSaved(true);
                toast.success("Prompt saved", `${agent.name}'s system prompt has been updated.`);
              } catch {
                toast.error("Couldn't save prompt", "Please try again.");
              }
            });
          }}
        >
          {saved ? "Saved" : "Save changes"}
        </Button>
      </TabsContent>

      <TabsContent value="tools">
        <Card>
          <CardContent className="space-y-2">
            {agent.toolPermissions.map((tool, i) => (
              <div key={tool.tool} className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor={`tool-${tool.tool}`}>{tool.tool}</Label>
                <Switch
                  id={`tool-${tool.tool}`}
                  checked={tool.enabled}
                  onCheckedChange={(checked) => {
                    const nextTools = agent.toolPermissions.map((t, idx) => (idx === i ? { ...t, enabled: checked } : t));
                    startTransition(async () => {
                      try {
                        await updateAgentTools(agent.id, nextTools);
                        toast.success(checked ? `${tool.tool} access enabled` : `${tool.tool} access disabled`);
                      } catch {
                        toast.error("Couldn't update tool access", "Please try again.");
                      }
                    });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="memory" className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm text-primary">Short-Term Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.shortTermMemory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No short-term memory entries.</p>
            ) : (
              agent.shortTermMemory.map((m) => (
                <div key={m.key} className="text-sm">
                  <span className="font-medium">{m.key}: </span>
                  <span className="text-muted-foreground">{m.value}</span>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setClearSessionOpen(true)}>
              Clear session
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm text-primary">Long-Term Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.longTermMemory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No long-term memory entries.</p>
            ) : (
              agent.longTermMemory.map((m) => (
                <div key={m.key} className="text-sm">
                  <span className="font-medium">{m.key}: </span>
                  <span className="text-muted-foreground">{m.value}</span>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setResetMemoryOpen(true)}>
              Reset memory
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{agent.tasksCompleted}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{agent.successRate}%</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Latency</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{agent.avgLatencyMs}ms</CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasks completed (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agent.performance}>
                <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <ConfirmDialog
        open={clearSessionOpen}
        onOpenChange={setClearSessionOpen}
        title="Clear session?"
        description="This will clear the agent's short-term memory for this session."
        onConfirm={() => {
          startTransition(async () => {
            try {
              await updateAgentMemory(agent.id, "short_term_memory", []);
              toast.success("Session cleared", "Short-term memory has been cleared.");
            } catch {
              toast.error("Couldn't clear session", "Please try again.");
            }
          });
        }}
      />
      <ConfirmDialog
        open={resetMemoryOpen}
        onOpenChange={setResetMemoryOpen}
        title="Reset memory?"
        description="This will reset the agent's long-term memory."
        onConfirm={() => {
          startTransition(async () => {
            try {
              await updateAgentMemory(agent.id, "long_term_memory", []);
              toast.success("Memory reset", "Long-term memory has been reset.");
            } catch {
              toast.error("Couldn't reset memory", "Please try again.");
            }
          });
        }}
      />
    </Tabs>
  );
}
