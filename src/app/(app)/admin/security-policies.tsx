"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { useAppStore, type SecurityPolicies as SecurityPoliciesState } from "@/lib/store/app-store";

const POLICIES: { id: keyof SecurityPoliciesState; label: string }[] = [
  { id: "mfa", label: "Require multi-factor authentication" },
  { id: "sso", label: "Require single sign-on" },
  { id: "session-timeout", label: "Automatically sign out after 30 minutes of inactivity" },
  { id: "ip", label: "Restrict access by IP allowlist" },
];

export function SecurityPolicies() {
  const { securityPolicies, setSecurityPolicy } = useAppStore();

  function handleChange(id: keyof SecurityPoliciesState, label: string, checked: boolean) {
    setSecurityPolicy(id, checked);
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
              checked={securityPolicies[policy.id]}
              onCheckedChange={(checked) => handleChange(policy.id, policy.label, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
