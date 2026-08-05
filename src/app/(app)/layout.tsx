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
          <main className="mx-auto w-full min-w-0 max-w-[1200px] flex-1">{children}</main>
        </div>
      </div>
    </SidebarCollapseProvider>
  );
}
