"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";

const PREFERENCES = [
  { id: "critical-alerts", label: "Critical alerts", description: "Agent failures and connector errors." },
  { id: "email-digest", label: "Email digest", description: "Daily summary of AI activity." },
  { id: "weekly-report", label: "Weekly usage report", description: "Cost and performance rollup every Monday." },
] as const;

export function NotificationSettings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "critical-alerts": true,
    "email-digest": true,
    "weekly-report": false,
  });

  return (
    <div className="divide-y divide-border">
      {PREFERENCES.map((pref, index) => (
        <div key={pref.id} className={index === 0 ? "flex items-center justify-between pb-3" : "flex items-center justify-between py-3"}>
          <div>
            <Label htmlFor={pref.id}>{pref.label}</Label>
            <p className="text-sm text-muted-foreground">{pref.description}</p>
          </div>
          <Switch
            id={pref.id}
            checked={enabled[pref.id]}
            onCheckedChange={(checked) => {
              setEnabled((prev) => ({ ...prev, [pref.id]: checked }));
              toast.success(checked ? `${pref.label} enabled` : `${pref.label} disabled`);
            }}
          />
        </div>
      ))}
    </div>
  );
}
