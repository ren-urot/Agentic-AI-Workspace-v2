"use client";

import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AppearanceSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor="dark-mode-switch">Dark mode</Label>
        <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
      </div>
      <Switch
        id="dark-mode-switch"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
}
