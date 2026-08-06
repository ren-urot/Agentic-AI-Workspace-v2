"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useAppStore } from "@/lib/store/app-store";

const LOCALE_PATTERN = /^[a-z]{2}-[A-Z]{2}$/;
const TIMEZONE_PATTERN = /^[A-Za-z_]+\/[A-Za-z_]+$/;

export function OrganizationSettings() {
  const { orgSettings, setOrgSettings } = useAppStore();
  const [orgName, setOrgName] = useState(orgSettings.orgName);
  const [timezone, setTimezone] = useState(orgSettings.timezone);
  const [locale, setLocale] = useState(orgSettings.locale);
  const [errors, setErrors] = useState<{ orgName?: string; timezone?: string; locale?: string }>({});

  function handleSave() {
    const nextErrors: typeof errors = {};
    if (!orgName.trim()) nextErrors.orgName = "Organization name is required.";
    if (!TIMEZONE_PATTERN.test(timezone.trim())) nextErrors.timezone = "Use IANA format, e.g. America/New_York.";
    if (!LOCALE_PATTERN.test(locale.trim())) nextErrors.locale = "Use locale format, e.g. en-US.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Couldn't save settings", "Fix the highlighted fields and try again.");
      return;
    }

    setOrgSettings({ orgName: orgName.trim(), timezone: timezone.trim(), locale: locale.trim() });
    toast.success("Settings saved", "Organization settings have been updated.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Organization Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            aria-invalid={errors.orgName ? true : undefined}
          />
          {errors.orgName && <p className="text-xs text-destructive">{errors.orgName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            aria-invalid={errors.timezone ? true : undefined}
          />
          {errors.timezone && <p className="text-xs text-destructive">{errors.timezone}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="default-locale">Default locale</Label>
          <Input
            id="default-locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-invalid={errors.locale ? true : undefined}
          />
          {errors.locale && <p className="text-xs text-destructive">{errors.locale}</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save changes</Button>
      </CardFooter>
    </Card>
  );
}
