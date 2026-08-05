"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { BrandMark } from "@/components/shared/brand-mark";
import { useSidebarCollapse } from "@/components/shell/sidebar-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapse();

  return (
    <aside
      className={cn(
        "sticky top-6 hidden h-fit shrink-0 flex-col rounded-xl bg-[#FFFDFD] text-foreground shadow-[0_0_20px_0_rgba(0,0,0,0.1)] transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-[250px]",
      )}
    >
      <nav className="flex flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-active text-foreground"
                  : "text-foreground/70 hover:bg-sidebar-active/60",
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-primary/70")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto h-5 w-[3px] shrink-0 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="p-0 data-[side=left]:w-64">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <BrandMark />
        </div>
        <nav className="space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
