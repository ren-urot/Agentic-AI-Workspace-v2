import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AppearanceSettings } from "./appearance-settings";
import { NotificationSettings } from "./notification-settings";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-6">
      <PageHeader title="Settings" description="Configure your workspace preferences." />

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <AppearanceSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSettings />
        </CardContent>
      </Card>
    </div>
  );
}
