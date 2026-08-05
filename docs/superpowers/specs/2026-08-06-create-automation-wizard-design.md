# Create Automation step wizard — design spec

Date: 2026-08-06
Status: Approved

## Context

Two Figma-exported mockups were provided: `Dashboard - Default View.svg`
(the already-implemented dashboard/app-shell visual language — white cards,
`#F05223` orange accent, dark `#231F20` sidebar/logo, `IconChip`-style
circular icons) and `Create Task Automation - Steps.svg`, a new mockup for a
4-step creation wizard (left step rail with icon + numbered rows, a large
content card, and a persistent bottom-right orange CTA button). The mockup's
text is vector-outlined (not `<text>`), so exact copy could not be extracted;
step content was inferred from icon semantics (template/layers, badge,
two-column canvas, shield-check) and mapped onto this app's actual workflow
domain model, then confirmed with the user.

Today, workflow creation on `/workflows` is a single always-visible section
(`workflow-canvas.tsx`) bolted onto the bottom of the workflow list page: a
name field, a node palette, a `ReactFlow` canvas, and one "Save workflow"
button. There is no entry point ("start creating") and no indication of
sequence, which is the actual UX problem being fixed.

## Scope

- `src/app/(app)/workflows/page.tsx` — additionally fetch `getAgents()` and
  pass to the workspace, alongside the existing `getWorkflows()`
- `src/app/(app)/workflows/workflows-workspace.tsx` — remove the inline
  canvas section; add a "Create Automation" trigger button above the grid
  that opens the new wizard overlay
- New: `src/app/(app)/workflows/create-automation-wizard.tsx` — wizard shell
  (full-screen overlay, step state machine, footer nav)
- New: `src/app/(app)/workflows/wizard-rail.tsx` — left step-rail component
- New: `src/app/(app)/workflows/wizard-step-basics.tsx`,
  `wizard-step-agents.tsx`, `wizard-step-build.tsx`, `wizard-step-review.tsx`
- Removed: `src/app/(app)/workflows/workflow-canvas.tsx` — its canvas/palette
  JSX is folded into `wizard-step-build.tsx`; its name-field and save-button
  responsibilities move to steps 1 and 4 respectively

Out of scope: no changes to `WorkflowSummary`/mock-data types, no new route
(the wizard is an in-page overlay, not `/workflows/new`), no persistence
beyond the existing in-memory client state pattern already used by
`WorkflowsWorkspace`.

## Entry point & overlay behavior

`WorkflowsWorkspace` gains a header row above the grid: heading + a
`Create Automation` primary button (with a `Plus` icon). Clicking it sets
`isWizardOpen = true`, rendering `<CreateAutomationWizard>` as a
`fixed inset-0 z-50` element covering the full viewport — no app sidebar,
matching the mockup's focused, single-purpose layout. This is a client-side
takeover within the same component tree (not a Next.js route), so on
completion the wizard can call back into `WorkflowsWorkspace`'s existing
`handleSave`-style state updater directly, with no cross-route state bridge
needed.

Wizard header: `Breadcrumbs` (`Workflows / Create Automation`) on the left,
a close (`X`) icon button on the right that resets wizard state and returns
to the grid.

## The 4 steps

| # | Step | Icon | Fields | Gate to advance |
|---|------|------|--------|---|
| 1 | **Basics** | `LayoutTemplate` | Name (text, required), Description (textarea, optional), Trigger type (select: Manual / Scheduled / Event / Webhook, defaults to Manual) | Name non-empty (trimmed) |
| 2 | **Assign Agent** | `BadgeCheck` | Multi-select list of real agents from `getAgents()`, rendered as selectable cards (existing `AgentIcon` + name + type badge) | ≥1 agent selected |
| 3 | **Build Workflow** | `Workflow` | Node palette (Trigger / AI Decision / API Call / Approval / Notification / Task Completion) + `ReactFlow` canvas, pre-seeded with the current default 6-node template so it's never empty | none — always valid |
| 4 | **Review & Activate** | `ShieldCheck` | Read-only summary (name, description, trigger, assigned agent(s), node count), a Save as Draft / Activate Now choice (defaults to Draft) | — (final step) |

Validation follows the existing codebase pattern already in
`workflow-canvas.tsx`: inline field error text + `toast.error(...)` on a
blocked "Next" click, rather than a fully disabled button (keeps the
affordance visible and clickable so users get told *why* they can't
proceed).

## Step rail behavior (the "which step is next" fix)

`wizard-rail.tsx` renders the 4 rows in a 250px card (same white-card/rounded
style as the rest of the app). Each row shows an icon chip, step number/title,
and one of three states:

- **Completed** (`step < current`): checkmark icon in an orange-filled chip,
  clickable — jumps back to that step without losing entered data (all step
  state lives in the wizard shell's `useState`, untouched by navigation).
- **Current** (`step === current`): orange-filled chip with the step number,
  row background highlighted, bold label.
- **Upcoming** (`step > current`): muted/gray chip, dimmed label, **not
  clickable**. This is the deliberate fix for the reported confusion — a
  user can never jump ahead to an unreached step, so there is exactly one
  possible "next" state at all times, visually obvious via the highlighted
  current row.

Rail state is derived from a single `currentStep: 1 | 2 | 3 | 4` plus
`maxReached: number` (the highest step index the user has ever reached);
`step <= maxReached` is clickable, `step > maxReached` is not.

No new color tokens are needed: each row's icon chip reuses the existing
`IconChip` component/variants — `success` (green) for completed, `primary`
(orange) for current, and a plain muted/outline treatment (not an `IconChip`
variant — just `bg-muted text-muted-foreground`) for upcoming — so light and
dark mode are handled automatically by tokens already defined in
`globals.css`.

## Content panel & footer

Right side: a white card matching existing dashboard card styling, header
"Step X of 4 · \<Title>", the active step's form body, and a footer pinned to
the bottom of the card containing:

- Left: `Cancel` (text link, closes wizard) and `Back` (ghost button, hidden
  on step 1)
- Right: primary orange button — `Next` on steps 1–3, `Create Automation` on
  step 4 — positioned bottom-right per the mockup

## Submit behavior

On step 4's `Create Automation` click: build a `WorkflowSummary` object
(`id: crypto.randomUUID()`, `name`, `status: "draft" | "active"` from the
Draft/Activate choice, `lastRun: ""`, `successRate: 0`) — the same shape
`WorkflowCanvas.onSave` already produces today — prepend it to the
workspace's `workflows` state, show `toast.success(...)`, close the wizard.
Description/trigger/agent/node data collected in steps 1–3 is used only to
populate the review screen and is not persisted beyond that (matches the
existing scope of `WorkflowSummary`; no mock-data schema change).

## Testing / manual verification

Since this is a frontend-only client-state feature with no test suite
observed for this area, verification is manual in the browser: open the
wizard, confirm upcoming steps are unclickable, confirm validation blocks
on empty name / zero agents, confirm Back preserves entered data, confirm
completing the wizard adds a card to the grid with a toast, confirm the
overlay has no visible sidebar and matches the app's card/color language in
both light and dark mode.
