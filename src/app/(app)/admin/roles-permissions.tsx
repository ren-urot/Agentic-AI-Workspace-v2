"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleRolePermission } from "./actions";
import type { Permission, RolePermissions, UserRole } from "@/lib/mock-data/types";

const ROLE_ORDER: UserRole[] = ["Admin", "Manager", "Operator", "Viewer"];

export function RolesPermissions({
  permissions,
  rolePermissions,
}: {
  permissions: Permission[];
  rolePermissions: RolePermissions[];
}) {
  const [, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Role Permission Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-medium text-muted-foreground">Permission</th>
                {ROLE_ORDER.map((role) => (
                  <th key={role} className="p-2 text-center font-medium text-muted-foreground">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.key} className="border-b last:border-b-0">
                  <td className="p-2">{perm.label}</td>
                  {ROLE_ORDER.map((role) => {
                    const entry = rolePermissions.find((m) => m.role === role);
                    const checked = entry?.permissions[perm.key] ?? false;
                    return (
                      <td key={role} className="p-2 text-center">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => startTransition(() => toggleRolePermission(role, perm.key, Boolean(next)))}
                          aria-label={`${perm.label} — ${role}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
