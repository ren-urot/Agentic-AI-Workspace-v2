import { getAuditLogs, getAgentCosts, getPermissions, getRolePermissions, getUsageSeries, getUsers } from "@/lib/mock-data/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UsersWorkspace } from "./users-workspace";
import { AuditLogTable } from "./audit-log-table";
import { RolesPermissions } from "./roles-permissions";
import { AiUsageMonitoring } from "./ai-usage";

export default async function AdminPage() {
  const [users, logs, permissions, rolePermissions, usage, costs] = await Promise.all([
    getUsers(),
    getAuditLogs(),
    getPermissions(),
    getRolePermissions(),
    getUsageSeries(),
    getAgentCosts(),
  ]);

  return (
    <div>
      <PageHeader title="Administration" description="Manage users, security policies, and system settings." />

      <Tabs defaultValue="users">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security Policies</TabsTrigger>
            <TabsTrigger value="usage">AI Usage Monitoring</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users">
          <UsersWorkspace initialUsers={users} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesPermissions permissions={permissions} initialMatrix={rolePermissions} />
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-6">
              <AuditLogTable logs={logs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mfa">Require multi-factor authentication</Label>
                <Switch id="mfa" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sso">Require single sign-on</Label>
                <Switch id="sso" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="session-timeout">Automatically sign out after 30 minutes of inactivity</Label>
                <Switch id="session-timeout" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ip">Restrict access by IP allowlist</Label>
                <Switch id="ip" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <AiUsageMonitoring usage={usage} costs={costs} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input id="org-name" defaultValue="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="America/New_York" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-locale">Default locale</Label>
                <Input id="default-locale" defaultValue="en-US" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
