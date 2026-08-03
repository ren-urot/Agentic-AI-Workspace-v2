# Spec-Completion Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between the design spec (`docs/superpowers/specs/2026-08-02-product-platform-design.md`) and the implemented app, found by the final whole-branch review of the original 12-task plan: a Knowledge Base approval queue, Workflow save/persist, Integration Center webhooks, two missing Administration sub-modules (Roles & Permissions, AI Usage Monitoring), a user invite dialog, filterable audit logs, and fuller agent performance/last-active display.

**Architecture:** Same as the base app — Next.js App Router, mock-data functions returning `Promise`s via `delay()`, client components holding session-scoped local state for anything mutable (approve/reject, save workflow, add/delete webhook, invite user, toggle permission) since there is still no real backend in this phase.

**Tech Stack:** Same as base app — no new dependencies. Reuses `@tanstack/react-table`, Recharts, shadcn/ui `Checkbox`/`Select` (already installed in Task 1, currently unused).

## Global Constraints

(Same as the base plan — carried forward.)

- TypeScript strict mode; no `any` in new code.
- All components styled with Tailwind + shadcn/ui — no ad hoc CSS files.
- Brand accent color via the shadcn CSS variable theme, not hardcoded hex.
- No automated test suite this phase. Verification per task: `npx tsc --noEmit` passes, `npm run build` passes, and manual check of the route in the dev server (light + dark, desktop + mobile width).
- Dark mode and light mode must both render correctly for every screen touched — use `var(--muted-foreground)`/`var(--popover)`/`var(--border)`/`var(--popover-foreground)` for any new Recharts chrome, matching the pattern already established in `dashboard/charts.tsx` and `agent-detail-tabs.tsx`.
- Any new Client Component that formats a `Date` must use a fixed locale/timezone (`toLocaleDateString("en-US", { timeZone: "UTC" })` or equivalent) to avoid hydration mismatches — Server Components formatting dates are exempt (already established pattern from the final-review fix wave).
- This project's shadcn scaffold generated Base UI–backed primitives (not Radix) — never use `asChild` on a trigger/composition component; use the `render` prop or plain controlled `open`/`onOpenChange` state (see `src/app/(app)/integrations/integration-card.tsx` for the established controlled-Dialog pattern used throughout this plan).
- Every `git commit` in this plan uses `git add <specific files>` (never `-A` or `.`).
- All mutations in this plan are client-side, session-scoped (React `useState`), not persisted to any backend — consistent with the base app's Non-Goals (no real database this phase).

---

### Task 13: Knowledge Base — TanStack Table + Approval Queue

**Files:**
- Modify: `src/app/(app)/knowledge/documents-table.tsx`
- Create: `src/app/(app)/knowledge/approval-queue.tsx`
- Create: `src/app/(app)/knowledge/knowledge-workspace.tsx`
- Modify: `src/app/(app)/knowledge/page.tsx`

**Interfaces:**
- Consumes: `KnowledgeDocument`, `DocumentStatus` from `@/lib/mock-data/types`; `getDocuments()` from `@/lib/mock-data/knowledge`; `StatusBadge`, `EmptyState`, `PageHeader` from `@/components/shared/*`; `useReactTable`/`getCoreRowModel`/`flexRender`/`createColumnHelper` from `@tanstack/react-table` (already installed, used in `src/app/(app)/admin/users-table.tsx`).
- Produces: `KnowledgeWorkspace` component holding the shared `documents` state for the page — no other task depends on this.

- [ ] **Step 1: Migrate the documents table to TanStack Table**

Replace `src/app/(app)/knowledge/documents-table.tsx` with:
```tsx
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
```

- [ ] **Step 2: Create the approval queue component**

Create `src/app/(app)/knowledge/approval-queue.tsx`:
```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DocumentStatus, KnowledgeDocument } from "@/lib/mock-data/types";

export function ApprovalQueue({
  documents,
  onDecision,
}: {
  documents: KnowledgeDocument[];
  onDecision: (id: string, status: DocumentStatus) => void;
}) {
  if (documents.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Content Approval Queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-muted-foreground">
                {doc.sourceType} · v{doc.version}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={doc.status} />
              <Button size="sm" variant="outline" onClick={() => onDecision(doc.id, "rejected")}>
                Reject
              </Button>
              <Button size="sm" onClick={() => onDecision(doc.id, "approved")}>
                Approve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create the workspace wrapper holding shared state**

Create `src/app/(app)/knowledge/knowledge-workspace.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { DocumentStatus, KnowledgeDocument } from "@/lib/mock-data/types";
import { DocumentsTable } from "./documents-table";
import { ApprovalQueue } from "./approval-queue";

export function KnowledgeWorkspace({ initialDocuments }: { initialDocuments: KnowledgeDocument[] }) {
  const [documents, setDocuments] = useState(initialDocuments);

  function updateStatus(id: string, status: DocumentStatus) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }

  const pending = documents.filter((d) => d.status === "pending");

  return (
    <div className="space-y-8">
      <ApprovalQueue documents={pending} onDecision={updateStatus} />
      <DocumentsTable documents={documents} />
    </div>
  );
}
```

- [ ] **Step 4: Wire the workspace into the page**

Replace `src/app/(app)/knowledge/page.tsx`:
```tsx
import { getDocuments } from "@/lib/mock-data/knowledge";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDialog } from "./upload-dialog";
import { KnowledgeWorkspace } from "./knowledge-workspace";

export default async function KnowledgeBasePage() {
  const documents = await getDocuments();

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Manage the documents and data sources your agents are trained on."
        actions={<UploadDialog />}
      />
      <KnowledgeWorkspace initialDocuments={documents} />
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/knowledge` should show a "Content Approval Queue" card above the table (only when pending documents exist), with working Approve/Reject buttons that move a document out of the queue and update its status badge in the table below. Confirm search still filters correctly.

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/knowledge/documents-table.tsx src/app/(app)/knowledge/approval-queue.tsx src/app/(app)/knowledge/knowledge-workspace.tsx src/app/(app)/knowledge/page.tsx
git commit -m "Add Knowledge Base approval queue and migrate table to TanStack Table"
```

---

### Task 14: Workflow Builder — Save/Persist Workflow

**Files:**
- Modify: `src/app/(app)/workflows/workflow-canvas.tsx`
- Create: `src/app/(app)/workflows/workflows-workspace.tsx`
- Modify: `src/app/(app)/workflows/page.tsx`

**Interfaces:**
- Consumes: `WorkflowSummary` from `@/lib/mock-data/types`; `getWorkflows()` from `@/lib/mock-data/workflows`; `StatusBadge`, `PageHeader`.
- Produces: `WorkflowCanvas` now accepts an `onSave: (name: string) => void` prop — no other task depends on this.

- [ ] **Step 1: Add a name field and Save button to the canvas**

Replace `src/app/(app)/workflows/workflow-canvas.tsx`:
```tsx
"use client";

import { useCallback, useState } from "react";
import { useTheme } from "next-themes";
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NODE_PALETTE: { type: string; label: string }[] = [
  { type: "trigger", label: "Trigger" },
  { type: "ai-decision", label: "AI Decision" },
  { type: "api-call", label: "API Call" },
  { type: "approval", label: "Approval" },
  { type: "notification", label: "Notification" },
  { type: "task-completion", label: "Task Completion" },
];

const INITIAL_NODES: Node[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "Trigger" }, type: "input" },
  { id: "2", position: { x: 0, y: 120 }, data: { label: "AI Decision" } },
  { id: "3", position: { x: 0, y: 240 }, data: { label: "API Call" } },
  { id: "4", position: { x: 0, y: 360 }, data: { label: "Approval" } },
  { id: "5", position: { x: 0, y: 480 }, data: { label: "Notification" } },
  { id: "6", position: { x: 0, y: 600 }, data: { label: "Task Completion" }, type: "output" },
];

const INITIAL_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
  { id: "e5-6", source: "5", target: "6" },
];

let nodeIdCounter = INITIAL_NODES.length + 1;

export function WorkflowCanvas({ onSave }: { onSave: (name: string) => void }) {
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [name, setName] = useState("");

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const addNode = (label: string) => {
    const id = String(nodeIdCounter++);
    setNodes((nds) => [
      ...nds,
      { id, position: { x: 260, y: Math.random() * 400 }, data: { label } },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Workflow name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button
          disabled={!name.trim()}
          onClick={() => {
            onSave(name.trim());
            setName("");
          }}
        >
          Save workflow
        </Button>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="w-full p-3 lg:w-48 lg:shrink-0">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Node palette</p>
          <div className="space-y-2">
            {NODE_PALETTE.map((item) => (
              <button
                key={item.type}
                onClick={() => addNode(item.label)}
                className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {item.label}
              </button>
            ))}
          </div>
        </Card>
        <div className="h-[600px] lg:flex-1 rounded-md border">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            colorMode={resolvedTheme === "dark" ? "dark" : "light"}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the workspace wrapper holding the workflow list state**

Create `src/app/(app)/workflows/workflows-workspace.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkflowCanvas } from "./workflow-canvas";
import type { WorkflowSummary } from "@/lib/mock-data/types";

export function WorkflowsWorkspace({ initialWorkflows }: { initialWorkflows: WorkflowSummary[] }) {
  const [workflows, setWorkflows] = useState(initialWorkflows);

  function handleSave(name: string) {
    setWorkflows((prev) => [
      {
        id: crypto.randomUUID(),
        name,
        status: "draft",
        lastRun: new Date().toISOString(),
        successRate: 100,
      },
      ...prev,
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workflows.map((wf) => (
          <Card key={wf.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{wf.name}</CardTitle>
              <StatusBadge status={wf.status} />
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Success rate: {wf.successRate}% · Last run {new Date(wf.lastRun).toLocaleString()}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Canvas</h2>
        <WorkflowCanvas onSave={handleSave} />
      </div>
    </div>
  );
}
```

Note: `WorkflowsWorkspace` is a Client Component (`"use client"`), so `new Date(wf.lastRun).toLocaleString()` at line ~24 runs on both server-render-of-client-boundary and client — but since the whole component is client-rendered (no SSR content is sent for its initial values other than what Next.js serializes as props), this mirrors the same pattern already accepted in `documents-table.tsx` prior to its hydration fix. To avoid reintroducing that class of bug, use the fixed-timezone form here too: `new Date(wf.lastRun).toLocaleString("en-US", { timeZone: "UTC" })`.

- [ ] **Step 3: Wire the workspace into the page**

Replace `src/app/(app)/workflows/page.tsx`:
```tsx
import { getWorkflows } from "@/lib/mock-data/workflows";
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowsWorkspace } from "./workflows-workspace";

export default async function WorkflowsPage() {
  const workflows = await getWorkflows();

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Builder" description="Design and automate multi-step business processes." />
      <WorkflowsWorkspace initialWorkflows={workflows} />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/workflows`: type a name into the field above the canvas, click "Save workflow" — confirm a new card appears at the top of the workflow list with that name, "Draft" status, and the name field clears. Confirm the canvas itself still works (drag, connect, add-from-palette) and dark mode/mobile layout are unaffected.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/workflows/workflow-canvas.tsx src/app/(app)/workflows/workflows-workspace.tsx src/app/(app)/workflows/page.tsx
git commit -m "Add Workflow Builder save/persist to session-scoped workflow list"
```

---

### Task 15: Integration Center — Webhook Management

**Files:**
- Modify: `src/lib/mock-data/types.ts`
- Modify: `src/lib/mock-data/integrations.ts`
- Create: `src/app/(app)/integrations/webhook-list.tsx`
- Modify: `src/app/(app)/integrations/page.tsx`

**Interfaces:**
- Produces: `Webhook` type in `types.ts`; `getWebhooks(): Promise<Webhook[]>` in `integrations.ts` — no other task depends on these.

- [ ] **Step 1: Add the `Webhook` type**

In `src/lib/mock-data/types.ts`, add at the end of the file:
```ts
export interface Webhook {
  id: string;
  url: string;
  event: string;
  createdAt: string;
}
```

- [ ] **Step 2: Add mock webhook data and the fetch function**

In `src/lib/mock-data/integrations.ts`, add `Webhook` to the type import and append below the existing `getIntegrations` function:
```ts
import type { Integration, Webhook } from "@/lib/mock-data/types";
```
(replacing the existing `import type { Integration } from "@/lib/mock-data/types";` line)

```ts
const WEBHOOKS: Webhook[] = [
  {
    id: "1",
    url: "https://hooks.client.com/agent-events",
    event: "agent.task.completed",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "2",
    url: "https://hooks.client.com/approvals",
    event: "workflow.approval.requested",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export async function getWebhooks(): Promise<Webhook[]> {
  return delay(WEBHOOKS);
}
```

- [ ] **Step 3: Create the webhook list component**

Create `src/app/(app)/integrations/webhook-list.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Webhook } from "@/lib/mock-data/types";

export function WebhookList({ initialWebhooks }: { initialWebhooks: Webhook[] }) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("");

  function addWebhook() {
    if (!url.trim() || !event.trim()) return;
    setWebhooks((prev) => [
      { id: crypto.randomUUID(), url: url.trim(), event: event.trim(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setUrl("");
    setEvent("");
  }

  function removeWebhook(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Webhooks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="https://your-endpoint.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Input
            placeholder="Event (e.g. agent.task.completed)"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button onClick={addWebhook} disabled={!url.trim() || !event.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        {webhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No webhooks configured.</p>
        ) : (
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{webhook.url}</p>
                  <p className="text-xs text-muted-foreground">{webhook.event}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeWebhook(webhook.id)} aria-label="Delete webhook">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Wire the webhook list into the page**

Replace `src/app/(app)/integrations/page.tsx`:
```tsx
import { getIntegrations, getWebhooks } from "@/lib/mock-data/integrations";
import { PageHeader } from "@/components/shared/page-header";
import { IntegrationCard } from "./integration-card";
import { WebhookList } from "./webhook-list";
import type { IntegrationCategory } from "@/lib/mock-data/types";

const CATEGORY_ORDER: IntegrationCategory[] = ["CRM", "ERP", "Communication", "Identity", "Custom API"];

export default async function IntegrationsPage() {
  const [integrations, webhooks] = await Promise.all([getIntegrations(), getWebhooks()]);

  return (
    <div className="space-y-8">
      <PageHeader title="Integration Center" description="Manage connections to your enterprise systems." />
      {CATEGORY_ORDER.map((category) => {
        const items = integrations.filter((i) => i.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        );
      })}
      <WebhookList initialWebhooks={webhooks} />
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/integrations`: confirm a "Webhooks" card renders below the category sections with 2 seeded webhooks; adding a URL+event and clicking "Add" prepends a new entry; clicking the trash icon removes it.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock-data/types.ts src/lib/mock-data/integrations.ts src/app/(app)/integrations/webhook-list.tsx src/app/(app)/integrations/page.tsx
git commit -m "Add Integration Center webhook management (add/delete)"
```

---

### Task 16: Administration — Roles & Permissions Matrix

**Files:**
- Modify: `src/lib/mock-data/types.ts`
- Modify: `src/lib/mock-data/admin.ts`
- Create: `src/app/(app)/admin/roles-permissions.tsx`
- Modify: `src/app/(app)/admin/page.tsx`

**Interfaces:**
- Produces: `Permission`, `RolePermissions` types; `getPermissions()`, `getRolePermissions()` in `admin.ts`. Task 17 and Task 18 both modify `src/app/(app)/admin/page.tsx` again after this task — each task's Step gives the full expected file content at that point, so apply them in order (16 → 17 → 18).

- [ ] **Step 1: Add `Permission` and `RolePermissions` types**

In `src/lib/mock-data/types.ts`, add at the end of the file:
```ts
export interface Permission {
  key: string;
  label: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Record<string, boolean>;
}
```

- [ ] **Step 2: Add mock permission data and fetch functions**

In `src/lib/mock-data/admin.ts`, add `Permission` and `RolePermissions` to the type import (alongside the existing `AuditLogEntry, OrgUser, UserRole, UserStatus`), then append:
```ts
const PERMISSIONS: Permission[] = [
  { key: "manage_agents", label: "Manage AI Agents" },
  { key: "manage_workflows", label: "Manage Workflows" },
  { key: "manage_integrations", label: "Manage Integrations" },
  { key: "manage_users", label: "Manage Users" },
  { key: "view_audit_logs", label: "View Audit Logs" },
  { key: "manage_knowledge_base", label: "Manage Knowledge Base" },
];

const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: "Admin",
    permissions: {
      manage_agents: true,
      manage_workflows: true,
      manage_integrations: true,
      manage_users: true,
      view_audit_logs: true,
      manage_knowledge_base: true,
    },
  },
  {
    role: "Manager",
    permissions: {
      manage_agents: true,
      manage_workflows: true,
      manage_integrations: true,
      manage_users: false,
      view_audit_logs: true,
      manage_knowledge_base: true,
    },
  },
  {
    role: "Operator",
    permissions: {
      manage_agents: true,
      manage_workflows: true,
      manage_integrations: false,
      manage_users: false,
      view_audit_logs: false,
      manage_knowledge_base: true,
    },
  },
  {
    role: "Viewer",
    permissions: {
      manage_agents: false,
      manage_workflows: false,
      manage_integrations: false,
      manage_users: false,
      view_audit_logs: true,
      manage_knowledge_base: false,
    },
  },
];

export async function getPermissions(): Promise<Permission[]> {
  return delay(PERMISSIONS);
}

export async function getRolePermissions(): Promise<RolePermissions[]> {
  return delay(ROLE_PERMISSIONS);
}
```

- [ ] **Step 3: Create the permission matrix component**

Create `src/app/(app)/admin/roles-permissions.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Permission, RolePermissions, UserRole } from "@/lib/mock-data/types";

const ROLE_ORDER: UserRole[] = ["Admin", "Manager", "Operator", "Viewer"];

export function RolesPermissions({
  permissions,
  initialMatrix,
}: {
  permissions: Permission[];
  initialMatrix: RolePermissions[];
}) {
  const [matrix, setMatrix] = useState(initialMatrix);

  function toggle(role: UserRole, key: string) {
    setMatrix((prev) =>
      prev.map((entry) =>
        entry.role === role
          ? { ...entry, permissions: { ...entry.permissions, [key]: !entry.permissions[key] } }
          : entry,
      ),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Role Permission Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
                    const entry = matrix.find((m) => m.role === role);
                    const checked = entry?.permissions[perm.key] ?? false;
                    return (
                      <td key={role} className="p-2 text-center">
                        <Checkbox checked={checked} onCheckedChange={() => toggle(role, perm.key)} />
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
```

- [ ] **Step 4: Add the Roles & Permissions tab to the Admin page**

Replace `src/app/(app)/admin/page.tsx`:
```tsx
import { getAuditLogs, getPermissions, getRolePermissions, getUsers } from "@/lib/mock-data/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UsersTable } from "./users-table";
import { AuditLogTable } from "./audit-log-table";
import { RolesPermissions } from "./roles-permissions";

export default async function AdminPage() {
  const [users, logs, permissions, rolePermissions] = await Promise.all([
    getUsers(),
    getAuditLogs(),
    getPermissions(),
    getRolePermissions(),
  ]);

  return (
    <div>
      <PageHeader title="Administration" description="Manage users, security policies, and system settings." />

      <Tabs defaultValue="users">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security Policies</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <UsersTable users={users} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <RolesPermissions permissions={permissions} initialMatrix={rolePermissions} />
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-6">
              <AuditLogTable logs={logs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mfa">Require multi-factor authentication</Label>
                <Switch id="mfa" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sso">Require single sign-on</Label>
                <Switch id="sso" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ip">Restrict access by IP allowlist</Label>
                <Switch id="ip" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input id="org-name" defaultValue="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="America/New_York" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/admin` → "Roles & Permissions" tab: confirm a 6-row × 4-column checkbox matrix renders with the seeded values (e.g. Viewer has only "View Audit Logs" checked), and clicking any checkbox toggles it.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock-data/types.ts src/lib/mock-data/admin.ts src/app/(app)/admin/roles-permissions.tsx "src/app/(app)/admin/page.tsx"
git commit -m "Add Administration Roles & Permissions matrix tab"
```

---

### Task 17: Administration — AI Usage Monitoring

**Files:**
- Modify: `src/lib/mock-data/types.ts`
- Modify: `src/lib/mock-data/admin.ts`
- Create: `src/app/(app)/admin/ai-usage.tsx`
- Modify: `src/app/(app)/admin/page.tsx`

**Interfaces:**
- Consumes: `ChartPoint` from `@/lib/mock-data/types` (already defined).
- Produces: `AgentCostEntry` type; `getUsageSeries()`, `getAgentCosts()` in `admin.ts`. Builds on Task 16's `admin/page.tsx` — apply after Task 16.

- [ ] **Step 1: Add the `AgentCostEntry` type**

In `src/lib/mock-data/types.ts`, add at the end of the file:
```ts
export interface AgentCostEntry {
  agentName: string;
  cost: number;
}
```

- [ ] **Step 2: Add mock usage data and fetch functions**

In `src/lib/mock-data/admin.ts`, add `AgentCostEntry, ChartPoint` to the type import, then append:
```ts
const USAGE_SERIES: ChartPoint[] = [
  { label: "Mon", value: 420 },
  { label: "Tue", value: 512 },
  { label: "Wed", value: 489 },
  { label: "Thu", value: 601 },
  { label: "Fri", value: 578 },
  { label: "Sat", value: 210 },
  { label: "Sun", value: 190 },
];

const AGENT_COSTS: AgentCostEntry[] = [
  { agentName: "Sales Agent", cost: 42.5 },
  { agentName: "Customer Service Agent", cost: 38.2 },
  { agentName: "HR Agent", cost: 12.1 },
  { agentName: "Compliance Agent", cost: 9.8 },
  { agentName: "Finance Agent", cost: 15.6 },
];

export async function getUsageSeries(): Promise<ChartPoint[]> {
  return delay(USAGE_SERIES);
}

export async function getAgentCosts(): Promise<AgentCostEntry[]> {
  return delay(AGENT_COSTS);
}
```

- [ ] **Step 3: Create the AI usage monitoring component**

Create `src/app/(app)/admin/ai-usage.tsx`:
```tsx
"use client";

import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentCostEntry, ChartPoint } from "@/lib/mock-data/types";

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  color: "var(--popover-foreground)",
};

export function AiUsageMonitoring({ usage, costs }: { usage: ChartPoint[]; costs: AgentCostEntry[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Requests (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usage}>
              <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Estimated Cost per Agent ($)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costs}>
              <XAxis
                dataKey="agentName"
                fontSize={11}
                stroke="var(--muted-foreground)"
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="cost" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Add the AI Usage Monitoring tab**

Replace `src/app/(app)/admin/page.tsx`:
```tsx
import { getAuditLogs, getAgentCosts, getPermissions, getRolePermissions, getUsageSeries, getUsers } from "@/lib/mock-data/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UsersTable } from "./users-table";
import { AuditLogTable } from "./audit-log-table";
import { RolesPermissions } from "./roles-permissions";
import { AiUsageMonitoring } from "./ai-usage";

export default async function AdminPage() {
  const [users, logs, permissions, rolePermissions, usage, costs] = await Promise.all([
    getUsers(),
    getAuditLogs(),
    getPermissions(),
    getRolePermissions(),
    getUsageSeries(),
    getAgentCosts(),
  ]);

  return (
    <div>
      <PageHeader title="Administration" description="Manage users, security policies, and system settings." />

      <Tabs defaultValue="users">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security Policies</TabsTrigger>
            <TabsTrigger value="usage">AI Usage Monitoring</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <UsersTable users={users} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <RolesPermissions permissions={permissions} initialMatrix={rolePermissions} />
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-6">
              <AuditLogTable logs={logs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mfa">Require multi-factor authentication</Label>
                <Switch id="mfa" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sso">Require single sign-on</Label>
                <Switch id="sso" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ip">Restrict access by IP allowlist</Label>
                <Switch id="ip" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <AiUsageMonitoring usage={usage} costs={costs} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input id="org-name" defaultValue="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="America/New_York" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/admin` → "AI Usage Monitoring" tab: confirm a requests-over-time line chart and a cost-per-agent bar chart both render with correctly themed axes/tooltips in light and dark mode.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock-data/types.ts src/lib/mock-data/admin.ts src/app/(app)/admin/ai-usage.tsx "src/app/(app)/admin/page.tsx"
git commit -m "Add Administration AI Usage Monitoring tab"
```

---

### Task 18: Administration — User Invite Dialog + Filterable Audit Logs

**Files:**
- Create: `src/app/(app)/admin/invite-user-dialog.tsx`
- Create: `src/app/(app)/admin/users-workspace.tsx`
- Modify: `src/app/(app)/admin/audit-log-table.tsx`
- Modify: `src/app/(app)/admin/page.tsx`

**Interfaces:**
- Consumes: `OrgUser`, `UserRole`, `AuditLogEntry` from `@/lib/mock-data/types`; `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` from `@/components/ui/select` (installed in Task 1, unused until now).
- Produces: `UsersWorkspace` replaces the bare `UsersTable` render in the Admin page's Users tab. Builds on Task 17's `admin/page.tsx` — apply after Task 17 (this is the last of the three Administration tasks).

- [ ] **Step 1: Create the invite dialog**

Create `src/app/(app)/admin/invite-user-dialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrgUser, UserRole } from "@/lib/mock-data/types";

const ROLES: UserRole[] = ["Admin", "Manager", "Operator", "Viewer"];

export function InviteUserDialog({ onInvite }: { onInvite: (user: OrgUser) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Viewer");

  function handleInvite() {
    if (!name.trim() || !email.trim()) return;
    onInvite({
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      role,
      status: "invited",
    });
    setName("");
    setEmail("");
    setRole("Viewer");
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Invite user
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>Send an invitation to join this workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```
If `<Select>`'s `SelectTrigger` in this repo's generated `src/components/ui/select.tsx` requires a different composition than plain children (check the file before assuming) — this usage passes no `asChild`/`render` composition at all (just a normal controlled `value`/`onValueChange` with a `SelectValue` child), which is the standard, safe usage pattern regardless of whether the primitive is Base UI or Radix-flavored. Only adapt if `tsc` actually reports an error.

- [ ] **Step 2: Create the users workspace wrapper**

Create `src/app/(app)/admin/users-workspace.tsx`:
```tsx
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
```

- [ ] **Step 3: Make the audit log table filterable**

Replace `src/app/(app)/admin/audit-log-table.tsx`:
```tsx
"use client";

import { useMemo, useState } from "react";
import { Search, FileQuestion } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import type { AuditLogEntry } from "@/lib/mock-data/types";

export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  const [query, setQuery] = useState("");

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

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by actor, action, or resource..."
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={FileQuestion} title="No matching audit log entries" description="Try a different search term." />
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
            {filtered.map((log) => (
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
    </div>
  );
}
```
Note: this component becomes a Client Component (it wasn't before) because it now needs `useState` for the filter — so the fixed-timezone date formatting is required here now (see Global Constraints), whereas the previous Server Component version didn't need it.

- [ ] **Step 4: Swap in `UsersWorkspace` on the Admin page**

In `src/app/(app)/admin/page.tsx` (the version from Task 17's Step 4), make two changes:
1. Replace the import `import { UsersTable } from "./users-table";` with `import { UsersWorkspace } from "./users-workspace";`
2. Replace the `users` TabsContent body:
```tsx
        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <UsersTable users={users} />
            </CardContent>
          </Card>
        </TabsContent>
```
with:
```tsx
        <TabsContent value="users">
          <UsersWorkspace initialUsers={users} />
        </TabsContent>
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/admin` → "Users" tab: click "Invite user", fill in name/email, pick a role, click "Send invite" — confirm a new row appears at the top of the users table with "Invited" status. On the "Audit Logs" tab, type a filter term (e.g. an actor's first name) and confirm the table narrows to matching rows; clear it and confirm all 10 rows return.

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/admin/invite-user-dialog.tsx src/app/(app)/admin/users-workspace.tsx src/app/(app)/admin/audit-log-table.tsx "src/app/(app)/admin/page.tsx"
git commit -m "Add Administration user invite dialog and filterable audit logs"
```

---

### Task 19: Agent Console & Dashboard — Fuller Performance Metrics and Last-Active Display

**Files:**
- Modify: `src/app/(app)/agents/[id]/agent-detail-tabs.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Agent.successRate`, `Agent.avgLatencyMs`, `Agent.tasksCompleted`, `Agent.lastActive` — all already defined on the `Agent` type and already populated in mock data (Task 5); this task only adds UI to display fields that already exist but were never rendered.

- [ ] **Step 1: Add success-rate and latency stats to the Performance Monitoring tab**

In `src/app/(app)/agents/[id]/agent-detail-tabs.tsx`, replace the `performance` `TabsContent` block:
```tsx
      <TabsContent value="performance">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasks completed (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agent.performance}>
                <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
```
with:
```tsx
      <TabsContent value="performance" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{agent.tasksCompleted}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{agent.successRate}%</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Latency</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{agent.avgLatencyMs}ms</CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasks completed (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agent.performance}>
                <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
```
Every other part of the file (imports, other tabs, `ConfirmDialog` usages) stays unchanged.

- [ ] **Step 2: Show last-active timestamp in the Dashboard's Agent Status panel**

In `src/app/(app)/dashboard/page.tsx`, find the agent status `.map()` block (inside the "Agent Status" `Card`):
```tsx
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <AgentIcon type={agent.type} className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agent.name}</span>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            ))}
```
Replace it with:
```tsx
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <AgentIcon type={agent.type} className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active {new Date(agent.lastActive).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            ))}
```
`dashboard/page.tsx` is a Server Component (no `"use client"`), so this date formatting doesn't need the fixed-timezone treatment (per Global Constraints, Server Component date formatting is exempt).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server: `/agents/[id]` (any agent) → Performance Monitoring tab shows 3 stat cards (Tasks Completed, Success Rate, Avg Latency) above the existing chart with correct values matching the agent's mock data. `/dashboard` → Agent Status panel shows a "Last active HH:MM:SS" line under each agent name.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/agents/[id]/agent-detail-tabs.tsx" "src/app/(app)/dashboard/page.tsx"
git commit -m "Add fuller agent performance stats and dashboard last-active display"
```

---

## Self-Review Notes

- **Spec coverage:** every item flagged by the final whole-branch review's Important finding #1 is covered — Knowledge Base approval queue + TanStack Table (Task 13), Workflow save/persist (Task 14), Integration Center webhooks (Task 15), Administration Roles & Permissions (Task 16), Administration AI Usage Monitoring (Task 17), Administration invite dialog + filterable audit logs (Task 18), fuller agent performance metrics + dashboard last-active (Task 19).
- **Type consistency:** `Webhook`, `Permission`, `RolePermissions`, `AgentCostEntry` are each defined once in `types.ts` and consumed by name only in the task that needs them; no redefinition across tasks.
- **File-conflict awareness:** Tasks 16, 17, and 18 all modify `src/app/(app)/admin/page.tsx` sequentially — each task's brief gives the complete file content reflecting all prior tasks' changes, so they must execute in order (16 → 17 → 18), matching their numeric order in this plan.
- **No regressions:** every full-file replacement in this plan was written from the actual current file contents on the branch (post final-review fix wave), preserving the dark-mode `colorMode` fix, the `lg:`-scoped responsive classes, the fixed-timezone date formatting, and the `ConfirmDialog` wiring already in place — none of Tasks 13-19 should revert any final-review fix.
