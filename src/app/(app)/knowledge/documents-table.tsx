"use client";

import { useMemo, useState } from "react";
import { Search, FileQuestion } from "lucide-react";
import { flexRender, getCoreRowModel, useReactTable, createColumnHelper } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { KnowledgeDocument } from "@/lib/mock-data/types";

const columnHelper = createColumnHelper<KnowledgeDocument>();

const columns = [
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("sourceType", { header: "Source" }),
  columnHelper.accessor("version", { header: "Version", cell: (info) => `v${info.getValue()}` }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated",
    cell: (info) => new Date(info.getValue()).toLocaleDateString("en-US", { timeZone: "UTC" }),
  }),
];

export function DocumentsTable({ documents }: { documents: KnowledgeDocument[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (doc) => doc.name.toLowerCase().includes(q) || doc.keywords.some((k) => k.includes(q)),
    );
  }, [documents, query]);

  const table = useReactTable({ data: filtered, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Semantic search across documents..."
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileQuestion} title="No documents found" description="Try a different search term." />
      ) : (
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
      )}
    </div>
  );
}
