"use client";

import { useState } from "react";
import { InviteUserDialog } from "./invite-user-dialog";
import { UsersTable } from "./users-table";
import { Card, CardContent } from "@/components/ui/card";
import type { OrgUser } from "@/lib/mock-data/types";

export function UsersWorkspace({ initialUsers }: { initialUsers: OrgUser[] }) {
  const [users, setUsers] = useState(initialUsers);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteUserDialog onInvite={(user) => setUsers((prev) => [user, ...prev])} />
      </div>
      <Card>
        <CardContent className="pt-6">
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
