"use client";

import { useState } from "react";
import { AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AlertItem } from "@/lib/mock-data/types";

const SEVERITY_ICON_COLOR: Record<AlertItem["severity"], string> = {
  critical: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export function NotificationsMenu({ notifications }: { notifications: AlertItem[] }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length;

  function markRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id));
  }

  function markAllRead() {
    setReadIds(new Set(notifications.map((item) => item.id)));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#D70000] ring-2 ring-background"
                aria-hidden="true"
              />
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <span className="text-sm font-medium text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-1.5 py-4 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          notifications.map((item) => {
            const unread = !readIds.has(item.id);
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => markRead(item.id)}
                className="items-start gap-2 py-2 whitespace-normal"
              >
                <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", SEVERITY_ICON_COLOR[item.severity])} />
                <div className="flex-1 space-y-0.5">
                  <p className={cn("text-sm", unread && "font-medium")}>{item.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleTimeString()}</p>
                </div>
                {unread && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#D70000]" aria-hidden="true" />}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
