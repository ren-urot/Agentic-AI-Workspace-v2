"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { runWorkflow } from "./actions";

const STEP_DELAY_MS = 850;

function buildSteps(agentName: string): string[] {
  return [
    "Trigger fired",
    `${agentName} is deciding the next action`,
    "Calling connected integration",
    "Awaiting approval — approved",
    "Sending notification",
    "Task completed",
  ];
}

export function RunAutomationModal({
  open,
  onOpenChange,
  workflowId,
  workflowName,
  agentNames,
  agentKeys,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowName: string;
  agentNames: string[];
  agentKeys: string[];
}) {
  const steps = buildSteps(agentNames[0] ?? "The agent");
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);

  // Mounted only while a run is in progress (see workflows-workspace.tsx),
  // with a fresh `key` per run, so this effect only ever needs to run once
  // per mount -- no reset-on-close branch needed.
  useEffect(() => {
    let cancelled = false;
    let i = 0;

    function advance() {
      if (cancelled) return;
      i += 1;
      if (i >= steps.length) {
        setDone(true);
        runWorkflow(workflowId, workflowName, agentKeys).catch(() => {
          toast.error("Run didn't save", "The animation finished but saving the result failed.");
        });
        return;
      }
      setStepIndex(i);
      timer = window.setTimeout(advance, STEP_DELAY_MS);
    }

    let timer = window.setTimeout(advance, STEP_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog open={open} onOpenChange={done ? onOpenChange : () => {}}>
      <DialogContent showCloseButton={done} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Running &quot;{workflowName}&quot;</DialogTitle>
          <DialogDescription>{done ? "Completed successfully." : "Executing steps…"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {steps.map((label, i) => {
            const state = done || i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
            return (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                {state === "done" && <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />}
                {state === "active" && <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />}
                {state === "pending" && <Circle className="size-4 shrink-0 text-muted-foreground/40" aria-hidden="true" />}
                <span className={state === "pending" ? "text-muted-foreground" : ""}>{label}</span>
              </div>
            );
          })}
        </div>
        {done && (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
