"use client";

import { useMemo, useState } from "react";
import { Search, FileQuestion } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { TablePagination } from "@/components/shared/table-pagination";
import type { AuditLogEntry } from "@/lib/mock-data/types";

const PAGE_SIZE = 5;

export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (log) =>
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q),
    );
  }, [logs, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by actor, action, or resource..."
            className="bg-white pl-8 dark:bg-input/30"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {filtered.length === 0 ? (
          logs.length === 0 ? (
            <EmptyState icon={FileQuestion} title="No activity yet" description="Audit log entries will appear here as your team uses the workspace." />
          ) : (
            <EmptyState icon={FileQuestion} title="No matching audit log entries" description="Try a different search term." />
          )
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.actor}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString("en-US", { timeZone: "UTC" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {filtered.length > 0 && (
        <CardFooter>
          <TablePagination page={page} pageCount={pageCount} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </CardFooter>
      )}
    </Card>
  );
}
