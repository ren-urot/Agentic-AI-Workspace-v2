"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRIGGER_TYPE_LABELS, type TriggerType, type WizardBasics } from "./wizard-types";

const TRIGGER_TYPES = Object.keys(TRIGGER_TYPE_LABELS) as TriggerType[];

export function WizardStepBasics({
  value,
  onChange,
  error,
}: {
  value: WizardBasics;
  onChange: (value: WizardBasics) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="automation-name">Automation name</Label>
        <Input
          id="automation-name"
          placeholder="e.g. New Lead Qualification"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "automation-name-error" : undefined}
        />
        {error && (
          <p id="automation-name-error" role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="automation-description">Description</Label>
        <Textarea
          id="automation-description"
          placeholder="What does this automation do?"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          className="h-24 min-h-24"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="automation-trigger">Trigger type</Label>
        <Select
          value={value.triggerType}
          onValueChange={(next) => onChange({ ...value, triggerType: next as TriggerType })}
        >
          <SelectTrigger id="automation-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {TRIGGER_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
