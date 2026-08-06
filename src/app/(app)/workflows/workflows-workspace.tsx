"use client";

import { useState } from "react";
import { Plus, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateAutomationWizard } from "./create-automation-wizard";
import { toast } from "@/lib/toast";
import type { Agent, WorkflowStatus, WorkflowSummary } from "@/lib/mock-data/types";

const STATUS_OPTIONS: WorkflowStatus[] = ["active", "paused", "draft"];

export function WorkflowsWorkspace({
  initialWorkflows,
  initialAgents,
}: {
  initialWorkflows: WorkflowSummary[];
  initialAgents: Agent[];
}) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  function handleCreate(workflow: WorkflowSummary) {
    setWorkflows((prev) => [workflow, ...prev]);
    setIsWizardOpen(false);
  }

  function handleStatusChange(id: string, status: WorkflowStatus) {
    setWorkflows((prev) => prev.map((wf) => (wf.id === id ? { ...wf, status } : wf)));
    const workflow = workflows.find((wf) => wf.id === id);
    if (workflow) {
      toast.success("Status updated", `"${workflow.name}" is now ${status}.`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Your automations</h2>
        <Button onClick={() => setIsWizardOpen(true)}>
          <Plus className="size-4" />
          Create Automation
        </Button>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No automations yet"
          description="Create your first automation to start automating business processes with AI agents."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflows.map((wf) => (
            <Card key={wf.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <CardTitle className="line-clamp-2 min-h-10 max-w-[130px] text-sm">{wf.name}</CardTitle>
                <div className="flex shrink-0 items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          aria-label={`Change status for ${wf.name}`}
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <StatusBadge status={wf.status} />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      {STATUS_OPTIONS.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          disabled={status === wf.status}
                          onClick={() => handleStatusChange(wf.id, status)}
                          className="capitalize"
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Success rate: {wf.successRate}% · Last run{" "}
                {wf.lastRun ? new Date(wf.lastRun).toLocaleString("en-US", { timeZone: "UTC" }) : "Never run"}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isWizardOpen && (
        <CreateAutomationWizard agents={initialAgents} onCreate={handleCreate} onClose={() => setIsWizardOpen(false)} />
      )}
    </div>
  );
}
