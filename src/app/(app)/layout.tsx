import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { SidebarCollapseProvider } from "@/components/shell/sidebar-context";
import { AppStoreProvider, type AppStoreSeed } from "@/lib/store/app-store";
import { getAlerts } from "@/lib/mock-data/dashboard";
import { getAgents } from "@/lib/mock-data/agents";
import { getWorkflows } from "@/lib/mock-data/workflows";
import { getIntegrations, getWebhooks } from "@/lib/mock-data/integrations";
import { getDocuments } from "@/lib/mock-data/knowledge";
import { getUsers, getRolePermissions } from "@/lib/mock-data/admin";
import { getCurrentUser, isNewOrg } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [notifications, agents, workflows, integrations, webhooks, documents, users, rolePermissions, newOrg, currentUser] =
    await Promise.all([
      getAlerts(),
      getAgents(),
      getWorkflows(),
      getIntegrations(),
      getWebhooks(),
      getDocuments(),
      getUsers(),
      getRolePermissions(),
      isNewOrg(),
      getCurrentUser(),
    ]);

  const seed: AppStoreSeed = {
    workflows: newOrg ? [] : workflows,
    deployedAgentIds: newOrg ? [] : agents.map((a) => a.id),
    integrations: newOrg ? integrations.map((i) => ({ ...i, status: "disconnected" as const })) : integrations,
    webhooks: newOrg ? [] : webhooks,
    users: newOrg
      ? [{ id: "self", name: currentUser?.name ?? "You", email: currentUser?.email ?? "", role: "Admin", status: "active" }]
      : users,
    documents: newOrg ? [] : documents,
    rolePermissions,
  };

  const sessionKey = currentUser?.email ?? "demo";

  return (
    <AppStoreProvider seed={seed} agents={agents} sessionKey={sessionKey}>
      <SidebarCollapseProvider>
        <div className="flex min-h-screen flex-col">
          <Topbar notifications={notifications} />
          <div className="flex flex-1 gap-6 p-6">
            <Sidebar />
            <main className="mx-auto w-full min-w-0 max-w-[1200px] flex-1">{children}</main>
          </div>
        </div>
      </SidebarCollapseProvider>
    </AppStoreProvider>
  );
}
