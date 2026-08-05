import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { SidebarCollapseProvider } from "@/components/shell/sidebar-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarCollapseProvider>
      <div className="flex min-h-screen flex-col">
        <Topbar />
        <div className="flex flex-1 gap-6 p-6">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarCollapseProvider>
  );
}
