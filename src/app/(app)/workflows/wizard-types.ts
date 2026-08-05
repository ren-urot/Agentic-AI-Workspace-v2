import type { LucideIcon } from "lucide-react";

export type TriggerType = "manual" | "scheduled" | "event" | "webhook";

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  manual: "Manual",
  scheduled: "Scheduled",
  event: "Event-based",
  webhook: "Webhook",
};

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
