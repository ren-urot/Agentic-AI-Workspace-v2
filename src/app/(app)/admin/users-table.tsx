"use client";

import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, createColumnHelper } from "@tanstack/react-table";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { TablePagination } from "@/components/shared/table-pagination";
import type { OrgUser, UserRole, UserStatus } from "@/lib/mock-data/types";

const ROLE_OPTIONS: UserRole[] = ["Admin", "Manager", "Operator", "Viewer"];
const STATUS_OPTIONS: UserStatus[] = ["active", "invited", "disabled"];

const columnHelper = createColumnHelper<OrgUser>();

function makeColumns(onRoleChange: (id: string, role: UserRole) => void, onStatusChange: (id: string, status: UserStatus) => void) {
  return [
    columnHelper.accessor("name", { header: "Name" }),
    columnHelper.accessor("email", { header: "Email" }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: (info) => {
        const user = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Change role for ${user.name}`}
                  className="rounded-md px-1.5 py-0.5 text-left hover:bg-accent"
                >
                  {user.role}
                </button>
              }
            />
            <DropdownMenuContent align="start">
              {ROLE_OPTIONS.map((role) => (
                <DropdownMenuItem
                  key={role}
                  disabled={role === user.role}
                  onClick={() => onRoleChange(user.id, role)}
                >
                  {role}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const user = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Change status for ${user.name}`}
                  className="rounded-full hover:opacity-80"
                >
                  <StatusBadge status={user.status} />
                </button>
              }
            />
            <DropdownMenuContent align="start">
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem
                  key={status}
                  disabled={status === user.status}
                  onClick={() => onStatusChange(user.id, status)}
                  className="capitalize"
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];
}

export function UsersTable({
  users,
  onRoleChange,
  onStatusChange,
}: {
  users: OrgUser[];
  onRoleChange: (id: string, role: UserRole) => void;
  onStatusChange: (id: string, status: UserStatus) => void;
}) {
  const table = useReactTable({
    data: users,
    columns: makeColumns(onRoleChange, onStatusChange),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <TablePagination
          page={table.getState().pagination.pageIndex + 1}
          pageCount={table.getPageCount()}
          pageSize={table.getState().pagination.pageSize}
          total={users.length}
          onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      </CardFooter>
    </Card>
  );
}
