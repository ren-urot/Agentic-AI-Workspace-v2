"use client";

import { useState } from "react";
import { InviteUserDialog } from "./invite-user-dialog";
import { UsersTable } from "./users-table";
import type { OrgUser } from "@/lib/mock-data/types";

export function UsersWorkspace({ initialUsers }: { initialUsers: OrgUser[] }) {
  const [users, setUsers] = useState(initialUsers);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteUserDialog onInvite={(user) => setUsers((prev) => [user, ...prev])} />
      </div>
      <UsersTable users={users} />
    </div>
  );
}
