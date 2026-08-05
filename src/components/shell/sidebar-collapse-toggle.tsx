"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </Button>
  );
}
