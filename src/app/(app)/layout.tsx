import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { SidebarCollapseProvider } from "@/components/shell/sidebar-context";
import { getAlerts } from "@/lib/mock-data/dashboard";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const notifications = await getAlerts();

  return (
    <SidebarCollapseProvider>
      <div className="flex min-h-screen flex-col">
        <Topbar notifications={notifications} />
        <div className="flex flex-1 gap-6 p-6">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarCollapseProvider>
  );
}
