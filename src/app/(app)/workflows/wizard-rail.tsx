"use client";

import { BadgeCheck, Check, LayoutTemplate, ShieldCheck, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStepIndex, WizardStepMeta } from "./wizard-types";

export const WIZARD_STEPS: WizardStepMeta[] = [
  { index: 1, title: "Basics", icon: LayoutTemplate },
  { index: 2, title: "Assign Agent", icon: BadgeCheck },
  { index: 3, title: "Build Workflow", icon: Workflow },
  { index: 4, title: "Review & Activate", icon: ShieldCheck },
];

export function WizardRail({
  currentStep,
  maxReached,
  onStepClick,
}: {
  currentStep: WizardStepIndex;
  maxReached: WizardStepIndex;
  onStepClick: (step: WizardStepIndex) => void;
}) {
  return (
    <div className="w-full shrink-0 rounded-xl border bg-card p-2 shadow-sm lg:w-[250px] lg:min-h-[500px]">
      <nav className="flex flex-col gap-1" aria-label="Create automation steps">
        {WIZARD_STEPS.map((step) => {
          const completed = step.index < currentStep;
          const current = step.index === currentStep;
          const clickable = step.index <= maxReached;
          const Icon = step.icon;

          return (
            <button
              key={step.index}
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick(step.index)}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                current && "bg-sidebar-active",
                !clickable && "cursor-not-allowed opacity-50",
                clickable && !current && "hover:bg-sidebar-active/60",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  completed && "bg-chip-success text-chip-success-foreground",
                  current && "bg-chip-primary text-chip-primary-foreground",
                  !completed && !current && "bg-muted text-muted-foreground",
                )}
              >
                {completed ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-xs text-muted-foreground", current && "text-foreground")}>
                  Step {step.index} of {WIZARD_STEPS.length}
                </span>
                <span className={cn("block truncate text-sm font-medium", current && "text-foreground")}>
                  {step.title}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
