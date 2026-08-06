"use client";

import { useState } from "react";
import { InviteUserDialog } from "./invite-user-dialog";
import { UsersTable } from "./users-table";
import { toast } from "@/lib/toast";
import type { OrgUser, UserRole, UserStatus } from "@/lib/mock-data/types";

export function UsersWorkspace({ initialUsers }: { initialUsers: OrgUser[] }) {
  const [users, setUsers] = useState(initialUsers);

  function handleRoleChange(id: string, role: UserRole) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    const user = users.find((u) => u.id === id);
    if (user) toast.success("Role updated", `${user.name} is now ${role}.`);
  }

  function handleStatusChange(id: string, status: UserStatus) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    const user = users.find((u) => u.id === id);
    if (user) toast.success("Status updated", `${user.name} is now ${status}.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteUserDialog onInvite={(user) => setUsers((prev) => [user, ...prev])} />
      </div>
      <UsersTable users={users} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} />
    </div>
  );
}
