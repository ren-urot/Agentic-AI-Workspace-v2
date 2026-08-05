"use client";

import { Check } from "lucide-react";
import { AgentIcon } from "@/components/shared/agent-icon";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/mock-data/types";

export function WizardStepAgents({
  agents,
  selectedIds,
  onChange,
}: {
  agents: Agent[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Choose which AI agent(s) will carry out this automation.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {agents.map((agent) => {
          const checked = selectedIds.includes(agent.id);
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => toggle(agent.id)}
              aria-pressed={checked}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                checked ? "border-primary bg-chip-primary/40" : "hover:bg-accent",
              )}
            >
              <AgentIcon type={agent.type} className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{agent.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{agent.description}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border",
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                )}
              >
                {checked && <Check className="size-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
