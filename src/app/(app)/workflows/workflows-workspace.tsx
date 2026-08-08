"use client";

import { useTransition } from "react";
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
import { createWorkflow, updateWorkflowStatus } from "./actions";
import { useState } from "react";
import { WORKFLOW_TRIGGER_TYPE_LABELS } from "@/lib/mock-data/types";
import type { Agent, WorkflowStatus, WorkflowSummary } from "@/lib/mock-data/types";

const STATUS_OPTIONS: WorkflowStatus[] = ["active", "paused", "draft"];

export function WorkflowsWorkspace({
  initialWorkflows,
  agents,
}: {
  initialWorkflows: WorkflowSummary[];
  agents: Agent[];
}) {
  const [, startTransition] = useTransition();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const workflows = initialWorkflows;

  function handleCreate(workflow: WorkflowSummary) {
    setIsWizardOpen(false);
    startTransition(async () => {
      try {
        await createWorkflow({
          name: workflow.name,
          status: workflow.status,
          triggerType: workflow.triggerType,
          agentIds: workflow.agentIds,
        });
      } catch {
        toast.error("Couldn't create automation", "Please try again.");
      }
    });
  }

  function handleStatusChange(id: string, status: WorkflowStatus) {
    const workflow = workflows.find((wf) => wf.id === id);
    if (!workflow) return;
    startTransition(async () => {
      try {
        await updateWorkflowStatus(id, status, workflow.name);
        toast.success("Status updated", `"${workflow.name}" is now ${status}.`);
      } catch {
        toast.error("Couldn't update status", "Please try again.");
      }
    });
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
          {workflows.map((wf) => {
            const assignedAgents = agents.filter((a) => wf.agentIds.includes(a.id));
            return (
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
                  <p>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                      {WORKFLOW_TRIGGER_TYPE_LABELS[wf.triggerType]}
                    </span>{" "}
                    trigger
                  </p>
                  <p className="mt-1">
                    Success rate: {wf.successRate}% · Last run{" "}
                    {wf.lastRun ? new Date(wf.lastRun).toLocaleString("en-US", { timeZone: "UTC" }) : "Never run"}
                  </p>
                  {assignedAgents.length > 0 && (
                    <p className="mt-1 truncate">Agents: {assignedAgents.map((a) => a.name).join(", ")}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isWizardOpen && (
        <CreateAutomationWizard agents={agents} onCreate={handleCreate} onClose={() => setIsWizardOpen(false)} />
      )}
    </div>
  );
}
