"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkflowCanvas } from "./workflow-canvas";
import type { WorkflowSummary } from "@/lib/mock-data/types";

export function WorkflowsWorkspace({ initialWorkflows }: { initialWorkflows: WorkflowSummary[] }) {
  const [workflows, setWorkflows] = useState(initialWorkflows);

  function handleSave(name: string) {
    setWorkflows((prev) => [
      {
        id: crypto.randomUUID(),
        name,
        status: "draft",
        lastRun: "",
        successRate: 0,
      },
      ...prev,
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workflows.map((wf) => (
          <Card key={wf.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <CardTitle className="line-clamp-2 min-h-10 max-w-[130px] text-sm">{wf.name}</CardTitle>
              <div className="shrink-0">
                <StatusBadge status={wf.status} />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Success rate: {wf.successRate}% · Last run{" "}
              {wf.lastRun ? new Date(wf.lastRun).toLocaleString("en-US", { timeZone: "UTC" }) : "Never run"}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Canvas</h2>
        <WorkflowCanvas onSave={handleSave} />
      </div>
    </div>
  );
}
