# Create Automation step wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-visible, entry-point-less workflow canvas on `/workflows` with a 4-step "Create Automation" wizard (Basics → Assign Agent → Build Workflow → Review & Activate) so a user always knows what step they're on and what's next.

**Architecture:** A full-screen client-side overlay (`CreateAutomationWizard`), opened from a new button on the Workflows page, owns all wizard state (name/description/trigger, selected agents, React Flow nodes/edges, activation choice) in `useState`/`useNodesState`/`useEdgesState`. Each step is a small controlled/presentational component receiving `value`/`onChange` props. A left rail shows 4 steps with completed/current/locked-upcoming states driven by `currentStep` + `maxReached`. On the final step, the wizard hands a finished `WorkflowSummary` back to the existing page-level state via a callback — the same mechanism `workflow-canvas.tsx`'s `onSave` already uses today.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind v4 (existing design tokens), `@xyflow/react` (React Flow v12, already a dependency), `lucide-react` icons, existing shadcn-style UI primitives in `src/components/ui/`.

## Global Constraints

- No test framework is configured in this repo (no jest/vitest/playwright, `package.json` only has `dev`/`build`/`start`/`lint`). Verification for each task is `npm run lint` (and `npm run build` for the final integration task), plus manual browser checks — there are no automated tests to write or run.
- All new files are client components (`"use client"` at the top) — they use hooks and interactivity, matching every existing file under `src/app/(app)/workflows/`.
- Reuse existing UI primitives exactly as used elsewhere in the codebase (`Button`, `Input`, `Label`, `Textarea`, `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`, `Card`, `Breadcrumbs`, `toast`) — do not introduce new UI primitives or a component library.
- Use the `cn()` helper (`@/lib/utils`) for all conditional className logic, not template literals — this is the established pattern in every existing component.
- Color/spacing must come from existing design tokens only (`bg-chip-primary`, `text-chip-primary-foreground`, `bg-chip-success`, `text-chip-success-foreground`, `bg-sidebar-active`, `bg-card`, `bg-muted`, `text-muted-foreground`, `border-destructive`, `text-destructive`) — no new colors, no hard-coded hex values in JSX.
- TypeScript strict mode is on for this project — no `any`, no implicit `any` parameters.

---

### Task 1: Shared wizard types

**Files:**
- Create: `src/app/(app)/workflows/wizard-types.ts`

**Interfaces:**
- Consumes: nothing (foundational file)
- Produces: `TriggerType`, `TRIGGER_TYPE_LABELS: Record<TriggerType, string>`, `WizardBasics { name: string; description: string; triggerType: TriggerType }`, `WizardStepIndex = 1 | 2 | 3 | 4`, `WizardStepMeta { index: WizardStepIndex; title: string; icon: LucideIcon }` — all imported by later tasks.

- [ ] **Step 1: Create the types file**

```ts
import type { LucideIcon } from "lucide-react";

export type TriggerType = "manual" | "scheduled" | "event" | "webhook";

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  manual: "Manual",
  scheduled: "Scheduled",
  event: "Event-based",
  webhook: "Webhook",
};

export interface WizardBasics {
  name: string;
  description: string;
  triggerType: TriggerType;
}

export type WizardStepIndex = 1 | 2 | 3 | 4;

export interface WizardStepMeta {
  index: WizardStepIndex;
  title: string;
  icon: LucideIcon;
}
```

- [ ] **Step 2: Verify with lint**

Run: `npm run lint`
Expected: no errors reported for `wizard-types.ts`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/workflows/wizard-types.ts"
git commit -m "Add shared types for the Create Automation wizard"
```

---

### Task 2: Step rail component

**Files:**
- Create: `src/app/(app)/workflows/wizard-rail.tsx`

**Interfaces:**
- Consumes: `WizardStepIndex`, `WizardStepMeta` from `./wizard-types` (Task 1); `cn` from `@/lib/utils`
- Produces: `WIZARD_STEPS: WizardStepMeta[]` (the 4-step definition, reused by the shell in Task 7 for length/lookup), `WizardRail({ currentStep, maxReached, onStepClick }: { currentStep: WizardStepIndex; maxReached: WizardStepIndex; onStepClick: (step: WizardStepIndex) => void })` component

- [ ] **Step 1: Create the rail component**

```tsx
"use client";

import { BadgeCheck, Check, LayoutTemplate, ShieldCheck, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStepIndex, WizardStepMeta } from "./wizard-types";

export const WIZARD_STEPS: WizardStepMeta[] = [
  { index: 1, title: "Basics", icon: LayoutTemplate },
  { index: 2, title: "Assign Agent", icon: BadgeCheck },
  { index: 3, title: "Build Workflow", icon: Workflow },
  { index: 4, title: "Review & Activate", icon: ShieldCheck },
];

export function WizardRail({
  currentStep,
  maxReached,
  onStepClick,
}: {
  currentStep: WizardStepIndex;
  maxReached: WizardStepIndex;
  onStepClick: (step: WizardStepIndex) => void;
}) {
  return (
    <div className="w-full shrink-0 rounded-xl border bg-card p-2 shadow-sm lg:w-[250px]">
      <nav className="flex flex-col gap-1" aria-label="Create automation steps">
        {WIZARD_STEPS.map((step) => {
          const completed = step.index < currentStep;
          const current = step.index === currentStep;
          const clickable = step.index <= maxReached;
          const Icon = step.icon;

          return (
            <button
              key={step.index}
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick(step.index)}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                current && "bg-sidebar-active",
                !clickable && "cursor-not-allowed opacity-50",
                clickable && !current && "hover:bg-sidebar-active/60",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  completed && "bg-chip-success text-chip-success-foreground",
                  current && "bg-chip-primary text-chip-primary-foreground",
                  !completed && !current && "bg-muted text-muted-foreground",
                )}
              >
                {completed ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-xs text-muted-foreground", current && "text-foreground")}>
                  Step {step.index} of {WIZARD_STEPS.length}
                </span>
                <span className={cn("block truncate text-sm font-medium", current && "text-foreground")}>
                  {step.title}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Verify with lint**

Run: `npm run lint`
Expected: no errors reported for `wizard-rail.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/workflows/wizard-rail.tsx"
git commit -m "Add step rail component for the Create Automation wizard"
```

---

### Task 3: Basics step

**Files:**
- Create: `src/app/(app)/workflows/wizard-step-basics.tsx`

**Interfaces:**
- Consumes: `TRIGGER_TYPE_LABELS`, `TriggerType`, `WizardBasics` from `./wizard-types` (Task 1); `Input`, `Label`, `Textarea`, `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem` from `@/components/ui/*`
- Produces: `WizardStepBasics({ value, onChange, error }: { value: WizardBasics; onChange: (value: WizardBasics) => void; error: string | null })` component

- [ ] **Step 1: Create the basics step component**

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRIGGER_TYPE_LABELS, type TriggerType, type WizardBasics } from "./wizard-types";

const TRIGGER_TYPES = Object.keys(TRIGGER_TYPE_LABELS) as TriggerType[];

export function WizardStepBasics({
  value,
  onChange,
  error,
}: {
  value: WizardBasics;
  onChange: (value: WizardBasics) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="automation-name">Automation name</Label>
        <Input
          id="automation-name"
          placeholder="e.g. New Lead Qualification"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          aria-invalid={error ? true : undefined}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="automation-description">Description</Label>
        <Textarea
          id="automation-description"
          placeholder="What does this automation do?"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          className="h-24 min-h-24"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="automation-trigger">Trigger type</Label>
        <Select
          value={value.triggerType}
          onValueChange={(next) => onChange({ ...value, triggerType: next as TriggerType })}
        >
          <SelectTrigger id="automation-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {TRIGGER_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify with lint**

Run: `npm run lint`
Expected: no errors reported for `wizard-step-basics.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/workflows/wizard-step-basics.tsx"
git commit -m "Add Basics step to the Create Automation wizard"
```

---

### Task 4: Assign Agent step

**Files:**
- Create: `src/app/(app)/workflows/wizard-step-agents.tsx`

**Interfaces:**
- Consumes: `Agent` from `@/lib/mock-data/types`; `AgentIcon` from `@/components/shared/agent-icon`; `cn` from `@/lib/utils`
- Produces: `WizardStepAgents({ agents, selectedIds, onChange }: { agents: Agent[]; selectedIds: string[]; onChange: (ids: string[]) => void })` component

- [ ] **Step 1: Create the agents step component**

Note: the selection card is a single `<button>` per agent (not a nested `<button>` + `<Checkbox>`, which would be invalid nested-interactive HTML and would double-toggle on click). The checkbox look is a purely decorative `aria-hidden` indicator inside that button.

```tsx
"use client";

import { Check } from "lucide-react";
import { AgentIcon } from "@/components/shared/agent-icon";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/mock-data/types";

export function WizardStepAgents({
  agents,
  selectedIds,
  onChange,
}: {
  agents: Agent[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Choose which AI agent(s) will carry out this automation.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {agents.map((agent) => {
          const checked = selectedIds.includes(agent.id);
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => toggle(agent.id)}
              aria-pressed={checked}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                checked ? "border-primary bg-chip-primary/40" : "hover:bg-accent",
              )}
            >
              <AgentIcon type={agent.type} className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{agent.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{agent.description}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border",
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                )}
              >
                {checked && <Check className="size-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify with lint**

Run: `npm run lint`
Expected: no errors reported for `wizard-step-agents.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/workflows/wizard-step-agents.tsx"
git commit -m "Add Assign Agent step to the Create Automation wizard"
```

---

### Task 5: Build Workflow step

**Files:**
- Create: `src/app/(app)/workflows/wizard-step-build.tsx`

**Interfaces:**
- Consumes: `Background`, `Controls`, `ReactFlow`, `Edge`, `Node`, `OnConnect`, `OnEdgesChange`, `OnNodesChange` from `@xyflow/react`; `Card` from `@/components/ui/card`; `useTheme` from `next-themes`
- Produces: `WizardStepBuild({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onAddNode }: { nodes: Node[]; edges: Edge[]; onNodesChange: OnNodesChange; onEdgesChange: OnEdgesChange; onConnect: OnConnect; onAddNode: (label: string) => void })` component. This is a controlled/presentational port of the canvas+palette portion of the current `workflow-canvas.tsx` — node/edge state itself lives in the wizard shell (Task 7), not here, so the shell can read `nodes.length` for the Review step.

- [ ] **Step 1: Create the build step component**

```tsx
"use client";

import { useTheme } from "next-themes";
import { Background, Controls, ReactFlow, type Edge, type Node, type OnConnect, type OnEdgesChange, type OnNodesChange } from "@xyflow/react";
import { Card } from "@/components/ui/card";

const NODE_PALETTE: { type: string; label: string }[] = [
  { type: "trigger", label: "Trigger" },
  { type: "ai-decision", label: "AI Decision" },
  { type: "api-call", label: "API Call" },
  { type: "approval", label: "Approval" },
  { type: "notification", label: "Notification" },
  { type: "task-completion", label: "Task Completion" },
];

export function WizardStepBuild({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onAddNode: (label: string) => void;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Card className="w-full p-3 lg:w-48 lg:shrink-0">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Node palette</p>
        <div className="space-y-2">
          {NODE_PALETTE.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onAddNode(item.label)}
              className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>
      <div className="h-[420px] rounded-md border lg:flex-1">
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
  );
}
```

- [ ] **Step 2: Verify with lint**

Run: `npm run lint`
Expected: no errors reported for `wizard-step-build.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/workflows/wizard-step-build.tsx"
git commit -m "Add Build Workflow step to the Create Automation wizard"
```

---

### Task 6: Review & Activate step

**Files:**
- Create: `src/app/(app)/workflows/wizard-step-review.tsx`

**Interfaces:**
- Consumes: `Node` from `@xyflow/react`; `Agent` from `@/lib/mock-data/types`; `TRIGGER_TYPE_LABELS`, `WizardBasics` from `./wizard-types`; `cn` from `@/lib/utils`
- Produces: `WizardStepReview({ basics, selectedAgents, nodes, activateNow, onActivateNowChange }: { basics: WizardBasics; selectedAgents: Agent[]; nodes: Node[]; activateNow: boolean; onActivateNowChange: (value: boolean) => void })` component

- [ ] **Step 1: Create the review step component**

```tsx
"use client";

import type { Node } from "@xyflow/react";
import type { Agent } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";
import { TRIGGER_TYPE_LABELS, type WizardBasics } from "./wizard-types";

export function WizardStepReview({
  basics,
  selectedAgents,
  nodes,
  activateNow,
  onActivateNowChange,
}: {
  basics: WizardBasics;
  selectedAgents: Agent[];
  nodes: Node[];
  activateNow: boolean;
  onActivateNowChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Name</dt>
          <dd className="text-sm">{basics.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Trigger</dt>
          <dd className="text-sm">{TRIGGER_TYPE_LABELS[basics.triggerType]}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground">Description</dt>
          <dd className="text-sm">{basics.description || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Assigned agent(s)</dt>
          <dd className="text-sm">{selectedAgents.map((a) => a.name).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Workflow steps</dt>
          <dd className="text-sm">
            {nodes.length} node{nodes.length === 1 ? "" : "s"} configured
          </dd>
        </div>
      </dl>
      <div className="space-y-2">
        <p className="text-sm font-medium">Status</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onActivateNowChange(false)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm",
              !activateNow ? "border-primary bg-chip-primary/40 font-medium" : "hover:bg-accent",
            )}
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={() => onActivateNowChange(true)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm",
              activateNow ? "border-primary bg-chip-primary/40 font-medium" : "hover:bg-accent",
            )}
          >
            Activate now
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify with lint**

Run: `npm run lint`
Expected: no errors reported for `wizard-step-review.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/workflows/wizard-step-review.tsx"
git commit -m "Add Review & Activate step to the Create Automation wizard"
```

---

### Task 7: Wizard shell, page wiring, and cleanup

This is the integration task: it builds the shell that composes Tasks 1–6, wires it into the Workflows page behind a new button, removes the old always-visible canvas, and is the first point where the whole feature is manually testable end-to-end in the browser.

**Files:**
- Create: `src/app/(app)/workflows/create-automation-wizard.tsx`
- Modify: `src/app/(app)/workflows/workflows-workspace.tsx` (full rewrite of its body — add `initialAgents` prop, remove the inline canvas section, add the "Create Automation" button + wizard overlay)
- Modify: `src/app/(app)/workflows/page.tsx` (fetch `getAgents()` alongside `getWorkflows()`, pass `initialAgents` down)
- Delete: `src/app/(app)/workflows/workflow-canvas.tsx` (superseded — its canvas/palette JSX now lives in `wizard-step-build.tsx`, its name field and save button are replaced by steps 1 and 4)

**Interfaces:**
- Consumes: `WizardRail`, `WIZARD_STEPS` (Task 2); `WizardStepBasics` (Task 3); `WizardStepAgents` (Task 4); `WizardStepBuild` (Task 5); `WizardStepReview` (Task 6); `WizardBasics`, `WizardStepIndex` (Task 1); `Agent`, `WorkflowSummary` from `@/lib/mock-data/types`; `getAgents` from `@/lib/mock-data/agents`; `Breadcrumbs` from `@/components/shared/breadcrumbs`; `Button` from `@/components/ui/button`; `toast` from `@/lib/toast`; `addEdge`, `useEdgesState`, `useNodesState`, `Connection`, `Edge`, `Node` from `@xyflow/react`
- Produces: `CreateAutomationWizard({ agents, onCreate, onClose }: { agents: Agent[]; onCreate: (workflow: WorkflowSummary) => void; onClose: () => void })` — the fully composed wizard, mounted by `WorkflowsWorkspace`

- [ ] **Step 1: Create the wizard shell**

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { X } from "lucide-react";
import { addEdge, useEdgesState, useNodesState, type Connection, type Edge, type Node } from "@xyflow/react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import type { Agent, WorkflowSummary } from "@/lib/mock-data/types";
import { WizardRail, WIZARD_STEPS } from "./wizard-rail";
import { WizardStepBasics } from "./wizard-step-basics";
import { WizardStepAgents } from "./wizard-step-agents";
import { WizardStepBuild } from "./wizard-step-build";
import { WizardStepReview } from "./wizard-step-review";
import type { WizardBasics, WizardStepIndex } from "./wizard-types";

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

export function CreateAutomationWizard({
  agents,
  onCreate,
  onClose,
}: {
  agents: Agent[];
  onCreate: (workflow: WorkflowSummary) => void;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState<WizardStepIndex>(1);
  const [maxReached, setMaxReached] = useState<WizardStepIndex>(1);

  const [basics, setBasics] = useState<WizardBasics>({ name: "", description: "", triggerType: "manual" });
  const [basicsError, setBasicsError] = useState<string | null>(null);

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const nodeIdCounter = useRef(INITIAL_NODES.length + 1);

  const [activateNow, setActivateNow] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  function addNode(label: string) {
    const id = String(nodeIdCounter.current++);
    setNodes((nds) => [...nds, { id, position: { x: 260, y: Math.random() * 400 }, data: { label } }]);
  }

  function goToStep(step: WizardStepIndex) {
    if (step > maxReached) return;
    setCurrentStep(step);
  }

  function handleNext() {
    if (currentStep === 1) {
      const trimmed = basics.name.trim();
      if (!trimmed) {
        setBasicsError("Automation name is required.");
        toast.error("Couldn't continue", "Give your automation a name first.");
        return;
      }
      setBasicsError(null);
      setBasics((prev) => ({ ...prev, name: trimmed }));
    }

    if (currentStep === 2) {
      if (selectedAgentIds.length === 0) {
        setAgentsError("Choose at least one agent.");
        toast.error("Couldn't continue", "Assign at least one agent to this automation.");
        return;
      }
      setAgentsError(null);
    }

    const next = Math.min(currentStep + 1, WIZARD_STEPS.length) as WizardStepIndex;
    setCurrentStep(next);
    setMaxReached((prev) => (next > prev ? next : prev));
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as WizardStepIndex);
  }

  function handleCreate() {
    onCreate({
      id: crypto.randomUUID(),
      name: basics.name,
      status: activateNow ? "active" : "draft",
      lastRun: "",
      successRate: 0,
    });
    toast.success(
      activateNow ? "Automation activated" : "Automation saved as draft",
      `"${basics.name}" has been created.`,
    );
  }

  const selectedAgents = agents.filter((a) => selectedAgentIds.includes(a.id));
  const activeStepMeta = WIZARD_STEPS[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <Breadcrumbs items={[{ label: "Workflows" }, { label: "Create Automation" }]} />
        <Button variant="ghost" size="icon" aria-label="Close wizard" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-6 p-6 lg:flex-row">
        <WizardRail currentStep={currentStep} maxReached={maxReached} onStepClick={goToStep} />

        <div className="flex flex-1 flex-col rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground">
              Step {currentStep} of {WIZARD_STEPS.length}
            </p>
            <h2 className="text-lg font-semibold">{activeStepMeta.title}</h2>
          </div>

          <div className="flex-1">
            {currentStep === 1 && <WizardStepBasics value={basics} onChange={setBasics} error={basicsError} />}
            {currentStep === 2 && (
              <>
                <WizardStepAgents
                  agents={agents}
                  selectedIds={selectedAgentIds}
                  onChange={(ids) => {
                    setSelectedAgentIds(ids);
                    if (ids.length > 0) setAgentsError(null);
                  }}
                />
                {agentsError && <p className="mt-2 text-xs text-destructive">{agentsError}</p>}
              </>
            )}
            {currentStep === 3 && (
              <WizardStepBuild
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onAddNode={addNode}
              />
            )}
            {currentStep === 4 && (
              <WizardStepReview
                basics={basics}
                selectedAgents={selectedAgents}
                nodes={nodes}
                activateNow={activateNow}
                onActivateNowChange={setActivateNow}
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            {currentStep < WIZARD_STEPS.length ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleCreate}>Create Automation</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the Workflows workspace to add the trigger button and mount the wizard**

Replace the full contents of `src/app/(app)/workflows/workflows-workspace.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { CreateAutomationWizard } from "./create-automation-wizard";
import type { Agent, WorkflowSummary } from "@/lib/mock-data/types";

export function WorkflowsWorkspace({
  initialWorkflows,
  initialAgents,
}: {
  initialWorkflows: WorkflowSummary[];
  initialAgents: Agent[];
}) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  function handleCreate(workflow: WorkflowSummary) {
    setWorkflows((prev) => [workflow, ...prev]);
    setIsWizardOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Your automations</h2>
        <Button onClick={() => setIsWizardOpen(true)}>
          <Plus className="size-4" />
          Create Automation
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workflows.map((wf) => (
          <Card key={wf.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <CardTitle className="line-clamp-2 min-h-10 max-w-[130px] text-sm">{wf.name}</CardTitle>
              <div className="shrink-0">
                <StatusBadge status={wf.status} />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Success rate: {wf.successRate}% · Last run{" "}
              {wf.lastRun ? new Date(wf.lastRun).toLocaleString("en-US", { timeZone: "UTC" }) : "Never run"}
            </CardContent>
          </Card>
        ))}
      </div>

      {isWizardOpen && (
        <CreateAutomationWizard agents={initialAgents} onCreate={handleCreate} onClose={() => setIsWizardOpen(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Fetch agents in the page and pass them down**

Replace the full contents of `src/app/(app)/workflows/page.tsx`:

```tsx
import { getWorkflows } from "@/lib/mock-data/workflows";
import { getAgents } from "@/lib/mock-data/agents";
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowsWorkspace } from "./workflows-workspace";

export default async function WorkflowsPage() {
  const [workflows, agents] = await Promise.all([getWorkflows(), getAgents()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Builder" description="Design and automate multi-step business processes." />
      <WorkflowsWorkspace initialWorkflows={workflows} initialAgents={agents} />
    </div>
  );
}
```

- [ ] **Step 4: Delete the superseded canvas file**

```bash
git rm "src/app/(app)/workflows/workflow-canvas.tsx"
```

- [ ] **Step 5: Verify with lint and a full build**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds with no TypeScript errors (this also catches any prop-shape mismatches across the 7 new/changed files that `lint` alone wouldn't).

- [ ] **Step 6: Manual verification in the browser**

Run: `npm run dev`, open `/workflows`, and confirm:

1. The page shows the automations grid and a "Create Automation" button — no inline canvas is visible anymore.
2. Clicking "Create Automation" opens a full-screen overlay with **no app sidebar visible**, just a breadcrumb + close button header.
3. On step 1 (Basics), clicking "Next" with an empty name shows an inline error and a toast, and does not advance.
4. Filling in a name and clicking "Next" advances to step 2; the rail now shows step 1 with a checkmark, step 2 highlighted as current, and steps 3–4 dimmed and **not clickable**.
5. On step 2, clicking "Next" with no agent selected shows an inline error and a toast, and does not advance. Selecting an agent and clicking "Next" advances to step 3.
6. Step 3 shows the node palette and a pre-populated 6-node flow diagram; adding a node from the palette adds it to the canvas.
7. Step 4 shows a summary matching what was entered, with "Save as draft" / "Activate now" toggle buttons.
8. Clicking a completed step in the rail (e.g. step 1 from step 4) jumps back there **without clearing** previously entered data.
9. Clicking "Create Automation" on step 4 closes the wizard, shows a success toast, and adds a new card to the grid at the top with the correct name and status (`draft` or `active` matching the toggle chosen).
10. The close (X) button and "Cancel" both exit the wizard back to the grid without creating anything.
11. Toggle dark mode (existing theme toggle in the topbar) and re-open the wizard — rail chip colors, card backgrounds, and text remain legible in both themes.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/workflows/create-automation-wizard.tsx" \
  "src/app/(app)/workflows/workflows-workspace.tsx" \
  "src/app/(app)/workflows/page.tsx"
git commit -m "Wire Create Automation wizard into the Workflows page, remove old inline canvas"
```
