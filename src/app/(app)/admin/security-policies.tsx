"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

const POLICIES = [
  { id: "mfa", label: "Require multi-factor authentication", defaultChecked: true },
  { id: "sso", label: "Require single sign-on", defaultChecked: false },
  { id: "session-timeout", label: "Automatically sign out after 30 minutes of inactivity", defaultChecked: true },
  { id: "ip", label: "Restrict access by IP allowlist", defaultChecked: false },
] as const;

export function SecurityPolicies() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(POLICIES.map((p) => [p.id, p.defaultChecked]))
  );

  function handleChange(id: string, label: string, checked: boolean) {
    setState((prev) => ({ ...prev, [id]: checked }));
    toast.success(checked ? "Policy enabled" : "Policy disabled", label);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Policies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {POLICIES.map((policy) => (
          <div key={policy.id} className="flex items-center justify-between">
            <Label htmlFor={policy.id}>{policy.label}</Label>
            <Switch
              id={policy.id}
              checked={state[policy.id]}
              onCheckedChange={(checked) => handleChange(policy.id, policy.label, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
