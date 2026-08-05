"use client";

import { Settings, User } from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark } from "@/components/shared/brand-mark";
import { SidebarCollapseToggle } from "@/components/shell/sidebar-collapse-toggle";
import { useSidebarCollapse } from "@/components/shell/sidebar-context";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { NotificationsMenu } from "@/components/shell/notifications-menu";
import { MobileNav } from "@/components/shell/sidebar";
import { logout } from "@/app/login/actions";
import type { AlertItem } from "@/lib/mock-data/types";

export function Topbar({ notifications }: { notifications: AlertItem[] }) {
  const { collapsed } = useSidebarCollapse();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="flex h-[79px] shrink-0 items-center justify-between border-b border-[#D9D9D9] bg-white px-4 sm:px-6 dark:border-border dark:bg-card">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="flex w-16 shrink-0 items-center justify-center">
          <BrandMark />
        </div>
        {!collapsed && (
          <div className="hidden leading-[1.15] sm:block">
            <p className="text-sm font-bold text-foreground">NexxaByte</p>
            <p className="text-sm text-foreground">AI Workspace</p>
          </div>
        )}
        <SidebarCollapseToggle />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsMenu notifications={notifications} />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#231F20] text-white">NB</AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Admin User</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" />}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
