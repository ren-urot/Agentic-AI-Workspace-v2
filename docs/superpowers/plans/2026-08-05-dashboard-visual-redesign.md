# Dashboard Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the app shell (topbar + sidebar) and the dashboard page to match `Dashboard.svg` — warm gray page background, orange brand color, a floating rounded sidebar card, pastel icon-chip stat cards, and a new circular logo mark.

**Architecture:** Pure presentational restyle on top of existing mock-data plumbing. No data shape changes. Global CSS tokens (`globals.css`) drive color everywhere; the app shell is restructured so the topbar spans the full page width with the sidebar+content as a nested row below it (currently the sidebar spans full height beside the topbar); a new React context shares sidebar-collapsed state between the topbar (which now hosts the toggle button) and the sidebar itself.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (`@theme inline` token mapping), `lucide-react` icons, `@base-ui/react` primitives (Avatar, Button, DropdownMenu — already in use, no new deps). No test framework is configured in this repo (`package.json` has no `test` script) — verification is `npx tsc --noEmit`, `npm run lint`, and manual browser screenshots via the dev server.

## Global Constraints

- No new npm dependencies.
- Only these areas change: `src/app/globals.css`, `src/components/shell/*`, `src/components/shared/{brand-mark,icon-chip,stat-card}.tsx` (new/modified), `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/page.tsx`. No other pages (`agents`, `knowledge`, `workflows`, `integrations`, `admin`) get direct edits, but the global token changes (background/primary colors) affect them visually — the final task spot-checks this doesn't break anything.
- Colors/values must match the spec exactly: page bg `#EAEAEA`, primary `#F05223`, chip palette (primary `#FFE3CA`/`#F05223`, success `#C7F2CE`/`#00A424`, info `#CACDFF`/`#235DF0`, warning `#FFEBCA`/`#FF8D28`), sidebar active row `#F4F4F4`, sidebar accent bar `#F05223` 3px, topbar border `#D9D9D9`, topbar height 79px, dashboard grid gaps 20px (`gap-5`).
- Card corner radius: the existing `Card` component already renders at exactly 15px via the current `--radius`/`--radius-xl` chain (`0.6696rem × 1.4 ≈ 0.9375rem = 15px`) — **no radius token change is needed**, despite the design spec mentioning a radius bump. Just confirm `rounded-xl` is used everywhere the mockup shows a 15px-radius card (it already is, via the `Card` component).
- Keep all existing routing, auth (`logout` action), and data-fetching behavior unchanged — this is a visual-only pass.

---

### Task 1: Design tokens

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes `bg-chip-primary`, `text-chip-primary-foreground`, `bg-chip-success`, `text-chip-success-foreground`, `bg-chip-info`, `text-chip-info-foreground`, `bg-chip-warning`, `text-chip-warning-foreground`, `bg-sidebar-active` — consumed by Tasks 4, 6, 8.
- Produces: `--background` and `--primary` now resolve to `#EAEAEA` / `#F05223` (light) — consumed implicitly by every component using `bg-background`, `bg-primary`, `text-primary`, `border-primary`, etc. (including the existing `RevenueChart`/`WorkflowHealthChart`, which already read `var(--primary)`).

- [ ] **Step 1: Update `:root` background and primary**

In `src/app/globals.css`, inside the `:root { ... }` block, replace:

```css
  --background: #f9f9f9;
```
with:
```css
  --background: #eaeaea;
```

and replace:
```css
  --primary: oklch(0.62 0.19 35);
```
with:
```css
  --primary: #f05223;
```

(Leave `--accent` and `--sidebar-accent`/`--sidebar-accent-foreground` as-is — they're not used by the new components in this plan.)

- [ ] **Step 2: Update `.dark` primary to match**

In the `.dark { ... }` block, replace:
```css
  --primary: oklch(0.65 0.19 35);
```
with:
```css
  --primary: #f56a41;
```

(A slightly lighter tint than the light-mode `#f05223` for adequate contrast on the dark surface — the mockup has no dark-mode spec, so this follows the codebase's existing pattern of lightening saturated colors for dark mode, e.g. `emerald-600` → `emerald-400`.)

- [ ] **Step 3: Add chip and sidebar-active tokens**

In `:root`, immediately after the `--sidebar-ring` line, add:

```css
  --chip-primary: #ffe3ca;
  --chip-primary-foreground: #f05223;
  --chip-success: #c7f2ce;
  --chip-success-foreground: #00a424;
  --chip-info: #cacdff;
  --chip-info-foreground: #235df0;
  --chip-warning: #ffebca;
  --chip-warning-foreground: #ff8d28;
  --sidebar-active: #f4f4f4;
```

In `.dark`, immediately after its `--sidebar-ring` line, add the dark-mode equivalents (translucent chip backgrounds so they read on a dark surface, lightened foregrounds for contrast):

```css
  --chip-primary: color-mix(in oklab, #f05223 18%, transparent);
  --chip-primary-foreground: #ff8f65;
  --chip-success: color-mix(in oklab, #00a424 18%, transparent);
  --chip-success-foreground: #4ade80;
  --chip-info: color-mix(in oklab, #235df0 18%, transparent);
  --chip-info-foreground: #7c9cff;
  --chip-warning: color-mix(in oklab, #ff8d28 18%, transparent);
  --chip-warning-foreground: #ffb15e;
  --sidebar-active: color-mix(in oklab, white 8%, transparent);
```

- [ ] **Step 4: Register the new tokens in `@theme inline`**

In the `@theme inline { ... }` block, immediately after the `--color-sidebar-ring: var(--sidebar-ring);` line, add:

```css
  --color-chip-primary: var(--chip-primary);
  --color-chip-primary-foreground: var(--chip-primary-foreground);
  --color-chip-success: var(--chip-success);
  --color-chip-success-foreground: var(--chip-success-foreground);
  --color-chip-info: var(--chip-info);
  --color-chip-info-foreground: var(--chip-info-foreground);
  --color-chip-warning: var(--chip-warning);
  --color-chip-warning-foreground: var(--chip-warning-foreground);
  --color-sidebar-active: var(--sidebar-active);
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors (CSS changes don't affect TypeScript, this just confirms the repo is in a clean baseline state before further edits).

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "Update design tokens for dashboard redesign (bg, primary, chip palette)"
```

---

### Task 2: Brand mark component

**Files:**
- Create: `src/components/shared/brand-mark.tsx`

**Interfaces:**
- Produces: `BrandMark({ className?: string }): JSX.Element` — a self-contained 55×55 (viewBox) SVG logo mark, rendered at 32×32 by default. Consumed by Task 5 (Topbar).

- [ ] **Step 1: Create the component**

```tsx
// src/components/shared/brand-mark.tsx
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="82 14 55 55"
      width="32"
      height="32"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="NexxaByte"
    >
      <circle cx="109.3" cy="40.3" r="25.3" fill="#231F20" />
      <path
        d="M98.248 53.0599L106.933 39.6413L98.7116 27.5159H91.002L99.6387 40.0805L90.6849 53.0599H98.248Z"
        fill="#F05223"
      />
      <path d="M120.059 38.2751L127.525 27.5159H119.962L116.4 32.8589L120.059 38.2751Z" fill="white" />
      <path
        d="M109.861 53.0599L118.547 39.6413L110.325 27.5159H102.615L111.252 40.0805L102.298 53.0599H109.861Z"
        fill="#F05223"
      />
      <path d="M119.913 41.3491L116.204 47.0337L120.157 53.0842H127.915L119.913 41.3491Z" fill="white" />
    </svg>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/brand-mark.tsx
git commit -m "Add BrandMark logo component"
```

---

### Task 3: Sidebar-collapse context and toggle button

**Files:**
- Create: `src/components/shell/sidebar-context.tsx`
- Create: `src/components/shell/sidebar-collapse-toggle.tsx`

**Interfaces:**
- Produces: `SidebarCollapseProvider({ children }): JSX.Element` — consumed by Task 7 (`layout.tsx`, wraps the whole shell).
- Produces: `useSidebarCollapse(): { collapsed: boolean; toggle: () => void }` — consumed by Task 6 (`Sidebar`) and this task's own `SidebarCollapseToggle`.
- Produces: `SidebarCollapseToggle(): JSX.Element` — consumed by Task 5 (`Topbar`).

- [ ] **Step 1: Create the context**

```tsx
// src/components/shell/sidebar-context.tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarCollapseContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarCollapseContext = createContext<SidebarCollapseContextValue | null>(null);

export function SidebarCollapseProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarCollapseContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse(): SidebarCollapseContextValue {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) {
    throw new Error("useSidebarCollapse must be used within a SidebarCollapseProvider");
  }
  return ctx;
}
```

- [ ] **Step 2: Create the toggle button**

```tsx
// src/components/shell/sidebar-collapse-toggle.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarCollapse } from "@/components/shell/sidebar-context";

export function SidebarCollapseToggle() {
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden md:inline-flex"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={toggle}
    >
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </Button>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (`Sidebar` doesn't consume the context yet — that's Task 6 — so no "provider missing" runtime error can occur here; this is a pure static check.)

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/sidebar-context.tsx src/components/shell/sidebar-collapse-toggle.tsx
git commit -m "Add shared sidebar-collapse context and toggle button"
```

---

### Task 4: IconChip component

**Files:**
- Create: `src/components/shared/icon-chip.tsx`

**Interfaces:**
- Produces: `IconChip({ icon: LucideIcon; variant: "primary"|"success"|"info"|"warning"; className?: string }): JSX.Element` and exported type `IconChipVariant`. Consumed by Task 8 (`StatCard`).

- [ ] **Step 1: Create the component**

```tsx
// src/components/shared/icon-chip.tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  primary: "bg-chip-primary text-chip-primary-foreground",
  success: "bg-chip-success text-chip-success-foreground",
  info: "bg-chip-info text-chip-info-foreground",
  warning: "bg-chip-warning text-chip-warning-foreground",
} as const;

export type IconChipVariant = keyof typeof VARIANT_STYLES;

export function IconChip({
  icon: Icon,
  variant,
  className,
}: {
  icon: LucideIcon;
  variant: IconChipVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-[53px] shrink-0 items-center justify-center rounded-full",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/icon-chip.tsx
git commit -m "Add IconChip component"
```

---

### Task 5: Topbar restyle

**Files:**
- Modify: `src/components/shell/topbar.tsx`

**Interfaces:**
- Consumes: `BrandMark` (Task 2), `SidebarCollapseToggle` (Task 3), `MobileNav` (from `src/components/shell/sidebar.tsx`, unchanged export name).
- Produces: `Topbar(): JSX.Element` — same export name/signature as before (no props), consumed by `layout.tsx` (Task 7) — no interface change, so `layout.tsx`'s existing `<Topbar />` call site keeps working until Task 7 touches it.

- [ ] **Step 1: Replace the file contents**

```tsx
// src/components/shell/topbar.tsx
"use client";

import { Bell } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark } from "@/components/shared/brand-mark";
import { SidebarCollapseToggle } from "@/components/shell/sidebar-collapse-toggle";
import { MobileNav } from "@/components/shell/sidebar";
import { logout } from "@/app/login/actions";

export function Topbar() {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="flex h-[79px] shrink-0 items-center justify-between border-b border-[#D9D9D9] bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <BrandMark />
        <SidebarCollapseToggle />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#231F20] text-white">NB</AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Admin User</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (This will report an error if `SidebarCollapseToggle` is rendered without a provider ancestor being *statically required* — it isn't; that's a runtime concern, not a type error. Runtime is verified in Task 7 once the provider is wired in.)

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/topbar.tsx
git commit -m "Restyle Topbar: brand mark, collapse toggle, dark avatar, 79px height"
```

---

### Task 6: Sidebar restyle (floating card)

**Files:**
- Modify: `src/components/shell/sidebar.tsx`

**Interfaces:**
- Consumes: `useSidebarCollapse` (Task 3), `BrandMark` (Task 2), `NAV_ITEMS` (existing, unchanged).
- Produces: `Sidebar(): JSX.Element` (desktop floating card, reads collapsed state from context instead of local `useState` — no props change) and `MobileNav(): JSX.Element` (unchanged export, logo swapped). Both consumed by Task 7 (`layout.tsx`) and Task 5 (`Topbar` imports `MobileNav`).

- [ ] **Step 1: Replace the file contents**

```tsx
// src/components/shell/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { BrandMark } from "@/components/shared/brand-mark";
import { useSidebarCollapse } from "@/components/shell/sidebar-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapse();

  return (
    <aside
      className={cn(
        "sticky top-6 hidden h-fit shrink-0 flex-col rounded-xl bg-[#FFFDFD] text-foreground shadow-[0_0_20px_0_rgba(0,0,0,0.1)] transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-[250px]",
      )}
    >
      <nav className="flex flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-active text-foreground"
                  : "text-foreground/70 hover:bg-sidebar-active/60",
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-primary/70")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto h-5 w-[3px] shrink-0 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="p-0 data-[side=left]:w-64">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <BrandMark />
        </div>
        <nav className="space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

Note: `collapsed` is read from context in `Sidebar` but `MobileNav` intentionally keeps its own local `open` state (that's the sheet's open/closed state, unrelated to desktop collapse — no change there).

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/sidebar.tsx
git commit -m "Restyle Sidebar as floating rounded card; swap MobileNav logo"
```

---

### Task 7: Layout restructure

**Files:**
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `SidebarCollapseProvider` (Task 3), `Sidebar`/`Topbar` (Tasks 5/6, unchanged call signatures).

- [ ] **Step 1: Replace the file contents**

Restructure so the topbar spans the full page width, with sidebar+content as a nested row below it (previously the sidebar spanned full height beside the topbar):

```tsx
// src/app/(app)/layout.tsx
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { SidebarCollapseProvider } from "@/components/shell/sidebar-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarCollapseProvider>
      <div className="flex min-h-screen flex-col">
        <Topbar />
        <div className="flex flex-1 gap-6 p-6">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarCollapseProvider>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Start the dev server and do a first visual pass**

Run in background: `npm run dev`

Then, using a browser (devtools MCP or Playwright MCP), navigate to `http://localhost:3000/dashboard` (log in first if the app redirects to `/login` — use whatever seeded credentials the mock auth accepts, check `src/app/login/actions.ts` / `src/lib/auth.ts` if unsure) and take a screenshot at 1440×900 or wider.

Expected: page background is warm gray, topbar is a full-width white bar with the new logo mark + collapse chevron on the left and bell + dark avatar on the right, sidebar renders as a floating white rounded card with a visible shadow below-left of the topbar (not flush against the left/top edges), clicking the collapse chevron toggles the sidebar between 250px and 64px. Dashboard page content itself will still look like the old layout (Task 9 restyles it) — that's expected at this point.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/layout.tsx"
git commit -m "Restructure app shell: full-width topbar, floating sidebar row below it"
```

---

### Task 8: StatCard restyle

**Files:**
- Modify: `src/components/shared/stat-card.tsx`

**Interfaces:**
- Consumes: `IconChip`, `IconChipVariant` (Task 4).
- Produces: `StatCard({ metric: KpiMetric; icon: LucideIcon; variant: IconChipVariant }): JSX.Element` — **signature change** (adds required `icon` and `variant` props, previously just `{ metric }`). Consumed by Task 9 (`dashboard/page.tsx`), which is the only call site (confirmed via `grep -rn "StatCard" src` — only `dashboard/page.tsx` imports it) so no other file needs updating for this signature change.

- [ ] **Step 1: Replace the file contents**

```tsx
// src/components/shared/stat-card.tsx
import { ArrowDown, ArrowRight, ArrowUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconChip, type IconChipVariant } from "@/components/shared/icon-chip";
import type { KpiMetric } from "@/lib/mock-data/types";

const DIVIDER_COLOR: Record<IconChipVariant, string> = {
  primary: "bg-chip-primary",
  success: "bg-chip-success",
  info: "bg-chip-info",
  warning: "bg-chip-warning",
};

export function StatCard({
  metric,
  icon,
  variant,
}: {
  metric: KpiMetric;
  icon: LucideIcon;
  variant: IconChipVariant;
}) {
  const TrendIcon = metric.trend === "up" ? ArrowUp : metric.trend === "down" ? ArrowDown : ArrowRight;
  const trendColor =
    metric.trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : metric.trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card className="ring-0">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <IconChip icon={icon} variant={variant} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-muted-foreground">{metric.label}</p>
            <div className={cn("mt-2 h-px w-full", DIVIDER_COLOR[variant])} />
          </div>
        </div>
        <div className="text-2xl font-semibold">{metric.value}</div>
        <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{Math.abs(metric.delta)}%</span>
          <span className="font-normal text-muted-foreground">vs last 7 days</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: **errors** at the `dashboard/page.tsx` call site (`<StatCard key={kpi.id} metric={kpi} />` is now missing required `icon`/`variant` props). This is expected and fixed in Task 9 — do not treat this as a failure to fix here, just confirm the error is exactly the missing-props error and nothing else (e.g. no typo/syntax errors in `stat-card.tsx` itself).

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/stat-card.tsx
git commit -m "Restyle StatCard with IconChip, colored divider, and trend row"
```

---

### Task 9: Dashboard page restructure

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `StatCard` (Task 8, new `icon`/`variant` props), `RevenueChart`/`WorkflowHealthChart` (existing, unchanged, from `./charts`), `getKpis`/`getActivityFeed`/`getAlerts`/`getRevenueSeries`/`getWorkflowHealthSeries` (existing, unchanged), `getAgents` (existing, unchanged), `AgentIcon`/`StatusBadge` (existing, unchanged).

- [ ] **Step 1: Replace the file contents**

```tsx
// src/app/(app)/dashboard/page.tsx
import { AlertTriangle, Bot, CheckCircle2, PiggyBank, Zap } from "lucide-react";
import { getAgents } from "@/lib/mock-data/agents";
import { getActivityFeed, getAlerts, getKpis, getRevenueSeries, getWorkflowHealthSeries } from "@/lib/mock-data/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import type { IconChipVariant } from "@/components/shared/icon-chip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart, WorkflowHealthChart } from "./charts";
import type { LucideIcon } from "lucide-react";

const KPI_PRESENTATION: Record<string, { icon: LucideIcon; variant: IconChipVariant }> = {
  "active-agents": { icon: Bot, variant: "primary" },
  "tasks-automated": { icon: CheckCircle2, variant: "success" },
  "avg-response": { icon: Zap, variant: "info" },
  "cost-saved": { icon: PiggyBank, variant: "warning" },
};

export default async function DashboardPage() {
  const [kpis, activity, alerts, revenue, workflowHealth, agents] = await Promise.all([
    getKpis(),
    getActivityFeed(),
    getAlerts(),
    getRevenueSeries(),
    getWorkflowHealthSeries(),
    getAgents(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Executive Dashboard" description="Real-time overview of your organization's AI operations." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const presentation = KPI_PRESENTATION[kpi.id] ?? { icon: Bot, variant: "primary" as const };
          return <StatCard key={kpi.id} metric={kpi} icon={presentation.icon} variant={presentation.variant} />;
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[437fr_437fr_284fr]">
        <RevenueChart data={revenue} />
        <WorkflowHealthChart data={workflowHealth} />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 text-sm">
                <AlertTriangle
                  className={
                    alert.severity === "critical"
                      ? "mt-0.5 h-4 w-4 shrink-0 text-red-500"
                      : alert.severity === "warning"
                        ? "mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                        : "mt-0.5 h-4 w-4 shrink-0 text-blue-500"
                  }
                />
                <span className="text-muted-foreground">{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agent Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <AgentIcon type={agent.type} className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active {new Date(agent.lastActive).toLocaleTimeString("en-US", { timeZone: "UTC" })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="size-2 shrink-0 rounded-full bg-[#D70000]" aria-hidden="true" />
                <div className="flex flex-1 items-center justify-between">
                  <span>
                    <span className="font-medium">{item.agentName}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors (this fixes the `StatCard` prop error introduced in Task 8).

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "Restructure dashboard page: move Alerts to row 2, resize Agent Status/AI Activity to row 3"
```

---

### Task 10: Full visual verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm dev server is running**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard`
Expected: `200` (or a redirect to `/login` if not authenticated — if so, log in through the browser first, then re-check `/dashboard`). If not running, start it: `npm run dev` (background).

- [ ] **Step 2: Screenshot the redesigned dashboard**

Using the browser MCP tool, navigate to `http://localhost:3000/dashboard`, resize the viewport to at least 1600×1000, and take a full-page screenshot.

Expected, compared against `Dashboard.svg`:
- Page background is `#EAEAEA` (warm gray), not white.
- Topbar: white, ~79px tall, `#D9D9D9` border-bottom, circular black+orange logo mark + collapse chevron on the left, bell + solid dark avatar circle on the right.
- Sidebar: floating white rounded card (not edge-to-edge/full-height), with a soft shadow, positioned below-left of the topbar with visible page-background margin around it. Active nav item (Dashboard) has a light-gray row background and a thin orange bar on the card's right edge.
- Row 1: 4 equal-width KPI cards, each with a 53px pastel circular icon badge (orange/green/periwinkle/amber in that order), a thin colored divider next to the label, the metric value, and a colored trend arrow + percentage at the bottom.
- Row 2: two wide chart cards (Revenue, Workflow Health) plus a narrower Alerts card, all the same height.
- Row 3: Agent Status and AI Activity cards, roughly equal width, AI Activity rows each prefixed with a small red dot.
- Card gaps are visibly larger/airier than a tight `gap-4` — confirm `gap-5` (20px) reads correctly throughout.

If any of these don't match, go back to the relevant task and fix before proceeding (this is the actual "does it match the design" gate for the whole plan).

- [ ] **Step 3: Toggle the sidebar collapse button**

Click the collapse chevron in the topbar. Screenshot again.

Expected: sidebar narrows to a 64px icon-only rail (labels hidden), content area reflows to use the freed width, no layout shift/overlap.

- [ ] **Step 4: Confirm unchanged interactive behavior**

At a narrow viewport (<768px), confirm the hamburger button in the topbar opens the `MobileNav` sheet with the new logo and all 6 links, and clicking a link navigates and closes the sheet. At desktop width, click the bell button (no-op is expected — it was already a plain button with no dropdown in `main`) and open the user-avatar dropdown, then click "Sign out" and confirm it redirects to the login page (existing `logout` action, unchanged).

Expected: no regressions — these are all pre-existing behaviors this plan didn't intend to change.

- [ ] **Step 5: Spot-check dark mode**

If a theme toggle exists in the app (check `src/components/shell/theme-toggle.tsx` if present) switch to dark mode and re-screenshot `/dashboard`. If no theme toggle is wired up in the UI, instead verify by temporarily adding the `dark` class to `<html>` via the browser devtools console (`document.documentElement.classList.add('dark')`) and reloading is not needed — the class toggle re-renders live.

Expected: page remains legible — chip backgrounds are dim/translucent rather than glaring pastel-on-dark, sidebar/topbar don't lose contrast, primary orange is still visibly orange (not washed out).

- [ ] **Step 6: Spot-check an unrelated page for token regressions**

Navigate to `http://localhost:3000/agents` (or any other existing page) and screenshot it.

Expected: the page still renders correctly with the new page background (`#EAEAEA`) and primary color (`#F05223`) applied globally — no broken contrast, no unreadable text, nothing visually clipped. This page wasn't redesigned, so its layout should be identical to before — only its background/primary/button colors shift with the rest of the app.

- [ ] **Step 7: Stop the dev server**

If it was started in the background for this verification, stop it.

- [ ] **Step 8: Final commit (if any fixes were made during verification)**

```bash
git status
```

If verification uncovered issues that were fixed in the relevant task files, stage and commit them with a message describing what was corrected, e.g.:

```bash
git add -A
git commit -m "Fix visual issues found during dashboard redesign verification"
```

If no fixes were needed, skip this step — the plan is complete.
