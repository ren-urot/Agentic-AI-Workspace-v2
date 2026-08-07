import { getUsageSeries, getAgentCosts, getPermissions } from "@/lib/mock-data/admin";
import { PageHeader } from "@/components/shared/page-header";
import { DragScrollX } from "@/components/shared/drag-scroll-x";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersWorkspace } from "./users-workspace";
import { AuditLogTable } from "./audit-log-table";
import { RolesPermissions } from "./roles-permissions";
import { AiUsageMonitoring } from "./ai-usage";
import { SecurityPolicies } from "./security-policies";
import { OrganizationSettings } from "./organization-settings";
import { getCurrentProfile } from "@/lib/db/profile";
import {
  getOrgUsers,
  getOrgRolePermissions,
  getOrgSecurityPolicies,
  getOrgSettings,
  getOrgAuditLogs,
} from "@/lib/db/admin";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  const [permissions, usage, costs, users, rolePermissions, securityPolicies, orgSettings, auditLogs] = await Promise.all([
    getPermissions(),
    getUsageSeries(),
    getAgentCosts(),
    profile ? getOrgUsers(profile.orgId) : Promise.resolve([]),
    profile ? getOrgRolePermissions(profile.orgId) : Promise.resolve([]),
    profile ? getOrgSecurityPolicies(profile.orgId) : Promise.resolve({}),
    profile ? getOrgSettings(profile.orgId) : Promise.resolve({ orgName: "", timezone: "", locale: "" }),
    profile ? getOrgAuditLogs(profile.orgId) : Promise.resolve([]),
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
          <UsersWorkspace users={users} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesPermissions permissions={permissions} rolePermissions={rolePermissions} />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogTable logs={auditLogs} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityPolicies policies={securityPolicies} />
        </TabsContent>

        <TabsContent value="usage">
          <AiUsageMonitoring usage={usage} costs={costs} />
        </TabsContent>

        <TabsContent value="settings">
          <OrganizationSettings settings={orgSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
