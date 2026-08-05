"use client";

import { Bell } from "lucide-react";
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
import { MobileNav } from "@/components/shell/sidebar";
import { logout } from "@/app/login/actions";

export function Topbar() {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="flex h-[79px] shrink-0 items-center justify-between border-b border-[#D9D9D9] bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <BrandMark />
        <SidebarCollapseToggle />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
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
            <DropdownMenuItem onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
