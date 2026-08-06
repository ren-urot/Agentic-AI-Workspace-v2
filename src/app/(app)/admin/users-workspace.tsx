"use client";

import { InviteUserDialog } from "./invite-user-dialog";
import { UsersTable } from "./users-table";
import { toast } from "@/lib/toast";
import { useAppStore } from "@/lib/store/app-store";
import type { UserRole, UserStatus } from "@/lib/mock-data/types";

export function UsersWorkspace() {
  const { users, addUser, setUserRole, setUserStatus } = useAppStore();

  function handleRoleChange(id: string, role: UserRole) {
    const user = users.find((u) => u.id === id);
    setUserRole(id, role);
    if (user) toast.success("Role updated", `${user.name} is now ${role}.`);
  }

  function handleStatusChange(id: string, status: UserStatus) {
    const user = users.find((u) => u.id === id);
    setUserStatus(id, status);
    if (user) toast.success("Status updated", `${user.name} is now ${status}.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteUserDialog onInvite={addUser} />
      </div>
      <UsersTable users={users} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} />
    </div>
  );
}
