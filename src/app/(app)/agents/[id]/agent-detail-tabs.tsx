"use client";

import { useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent } from "@/lib/mock-data/types";

export function AgentDetailTabs({ agent }: { agent: Agent }) {
  const [prompt, setPrompt] = useState(agent.systemPrompt);
  const [saved, setSaved] = useState(false);
  const [tools, setTools] = useState(agent.toolPermissions);

  return (
    <Tabs defaultValue="prompt" className="w-full">
      <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="prompt">Prompt Configuration</TabsTrigger>
          <TabsTrigger value="tools">Tool Permissions</TabsTrigger>
          <TabsTrigger value="memory">Memory Management</TabsTrigger>
          <TabsTrigger value="performance">Performance Monitoring</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="prompt" className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setSaved(false);
          }}
          rows={8}
        />
        <Button
          onClick={() => setSaved(true)}
        >
          {saved ? "Saved" : "Save changes"}
        </Button>
      </TabsContent>

      <TabsContent value="tools" className="space-y-4">
        {tools.map((tool, i) => (
          <div key={tool.tool} className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor={`tool-${tool.tool}`}>{tool.tool}</Label>
            <Switch
              id={`tool-${tool.tool}`}
              checked={tool.enabled}
              onCheckedChange={(checked) =>
                setTools((prev) => prev.map((t, idx) => (idx === i ? { ...t, enabled: checked } : t)))
              }
            />
          </div>
        ))}
      </TabsContent>

      <TabsContent value="memory" className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Short-Term Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.shortTermMemory.map((m) => (
              <div key={m.key} className="text-sm">
                <span className="font-medium">{m.key}: </span>
                <span className="text-muted-foreground">{m.value}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2">
              Clear session
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Long-Term Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.longTermMemory.map((m) => (
              <div key={m.key} className="text-sm">
                <span className="font-medium">{m.key}: </span>
                <span className="text-muted-foreground">{m.value}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2">
              Reset memory
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasks completed (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agent.performance}>
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
