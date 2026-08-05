"use client";

import type { Node } from "@xyflow/react";
import type { Agent } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";
import { TRIGGER_TYPE_LABELS, type WizardBasics } from "./wizard-types";

export function WizardStepReview({
  basics,
  selectedAgents,
  nodes,
  activateNow,
  onActivateNowChange,
}: {
  basics: WizardBasics;
  selectedAgents: Agent[];
  nodes: Node[];
  activateNow: boolean;
  onActivateNowChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Name</dt>
          <dd className="text-sm">{basics.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Trigger</dt>
          <dd className="text-sm">{TRIGGER_TYPE_LABELS[basics.triggerType]}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground">Description</dt>
          <dd className="text-sm">{basics.description || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Assigned agent(s)</dt>
          <dd className="text-sm">{selectedAgents.map((a) => a.name).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Workflow steps</dt>
          <dd className="text-sm">
            {nodes.length} node{nodes.length === 1 ? "" : "s"} configured
          </dd>
        </div>
      </dl>
      <div className="space-y-2">
        <p className="text-sm font-medium">Status</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onActivateNowChange(false)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm",
              !activateNow ? "border-primary bg-chip-primary/40 font-medium" : "hover:bg-accent",
            )}
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={() => onActivateNowChange(true)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm",
              activateNow ? "border-primary bg-chip-primary/40 font-medium" : "hover:bg-accent",
            )}
          >
            Activate now
          </button>
        </div>
      </div>
    </div>
  );
}
