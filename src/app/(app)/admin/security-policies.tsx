"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { setSecurityPolicy } from "./actions";

const POLICIES = [
  { id: "mfa", label: "Require multi-factor authentication" },
  { id: "sso", label: "Require single sign-on" },
  { id: "session-timeout", label: "Automatically sign out after 30 minutes of inactivity" },
  { id: "ip", label: "Restrict access by IP allowlist" },
] as const;

export function SecurityPolicies({ policies }: { policies: Record<string, boolean> }) {
  const [, startTransition] = useTransition();

  function handleChange(id: string, label: string, checked: boolean) {
    startTransition(async () => {
      try {
        await setSecurityPolicy(id, checked);
        toast.success(checked ? "Policy enabled" : "Policy disabled", label);
      } catch {
        toast.error("Couldn't update policy", "Please try again.");
      }
    });
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
              checked={policies[policy.id] ?? false}
              onCheckedChange={(checked) => handleChange(policy.id, policy.label, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
