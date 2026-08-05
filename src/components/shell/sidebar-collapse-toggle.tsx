"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarCollapse } from "@/components/shell/sidebar-context";

export function SidebarCollapseToggle() {
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden md:inline-flex"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={toggle}
    >
      {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
    </Button>
  );
}
