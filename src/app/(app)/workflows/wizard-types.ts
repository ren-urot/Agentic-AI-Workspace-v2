import type { LucideIcon } from "lucide-react";
import type { WorkflowTriggerType } from "@/lib/mock-data/types";

export type TriggerType = WorkflowTriggerType;

export { WORKFLOW_TRIGGER_TYPE_LABELS as TRIGGER_TYPE_LABELS } from "@/lib/mock-data/types";

export interface WizardBasics {
  name: string;
  description: string;
  triggerType: TriggerType;
}

export type WizardStepIndex = 1 | 2 | 3 | 4;

export interface WizardStepMeta {
  index: WizardStepIndex;
  title: string;
  icon: LucideIcon;
}
