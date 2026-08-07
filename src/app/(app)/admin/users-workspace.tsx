"use client";

import { useTransition } from "react";
import { InviteUserDialog } from "./invite-user-dialog";
import { UsersTable } from "./users-table";
import { toast } from "@/lib/toast";
import { setUserRole, setUserStatus } from "./actions";
import type { OrgUser, UserRole, UserStatus } from "@/lib/mock-data/types";

export function UsersWorkspace({ users }: { users: OrgUser[] }) {
  const [, startTransition] = useTransition();

  function handleRoleChange(id: string, role: UserRole) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    startTransition(async () => {
      try {
        await setUserRole(id, role, user.name);
        toast.success("Role updated", `${user.name} is now ${role}.`);
      } catch {
        toast.error("Couldn't update role", "Please try again.");
      }
    });
  }

  function handleStatusChange(id: string, status: UserStatus) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    startTransition(async () => {
      try {
        await setUserStatus(id, status, user.name);
        toast.success("Status updated", `${user.name} is now ${status}.`);
      } catch {
        toast.error("Couldn't update status", "Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteUserDialog />
      </div>
      <UsersTable users={users} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} />
    </div>
  );
}
