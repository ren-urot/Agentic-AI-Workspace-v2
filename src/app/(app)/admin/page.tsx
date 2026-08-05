import { getAuditLogs, getAgentCosts, getPermissions, getRolePermissions, getUsageSeries, getUsers } from "@/lib/mock-data/admin";
import { PageHeader } from "@/components/shared/page-header";
import { DragScrollX } from "@/components/shared/drag-scroll-x";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersWorkspace } from "./users-workspace";
import { AuditLogTable } from "./audit-log-table";
import { RolesPermissions } from "./roles-permissions";
import { AiUsageMonitoring } from "./ai-usage";
import { SecurityPolicies } from "./security-policies";
import { OrganizationSettings } from "./organization-settings";

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
        <DragScrollX>
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security Policies</TabsTrigger>
            <TabsTrigger value="usage">AI Usage Monitoring</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>
        </DragScrollX>

        <TabsContent value="users">
          <UsersWorkspace initialUsers={users} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesPermissions permissions={permissions} initialMatrix={rolePermissions} />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogTable logs={logs} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityPolicies />
        </TabsContent>

        <TabsContent value="usage">
          <AiUsageMonitoring usage={usage} costs={costs} />
        </TabsContent>

        <TabsContent value="settings">
          <OrganizationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
