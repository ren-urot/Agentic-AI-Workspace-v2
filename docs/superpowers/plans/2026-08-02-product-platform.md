# NexxaByte Agentic AI Solutions — Product Platform (Frontend Phase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully navigable, fully interactive Next.js frontend implementing all six modules from PRD Section 14 (Executive Dashboard, AI Agent Console, Knowledge Base, Workflow Builder, Integration Center, Administration), running on realistic mock data, styled to NexxaByte branding.

**Architecture:** Next.js App Router with a `(app)` route group holding the authenticated shell (sidebar + topbar) and one route per module. A typed mock-data layer (`src/lib/mock-data/`) simulates async API calls so real endpoints can swap in later without touching component code. Mock cookie-based "auth" gates the app via middleware.

**Tech Stack:** Next.js (App Router) + TypeScript (strict) + Tailwind CSS + shadcn/ui + Geist font + next-themes + Recharts + `@xyflow/react` (React Flow) + TanStack Table.

## Global Constraints

- TypeScript strict mode; no `any` in new code.
- All components styled with Tailwind + shadcn/ui — no ad hoc CSS files beyond `globals.css`.
- Brand accent color `#F05223` (orange), neutral `#494949` (dark gray), applied via the shadcn CSS variable theme (`--primary` etc.), not hardcoded hex in components.
- Every module route lives under the `(app)` route group and is gated by the auth middleware.
- Mock data functions are `async` and return `Promise<T>` (simulated latency via a shared `delay()` helper) so call sites already handle loading state correctly.
- Dark mode and light mode must both render correctly for every screen built.
- No automated test suite this phase. Verification per task: `npx tsc --noEmit` passes, `npm run build` passes, and manual check of the route in the dev server (light + dark, desktop + mobile width).
- Every `git commit` in this plan uses `git add <specific files>` (never `-A` or `.`).

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, `components.json`, `.gitignore`
- Create: `public/nexxabyte-logo.svg` (copy of the provided logo asset)

**Interfaces:**
- Produces: a runnable `npm run dev` Next.js + TypeScript + Tailwind + shadcn/ui project with the `@/*` path alias resolving to `src/*`, ready for all later tasks to add files into `src/`.

- [ ] **Step 1: Scaffold Next.js app**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```
When prompted, accept defaults. This creates `src/app/`, `tailwind.config.ts` (or CSS-based Tailwind v4 config), `tsconfig.json` with the `@/*` alias.

- [ ] **Step 2: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init -d
```
This creates `components.json` and wires shadcn's CSS variables into `src/app/globals.css`.

- [ ] **Step 3: Add the shadcn components used across this plan**

Run:
```bash
npx shadcn@latest add button card badge table tabs dialog alert-dialog sheet dropdown-menu avatar input textarea switch select separator skeleton tooltip scroll-area checkbox label alert progress
```
This populates `src/components/ui/*`.

- [ ] **Step 4: Install remaining libraries**

Run:
```bash
npm install next-themes geist recharts @xyflow/react @tanstack/react-table lucide-react
```

- [ ] **Step 5: Copy the NexxaByte logo into `public/`**

Copy the logo SVG provided by the user to `public/nexxabyte-logo.svg` (create the file with the exact SVG markup from `nexxabyte_logo.svg`).

- [ ] **Step 6: Set brand colors in the theme**

Edit `src/app/globals.css`: in the `:root` block, set `--primary` to `oklch(0.62 0.19 35)` (equivalent to `#F05223`) and `--primary-foreground` to `oklch(0.98 0 0)`. In the `.dark` block, set `--primary` to `oklch(0.65 0.19 35)` and `--primary-foreground` to `oklch(0.98 0 0)`. Leave all other shadcn-generated variables as-is.

- [ ] **Step 7: Verify the scaffold builds**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed with no errors. Delete the default boilerplate content from `src/app/page.tsx` (it will be replaced in Task 4) but leave the file present with a minimal valid component (`export default function Page() { return null; }`) so the build stays green until Task 4.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs components.json .gitignore src/app/globals.css src/app/page.tsx src/app/layout.tsx public/nexxabyte-logo.svg src/components/ui src/lib/utils.ts
git commit -m "Scaffold Next.js app with shadcn/ui, Tailwind, and brand theme"
```

---

### Task 2: Shared Types, Mock Data Infra, and Shared UI Primitives

**Files:**
- Create: `src/lib/mock-data/types.ts`
- Create: `src/lib/mock-data/delay.ts`
- Create: `src/components/shared/stat-card.tsx`
- Create: `src/components/shared/status-badge.tsx`
- Create: `src/components/shared/page-header.tsx`
- Create: `src/components/shared/empty-state.tsx`
- Create: `src/components/shared/confirm-dialog.tsx`
- Create: `src/components/shared/loading-grid.tsx`

**Interfaces:**
- Consumes: shadcn `Card`, `Badge`, `AlertDialog`, `Skeleton` from `src/components/ui/*` (Task 1).
- Produces: every type and shared component name below, importable as `@/lib/mock-data/types`, `@/lib/mock-data/delay`, `@/components/shared/*`. All later mock-data and page tasks depend on these exact names.

- [ ] **Step 1: Define shared mock-data types**

Create `src/lib/mock-data/types.ts`:
```ts
export type AgentStatus = "active" | "idle" | "error";

export type AgentType =
  | "sales"
  | "customer-service"
  | "hr"
  | "recruitment"
  | "procurement"
  | "finance"
  | "compliance"
  | "operations"
  | "executive-assistant"
  | "knowledge-assistant"
  | "it-helpdesk";

export interface ToolPermission {
  tool: string;
  enabled: boolean;
}

export interface MemoryEntry {
  key: string;
  value: string;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  lastActive: string;
  tasksCompleted: number;
  successRate: number;
  avgLatencyMs: number;
  systemPrompt: string;
  toolPermissions: ToolPermission[];
  shortTermMemory: MemoryEntry[];
  longTermMemory: MemoryEntry[];
  performance: ChartPoint[];
}

export type TrendDirection = "up" | "down" | "flat";

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  delta: number;
  trend: TrendDirection;
}

export interface ActivityItem {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export type DocumentSourceType =
  | "PDF"
  | "Word"
  | "Excel"
  | "CSV"
  | "Website"
  | "SharePoint"
  | "Google Drive"
  | "Notion"
  | "Confluence"
  | "Database";

export type DocumentStatus = "approved" | "pending" | "rejected";

export interface KnowledgeDocument {
  id: string;
  name: string;
  sourceType: DocumentSourceType;
  version: number;
  status: DocumentStatus;
  updatedAt: string;
  keywords: string[];
}

export type WorkflowStatus = "active" | "draft" | "paused";

export interface WorkflowSummary {
  id: string;
  name: string;
  status: WorkflowStatus;
  lastRun: string;
  successRate: number;
}

export type IntegrationCategory = "CRM" | "ERP" | "Communication" | "Identity" | "Custom API";
export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
}

export type UserRole = "Admin" | "Manager" | "Operator" | "Viewer";
export type UserStatus = "active" | "invited" | "disabled";

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
}
```

- [ ] **Step 2: Create the delay helper**

Create `src/lib/mock-data/delay.ts`:
```ts
export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}
```

- [ ] **Step 3: Create the StatCard component**

Create `src/components/shared/stat-card.tsx`:
```tsx
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiMetric } from "@/lib/mock-data/types";

export function StatCard({ metric }: { metric: KpiMetric }) {
  const TrendIcon = metric.trend === "up" ? ArrowUp : metric.trend === "down" ? ArrowDown : ArrowRight;
  const trendColor =
    metric.trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : metric.trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{metric.value}</div>
        <div className={cn("mt-1 flex items-center gap-1 text-xs", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{Math.abs(metric.delta)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create the StatusBadge component**

Create `src/components/shared/status-badge.tsx`:
```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  connected: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  draft: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  invited: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  error: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  disconnected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  disabled: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[status] ?? "")}>
      {status}
    </Badge>
  );
}
```

- [ ] **Step 5: Create PageHeader, EmptyState, LoadingGrid, ConfirmDialog**

Create `src/components/shared/page-header.tsx`:
```tsx
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
```

Create `src/components/shared/empty-state.tsx`:
```tsx
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <Icon className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-sm font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
```

Create `src/components/shared/loading-grid.tsx`:
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingGrid({ count = 4, className = "h-28" }: { count?: number; className?: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}
```

Create `src/components/shared/confirm-dialog.tsx`:
```tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (these files are not yet imported anywhere, but must type-check standalone).

- [ ] **Step 7: Commit**

```bash
git add src/lib/mock-data/types.ts src/lib/mock-data/delay.ts src/components/shared
git commit -m "Add shared mock-data types and shared UI primitives"
```

---

### Task 3: App Shell (Sidebar, Topbar, Theme Toggle)

**Files:**
- Create: `src/components/shell/theme-provider.tsx`
- Create: `src/components/shell/nav-items.ts`
- Create: `src/components/shell/sidebar.tsx`
- Create: `src/components/shell/topbar.tsx`
- Create: `src/components/shell/theme-toggle.tsx`
- Create: `src/app/(app)/layout.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `NAV_ITEMS` defined in this task is consumed only within `sidebar.tsx`. `logout` server action from Task 4 is consumed by `topbar.tsx` (added as an import in Task 4 once it exists — for this task, wire the button with a no-op `"use server"` stub inline so the shell compiles standalone).
- Produces: `(app)` route group layout that every module page (Tasks 6–10) renders inside; `ThemeProvider` wraps the whole app from the root layout.

- [ ] **Step 1: Create the theme provider wrapper**

Create `src/components/shell/theme-provider.tsx`:
```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 2: Wire the theme provider and Geist font into the root layout**

Modify `src/app/layout.tsx` to:
```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/shell/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexxaByte Agentic AI Solutions",
  description: "Enterprise Agentic AI operations platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Define nav items**

Create `src/components/shell/nav-items.ts`:
```ts
import { Bot, BookOpen, LayoutDashboard, Plug, ShieldCheck, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Agent Console", href: "/agents", icon: Bot },
  { label: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { label: "Workflow Builder", href: "/workflows", icon: Workflow },
  { label: "Integration Center", href: "/integrations", icon: Plug },
  { label: "Administration", href: "/admin", icon: ShieldCheck },
];
```

- [ ] **Step 4: Create the theme toggle**

Create `src/components/shell/theme-toggle.tsx`:
```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 scale-100 dark:scale-0" />
      <Moon className="absolute h-4 w-4 scale-0 dark:scale-100" />
    </Button>
  );
}
```

- [ ] **Step 5: Create the sidebar**

Create `src/components/shell/sidebar.tsx`:
```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Image src="/nexxabyte-logo.svg" alt="NexxaByte" width={28} height={28} className="shrink-0" />
        {!collapsed && <span className="truncate text-sm font-semibold">NexxaByte</span>}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Button variant="ghost" size="icon" className="w-full" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Create the topbar**

Create `src/components/shell/topbar.tsx`:
```tsx
import { Bell } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { logout } from "@/app/login/actions";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
      <div className="text-sm font-medium text-muted-foreground">NexxaByte Enterprise Workspace</div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="User menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback>NB</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Admin User</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-left">
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```
Note: this imports `logout` from `src/app/login/actions.ts`, which is created in Task 4. This is expected — Task 4 must land before this file will compile. Proceed to Step 7 to build the layout, and run the verification in Step 8 only after Task 4's action file exists (the plan executes tasks in order, so this is satisfied by the time this task's verification step runs — see the note in Step 8).

- [ ] **Step 7: Create the `(app)` route group layout**

Create `src/app/(app)/layout.tsx`:
```tsx
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify**

`Topbar` depends on `src/app/login/actions.ts`, created next in Task 4. Create a temporary stub so this task verifies in isolation: create `src/app/login/actions.ts` with just:
```ts
"use server";

export async function logout() {}
```
Run: `npx tsc --noEmit`
Expected: no errors. (Task 4 will overwrite this stub file with the real implementation — do not commit a TODO comment, just let Task 4 replace it wholesale.)

- [ ] **Step 9: Commit**

```bash
git add src/components/shell src/app/layout.tsx "src/app/(app)/layout.tsx" src/app/login/actions.ts
git commit -m "Add app shell: sidebar, topbar, theme toggle"
```

---

### Task 4: Mock Authentication (Login + Session + Route Guard)

**Files:**
- Create: `src/lib/auth.ts`
- Modify: `src/app/login/actions.ts` (replace Task 3's stub)
- Create: `src/app/login/page.tsx`
- Create: `src/middleware.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `SESSION_COOKIE` constant defined in this task, used by both `actions.ts` and `middleware.ts`.
- Produces: `login(formData)` and `logout()` server actions (already imported by `Topbar` from Task 3); an auth-gated app where every route except `/login` requires the session cookie.

- [ ] **Step 1: Define the session constant**

Create `src/lib/auth.ts`:
```ts
export const SESSION_COOKIE = "nexxabyte_session";
```

- [ ] **Step 2: Implement the login/logout server actions**

Replace the contents of `src/app/login/actions.ts`:
```ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, String(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
```

- [ ] **Step 3: Build the login page**

Create `src/app/login/page.tsx`:
```tsx
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/app/login/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image src="/nexxabyte-logo.svg" alt="NexxaByte" width={160} height={40} />
          <CardTitle className="pt-2">Agentic AI Workspace</CardTitle>
          <CardDescription>Sign in to manage your organization&apos;s AI agents</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@company.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            {error ? <p className="text-sm text-red-600 dark:text-red-400">Enter an email and password.</p> : null}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Add the auth-guard middleware**

Create `src/middleware.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|nexxabyte-logo.svg).*)"],
};
```

- [ ] **Step 5: Redirect the root route**

Replace `src/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. Then run `npm run dev`, visit `http://localhost:3000` — expect a redirect to `/login`. Submit any email/password — expect a redirect to `/dashboard` (which will 404 until Task 6 exists; a 404 on `/dashboard` at this point is expected and fine). Confirm that manually revisiting `/login` after signing in redirects to `/dashboard`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/app/login src/middleware.ts src/app/page.tsx
git commit -m "Add mock cookie-based authentication and route guard"
```

---

### Task 5: AI Agent Console

**Files:**
- Create: `src/lib/mock-data/agents.ts`
- Create: `src/app/(app)/agents/page.tsx`
- Create: `src/app/(app)/agents/[id]/page.tsx`
- Create: `src/app/(app)/agents/[id]/agent-detail-tabs.tsx`
- Create: `src/components/shared/agent-icon.tsx`

**Interfaces:**
- Consumes: `Agent`, `AgentStatus`, `AgentType`, `MemoryEntry`, `ToolPermission`, `ChartPoint` from `@/lib/mock-data/types` (Task 2); `delay` from `@/lib/mock-data/delay` (Task 2); `StatusBadge`, `PageHeader`, `EmptyState`, `LoadingGrid` (Task 2).
- Produces: `getAgents(): Promise<Agent[]>` and `getAgentById(id: string): Promise<Agent | undefined>`, consumed by Task 6 (Executive Dashboard) for the agent status grid.

- [ ] **Step 1: Create the agents mock data module**

Create `src/lib/mock-data/agents.ts`:
```ts
import { delay } from "@/lib/mock-data/delay";
import type { Agent, AgentType } from "@/lib/mock-data/types";

const AGENT_DEFS: { type: AgentType; name: string; description: string }[] = [
  { type: "sales", name: "Sales Agent", description: "Qualifies leads, drafts proposals, and updates the CRM pipeline." },
  { type: "customer-service", name: "Customer Service Agent", description: "Resolves support tickets and escalates complex cases." },
  { type: "hr", name: "HR Agent", description: "Answers policy questions and manages employee onboarding tasks." },
  { type: "recruitment", name: "Recruitment Agent", description: "Screens resumes and schedules candidate interviews." },
  { type: "procurement", name: "Procurement Agent", description: "Processes purchase requests and vendor approvals." },
  { type: "finance", name: "Finance Agent", description: "Reconciles invoices and flags budget anomalies." },
  { type: "compliance", name: "Compliance Agent", description: "Monitors policy adherence and prepares audit evidence." },
  { type: "operations", name: "Operations Agent", description: "Coordinates logistics tasks and inventory alerts." },
  { type: "executive-assistant", name: "Executive Assistant", description: "Manages calendars, briefings, and correspondence." },
  { type: "knowledge-assistant", name: "Knowledge Assistant", description: "Answers internal questions from the knowledge base." },
  { type: "it-helpdesk", name: "IT Helpdesk Agent", description: "Triages IT tickets and resets access credentials." },
];

const STATUSES: Agent["status"][] = ["active", "active", "active", "idle", "error"];

function buildPerformance(seed: number) {
  return Array.from({ length: 7 }).map((_, i) => ({
    label: `Day ${i + 1}`,
    value: Math.round(60 + ((seed + i) * 7) % 40),
  }));
}

const AGENTS: Agent[] = AGENT_DEFS.map((def, i) => ({
  id: def.type,
  name: def.name,
  type: def.type,
  status: STATUSES[i % STATUSES.length],
  description: def.description,
  lastActive: new Date(Date.now() - i * 1000 * 60 * 17).toISOString(),
  tasksCompleted: 120 + i * 37,
  successRate: 90 + (i % 8),
  avgLatencyMs: 800 + i * 45,
  systemPrompt: `You are the ${def.name} for NexxaByte's client organization. ${def.description} Always follow the organization's business rules and escalate to a human when confidence is low.`,
  toolPermissions: [
    { tool: "CRM", enabled: i % 2 === 0 },
    { tool: "ERP", enabled: i % 3 === 0 },
    { tool: "Email", enabled: true },
    { tool: "Calendar", enabled: i % 2 === 1 },
    { tool: "Document Management", enabled: i % 4 !== 0 },
  ],
  shortTermMemory: [
    { key: "Current session", value: "Discussing Q3 renewal terms with Acme Corp." },
    { key: "Open task", value: "Awaiting approval on discount threshold." },
  ],
  longTermMemory: [
    { key: "Customer history", value: "12 prior interactions across 3 accounts." },
    { key: "Business preferences", value: "Prefers concise summaries over long reports." },
    { key: "Organization knowledge", value: "Aware of NexxaByte's standard SLA terms." },
  ],
  performance: buildPerformance(i),
}));

export async function getAgents(): Promise<Agent[]> {
  return delay(AGENTS);
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
  return delay(AGENTS.find((a) => a.id === id));
}
```

- [ ] **Step 2: Create an agent type icon helper**

Create `src/components/shared/agent-icon.tsx`:
```tsx
import {
  Bot,
  Briefcase,
  Calculator,
  Headset,
  Laptop,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserSearch,
  Users,
} from "lucide-react";
import type { AgentType } from "@/lib/mock-data/types";

const ICONS: Record<AgentType, typeof Bot> = {
  sales: Briefcase,
  "customer-service": Headset,
  hr: Users,
  recruitment: UserSearch,
  procurement: ShoppingCart,
  finance: Calculator,
  compliance: ShieldCheck,
  operations: Truck,
  "executive-assistant": ScrollText,
  "knowledge-assistant": Bot,
  "it-helpdesk": Laptop,
};

export function AgentIcon({ type, className }: { type: AgentType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={className} />;
}
```

- [ ] **Step 3: Build the agent roster page**

Create `src/app/(app)/agents/page.tsx`:
```tsx
import Link from "next/link";
import { getAgents } from "@/lib/mock-data/agents";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div>
      <PageHeader title="AI Agent Console" description="Manage, configure, and monitor every agent in your workspace." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <AgentIcon type={agent.type} className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                </div>
                <StatusBadge status={agent.status} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{agent.tasksCompleted} tasks completed</span>
                  <span>{agent.successRate}% success</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build the agent detail tabs (client component)**

Create `src/app/(app)/agents/[id]/agent-detail-tabs.tsx`:
```tsx
"use client";

import { useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent } from "@/lib/mock-data/types";

export function AgentDetailTabs({ agent }: { agent: Agent }) {
  const [prompt, setPrompt] = useState(agent.systemPrompt);
  const [saved, setSaved] = useState(false);
  const [tools, setTools] = useState(agent.toolPermissions);

  return (
    <Tabs defaultValue="prompt" className="w-full">
      <TabsList>
        <TabsTrigger value="prompt">Prompt Configuration</TabsTrigger>
        <TabsTrigger value="tools">Tool Permissions</TabsTrigger>
        <TabsTrigger value="memory">Memory Management</TabsTrigger>
        <TabsTrigger value="performance">Performance Monitoring</TabsTrigger>
      </TabsList>

      <TabsContent value="prompt" className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setSaved(false);
          }}
          rows={8}
        />
        <Button
          onClick={() => setSaved(true)}
        >
          {saved ? "Saved" : "Save changes"}
        </Button>
      </TabsContent>

      <TabsContent value="tools" className="space-y-4">
        {tools.map((tool, i) => (
          <div key={tool.tool} className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor={`tool-${tool.tool}`}>{tool.tool}</Label>
            <Switch
              id={`tool-${tool.tool}`}
              checked={tool.enabled}
              onCheckedChange={(checked) =>
                setTools((prev) => prev.map((t, idx) => (idx === i ? { ...t, enabled: checked } : t)))
              }
            />
          </div>
        ))}
      </TabsContent>

      <TabsContent value="memory" className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Short-Term Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.shortTermMemory.map((m) => (
              <div key={m.key} className="text-sm">
                <span className="font-medium">{m.key}: </span>
                <span className="text-muted-foreground">{m.value}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2">
              Clear session
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Long-Term Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.longTermMemory.map((m) => (
              <div key={m.key} className="text-sm">
                <span className="font-medium">{m.key}: </span>
                <span className="text-muted-foreground">{m.value}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2">
              Reset memory
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasks completed (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agent.performance}>
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 5: Build the agent detail page**

Create `src/app/(app)/agents/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getAgentById } from "@/lib/mock-data/agents";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentDetailTabs } from "./agent-detail-tabs";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={agent.name}
        description={agent.description}
        actions={<StatusBadge status={agent.status} />}
      />
      <AgentDetailTabs agent={agent} />
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In `npm run dev`, sign in, visit `/agents` — expect 11 agent cards. Click one — expect the detail page with 4 working tabs; toggling a tool switch and editing/saving the prompt should update state without errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/mock-data/agents.ts "src/app/(app)/agents" src/components/shared/agent-icon.tsx
git commit -m "Add AI Agent Console: roster and agent detail with tabs"
```

---

### Task 6: Executive Dashboard

**Files:**
- Create: `src/lib/mock-data/dashboard.ts`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/dashboard/charts.tsx`

**Interfaces:**
- Consumes: `getAgents()` from `@/lib/mock-data/agents` (Task 5); `KpiMetric`, `ActivityItem`, `AlertItem`, `ChartPoint` from `@/lib/mock-data/types` (Task 2); `StatCard`, `StatusBadge`, `PageHeader` (Task 2).
- Produces: nothing consumed by later tasks (dashboard is a leaf page).

- [ ] **Step 1: Create the dashboard mock data module**

Create `src/lib/mock-data/dashboard.ts`:
```ts
import { delay } from "@/lib/mock-data/delay";
import type { ActivityItem, AlertItem, ChartPoint, KpiMetric } from "@/lib/mock-data/types";

const KPIS: KpiMetric[] = [
  { id: "active-agents", label: "Active Agents", value: "9", delta: 12, trend: "up" },
  { id: "tasks-automated", label: "Tasks Automated (30d)", value: "4,812", delta: 8, trend: "up" },
  { id: "avg-response", label: "Avg Response Time", value: "1.4s", delta: 6, trend: "down" },
  { id: "cost-saved", label: "Est. Cost Saved (30d)", value: "$62,400", delta: 15, trend: "up" },
];

const ACTIVITY: ActivityItem[] = [
  { id: "1", agentName: "Sales Agent", action: "Drafted proposal for Acme Corp renewal", timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "2", agentName: "IT Helpdesk Agent", action: "Reset access credentials for 3 users", timestamp: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: "3", agentName: "Compliance Agent", action: "Flagged a policy exception for review", timestamp: new Date(Date.now() - 48 * 60000).toISOString() },
  { id: "4", agentName: "Finance Agent", action: "Reconciled 214 invoices", timestamp: new Date(Date.now() - 75 * 60000).toISOString() },
  { id: "5", agentName: "Customer Service Agent", action: "Resolved 18 support tickets", timestamp: new Date(Date.now() - 120 * 60000).toISOString() },
  { id: "6", agentName: "Knowledge Assistant", action: "Indexed 5 new SharePoint documents", timestamp: new Date(Date.now() - 160 * 60000).toISOString() },
];

const ALERTS: AlertItem[] = [
  { id: "1", severity: "critical", message: "Procurement Agent failed to authenticate with ERP connector", timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: "2", severity: "warning", message: "Knowledge Base has 4 documents pending approval", timestamp: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: "3", severity: "info", message: "Weekly AI usage report is ready", timestamp: new Date(Date.now() - 200 * 60000).toISOString() },
];

const REVENUE_SERIES: ChartPoint[] = [
  { label: "Wk 1", value: 42000 },
  { label: "Wk 2", value: 48500 },
  { label: "Wk 3", value: 51200 },
  { label: "Wk 4", value: 62400 },
];

const WORKFLOW_HEALTH_SERIES: ChartPoint[] = [
  { label: "Mon", value: 96 },
  { label: "Tue", value: 94 },
  { label: "Wed", value: 98 },
  { label: "Thu", value: 91 },
  { label: "Fri", value: 97 },
  { label: "Sat", value: 99 },
  { label: "Sun", value: 95 },
];

export async function getKpis(): Promise<KpiMetric[]> {
  return delay(KPIS);
}

export async function getActivityFeed(): Promise<ActivityItem[]> {
  return delay(ACTIVITY);
}

export async function getAlerts(): Promise<AlertItem[]> {
  return delay(ALERTS);
}

export async function getRevenueSeries(): Promise<ChartPoint[]> {
  return delay(REVENUE_SERIES);
}

export async function getWorkflowHealthSeries(): Promise<ChartPoint[]> {
  return delay(WORKFLOW_HEALTH_SERIES);
}
```

- [ ] **Step 2: Create the charts client component**

Create `src/app/(app)/dashboard/charts.tsx`:
```tsx
"use client";

import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartPoint } from "@/lib/mock-data/types";

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Revenue Impact (30 days)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function WorkflowHealthChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Workflow Success Rate (7 days)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} domain={[80, 100]} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Build the dashboard page**

Create `src/app/(app)/dashboard/page.tsx`:
```tsx
import { AlertTriangle } from "lucide-react";
import { getAgents } from "@/lib/mock-data/agents";
import { getActivityFeed, getAlerts, getKpis, getRevenueSeries, getWorkflowHealthSeries } from "@/lib/mock-data/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart, WorkflowHealthChart } from "./charts";

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.id} metric={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={revenue} />
        <WorkflowHealthChart data={workflowHealth} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Agent Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <AgentIcon type={agent.type} className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agent.name}</span>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            ))}
          </CardContent>
        </Card>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                <span className="font-medium">{item.agentName}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(item.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/dashboard` shows 4 KPI cards, 2 charts, agent status list, alerts, and activity feed, correctly styled in both light and dark mode.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mock-data/dashboard.ts "src/app/(app)/dashboard"
git commit -m "Add Executive Dashboard module"
```

---

### Task 7: Knowledge Base

**Files:**
- Create: `src/lib/mock-data/knowledge.ts`
- Create: `src/app/(app)/knowledge/page.tsx`
- Create: `src/app/(app)/knowledge/documents-table.tsx`
- Create: `src/app/(app)/knowledge/upload-dialog.tsx`

**Interfaces:**
- Consumes: `KnowledgeDocument`, `DocumentStatus` from `@/lib/mock-data/types` (Task 2); `delay` (Task 2); `StatusBadge`, `PageHeader`, `EmptyState` (Task 2).
- Produces: `getDocuments(): Promise<KnowledgeDocument[]>` — not consumed elsewhere, leaf module.

- [ ] **Step 1: Create the knowledge base mock data module**

Create `src/lib/mock-data/knowledge.ts`:
```ts
import { delay } from "@/lib/mock-data/delay";
import type { DocumentSourceType, DocumentStatus, KnowledgeDocument } from "@/lib/mock-data/types";

const SOURCES: DocumentSourceType[] = ["PDF", "Word", "Excel", "CSV", "Website", "SharePoint", "Google Drive", "Notion", "Confluence", "Database"];
const STATUSES: DocumentStatus[] = ["approved", "approved", "pending", "approved", "rejected"];

const DOCUMENTS: KnowledgeDocument[] = [
  "Employee Handbook 2026", "Sales Playbook Q3", "ERP Integration Spec", "Compliance Policy — GDPR", "Vendor Onboarding Guide",
  "Customer Support FAQ", "Product Catalog Export", "HR Benefits Summary", "Incident Response Runbook", "Procurement Approval Matrix",
].map((name, i) => ({
  id: String(i + 1),
  name,
  sourceType: SOURCES[i % SOURCES.length],
  version: 1 + (i % 4),
  status: STATUSES[i % STATUSES.length],
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  keywords: name.toLowerCase().split(" ").filter((w) => w.length > 3),
}));

export async function getDocuments(): Promise<KnowledgeDocument[]> {
  return delay(DOCUMENTS);
}
```

- [ ] **Step 2: Create the upload dialog (client component)**

Create `src/app/(app)/knowledge/upload-dialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UploadDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a knowledge source</DialogTitle>
          <DialogDescription>Drop a file or connect a data source. It will enter the approval queue.</DialogDescription>
        </DialogHeader>
        <div className="flex h-32 items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
          Drag and drop a file here
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Add to queue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create the documents table (client component, with search)**

Create `src/app/(app)/knowledge/documents-table.tsx`:
```tsx
"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FileQuestion } from "lucide-react";
import type { KnowledgeDocument } from "@/lib/mock-data/types";

export function DocumentsTable({ documents }: { documents: KnowledgeDocument[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (doc) => doc.name.toLowerCase().includes(q) || doc.keywords.some((k) => k.includes(q)),
    );
  }, [documents, query]);

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
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>{doc.sourceType}</TableCell>
                <TableCell>v{doc.version}</TableCell>
                <TableCell>
                  <StatusBadge status={doc.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(doc.updatedAt).toLocaleDateString()}
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

- [ ] **Step 4: Build the Knowledge Base page**

Create `src/app/(app)/knowledge/page.tsx`:
```tsx
import { getDocuments } from "@/lib/mock-data/knowledge";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDialog } from "./upload-dialog";
import { DocumentsTable } from "./documents-table";

export default async function KnowledgeBasePage() {
  const documents = await getDocuments();

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Manage the documents and data sources your agents are trained on."
        actions={<UploadDialog />}
      />
      <DocumentsTable documents={documents} />
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/knowledge` shows the document table, search filters rows live, and the upload dialog opens/closes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock-data/knowledge.ts "src/app/(app)/knowledge"
git commit -m "Add Knowledge Base module"
```

---

### Task 8: Workflow Builder

**Files:**
- Create: `src/lib/mock-data/workflows.ts`
- Create: `src/app/(app)/workflows/page.tsx`
- Create: `src/app/(app)/workflows/workflow-canvas.tsx`
- Modify: `src/app/globals.css` (import React Flow base styles)

**Interfaces:**
- Consumes: `WorkflowSummary`, `WorkflowStatus` from `@/lib/mock-data/types` (Task 2); `delay` (Task 2); `StatusBadge`, `PageHeader` (Task 2); `ReactFlow`, `Background`, `Controls`, `addEdge`, `useNodesState`, `useEdgesState` from `@xyflow/react` (Task 1).
- Produces: `getWorkflows(): Promise<WorkflowSummary[]>` — leaf module.

- [ ] **Step 1: Create the workflows mock data module**

Create `src/lib/mock-data/workflows.ts`:
```ts
import { delay } from "@/lib/mock-data/delay";
import type { WorkflowStatus, WorkflowSummary } from "@/lib/mock-data/types";

const STATUSES: WorkflowStatus[] = ["active", "active", "draft", "paused"];

const WORKFLOWS: WorkflowSummary[] = [
  "New Lead Qualification", "Invoice Approval Routing", "Employee Offboarding", "Support Ticket Escalation",
].map((name, i) => ({
  id: String(i + 1),
  name,
  status: STATUSES[i % STATUSES.length],
  lastRun: new Date(Date.now() - i * 3600000).toISOString(),
  successRate: 92 + i,
}));

export async function getWorkflows(): Promise<WorkflowSummary[]> {
  return delay(WORKFLOWS);
}
```

- [ ] **Step 2: Import React Flow's base stylesheet**

At the top of `src/app/globals.css`, add:
```css
@import "@xyflow/react/dist/style.css";
```
Place this as the very first line of the file, before the existing Tailwind/shadcn directives.

- [ ] **Step 3: Build the workflow canvas (client component)**

Create `src/app/(app)/workflows/workflow-canvas.tsx`:
```tsx
"use client";

import { useCallback } from "react";
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

export function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

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
    <div className="flex gap-4">
      <Card className="w-48 shrink-0 p-3">
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
      <div className="h-[600px] flex-1 rounded-md border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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

- [ ] **Step 4: Build the Workflow Builder page**

Create `src/app/(app)/workflows/page.tsx`:
```tsx
import { getWorkflows } from "@/lib/mock-data/workflows";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowCanvas } from "./workflow-canvas";

export default async function WorkflowsPage() {
  const workflows = await getWorkflows();

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Builder" description="Design and automate multi-step business processes." />

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
        <WorkflowCanvas />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/workflows` shows the 4 workflow summary cards and a working React Flow canvas — nodes draggable, connectable, and new nodes addable from the palette.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock-data/workflows.ts "src/app/(app)/workflows" src/app/globals.css
git commit -m "Add Workflow Builder module with React Flow canvas"
```

---

### Task 9: Integration Center

**Files:**
- Create: `src/lib/mock-data/integrations.ts`
- Create: `src/app/(app)/integrations/page.tsx`
- Create: `src/app/(app)/integrations/integration-card.tsx`

**Interfaces:**
- Consumes: `Integration`, `IntegrationCategory`, `IntegrationStatus` from `@/lib/mock-data/types` (Task 2); `delay` (Task 2); `StatusBadge`, `PageHeader` (Task 2).
- Produces: `getIntegrations(): Promise<Integration[]>` — leaf module.

- [ ] **Step 1: Create the integrations mock data module**

Create `src/lib/mock-data/integrations.ts`:
```ts
import { delay } from "@/lib/mock-data/delay";
import type { Integration } from "@/lib/mock-data/types";

const INTEGRATIONS: Integration[] = [
  { id: "1", name: "Salesforce", category: "CRM", status: "connected", description: "Sync leads, opportunities, and accounts." },
  { id: "2", name: "SAP", category: "ERP", status: "connected", description: "Inventory, procurement, and finance data." },
  { id: "3", name: "Slack", category: "Communication", status: "connected", description: "Agent notifications and approvals." },
  { id: "4", name: "Microsoft Teams", category: "Communication", status: "disconnected", description: "Chat-based agent interactions." },
  { id: "5", name: "WhatsApp Business", category: "Communication", status: "error", description: "Customer messaging channel." },
  { id: "6", name: "Okta", category: "Identity", status: "connected", description: "Single sign-on and user provisioning." },
  { id: "7", name: "NetSuite", category: "ERP", status: "disconnected", description: "Financial and order management." },
  { id: "8", name: "HubSpot", category: "CRM", status: "disconnected", description: "Marketing and sales pipeline sync." },
  { id: "9", name: "Custom REST API", category: "Custom API", status: "connected", description: "Internal service integration." },
  { id: "10", name: "Zendesk", category: "Communication", status: "connected", description: "Helpdesk ticket sync." },
];

export async function getIntegrations(): Promise<Integration[]> {
  return delay(INTEGRATIONS);
}
```

- [ ] **Step 2: Create the integration card with a mock configure dialog**

Create `src/app/(app)/integrations/integration-card.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/shared/status-badge";
import type { Integration } from "@/lib/mock-data/types";

export function IntegrationCard({ integration }: { integration: Integration }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">{integration.name}</CardTitle>
          <StatusBadge status={integration.status} />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{integration.description}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
            Configure
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {integration.name}</DialogTitle>
            <DialogDescription>Category: {integration.category}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" placeholder="sk-••••••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input id="endpoint" placeholder="https://api.example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: Build the Integration Center page**

Create `src/app/(app)/integrations/page.tsx`:
```tsx
import { getIntegrations } from "@/lib/mock-data/integrations";
import { PageHeader } from "@/components/shared/page-header";
import { IntegrationCard } from "./integration-card";
import type { IntegrationCategory } from "@/lib/mock-data/types";

const CATEGORY_ORDER: IntegrationCategory[] = ["CRM", "ERP", "Communication", "Identity", "Custom API"];

export default async function IntegrationsPage() {
  const integrations = await getIntegrations();

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
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. In dev server, `/integrations` shows cards grouped by category, and each "Configure" button opens a working dialog.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mock-data/integrations.ts "src/app/(app)/integrations"
git commit -m "Add Integration Center module"
```

---

### Task 10: Administration

**Files:**
- Create: `src/lib/mock-data/admin.ts`
- Create: `src/app/(app)/admin/page.tsx`
- Create: `src/app/(app)/admin/users-table.tsx`
- Create: `src/app/(app)/admin/audit-log-table.tsx`

**Interfaces:**
- Consumes: `OrgUser`, `UserRole`, `AuditLogEntry` from `@/lib/mock-data/types` (Task 2); `delay` (Task 2); `StatusBadge`, `PageHeader` (Task 2); `useReactTable`, `getCoreRowModel`, `flexRender`, `createColumnHelper` from `@tanstack/react-table` (Task 1).
- Produces: `getUsers(): Promise<OrgUser[]>`, `getAuditLogs(): Promise<AuditLogEntry[]>` — leaf module.

- [ ] **Step 1: Create the admin mock data module**

Create `src/lib/mock-data/admin.ts`:
```ts
import { delay } from "@/lib/mock-data/delay";
import type { AuditLogEntry, OrgUser, UserRole, UserStatus } from "@/lib/mock-data/types";

const ROLES: UserRole[] = ["Admin", "Manager", "Operator", "Viewer"];
const USER_STATUSES: UserStatus[] = ["active", "active", "invited", "disabled"];

const USERS: OrgUser[] = [
  "Jordan Lee", "Priya Patel", "Marcus Chen", "Sofia Ramirez", "Aisha Khan",
  "Tom Becker", "Nina Volkov", "Diego Alvarez",
].map((name, i) => ({
  id: String(i + 1),
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@client.com`,
  role: ROLES[i % ROLES.length],
  status: USER_STATUSES[i % USER_STATUSES.length],
}));

const ACTIONS = ["Signed in", "Updated agent prompt", "Approved document", "Changed role", "Disabled user", "Connected integration"];

const AUDIT_LOGS: AuditLogEntry[] = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i + 1),
  actor: USERS[i % USERS.length].name,
  action: ACTIONS[i % ACTIONS.length],
  resource: i % 2 === 0 ? "Sales Agent" : "Knowledge Base",
  timestamp: new Date(Date.now() - i * 2700000).toISOString(),
}));

export async function getUsers(): Promise<OrgUser[]> {
  return delay(USERS);
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return delay(AUDIT_LOGS);
}
```

- [ ] **Step 2: Create the users table using TanStack Table**

Create `src/app/(app)/admin/users-table.tsx`:
```tsx
"use client";

import { flexRender, getCoreRowModel, useReactTable, createColumnHelper } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { OrgUser } from "@/lib/mock-data/types";

const columnHelper = createColumnHelper<OrgUser>();

const columns = [
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("role", { header: "Role" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
];

export function UsersTable({ users }: { users: OrgUser[] }) {
  const table = useReactTable({ data: users, columns, getCoreRowModel: getCoreRowModel() });

  return (
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
  );
}
```

- [ ] **Step 3: Create the audit log table**

Create `src/app/(app)/admin/audit-log-table.tsx`:
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuditLogEntry } from "@/lib/mock-data/types";

export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  return (
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
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-medium">{log.actor}</TableCell>
            <TableCell>{log.action}</TableCell>
            <TableCell>{log.resource}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Build the Administration page**

Create `src/app/(app)/admin/page.tsx`:
```tsx
import { getAuditLogs, getUsers } from "@/lib/mock-data/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UsersTable } from "./users-table";
import { AuditLogTable } from "./audit-log-table";

export default async function AdminPage() {
  const [users, logs] = await Promise.all([getUsers(), getAuditLogs()]);

  return (
    <div>
      <PageHeader title="Administration" description="Manage users, security policies, and system settings." />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security Policies</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <UsersTable users={users} />
            </CardContent>
          </Card>
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
Expected: both succeed. In dev server, `/admin` shows 4 working tabs: users table, audit log table, security toggles, and settings form.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock-data/admin.ts "src/app/(app)/admin"
git commit -m "Add Administration module"
```

---

### Task 11: Branding, Responsive, and Theme Polish Pass

**Files:**
- Modify: `src/app/layout.tsx` (favicon metadata)
- Create: `public/favicon.ico` (derived from the logo mark)
- Modify: `src/components/shell/sidebar.tsx` (mobile nav via `Sheet`, if not already responsive enough)

**Interfaces:**
- Consumes: everything built in Tasks 1–10. No new interfaces produced.

- [ ] **Step 1: Add a mobile navigation sheet to the shell**

Modify `src/components/shell/sidebar.tsx` to also render a `Sheet`-based nav drawer for small screens. Add a new export `MobileNav`:
```tsx
// Append to src/components/shell/sidebar.tsx, after the Sidebar export
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Image src="/nexxabyte-logo.svg" alt="NexxaByte" width={28} height={28} />
          <span className="text-sm font-semibold">NexxaByte</span>
        </div>
        <nav className="space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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

- [ ] **Step 2: Render `MobileNav` in the topbar on small screens**

Modify `src/components/shell/topbar.tsx`: import `MobileNav` from `@/components/shell/sidebar` and render it as the first child inside the left-hand `<div>` of the header, before the "NexxaByte Enterprise Workspace" text, so it only appears via its own `md:hidden` class.

- [ ] **Step 3: Set the favicon**

Add to `src/app/layout.tsx`'s `metadata` export:
```ts
export const metadata: Metadata = {
  title: "NexxaByte Agentic AI Solutions",
  description: "Enterprise Agentic AI operations platform",
  icons: { icon: "/nexxabyte-logo.svg" },
};
```
(Using the SVG directly as the favicon avoids needing a separate `.ico` conversion step.)

- [ ] **Step 4: Manual responsive and theme walkthrough**

Run `npm run dev`. For each route (`/login`, `/dashboard`, `/agents`, `/agents/sales`, `/knowledge`, `/workflows`, `/integrations`, `/admin`):
- Resize the browser to a mobile width (~375px) and confirm the sidebar collapses to the hamburger menu and content reflows without horizontal scroll.
- Toggle dark/light mode via the theme toggle and confirm all text remains readable (no invisible text, no unstyled flashes).

Fix any issues found directly in the relevant component file before proceeding.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/components/shell/sidebar.tsx src/components/shell/topbar.tsx src/app/layout.tsx
git commit -m "Add mobile navigation and finish responsive/theme polish pass"
```

---

### Task 12: Final Verification

**Files:** none (verification only).

- [ ] **Step 1: Full clean build**

Run:
```bash
rm -rf .next
npm run build
```
Expected: build succeeds with no type errors or warnings that indicate broken imports.

- [ ] **Step 2: Full route walkthrough**

Run `npm run dev`. Starting from a fresh browser session (clear cookies for localhost):
1. Visit `/` — expect redirect to `/login`.
2. Submit the login form — expect redirect to `/dashboard`.
3. Visit each of `/dashboard`, `/agents`, `/agents/hr`, `/knowledge`, `/workflows`, `/integrations`, `/admin` — confirm each renders without console errors (check browser devtools console).
4. Sign out via the topbar user menu — expect redirect to `/login`, and confirm visiting `/dashboard` directly now redirects back to `/login`.

- [ ] **Step 3: Fix any issues found**

If any route errors or console warnings appear, fix them in the relevant file(s) and re-run Step 1 and Step 2 until clean.

- [ ] **Step 4: Final commit**

```bash
git add -A
git status
```
Review the output — if any files remain unstaged that should be committed, add them individually and commit:
```bash
git commit -m "Final verification pass for product platform frontend"
```
If nothing is unstaged, skip the commit.

---

## Self-Review Notes

- **Spec coverage:** all six PRD Section 14 modules (Tasks 5–10), app shell (Task 3), mock auth (Task 4), branding/theme/responsive (Task 11) are covered. Real backend/integrations/AI/tests are explicitly out of scope per the spec's Non-Goals.
- **Type consistency:** `Agent`, `KpiMetric`, `ActivityItem`, `AlertItem`, `ChartPoint`, `KnowledgeDocument`, `WorkflowSummary`, `Integration`, `OrgUser`, `AuditLogEntry` are all defined once in Task 2 and imported by name (not redefined) in every later task.
- **Function name consistency:** `getAgents`/`getAgentById` (Task 5) are the exact names consumed by Task 6's dashboard import — verified matching signatures.
