# Supabase Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `localStorage`/mock-data architecture with a real Supabase (Postgres + Auth) backend — real accounts, real organizations, real persisted data for every domain, enforced by Row-Level Security.

**Architecture:** Server Components fetch data via a new `src/lib/db/*.ts` query layer using a session-scoped Supabase server client. Every mutation is a Server Action that writes to Supabase and calls `revalidatePath()`. Client "workspace" components keep local UI state (dialogs, form fields) but call Server Actions wrapped in `useTransition()` instead of a client store — `src/lib/store/app-store.tsx` is deleted entirely.

**Tech Stack:** `@supabase/supabase-js`, `@supabase/ssr`, `server-only`, `tsx` (to run the seed script). No ORM — the Supabase JS client talks directly to RLS-protected Postgres.

## Global Constraints

- Every domain table has an `org_id` and an RLS policy scoping access to `org_id = (select org_id from profiles where id = auth.uid())` — this is the actual security boundary, not application code.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never be imported by any file without `"use server"` at the top or that isn't a trusted server-only script — guarded with the `server-only` package.
- Static reference data (11-agent catalog, 10-integration catalog, 6 permission definitions) stays in `src/lib/mock-data/{agents,integrations,admin}.ts` exactly as-is — only per-org mutable state moves to the database.
- Every Server Action ends by writing one row to `audit_logs` via the shared `logAudit()` helper, and calling `revalidatePath()` for the affected page.
- No automated test suite (this project's deliberate, existing stance). Every task is verified via `tsc --noEmit`, `eslint`, and either a `curl`/script check against Supabase or a Playwright browser walkthrough — matching how every prior feature in this codebase has been verified.
- Read `.env.local` values via shell/script when needed; never print secret values (`SUPABASE_SERVICE_ROLE_KEY`) into any response, log, or file that isn't `.env.local` itself.

---

### Task 1: Supabase SDK, client helpers, and shared DB helpers

**Files:**
- Modify: `package.json` (add dependencies)
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/db/profile.ts`
- Create: `src/lib/db/audit.ts`

**Interfaces:**
- Produces: `createClient()` (async, session-scoped server client) from `src/lib/supabase/server.ts`; `createClient()` (browser client) from `src/lib/supabase/client.ts`; `createAdminClient()` (service-role, bypasses RLS) from `src/lib/supabase/admin.ts`; `getCurrentProfile(): Promise<CurrentProfile | null>` from `src/lib/db/profile.ts`; `logAudit(supabase, { orgId, actorName, action, resource }): Promise<void>` from `src/lib/db/audit.ts`.

- [ ] **Step 1: Install dependencies**

```bash
cd "/Users/ren/Desktop/Projects 2/NexxaByte Agentic AI Solutions (GaaS) V2"
npm install @supabase/supabase-js @supabase/ssr server-only
npm install -D tsx
```

- [ ] **Step 2: Create the session-scoped server client**

Write `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render — safe to ignore since
            // middleware refreshes the session on every request.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Create the browser client**

Write `src/lib/supabase/client.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: Create the admin (service-role) client**

Write `src/lib/supabase/admin.ts`:

```ts
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

- [ ] **Step 5: Create the shared profile lookup**

Write `src/lib/db/profile.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

export interface CurrentProfile {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, org_id, name, email, role, status")
    .eq("id", user.id)
    .single();
  if (!data) return null;

  return {
    id: data.id,
    orgId: data.org_id,
    name: data.name,
    email: data.email,
    role: data.role,
    status: data.status,
  };
}
```

- [ ] **Step 6: Create the shared audit log helper**

Write `src/lib/db/audit.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  supabase: SupabaseClient,
  params: { orgId: string; actorName: string; action: string; resource: string },
) {
  await supabase.from("audit_logs").insert({
    org_id: params.orgId,
    actor_name: params.actorName,
    action: params.action,
    resource: params.resource,
  });
}
```

- [ ] **Step 7: Typecheck and lint**

```bash
npx tsc --noEmit
npx eslint src/lib/supabase src/lib/db
```

Expected: both clean (no errors).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/supabase src/lib/db
git commit -m "Add Supabase client helpers and shared profile/audit-log DB helpers"
```

---

### Task 2: Database schema, RLS policies, and the new-org signup trigger

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: tables `organizations`, `profiles`, `agent_deployments`, `workflows`, `workflow_agents`, `integrations`, `webhooks`, `documents`, `role_permissions`, `security_policies`, `audit_logs` — column names as used by every later task's queries (e.g. `agent_deployments.agent_key`, `workflows.success_rate`).
- Produces: trigger function `public.handle_new_user()` firing on `auth.users` insert, branching on `raw_user_meta_data->>'signup_type'` (`'self'` creates a new org + Admin profile; `'invited'` creates a profile in an existing org).

- [ ] **Step 1: Write the migration SQL**

Write `supabase/migrations/0001_init.sql`:

```sql
-- Organizations (also serves as "org settings": name/timezone/locale live here directly)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/New_York',
  locale text not null default 'en-US',
  created_at timestamptz not null default now()
);

-- Profiles extend auth.users with org membership + role
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('Admin', 'Manager', 'Operator', 'Viewer')),
  status text not null check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now()
);

create table agent_deployments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  agent_key text not null,
  status text not null default 'idle' check (status in ('active', 'idle', 'error')),
  tasks_completed int not null default 0,
  success_rate int not null default 0,
  avg_latency_ms int not null default 0,
  last_active timestamptz not null default now(),
  system_prompt text,
  tool_permissions jsonb,
  short_term_memory jsonb not null default '[]',
  long_term_memory jsonb not null default '[]',
  performance jsonb not null default '[]',
  deployed_at timestamptz not null default now(),
  unique (org_id, agent_key)
);

create table workflows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  status text not null check (status in ('active', 'draft', 'paused')),
  last_run timestamptz,
  success_rate int not null default 0,
  created_at timestamptz not null default now()
);

create table workflow_agents (
  workflow_id uuid not null references workflows(id) on delete cascade,
  agent_key text not null,
  primary key (workflow_id, agent_key)
);

create table integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  integration_key text not null,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  unique (org_id, integration_key)
);

create table webhooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  url text not null,
  event text not null,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  source_type text not null,
  version int not null default 1,
  status text not null default 'pending' check (status in ('approved', 'pending', 'rejected')),
  updated_at timestamptz not null default now(),
  keywords text[] not null default '{}'
);

create table role_permissions (
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null,
  permission_key text not null,
  allowed boolean not null default false,
  primary key (org_id, role, permission_key)
);

create table security_policies (
  org_id uuid not null references organizations(id) on delete cascade,
  policy_key text not null,
  enabled boolean not null default false,
  primary key (org_id, policy_key)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor_name text not null,
  action text not null,
  resource text not null,
  created_at timestamptz not null default now()
);

-- Row-Level Security -------------------------------------------------------

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table agent_deployments enable row level security;
alter table workflows enable row level security;
alter table workflow_agents enable row level security;
alter table integrations enable row level security;
alter table webhooks enable row level security;
alter table documents enable row level security;
alter table role_permissions enable row level security;
alter table security_policies enable row level security;
alter table audit_logs enable row level security;

create policy "members can select own org" on organizations
  for select using (id in (select org_id from profiles where id = auth.uid()));
create policy "members can update own org" on organizations
  for update using (id in (select org_id from profiles where id = auth.uid()));

create policy "select own org profiles" on profiles
  for select using (
    id = auth.uid() or org_id in (select org_id from profiles where id = auth.uid())
  );
create policy "update own org profiles" on profiles
  for update using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select agent_deployments" on agent_deployments
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write agent_deployments" on agent_deployments
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select workflows" on workflows
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write workflows" on workflows
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select workflow_agents" on workflow_agents
  for select using (
    workflow_id in (select id from workflows where org_id in (select org_id from profiles where id = auth.uid()))
  );
create policy "org write workflow_agents" on workflow_agents
  for all using (
    workflow_id in (select id from workflows where org_id in (select org_id from profiles where id = auth.uid()))
  )
  with check (
    workflow_id in (select id from workflows where org_id in (select org_id from profiles where id = auth.uid()))
  );

create policy "org select integrations" on integrations
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write integrations" on integrations
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select webhooks" on webhooks
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write webhooks" on webhooks
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select documents" on documents
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write documents" on documents
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select role_permissions" on role_permissions
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write role_permissions" on role_permissions
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select security_policies" on security_policies
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write security_policies" on security_policies
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select audit_logs" on audit_logs
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org insert audit_logs" on audit_logs
  for insert with check (org_id in (select org_id from profiles where id = auth.uid()));

-- New-user trigger: self-signup creates a new org; invited users join an
-- existing one. Runs as SECURITY DEFINER so it can bypass RLS to create the
-- very first rows for a brand-new org.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org_id uuid;
  meta jsonb := new.raw_user_meta_data;
begin
  if meta->>'signup_type' = 'invited' then
    insert into public.profiles (id, org_id, name, email, role, status)
    values (
      new.id,
      (meta->>'org_id')::uuid,
      coalesce(meta->>'name', split_part(new.email, '@', 1)),
      new.email,
      coalesce(meta->>'role', 'Viewer'),
      'invited'
    );
  else
    insert into public.organizations (name, timezone, locale)
    values (coalesce(meta->>'org_name', coalesce(meta->>'name', 'New') || '''s Organization'), 'America/New_York', 'en-US')
    returning id into new_org_id;

    insert into public.profiles (id, org_id, name, email, role, status)
    values (new.id, new_org_id, coalesce(meta->>'name', new.email), new.email, 'Admin', 'active');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Apply the migration**

This requires a login you have and I don't — open the Supabase dashboard for this project → **SQL Editor** → paste the entire contents of `supabase/migrations/0001_init.sql` → **Run**.

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify the tables exist and RLS is active**

```bash
cd "/Users/ren/Desktop/Projects 2/NexxaByte Agentic AI Solutions (GaaS) V2"
set -a && source .env.local && set +a
# Anon key, no auth token -> RLS should return an empty array, not an error, for a real table
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/organizations?select=id" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo
# Service role key bypasses RLS -> should also return [] (no rows yet) with HTTP 200, not 404
curl -s -o /dev/null -w "HTTP %{http_code}\n" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/agent_deployments?select=id" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Expected: first command prints `[]` (anon, RLS-scoped, no session — nothing visible, no error). Second prints `HTTP 200`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "Add initial Supabase schema: orgs, profiles, and every domain table with RLS"
```

---

### Task 3: Real authentication (signup, login, logout, middleware)

**Files:**
- Modify: `src/middleware.ts`
- Create: `src/lib/supabase/middleware.ts`
- Modify: `src/app/signup/actions.ts`
- Modify: `src/app/login/actions.ts`
- Modify: `src/lib/auth.ts` (remove now-dead cookie helpers, keep nothing — file becomes empty/deleted; see Step 6)

**Interfaces:**
- Consumes: `createClient()` from `src/lib/supabase/server.ts` (Task 1).
- Produces: real Supabase-session-backed auth. Every later Server Component relies on `getCurrentProfile()` (Task 1) for the caller's org — this task is what makes that function return real data.

- [ ] **Step 1: One-time Supabase dashboard setting**

Dashboard → **Authentication → Providers → Email** → turn **off** "Confirm email" (so `signUp()` returns an active session immediately, matching today's instant signup → dashboard flow). Save.

- [ ] **Step 2: Create the middleware session helper**

Write `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
```

- [ ] **Step 3: Rewrite middleware.ts**

Replace the contents of `src/middleware.ts`:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const isPublicAuthPage =
    request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";

  if (!user && !isPublicAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isPublicAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|nexxabyte-logo.svg|icon.svg).*)"],
};
```

- [ ] **Step 4: Rewrite signup**

Replace the contents of `src/app/signup/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password || !confirmPassword) {
    redirect("/signup?error=missing");
  }
  if (!EMAIL_PATTERN.test(email)) {
    redirect("/signup?error=email");
  }
  if (password.length < 8) {
    redirect("/signup?error=password");
  }
  if (password !== confirmPassword) {
    redirect("/signup?error=mismatch");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { signup_type: "self", name } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      redirect("/signup?error=exists");
    }
    redirect("/signup?error=unknown");
  }

  redirect("/dashboard?welcome=1");
}
```

- [ ] **Step 5: Rewrite login/logout**

Replace the contents of `src/app/login/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=1");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=1");
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 6: Delete the now-dead cookie-auth helpers**

`src/lib/auth.ts` (`SESSION_COOKIE`, `NEW_ORG_COOKIE`, `NEW_ORG_NAME_COOKIE`, `isNewOrg()`, `getCurrentUser()`) is fully superseded by real Supabase sessions and `getCurrentProfile()`. Delete the file:

```bash
rm "src/lib/auth.ts"
```

Any remaining import of it will now fail typecheck — that's intentional; those call sites get fixed in Tasks 5–10 as each page is migrated. If typecheck in Step 7 shows errors outside files this task touches, that's expected until later tasks land; note them and continue.

- [ ] **Step 7: Typecheck and lint what this task touched**

```bash
npx tsc --noEmit
npx eslint src/middleware.ts src/lib/supabase src/app/login/actions.ts src/app/signup/actions.ts
```

Expected: the targeted `eslint` call is clean. `tsc` may show errors in files this task doesn't touch yet (pages still importing the deleted `src/lib/auth.ts`) — that's expected and resolved by Task 5 onward.

- [ ] **Step 8: Verify signup and login manually**

Start the dev server if it isn't running (`npm run dev`), then in a browser:
1. Go to `/signup`, create an account with a real-looking email (e.g. `test-auth@example.com`) and an 8+ character password.
2. Expect a redirect to `/dashboard?welcome=1` (the rest of the dashboard will error until Task 10 — that's fine, confirm the redirect and auth cookie happened, not the page rendering).
3. Confirm the row landed in Supabase:

```bash
set -a && source .env.local && set +a
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=name,email,role,status" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Expected: JSON array containing one profile with `"role":"Admin","status":"active"` for the email you signed up with.

4. Sign out, then sign back in at `/login` with the same credentials — expect redirect to `/dashboard` (not an auth error).

- [ ] **Step 9: Commit**

```bash
git add src/middleware.ts src/lib/supabase/middleware.ts src/app/login/actions.ts src/app/signup/actions.ts
git rm src/lib/auth.ts
git commit -m "Replace mock cookie auth with real Supabase Auth"
```

---

### Task 4: Demo account seed script

**Files:**
- Create: `scripts/seed-demo.ts`
- Modify: `package.json` (add `seed:demo` script)

**Interfaces:**
- Consumes: `createAdminClient()` (Task 1).
- Produces: one real Supabase account (`demo@nexxabyte.com`) with an org populated exactly like today's canned dataset — 4 workflows, all 11 agents deployed, 8 users, 10 integrations (7 connected per today's mock data), 2 webhooks, 10 documents, full role-permission matrix, security policies, and 10 audit log entries.

- [ ] **Step 1: Write the seed script**

Write `scripts/seed-demo.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@nexxabyte.com";
const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD!;

const AGENT_KEYS = [
  "sales",
  "customer-service",
  "hr",
  "recruitment",
  "procurement",
  "finance",
  "compliance",
  "operations",
  "executive-assistant",
  "knowledge-assistant",
  "it-helpdesk",
];

const INTEGRATION_STATUSES: Record<string, string> = {
  "1": "connected",
  "2": "connected",
  "3": "connected",
  "4": "disconnected",
  "5": "error",
  "6": "connected",
  "7": "disconnected",
  "8": "disconnected",
  "9": "connected",
  "10": "connected",
};

const PERMISSION_KEYS = [
  "manage_agents",
  "manage_workflows",
  "manage_integrations",
  "manage_users",
  "view_audit_logs",
  "manage_knowledge_base",
];

const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  Admin: Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])),
  Manager: { manage_agents: true, manage_workflows: true, manage_integrations: true, manage_users: false, view_audit_logs: true, manage_knowledge_base: true },
  Operator: { manage_agents: true, manage_workflows: true, manage_integrations: false, manage_users: false, view_audit_logs: false, manage_knowledge_base: true },
  Viewer: { manage_agents: false, manage_workflows: false, manage_integrations: false, manage_users: false, view_audit_logs: true, manage_knowledge_base: false },
};

function zeroPerformance(seed: number) {
  return Array.from({ length: 7 }).map((_, i) => ({ label: `Day ${i + 1}`, value: Math.round(60 + ((seed + i) * 7) % 40) }));
}

async function main() {
  console.log("Creating demo auth user...");
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { signup_type: "self", name: "Jordan Lee", org_name: "Acme Corp" },
  });
  if (createError) throw createError;
  const userId = created.user!.id;

  // The on_auth_user_created trigger already made an organizations + profiles
  // row. Fetch the org id it created.
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", userId).single();
  const orgId = profile!.org_id;
  console.log("Org:", orgId);

  console.log("Deploying agents...");
  await supabase.from("agent_deployments").insert(
    AGENT_KEYS.map((agentKey, i) => ({
      org_id: orgId,
      agent_key: agentKey,
      status: ["active", "active", "active", "idle", "error"][i % 5],
      tasks_completed: 120 + i * 37,
      success_rate: 90 + (i % 8),
      avg_latency_ms: 800 + i * 45,
      last_active: new Date(Date.now() - i * 1000 * 60 * 17).toISOString(),
      short_term_memory: [
        { key: "Current session", value: "Discussing Q3 renewal terms with Acme Corp." },
        { key: "Open task", value: "Awaiting approval on discount threshold." },
      ],
      long_term_memory: [
        { key: "Customer history", value: "12 prior interactions across 3 accounts." },
        { key: "Business preferences", value: "Prefers concise summaries over long reports." },
      ],
      performance: zeroPerformance(i),
    })),
  );

  console.log("Creating workflows...");
  const workflowNames = ["New Lead Qualification", "Invoice Approval Routing", "Employee Offboarding", "Support Ticket Escalation"];
  const workflowStatuses = ["active", "active", "draft", "paused"];
  const workflowAgents = [["sales"], ["finance"], ["hr"], ["customer-service"]];
  for (let i = 0; i < workflowNames.length; i++) {
    const { data: wf } = await supabase
      .from("workflows")
      .insert({
        org_id: orgId,
        name: workflowNames[i],
        status: workflowStatuses[i],
        success_rate: 92 + i,
        last_run: new Date(Date.now() - i * 3600000).toISOString(),
      })
      .select("id")
      .single();
    await supabase.from("workflow_agents").insert(workflowAgents[i].map((agentKey) => ({ workflow_id: wf!.id, agent_key: agentKey })));
  }

  console.log("Connecting integrations...");
  await supabase.from("integrations").insert(
    Object.entries(INTEGRATION_STATUSES).map(([key, status]) => ({ org_id: orgId, integration_key: key, status })),
  );

  console.log("Adding webhooks...");
  await supabase.from("webhooks").insert([
    { org_id: orgId, url: "https://hooks.client.com/agent-events", event: "agent.task.completed" },
    { org_id: orgId, url: "https://hooks.client.com/approvals", event: "workflow.approval.requested" },
  ]);

  console.log("Adding documents...");
  const documentNames = [
    "Employee Handbook 2026", "Sales Playbook Q3", "ERP Integration Spec", "Compliance Policy GDPR", "Vendor Onboarding Guide",
    "Customer Support FAQ", "Product Catalog Export", "HR Benefits Summary", "Incident Response Runbook", "Procurement Approval Matrix",
  ];
  const sourceTypes = ["PDF", "Word", "Excel", "CSV", "Website", "SharePoint", "Google Drive", "Notion", "Confluence", "Database"];
  const docStatuses = ["approved", "approved", "pending", "approved", "rejected"];
  await supabase.from("documents").insert(
    documentNames.map((name, i) => ({
      org_id: orgId,
      name,
      source_type: sourceTypes[i % sourceTypes.length],
      version: 1 + (i % 4),
      status: docStatuses[i % docStatuses.length],
      keywords: name.toLowerCase().split(" ").filter((w) => w.length > 3),
    })),
  );

  console.log("Adding role permissions...");
  const rolePermRows = Object.entries(ROLE_PERMISSIONS).flatMap(([role, perms]) =>
    Object.entries(perms).map(([permission_key, allowed]) => ({ org_id: orgId, role, permission_key, allowed })),
  );
  await supabase.from("role_permissions").insert(rolePermRows);

  console.log("Adding security policies...");
  await supabase.from("security_policies").insert([
    { org_id: orgId, policy_key: "mfa", enabled: true },
    { org_id: orgId, policy_key: "sso", enabled: false },
    { org_id: orgId, policy_key: "session-timeout", enabled: true },
    { org_id: orgId, policy_key: "ip", enabled: false },
  ]);

  console.log("Adding more users...");
  const extraUsers = [
    { name: "Priya Patel", email: "priya.patel@client.com", role: "Manager", status: "active" },
    { name: "Marcus Chen", email: "marcus.chen@client.com", role: "Operator", status: "invited" },
    { name: "Sofia Ramirez", email: "sofia.ramirez@client.com", role: "Viewer", status: "disabled" },
    { name: "Aisha Khan", email: "aisha.khan@client.com", role: "Admin", status: "active" },
    { name: "Tom Becker", email: "tom.becker@client.com", role: "Manager", status: "active" },
    { name: "Nina Volkov", email: "nina.volkov@client.com", role: "Operator", status: "invited" },
    { name: "Diego Alvarez", email: "diego.alvarez@client.com", role: "Viewer", status: "disabled" },
  ];
  // profiles.id is a foreign key to auth.users(id), so each demo user needs
  // a real (if unused) auth account rather than a bare profiles insert.
  // The trigger always sets status='invited' for signup_type='invited'; for
  // users whose demo status is active/disabled, patch it after creation.
  for (const u of extraUsers) {
    const { data: extraUser } = await supabase.auth.admin.createUser({
      email: u.email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { signup_type: "invited", org_id: orgId, name: u.name, role: u.role },
    });
    if (u.status !== "invited" && extraUser.user) {
      await supabase.from("profiles").update({ status: u.status }).eq("id", extraUser.user.id);
    }
  }

  console.log("Adding audit log history...");
  const actions = ["Signed in", "Updated agent prompt", "Approved document", "Changed role", "Disabled user", "Connected integration"];
  await supabase.from("audit_logs").insert(
    Array.from({ length: 10 }).map((_, i) => ({
      org_id: orgId,
      actor_name: extraUsers[i % extraUsers.length].name,
      action: actions[i % actions.length],
      resource: i % 2 === 0 ? "Sales Agent" : "Knowledge Base",
      created_at: new Date(Date.now() - i * 2700000).toISOString(),
    })),
  );

  console.log("Demo org seeded:", orgId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add `dotenv` (needed by the script) and the run script**

```bash
npm install -D dotenv
```

Add to `package.json`'s `"scripts"` block:

```json
"seed:demo": "tsx scripts/seed-demo.ts"
```

- [ ] **Step 3: Run the seed script**

```bash
npm run seed:demo
```

Expected: log lines ending in `Demo org seeded: <uuid>`, no thrown error. If a prior partial run already created `demo@nexxabyte.com`, delete it first via the dashboard's Authentication → Users tab to avoid a duplicate-email error, then re-run.

- [ ] **Step 4: Verify the seed via REST**

```bash
set -a && source .env.local && set +a
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/workflows?select=name,status" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | head -c 500
```

Expected: JSON array with the 4 seeded workflow names.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-demo.ts package.json package-lock.json
git commit -m "Add demo account seed script"
```

---

### Task 5: Workflows domain

**Files:**
- Create: `src/lib/db/workflows.ts`
- Create: `src/app/(app)/workflows/actions.ts`
- Modify: `src/app/(app)/workflows/page.tsx`
- Modify: `src/app/(app)/workflows/workflows-workspace.tsx`
- Modify: `src/lib/mock-data/types.ts` (no change — `WorkflowSummary` already has `agentIds`)

**Interfaces:**
- Consumes: `createClient()`, `getCurrentProfile()`, `logAudit()` (Task 1); `getAgents()` from `src/lib/mock-data/agents.ts` (unchanged).
- Produces: `getWorkflows(orgId): Promise<WorkflowSummary[]>` from `src/lib/db/workflows.ts` — consumed by Task 10 (dashboard).

- [ ] **Step 1: Write the read layer**

Write `src/lib/db/workflows.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { WorkflowStatus, WorkflowSummary } from "@/lib/mock-data/types";

export async function getWorkflows(orgId: string): Promise<WorkflowSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflows")
    .select("id, name, status, last_run, success_rate, workflow_agents(agent_key)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status as WorkflowStatus,
    lastRun: row.last_run ?? "",
    successRate: row.success_rate,
    agentIds: (row.workflow_agents ?? []).map((wa: { agent_key: string }) => wa.agent_key),
  }));
}
```

- [ ] **Step 2: Write the Server Actions**

Write `src/app/(app)/workflows/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profile";
import { logAudit } from "@/lib/db/audit";
import type { WorkflowStatus } from "@/lib/mock-data/types";

function zeroPerformance() {
  return Array.from({ length: 7 }).map((_, i) => ({ label: `Day ${i + 1}`, value: 0 }));
}

export async function createWorkflow(params: { name: string; status: WorkflowStatus; agentIds: string[] }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { data: workflow, error } = await supabase
    .from("workflows")
    .insert({ org_id: profile.orgId, name: params.name, status: params.status, success_rate: 0, last_run: null })
    .select("id")
    .single();
  if (error || !workflow) throw new Error(error?.message ?? "Failed to create workflow");

  if (params.agentIds.length > 0) {
    await supabase
      .from("workflow_agents")
      .insert(params.agentIds.map((agentKey) => ({ workflow_id: workflow.id, agent_key: agentKey })));
  }

  const { data: existingDeployments } = await supabase
    .from("agent_deployments")
    .select("agent_key")
    .eq("org_id", profile.orgId)
    .in("agent_key", params.agentIds);
  const alreadyDeployed = new Set((existingDeployments ?? []).map((d) => d.agent_key));
  const newlyDeployed = params.agentIds.filter((key) => !alreadyDeployed.has(key));

  if (newlyDeployed.length > 0) {
    await supabase.from("agent_deployments").insert(
      newlyDeployed.map((agentKey) => ({
        org_id: profile.orgId,
        agent_key: agentKey,
        status: "idle",
        tasks_completed: 0,
        success_rate: 0,
        avg_latency_ms: 0,
        last_active: new Date().toISOString(),
        short_term_memory: [],
        long_term_memory: [],
        performance: zeroPerformance(),
      })),
    );
  }

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Created workflow", resource: params.name });

  revalidatePath("/workflows");
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function updateWorkflowStatus(id: string, status: WorkflowStatus, name: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("workflows").update({ status }).eq("id", id).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    orgId: profile.orgId,
    actorName: profile.name,
    action: `Changed workflow status to ${status}`,
    resource: name,
  });
  revalidatePath("/workflows");
}
```

- [ ] **Step 3: Rewrite the page**

Replace the contents of `src/app/(app)/workflows/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowsWorkspace } from "./workflows-workspace";
import { getAgents } from "@/lib/mock-data/agents";
import { getCurrentProfile } from "@/lib/db/profile";
import { getWorkflows } from "@/lib/db/workflows";

export default async function WorkflowsPage() {
  const [agents, profile] = await Promise.all([getAgents(), getCurrentProfile()]);
  const workflows = profile ? await getWorkflows(profile.orgId) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Builder" description="Design and automate multi-step business processes." />
      <WorkflowsWorkspace initialWorkflows={workflows} agents={agents} />
    </div>
  );
}
```

- [ ] **Step 4: Rewrite the workspace**

Replace the contents of `src/app/(app)/workflows/workflows-workspace.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { Plus, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateAutomationWizard } from "./create-automation-wizard";
import { toast } from "@/lib/toast";
import { createWorkflow, updateWorkflowStatus } from "./actions";
import { useState } from "react";
import type { Agent, WorkflowStatus, WorkflowSummary } from "@/lib/mock-data/types";

const STATUS_OPTIONS: WorkflowStatus[] = ["active", "paused", "draft"];

export function WorkflowsWorkspace({
  initialWorkflows,
  agents,
}: {
  initialWorkflows: WorkflowSummary[];
  agents: Agent[];
}) {
  const [, startTransition] = useTransition();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const workflows = initialWorkflows;

  function handleCreate(workflow: WorkflowSummary) {
    setIsWizardOpen(false);
    startTransition(async () => {
      try {
        await createWorkflow({ name: workflow.name, status: workflow.status, agentIds: workflow.agentIds });
      } catch {
        toast.error("Couldn't create automation", "Please try again.");
      }
    });
  }

  function handleStatusChange(id: string, status: WorkflowStatus) {
    const workflow = workflows.find((wf) => wf.id === id);
    if (!workflow) return;
    startTransition(async () => {
      try {
        await updateWorkflowStatus(id, status, workflow.name);
        toast.success("Status updated", `"${workflow.name}" is now ${status}.`);
      } catch {
        toast.error("Couldn't update status", "Please try again.");
      }
    });
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

      {workflows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No automations yet"
          description="Create your first automation to start automating business processes with AI agents."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflows.map((wf) => {
            const assignedAgents = agents.filter((a) => wf.agentIds.includes(a.id));
            return (
              <Card key={wf.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <CardTitle className="line-clamp-2 min-h-10 max-w-[130px] text-sm">{wf.name}</CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            aria-label={`Change status for ${wf.name}`}
                            className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <StatusBadge status={wf.status} />
                          </button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        {STATUS_OPTIONS.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            disabled={status === wf.status}
                            onClick={() => handleStatusChange(wf.id, status)}
                            className="capitalize"
                          >
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Success rate: {wf.successRate}% · Last run{" "}
                  {wf.lastRun ? new Date(wf.lastRun).toLocaleString("en-US", { timeZone: "UTC" }) : "Never run"}
                  {assignedAgents.length > 0 && (
                    <p className="mt-1 truncate">Agents: {assignedAgents.map((a) => a.name).join(", ")}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isWizardOpen && (
        <CreateAutomationWizard agents={agents} onCreate={handleCreate} onClose={() => setIsWizardOpen(false)} />
      )}
    </div>
  );
}
```

`create-automation-wizard.tsx` and every `wizard-step-*.tsx` file need no changes — their props are unchanged.

- [ ] **Step 5: Typecheck and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(app)/workflows"
```

Expected: clean for these files (other pages still reference the deleted store — expected until their tasks land).

- [ ] **Step 6: Verify in the browser**

Sign in as the account created in Task 3's verification (or sign up fresh). Go to `/workflows`, create an automation assigning an agent, confirm the card appears with the correct status badge and the dropdown correctly changes status. Then:

```bash
set -a && source .env.local && set +a
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/workflows?select=name,status" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Expected: the workflow you just created appears in the response.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/workflows.ts "src/app/(app)/workflows/actions.ts" "src/app/(app)/workflows/page.tsx" "src/app/(app)/workflows/workflows-workspace.tsx"
git commit -m "Migrate workflows domain to Supabase"
```

---

### Task 6: Agents domain

**Files:**
- Create: `src/lib/db/agents.ts`
- Create: `src/app/(app)/agents/actions.ts`
- Modify: `src/app/(app)/agents/page.tsx`
- Modify: `src/app/(app)/agents/agents-workspace.tsx`
- Modify: `src/app/(app)/agents/[id]/page.tsx`
- Modify: `src/app/(app)/agents/[id]/agent-detail-tabs.tsx`
- Delete: `src/app/(app)/agents/[id]/agent-status-badge.tsx` (superseded — status now comes straight from the server-fetched agent)

**Interfaces:**
- Consumes: `createClient()`, `getCurrentProfile()`, `logAudit()` (Task 1); `getAgents()` catalog (unchanged).
- Produces: `getDeployedAgents(orgId): Promise<Agent[]>` and `getAgentDeployment(orgId, agentKey): Promise<Agent | null>` from `src/lib/db/agents.ts` — consumed by Task 10 (dashboard).

- [ ] **Step 1: Write the read layer**

Write `src/lib/db/agents.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { getAgents as getAgentCatalog } from "@/lib/mock-data/agents";
import type { Agent } from "@/lib/mock-data/types";

interface AgentDeploymentRow {
  agent_key: string;
  status: string;
  tasks_completed: number;
  success_rate: number;
  avg_latency_ms: number;
  last_active: string;
  system_prompt: string | null;
  tool_permissions: Agent["toolPermissions"] | null;
  short_term_memory: Agent["shortTermMemory"];
  long_term_memory: Agent["longTermMemory"];
  performance: Agent["performance"];
}

export async function getDeployedAgents(orgId: string): Promise<Agent[]> {
  const supabase = await createClient();
  const [catalog, { data: deployments }] = await Promise.all([
    getAgentCatalog(),
    supabase.from("agent_deployments").select("*").eq("org_id", orgId),
  ]);

  const byKey = new Map((deployments ?? []).map((d) => [d.agent_key, d as AgentDeploymentRow]));

  return catalog
    .filter((agent) => byKey.has(agent.id))
    .map((agent) => {
      const d = byKey.get(agent.id)!;
      return {
        ...agent,
        status: d.status as Agent["status"],
        tasksCompleted: d.tasks_completed,
        successRate: d.success_rate,
        avgLatencyMs: d.avg_latency_ms,
        lastActive: d.last_active,
        systemPrompt: d.system_prompt ?? agent.systemPrompt,
        toolPermissions: d.tool_permissions ?? agent.toolPermissions,
        shortTermMemory: d.short_term_memory,
        longTermMemory: d.long_term_memory,
        performance: d.performance,
      };
    });
}

export async function getAgentDeployment(orgId: string, agentKey: string): Promise<Agent | null> {
  const agents = await getDeployedAgents(orgId);
  return agents.find((a) => a.id === agentKey) ?? null;
}
```

- [ ] **Step 2: Write the Server Actions**

Write `src/app/(app)/agents/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profile";
import type { MemoryEntry, ToolPermission } from "@/lib/mock-data/types";

export async function updateAgentPrompt(agentKey: string, systemPrompt: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("agent_deployments")
    .update({ system_prompt: systemPrompt })
    .eq("org_id", profile.orgId)
    .eq("agent_key", agentKey);
  if (error) throw new Error(error.message);
  revalidatePath(`/agents/${agentKey}`);
}

export async function updateAgentTools(agentKey: string, toolPermissions: ToolPermission[]) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("agent_deployments")
    .update({ tool_permissions: toolPermissions })
    .eq("org_id", profile.orgId)
    .eq("agent_key", agentKey);
  if (error) throw new Error(error.message);
  revalidatePath(`/agents/${agentKey}`);
}

export async function updateAgentMemory(
  agentKey: string,
  field: "short_term_memory" | "long_term_memory",
  value: MemoryEntry[],
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("agent_deployments")
    .update({ [field]: value })
    .eq("org_id", profile.orgId)
    .eq("agent_key", agentKey);
  if (error) throw new Error(error.message);
  revalidatePath(`/agents/${agentKey}`);
}
```

- [ ] **Step 3: Rewrite the console page and workspace**

Replace `src/app/(app)/agents/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared/page-header";
import { AgentsWorkspace } from "./agents-workspace";
import { getCurrentProfile } from "@/lib/db/profile";
import { getDeployedAgents } from "@/lib/db/agents";

export default async function AgentsPage() {
  const profile = await getCurrentProfile();
  const agents = profile ? await getDeployedAgents(profile.orgId) : [];

  return (
    <div>
      <PageHeader title="AI Agent Console" description="Manage, configure, and monitor every agent in your workspace." />
      <AgentsWorkspace agents={agents} />
    </div>
  );
}
```

Replace `src/app/(app)/agents/agents-workspace.tsx` (no longer needs `"use client"` — it has no hooks):

```tsx
import Link from "next/link";
import { Bot } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent } from "@/lib/mock-data/types";

export function AgentsWorkspace({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title="No agents yet"
        description="Agents are deployed as part of an automation. Head to Workflow Builder to create your first one."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <Link key={agent.id} href={`/agents/${agent.id}`}>
          <Card className="h-full transition-shadow hover:ring-primary/50">
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
  );
}
```

- [ ] **Step 4: Rewrite the detail page**

Replace `src/app/(app)/agents/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AgentDetailTabs } from "./agent-detail-tabs";
import { getCurrentProfile } from "@/lib/db/profile";
import { getAgentDeployment } from "@/lib/db/agents";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const agent = profile ? await getAgentDeployment(profile.orgId, id) : null;

  if (!agent) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "AI Agent Console", href: "/agents" }, { label: agent.name }]} />
      <div className="mt-[30px]">
        <PageHeader title={agent.name} description={agent.description} actions={<StatusBadge status={agent.status} />} />
        <AgentDetailTabs agent={agent} />
      </div>
    </div>
  );
}
```

Delete the now-unused status-badge wrapper:

```bash
rm "src/app/(app)/agents/[id]/agent-status-badge.tsx"
```

- [ ] **Step 5: Rewrite the detail tabs**

Replace `src/app/(app)/agents/[id]/agent-detail-tabs.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DragScrollX } from "@/components/shared/drag-scroll-x";
import { toast } from "@/lib/toast";
import { updateAgentPrompt, updateAgentTools, updateAgentMemory } from "./actions";
import type { Agent } from "@/lib/mock-data/types";

export function AgentDetailTabs({ agent }: { agent: Agent }) {
  const [, startTransition] = useTransition();
  const [prompt, setPrompt] = useState(agent.systemPrompt);
  const [saved, setSaved] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [clearSessionOpen, setClearSessionOpen] = useState(false);
  const [resetMemoryOpen, setResetMemoryOpen] = useState(false);

  return (
    <Tabs defaultValue="prompt" className="w-full">
      <DragScrollX>
        <TabsList>
          <TabsTrigger value="prompt">Prompt Configuration</TabsTrigger>
          <TabsTrigger value="tools">Tool Permissions</TabsTrigger>
          <TabsTrigger value="memory">Memory Management</TabsTrigger>
          <TabsTrigger value="performance">Performance Monitoring</TabsTrigger>
        </TabsList>
      </DragScrollX>

      <TabsContent value="prompt" className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setSaved(false);
            if (promptError) setPromptError(null);
          }}
          rows={8}
          aria-invalid={promptError ? true : undefined}
        />
        {promptError && <p className="text-xs text-destructive">{promptError}</p>}
        <Button
          onClick={() => {
            if (!prompt.trim()) {
              setPromptError("System prompt can't be empty.");
              toast.error("Couldn't save prompt", "System prompt can't be empty.");
              return;
            }
            startTransition(async () => {
              try {
                await updateAgentPrompt(agent.id, prompt);
                setSaved(true);
                toast.success("Prompt saved", `${agent.name}'s system prompt has been updated.`);
              } catch {
                toast.error("Couldn't save prompt", "Please try again.");
              }
            });
          }}
        >
          {saved ? "Saved" : "Save changes"}
        </Button>
      </TabsContent>

      <TabsContent value="tools">
        <Card>
          <CardContent className="space-y-2">
            {agent.toolPermissions.map((tool, i) => (
              <div key={tool.tool} className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor={`tool-${tool.tool}`}>{tool.tool}</Label>
                <Switch
                  id={`tool-${tool.tool}`}
                  checked={tool.enabled}
                  onCheckedChange={(checked) => {
                    const nextTools = agent.toolPermissions.map((t, idx) => (idx === i ? { ...t, enabled: checked } : t));
                    startTransition(async () => {
                      try {
                        await updateAgentTools(agent.id, nextTools);
                        toast.success(checked ? `${tool.tool} access enabled` : `${tool.tool} access disabled`);
                      } catch {
                        toast.error("Couldn't update tool access", "Please try again.");
                      }
                    });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="memory" className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm text-primary">Short-Term Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.shortTermMemory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No short-term memory entries.</p>
            ) : (
              agent.shortTermMemory.map((m) => (
                <div key={m.key} className="text-sm">
                  <span className="font-medium">{m.key}: </span>
                  <span className="text-muted-foreground">{m.value}</span>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setClearSessionOpen(true)}>
              Clear session
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm text-primary">Long-Term Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.longTermMemory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No long-term memory entries.</p>
            ) : (
              agent.longTermMemory.map((m) => (
                <div key={m.key} className="text-sm">
                  <span className="font-medium">{m.key}: </span>
                  <span className="text-muted-foreground">{m.value}</span>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setResetMemoryOpen(true)}>
              Reset memory
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

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

      <ConfirmDialog
        open={clearSessionOpen}
        onOpenChange={setClearSessionOpen}
        title="Clear session?"
        description="This will clear the agent's short-term memory for this session."
        onConfirm={() => {
          startTransition(async () => {
            try {
              await updateAgentMemory(agent.id, "short_term_memory", []);
              toast.success("Session cleared", "Short-term memory has been cleared.");
            } catch {
              toast.error("Couldn't clear session", "Please try again.");
            }
          });
        }}
      />
      <ConfirmDialog
        open={resetMemoryOpen}
        onOpenChange={setResetMemoryOpen}
        title="Reset memory?"
        description="This will reset the agent's long-term memory."
        onConfirm={() => {
          startTransition(async () => {
            try {
              await updateAgentMemory(agent.id, "long_term_memory", []);
              toast.success("Memory reset", "Long-term memory has been reset.");
            } catch {
              toast.error("Couldn't reset memory", "Please try again.");
            }
          });
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 6: Typecheck and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(app)/agents"
```

- [ ] **Step 7: Verify in the browser**

Confirm `/agents` lists the workflow-deployed agent from Task 5's verification. Open it, edit the system prompt, save, reload the page — the edited prompt must persist (proves it round-tripped through the database, not just local state).

- [ ] **Step 8: Commit**

```bash
git add src/lib/db/agents.ts "src/app/(app)/agents"
git commit -m "Migrate agents domain to Supabase"
```

---

### Task 7: Integrations + webhooks domain

**Files:**
- Create: `src/lib/db/integrations.ts`
- Create: `src/app/(app)/integrations/actions.ts`
- Modify: `src/app/(app)/integrations/page.tsx`
- Modify: `src/app/(app)/integrations/integrations-workspace.tsx`
- Modify: `src/app/(app)/integrations/webhook-list.tsx`
- No change: `src/app/(app)/integrations/integration-card.tsx` (its `onConnect`/`onDisconnect` props already accept `(id: string) => void`; passing an async Server-Action-backed function fits without a signature change)

**Interfaces:**
- Consumes: `createClient()`, `getCurrentProfile()`, `logAudit()` (Task 1); `getIntegrations()` catalog (unchanged).

- [ ] **Step 1: Write the read layer**

Write `src/lib/db/integrations.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { getIntegrations as getIntegrationCatalog } from "@/lib/mock-data/integrations";
import type { Integration, Webhook } from "@/lib/mock-data/types";

export async function getOrgIntegrations(orgId: string): Promise<Integration[]> {
  const supabase = await createClient();
  const [catalog, { data: rows }] = await Promise.all([
    getIntegrationCatalog(),
    supabase.from("integrations").select("integration_key, status").eq("org_id", orgId),
  ]);

  const statusByKey = new Map((rows ?? []).map((r) => [r.integration_key, r.status]));
  return catalog.map((integration) => ({
    ...integration,
    status: (statusByKey.get(integration.id) ?? "disconnected") as Integration["status"],
  }));
}

export async function getOrgWebhooks(orgId: string): Promise<Webhook[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhooks")
    .select("id, url, event, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({ id: row.id, url: row.url, event: row.event, createdAt: row.created_at }));
}
```

- [ ] **Step 2: Write the Server Actions**

Write `src/app/(app)/integrations/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profile";
import { logAudit } from "@/lib/db/audit";
import type { IntegrationStatus } from "@/lib/mock-data/types";

export async function setIntegrationStatus(integrationKey: string, status: IntegrationStatus, integrationName: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("integrations")
    .upsert({ org_id: profile.orgId, integration_key: integrationKey, status }, { onConflict: "org_id,integration_key" });
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    orgId: profile.orgId,
    actorName: profile.name,
    action: status === "connected" ? "Connected integration" : "Disconnected integration",
    resource: integrationName,
  });
  revalidatePath("/integrations");
}

export async function addWebhook(url: string, event: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("webhooks").insert({ org_id: profile.orgId, url, event });
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Added webhook", resource: url });
  revalidatePath("/integrations");
}

export async function removeWebhook(id: string, url: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("webhooks").delete().eq("id", id).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Removed webhook", resource: url });
  revalidatePath("/integrations");
}
```

- [ ] **Step 3: Rewrite the page and workspace**

Replace `src/app/(app)/integrations/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared/page-header";
import { IntegrationsWorkspace } from "./integrations-workspace";
import { WebhookList } from "./webhook-list";
import { getCurrentProfile } from "@/lib/db/profile";
import { getOrgIntegrations, getOrgWebhooks } from "@/lib/db/integrations";

export default async function IntegrationsPage() {
  const profile = await getCurrentProfile();
  const [integrations, webhooks] = profile
    ? await Promise.all([getOrgIntegrations(profile.orgId), getOrgWebhooks(profile.orgId)])
    : [[], []];

  return (
    <div className="space-y-8">
      <PageHeader title="Integration Center" description="Manage connections to your enterprise systems." />
      <IntegrationsWorkspace integrations={integrations} />
      <WebhookList initialWebhooks={webhooks} />
    </div>
  );
}
```

Replace `src/app/(app)/integrations/integrations-workspace.tsx`:

```tsx
"use client";

import { IntegrationCard } from "./integration-card";
import { setIntegrationStatus } from "./actions";
import type { Integration, IntegrationCategory } from "@/lib/mock-data/types";

const CATEGORY_ORDER: IntegrationCategory[] = ["CRM", "ERP", "Communication", "Identity", "Custom API"];

export function IntegrationsWorkspace({ integrations }: { integrations: Integration[] }) {
  return (
    <>
      {CATEGORY_ORDER.map((category) => {
        const items = integrations.filter((i) => i.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={(id) => setIntegrationStatus(id, "connected", integration.name)}
                  onDisconnect={(id) => setIntegrationStatus(id, "disconnected", integration.name)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
```

- [ ] **Step 4: Rewrite the webhook list**

Replace `src/app/(app)/integrations/webhook-list.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { addWebhook, removeWebhook } from "./actions";
import type { Webhook } from "@/lib/mock-data/types";

const EVENT_PATTERN = /^[a-z]+(\.[a-z]+)+$/;

function isValidWebhookUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function WebhookList({ initialWebhooks }: { initialWebhooks: Webhook[] }) {
  const [, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  function handleAdd() {
    const trimmedUrl = url.trim();
    const trimmedEvent = event.trim();

    const nextUrlError = !trimmedUrl
      ? "URL is required."
      : !isValidWebhookUrl(trimmedUrl)
        ? "Enter a valid http:// or https:// URL."
        : null;
    const nextEventError = !trimmedEvent
      ? "Event is required."
      : !EVENT_PATTERN.test(trimmedEvent)
        ? "Use lowercase, dot-separated segments, e.g. agent.task.completed."
        : null;

    setUrlError(nextUrlError);
    setEventError(nextEventError);
    if (nextUrlError || nextEventError) return;

    startTransition(async () => {
      try {
        await addWebhook(trimmedUrl, trimmedEvent);
        setUrl("");
        setEvent("");
        setUrlError(null);
        setEventError(null);
        toast.success("Webhook added", trimmedUrl);
      } catch {
        toast.error("Couldn't add webhook", "Please try again.");
      }
    });
  }

  function handleRemove(id: string, webhookUrl: string) {
    startTransition(async () => {
      try {
        await removeWebhook(id, webhookUrl);
        toast.success("Webhook removed");
      } catch {
        toast.error("Couldn't remove webhook", "Please try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Webhooks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-1">
            <Input
              placeholder="https://your-endpoint.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={urlError ? true : undefined}
            />
            {urlError && <p className="text-xs text-destructive">{urlError}</p>}
          </div>
          <div className="space-y-1 sm:max-w-xs sm:flex-1">
            <Input
              placeholder="Event (e.g. agent.task.completed)"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              aria-invalid={eventError ? true : undefined}
            />
            {eventError && <p className="text-xs text-destructive">{eventError}</p>}
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        {initialWebhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No webhooks configured.</p>
        ) : (
          <div className="space-y-2">
            {initialWebhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{webhook.url}</p>
                  <p className="text-xs text-muted-foreground">{webhook.event}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(webhook.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(webhook.id, webhook.url)} aria-label="Delete webhook">
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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

- [ ] **Step 5: Typecheck and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(app)/integrations"
```

- [ ] **Step 6: Verify in the browser**

On `/integrations`, connect an integration via "Configure" and confirm the badge flips and stays flipped after a full page reload (not just client state). Add a webhook, reload, confirm it's still there.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/integrations.ts "src/app/(app)/integrations"
git commit -m "Migrate integrations and webhooks domain to Supabase"
```

---

### Task 8: Knowledge base (documents) domain

**Files:**
- Create: `src/lib/db/documents.ts`
- Create: `src/app/(app)/knowledge/actions.ts`
- Modify: `src/app/(app)/knowledge/page.tsx`
- Modify: `src/app/(app)/knowledge/knowledge-workspace.tsx`
- Modify: `src/app/(app)/knowledge/upload-dialog.tsx`
- No change: `src/app/(app)/knowledge/documents-table.tsx`, `src/app/(app)/knowledge/approval-queue.tsx` (already prop-driven)

**Interfaces:**
- Consumes: `createClient()`, `getCurrentProfile()`, `logAudit()` (Task 1).

- [ ] **Step 1: Write the read layer**

Write `src/lib/db/documents.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { KnowledgeDocument } from "@/lib/mock-data/types";

export async function getOrgDocuments(orgId: string): Promise<KnowledgeDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, name, source_type, version, status, updated_at, keywords")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sourceType: row.source_type as KnowledgeDocument["sourceType"],
    version: row.version,
    status: row.status as KnowledgeDocument["status"],
    updatedAt: row.updated_at,
    keywords: row.keywords ?? [],
  }));
}
```

- [ ] **Step 2: Write the Server Actions**

Write `src/app/(app)/knowledge/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/db/profile";
import { logAudit } from "@/lib/db/audit";
import type { DocumentSourceType, DocumentStatus } from "@/lib/mock-data/types";

export async function uploadDocument(params: { name: string; sourceType: DocumentSourceType; keywords: string[] }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("documents").insert({
    org_id: profile.orgId,
    name: params.name,
    source_type: params.sourceType,
    version: 1,
    status: "pending",
    keywords: params.keywords,
  });
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Uploaded document", resource: params.name });
  revalidatePath("/knowledge");
}

export async function setDocumentStatus(id: string, status: DocumentStatus, name: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("documents").update({ status }).eq("id", id).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  const action = status === "approved" ? "Approved document" : status === "rejected" ? "Rejected document" : "Updated document status";
  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action, resource: name });
  revalidatePath("/knowledge");
}
```

- [ ] **Step 3: Rewrite the page and workspace**

Replace `src/app/(app)/knowledge/page.tsx`:

```tsx
import { PageHeader } from "@/components/shared/page-header";
import { UploadDialog } from "./upload-dialog";
import { KnowledgeWorkspace } from "./knowledge-workspace";
import { getCurrentProfile } from "@/lib/db/profile";
import { getOrgDocuments } from "@/lib/db/documents";

export default async function KnowledgeBasePage() {
  const profile = await getCurrentProfile();
  const documents = profile ? await getOrgDocuments(profile.orgId) : [];

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Manage the documents and data sources your agents are trained on."
        actions={<UploadDialog />}
      />
      <KnowledgeWorkspace documents={documents} />
    </div>
  );
}
```

Replace `src/app/(app)/knowledge/knowledge-workspace.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { DocumentsTable } from "./documents-table";
import { ApprovalQueue } from "./approval-queue";
import { setDocumentStatus } from "./actions";
import type { DocumentStatus, KnowledgeDocument } from "@/lib/mock-data/types";

export function KnowledgeWorkspace({ documents }: { documents: KnowledgeDocument[] }) {
  const [, startTransition] = useTransition();
  const pending = documents.filter((d) => d.status === "pending");

  function handleDecision(id: string, status: DocumentStatus) {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    startTransition(() => setDocumentStatus(id, status, doc.name));
  }

  return (
    <div className="space-y-8">
      <ApprovalQueue documents={pending} onDecision={handleDecision} />
      <DocumentsTable documents={documents} />
    </div>
  );
}
```

- [ ] **Step 4: Rewrite the upload dialog**

Replace `src/app/(app)/knowledge/upload-dialog.tsx`:

```tsx
"use client";

import { useRef, useState, useTransition } from "react";
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
import { toast } from "@/lib/toast";
import { uploadDocument } from "./actions";
import type { DocumentSourceType } from "@/lib/mock-data/types";

const EXTENSION_SOURCE_TYPE: Record<string, DocumentSourceType> = {
  pdf: "PDF",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  csv: "CSV",
};

function inferSourceType(fileName: string): DocumentSourceType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_SOURCE_TYPE[ext] ?? "PDF";
}

export function UploadDialog() {
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setError(null);
  }

  function handleSubmit() {
    if (!file) {
      setError("Choose a file to upload.");
      toast.error("Couldn't add to queue", "Choose a file to upload first.");
      return;
    }
    const name = file.name;
    startTransition(async () => {
      try {
        await uploadDocument({
          name,
          sourceType: inferSourceType(name),
          keywords: name.toLowerCase().split(/[.\s_-]+/).filter((w) => w.length > 3),
        });
        toast.success("Added to approval queue", name);
        setOpen(false);
        reset();
      } catch {
        toast.error("Couldn't add to queue", "Please try again.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button className="h-auto p-4"><Upload className="mr-2 h-4 w-4" />Upload document</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a knowledge source</DialogTitle>
          <DialogDescription>Drop a file or connect a data source. It will enter the approval queue.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            {file ? file.name : "Click to choose a file, or drag and drop here"}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              if (selected) setError(null);
            }}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add to queue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Typecheck and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(app)/knowledge"
```

- [ ] **Step 6: Verify in the browser**

Upload a file, confirm it appears in the approval queue and the table, approve it, reload — confirm the approved status persisted.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/documents.ts "src/app/(app)/knowledge"
git commit -m "Migrate knowledge base documents domain to Supabase"
```

---

### Task 9: Admin domain (users, invites, roles, security policies, org settings, audit log)

**Files:**
- Create: `src/lib/db/admin.ts`
- Create: `src/app/(app)/admin/actions.ts`
- Modify: `src/app/(app)/admin/page.tsx`
- Modify: `src/app/(app)/admin/users-workspace.tsx`
- Modify: `src/app/(app)/admin/invite-user-dialog.tsx`
- Modify: `src/app/(app)/admin/roles-permissions.tsx`
- Modify: `src/app/(app)/admin/security-policies.tsx`
- Modify: `src/app/(app)/admin/organization-settings.tsx`
- Modify: `src/app/(app)/admin/audit-log-table.tsx`
- No change: `src/app/(app)/admin/users-table.tsx` (already prop-driven)

**Interfaces:**
- Consumes: `createClient()`, `createAdminClient()`, `getCurrentProfile()`, `logAudit()` (Task 1); `getPermissions()`, `getUsageSeries()`, `getAgentCosts()` (unchanged).

- [ ] **Step 1: Write the read layer**

Write `src/lib/db/admin.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { getPermissions as getPermissionCatalog } from "@/lib/mock-data/admin";
import type { AuditLogEntry, OrgUser, RolePermissions } from "@/lib/mock-data/types";

const ROLES = ["Admin", "Manager", "Operator", "Viewer"] as const;

export async function getOrgUsers(orgId: string): Promise<OrgUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, status")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrgUser[];
}

export async function getOrgRolePermissions(orgId: string): Promise<RolePermissions[]> {
  const supabase = await createClient();
  const [catalog, { data: rows }] = await Promise.all([
    getPermissionCatalog(),
    supabase.from("role_permissions").select("role, permission_key, allowed").eq("org_id", orgId),
  ]);

  const byRole = new Map<string, Record<string, boolean>>(ROLES.map((r) => [r, {}]));
  for (const row of rows ?? []) {
    const perms = byRole.get(row.role);
    if (perms) perms[row.permission_key] = row.allowed;
  }

  return ROLES.map((role) => ({
    role,
    permissions: Object.fromEntries(catalog.map((p) => [p.key, byRole.get(role)?.[p.key] ?? false])),
  }));
}

export async function getOrgSecurityPolicies(orgId: string): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase.from("security_policies").select("policy_key, enabled").eq("org_id", orgId);
  const defaults: Record<string, boolean> = { mfa: true, sso: false, "session-timeout": true, ip: false };
  for (const row of data ?? []) defaults[row.policy_key] = row.enabled;
  return defaults;
}

export async function getOrgSettings(orgId: string): Promise<{ orgName: string; timezone: string; locale: string }> {
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("name, timezone, locale").eq("id", orgId).single();
  return { orgName: data?.name ?? "", timezone: data?.timezone ?? "America/New_York", locale: data?.locale ?? "en-US" };
}

export async function getOrgAuditLogs(orgId: string): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_name, action, resource, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    actor: row.actor_name,
    action: row.action,
    resource: row.resource,
    timestamp: row.created_at,
  }));
}
```

- [ ] **Step 2: Write the Server Actions**

Write `src/app/(app)/admin/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/db/profile";
import { logAudit } from "@/lib/db/audit";
import type { UserRole, UserStatus } from "@/lib/mock-data/types";

export async function inviteUser(name: string, email: string, role: UserRole) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { signup_type: "invited", org_id: profile.orgId, role, name },
  });
  if (error) throw new Error(error.message);

  const supabase = await createClient();
  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Invited user", resource: email });
  revalidatePath("/admin");
}

export async function setUserRole(userId: string, role: UserRole, userName: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: `Changed role to ${role}`, resource: userName });
  revalidatePath("/admin");
}

export async function setUserStatus(userId: string, status: UserStatus, userName: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId).eq("org_id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    orgId: profile.orgId,
    actorName: profile.name,
    action: `Changed user status to ${status}`,
    resource: userName,
  });
  revalidatePath("/admin");
}

export async function toggleRolePermission(role: UserRole, permissionKey: string, nextAllowed: boolean) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("role_permissions")
    .upsert(
      { org_id: profile.orgId, role, permission_key: permissionKey, allowed: nextAllowed },
      { onConflict: "org_id,role,permission_key" },
    );
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Updated role permissions", resource: role });
  revalidatePath("/admin");
}

export async function setSecurityPolicy(policyKey: string, enabled: boolean) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase
    .from("security_policies")
    .upsert({ org_id: profile.orgId, policy_key: policyKey, enabled }, { onConflict: "org_id,policy_key" });
  if (error) throw new Error(error.message);

  await logAudit(supabase, {
    orgId: profile.orgId,
    actorName: profile.name,
    action: enabled ? "Enabled security policy" : "Disabled security policy",
    resource: policyKey,
  });
  revalidatePath("/admin");
}

export async function updateOrgSettings(orgName: string, timezone: string, locale: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { error } = await supabase.from("organizations").update({ name: orgName, timezone, locale }).eq("id", profile.orgId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, { orgId: profile.orgId, actorName: profile.name, action: "Updated organization settings", resource: orgName });
  revalidatePath("/admin");
}
```

- [ ] **Step 3: Rewrite the page**

Replace `src/app/(app)/admin/page.tsx`:

```tsx
import { getUsageSeries, getAgentCosts, getPermissions } from "@/lib/mock-data/admin";
import { PageHeader } from "@/components/shared/page-header";
import { DragScrollX } from "@/components/shared/drag-scroll-x";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersWorkspace } from "./users-workspace";
import { AuditLogTable } from "./audit-log-table";
import { RolesPermissions } from "./roles-permissions";
import { AiUsageMonitoring } from "./ai-usage";
import { SecurityPolicies } from "./security-policies";
import { OrganizationSettings } from "./organization-settings";
import { getCurrentProfile } from "@/lib/db/profile";
import {
  getOrgUsers,
  getOrgRolePermissions,
  getOrgSecurityPolicies,
  getOrgSettings,
  getOrgAuditLogs,
} from "@/lib/db/admin";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  const [permissions, usage, costs, users, rolePermissions, securityPolicies, orgSettings, auditLogs] = await Promise.all([
    getPermissions(),
    getUsageSeries(),
    getAgentCosts(),
    profile ? getOrgUsers(profile.orgId) : Promise.resolve([]),
    profile ? getOrgRolePermissions(profile.orgId) : Promise.resolve([]),
    profile ? getOrgSecurityPolicies(profile.orgId) : Promise.resolve({}),
    profile ? getOrgSettings(profile.orgId) : Promise.resolve({ orgName: "", timezone: "", locale: "" }),
    profile ? getOrgAuditLogs(profile.orgId) : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title="Administration" description="Manage users, security policies, and system settings." />

      <Tabs defaultValue="users">
        <DragScrollX>
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security Policies</TabsTrigger>
            <TabsTrigger value="usage">AI Usage Monitoring</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>
        </DragScrollX>

        <TabsContent value="users">
          <UsersWorkspace users={users} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesPermissions permissions={permissions} rolePermissions={rolePermissions} />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogTable logs={auditLogs} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityPolicies policies={securityPolicies} />
        </TabsContent>

        <TabsContent value="usage">
          <AiUsageMonitoring usage={usage} costs={costs} />
        </TabsContent>

        <TabsContent value="settings">
          <OrganizationSettings settings={orgSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite the users workspace and invite dialog**

Replace `src/app/(app)/admin/users-workspace.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { InviteUserDialog } from "./invite-user-dialog";
import { UsersTable } from "./users-table";
import { toast } from "@/lib/toast";
import { setUserRole, setUserStatus } from "./actions";
import type { OrgUser, UserRole, UserStatus } from "@/lib/mock-data/types";

export function UsersWorkspace({ users }: { users: OrgUser[] }) {
  const [, startTransition] = useTransition();

  function handleRoleChange(id: string, role: UserRole) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    startTransition(async () => {
      try {
        await setUserRole(id, role, user.name);
        toast.success("Role updated", `${user.name} is now ${role}.`);
      } catch {
        toast.error("Couldn't update role", "Please try again.");
      }
    });
  }

  function handleStatusChange(id: string, status: UserStatus) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    startTransition(async () => {
      try {
        await setUserStatus(id, status, user.name);
        toast.success("Status updated", `${user.name} is now ${status}.`);
      } catch {
        toast.error("Couldn't update status", "Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteUserDialog />
      </div>
      <UsersTable users={users} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} />
    </div>
  );
}
```

Replace `src/app/(app)/admin/invite-user-dialog.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
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
import { toast } from "@/lib/toast";
import { inviteUser } from "./actions";
import type { UserRole } from "@/lib/mock-data/types";

const ROLES: UserRole[] = ["Admin", "Manager", "Operator", "Viewer"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteUserDialog() {
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Viewer");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleInvite() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const nextNameError = !trimmedName ? "Name is required." : null;
    const nextEmailError = !trimmedEmail
      ? "Email is required."
      : !EMAIL_PATTERN.test(trimmedEmail)
        ? "Enter a valid email address."
        : null;

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    if (nextNameError || nextEmailError) return;

    startTransition(async () => {
      try {
        await inviteUser(trimmedName, trimmedEmail, role);
        toast.success("Invitation sent", `${trimmedEmail} has been invited as ${role}.`);
        setName("");
        setEmail("");
        setRole("Viewer");
        setNameError(null);
        setEmailError(null);
        setOpen(false);
      } catch {
        toast.error("Couldn't send invitation", "Please try again.");
      }
    });
  }

  return (
    <>
      <Button size="sm" className="h-auto p-4 text-[14px]" onClick={() => setOpen(true)}>
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
              <Input
                id="invite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={nameError ? true : undefined}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={emailError ? true : undefined}
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
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

- [ ] **Step 5: Rewrite roles, security policies, org settings, and audit log**

Replace `src/app/(app)/admin/roles-permissions.tsx`:

```tsx
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
```

Replace `src/app/(app)/admin/security-policies.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { setSecurityPolicy } from "./actions";

const POLICIES = [
  { id: "mfa", label: "Require multi-factor authentication" },
  { id: "sso", label: "Require single sign-on" },
  { id: "session-timeout", label: "Automatically sign out after 30 minutes of inactivity" },
  { id: "ip", label: "Restrict access by IP allowlist" },
] as const;

export function SecurityPolicies({ policies }: { policies: Record<string, boolean> }) {
  const [, startTransition] = useTransition();

  function handleChange(id: string, label: string, checked: boolean) {
    startTransition(async () => {
      try {
        await setSecurityPolicy(id, checked);
        toast.success(checked ? "Policy enabled" : "Policy disabled", label);
      } catch {
        toast.error("Couldn't update policy", "Please try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Policies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {POLICIES.map((policy) => (
          <div key={policy.id} className="flex items-center justify-between">
            <Label htmlFor={policy.id}>{policy.label}</Label>
            <Switch
              id={policy.id}
              checked={policies[policy.id] ?? false}
              onCheckedChange={(checked) => handleChange(policy.id, policy.label, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

Replace `src/app/(app)/admin/organization-settings.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { updateOrgSettings } from "./actions";

const LOCALE_PATTERN = /^[a-z]{2}-[A-Z]{2}$/;
const TIMEZONE_PATTERN = /^[A-Za-z_]+\/[A-Za-z_]+$/;

export function OrganizationSettings({ settings }: { settings: { orgName: string; timezone: string; locale: string } }) {
  const [, startTransition] = useTransition();
  const [orgName, setOrgName] = useState(settings.orgName);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [locale, setLocale] = useState(settings.locale);
  const [errors, setErrors] = useState<{ orgName?: string; timezone?: string; locale?: string }>({});

  function handleSave() {
    const nextErrors: typeof errors = {};
    if (!orgName.trim()) nextErrors.orgName = "Organization name is required.";
    if (!TIMEZONE_PATTERN.test(timezone.trim())) nextErrors.timezone = "Use IANA format, e.g. America/New_York.";
    if (!LOCALE_PATTERN.test(locale.trim())) nextErrors.locale = "Use locale format, e.g. en-US.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Couldn't save settings", "Fix the highlighted fields and try again.");
      return;
    }

    startTransition(async () => {
      try {
        await updateOrgSettings(orgName.trim(), timezone.trim(), locale.trim());
        toast.success("Settings saved", "Organization settings have been updated.");
      } catch {
        toast.error("Couldn't save settings", "Please try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Organization Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            aria-invalid={errors.orgName ? true : undefined}
          />
          {errors.orgName && <p className="text-xs text-destructive">{errors.orgName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            aria-invalid={errors.timezone ? true : undefined}
          />
          {errors.timezone && <p className="text-xs text-destructive">{errors.timezone}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="default-locale">Default locale</Label>
          <Input
            id="default-locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-invalid={errors.locale ? true : undefined}
          />
          {errors.locale && <p className="text-xs text-destructive">{errors.locale}</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save changes</Button>
      </CardFooter>
    </Card>
  );
}
```

Replace `src/app/(app)/admin/audit-log-table.tsx` (this reverts to the exact prop-driven shape it had before the client store existed — just drop the `useAppStore()` call and take `logs` as a prop):

```tsx
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
```

- [ ] **Step 6: Typecheck and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(app)/admin"
```

- [ ] **Step 7: Verify in the browser**

Change a user's role and status — confirm they persist after reload. Toggle a role permission checkbox and a security policy switch — confirm both persist. Save organization settings with a new name — confirm it persists. Send a real invite to an email you control — confirm the invite email arrives and confirm a `status='invited'` profile row exists:

```bash
set -a && source .env.local && set +a
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=name,email,status&status=eq.invited" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Check the Audit Logs tab — every action just taken (role change, status change, permission toggle, policy toggle, org settings save, invite) should appear as a real entry.

- [ ] **Step 8: Commit**

```bash
git add src/lib/db/admin.ts "src/app/(app)/admin"
git commit -m "Migrate admin domain (users, roles, security, org settings, audit log) to Supabase"
```

---

### Task 10: Dashboard wiring

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/dashboard/dashboard-content.tsx`

**Interfaces:**
- Consumes: `getCurrentProfile()` (Task 1), `getWorkflows()` (Task 5), `getDeployedAgents()` (Task 6).

- [ ] **Step 1: Rewrite the page**

Replace `src/app/(app)/dashboard/page.tsx`:

```tsx
import { getActivityFeed, getAlerts, getKpis, getRevenueSeries, getWorkflowHealthSeries } from "@/lib/mock-data/dashboard";
import { DashboardContent } from "./dashboard-content";
import { getCurrentProfile } from "@/lib/db/profile";
import { getDeployedAgents } from "@/lib/db/agents";
import { getWorkflows } from "@/lib/db/workflows";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [{ welcome }, kpis, activity, alerts, revenue, workflowHealth, profile] = await Promise.all([
    searchParams,
    getKpis(),
    getActivityFeed(),
    getAlerts(),
    getRevenueSeries(),
    getWorkflowHealthSeries(),
    getCurrentProfile(),
  ]);

  const [workflows, deployedAgents] = profile
    ? await Promise.all([getWorkflows(profile.orgId), getDeployedAgents(profile.orgId)])
    : [[], []];

  return (
    <DashboardContent
      welcome={welcome === "1"}
      kpis={kpis}
      activity={activity}
      alerts={alerts}
      revenue={revenue}
      workflowHealth={workflowHealth}
      workflowCount={workflows.length}
      deployedAgents={deployedAgents}
    />
  );
}
```

- [ ] **Step 2: Rewrite the content component**

Replace `src/app/(app)/dashboard/dashboard-content.tsx`:

```tsx
"use client";

import Link from "next/link";
import { AlertTriangle, Bot, CheckCircle2, PiggyBank, Sparkles, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentIcon } from "@/components/shared/agent-icon";
import type { IconChipVariant } from "@/components/shared/icon-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart, WorkflowHealthChart } from "./charts";
import { WelcomeToast } from "./welcome-toast";
import type { Agent, ActivityItem, AlertItem, ChartPoint, KpiMetric } from "@/lib/mock-data/types";
import type { LucideIcon } from "lucide-react";

const KPI_PRESENTATION: Record<string, { icon: LucideIcon; variant: IconChipVariant }> = {
  "active-agents": { icon: Bot, variant: "primary" },
  "tasks-automated": { icon: CheckCircle2, variant: "success" },
  "avg-response": { icon: Zap, variant: "info" },
  "cost-saved": { icon: PiggyBank, variant: "warning" },
};

const EMPTY_KPIS: KpiMetric[] = [
  { id: "active-agents", label: "Active Agents", value: "0", delta: 0, trend: "flat" },
  { id: "tasks-automated", label: "Tasks Automated (30d)", value: "0", delta: 0, trend: "flat" },
  { id: "avg-response", label: "Avg Response Time", value: "—", delta: 0, trend: "flat" },
  { id: "cost-saved", label: "Est. Cost Saved (30d)", value: "$0", delta: 0, trend: "flat" },
];

function EmptyCardState({ message }: { message: string }) {
  return <p className="flex h-full min-h-32 items-center justify-center text-center text-sm text-muted-foreground">{message}</p>;
}

export function DashboardContent({
  welcome,
  kpis,
  activity,
  alerts,
  revenue,
  workflowHealth,
  workflowCount,
  deployedAgents,
}: {
  welcome: boolean;
  kpis: KpiMetric[];
  activity: ActivityItem[];
  alerts: AlertItem[];
  revenue: ChartPoint[];
  workflowHealth: ChartPoint[];
  workflowCount: number;
  deployedAgents: Agent[];
}) {
  const hasContent = workflowCount > 0 || deployedAgents.length > 0;

  const displayedKpis = hasContent
    ? kpis.map((kpi) => (kpi.id === "active-agents" ? { ...kpi, value: String(deployedAgents.length) } : kpi))
    : EMPTY_KPIS;

  return (
    <div className="space-y-6">
      <WelcomeToast show={welcome} />
      <PageHeader title="Executive Dashboard" description="Real-time overview of your organization's AI operations." />

      {!hasContent && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Your workspace is empty</p>
                <p className="text-sm text-muted-foreground">
                  Create your first automation to start seeing agents, activity, and metrics here.
                </p>
              </div>
            </div>
            <Button size="sm" nativeButton={false} render={<Link href="/workflows" />}>
              Create your first automation
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayedKpis.map((kpi) => {
          const presentation = KPI_PRESENTATION[kpi.id] ?? { icon: Bot, variant: "primary" as const };
          return <StatCard key={kpi.id} metric={kpi} icon={presentation.icon} variant={presentation.variant} />;
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[437fr_437fr_284fr]">
        {!hasContent ? (
          <>
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-sm">Revenue Impact</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <EmptyCardState message="No data yet — revenue impact appears once agents start completing tasks." />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-sm">Workflow Success Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <EmptyCardState message="No data yet — create a workflow to start tracking success rate." />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <RevenueChart data={revenue} />
            <WorkflowHealthChart data={workflowHealth} />
          </>
        )}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasContent ? (
              <EmptyCardState message="No alerts yet." />
            ) : (
              alerts.map((alert) => (
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
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Agent Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deployedAgents.length === 0 ? (
              <EmptyCardState message="No agents yet — agents are created as part of an automation." />
            ) : (
              deployedAgents.map((agent) => (
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
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">AI Activity</CardTitle>
          </CardHeader>
          <CardContent className="mt-1.5 space-y-6">
            {!hasContent ? (
              <EmptyCardState message="No activity yet." />
            ) : (
              activity.map((item) => (
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
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(app)/dashboard"
```

- [ ] **Step 4: Verify in the browser**

Log in as the demo account (Task 4) — dashboard should show Active Agents = 11, full canned charts/activity/alerts, and an Agent Status list of all 11 agents. Log in as a fresh account with one workflow — Active Agents should equal the number of agents that workflow deployed, and the empty-workspace banner should be gone.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx" "src/app/(app)/dashboard/dashboard-content.tsx"
git commit -m "Wire dashboard KPIs and agent status to real Supabase data"
```

---

### Task 11: Final cleanup, full verification, and deploy

**Files:**
- Delete: `src/lib/store/app-store.tsx`
- Modify: any remaining file still importing `useAppStore` or `@/lib/store/app-store` (should be none after Tasks 5–10; this step is the safety net)
- Modify: `src/app/(app)/layout.tsx` (stop seeding the store — it no longer exists)

**Interfaces:** None new — this task only removes dead code and verifies the whole system end-to-end.

- [ ] **Step 1: Confirm nothing still references the store**

```bash
cd "/Users/ren/Desktop/Projects 2/NexxaByte Agentic AI Solutions (GaaS) V2"
grep -rln "app-store\|useAppStore" src/ || echo "No references found"
```

Expected: `No references found`. If anything shows up, it's a file Tasks 5–10 missed — fix it before continuing (apply the same pattern: props from the server + Server Action calls in place of the store).

- [ ] **Step 2: Rewrite the layout**

Replace `src/app/(app)/layout.tsx`:

```tsx
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { SidebarCollapseProvider } from "@/components/shell/sidebar-context";
import { getAlerts } from "@/lib/mock-data/dashboard";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const notifications = await getAlerts();

  return (
    <SidebarCollapseProvider>
      <div className="flex min-h-screen flex-col">
        <Topbar notifications={notifications} />
        <div className="flex flex-1 gap-6 p-6">
          <Sidebar />
          <main className="mx-auto w-full min-w-0 max-w-[1200px] flex-1">{children}</main>
        </div>
      </div>
    </SidebarCollapseProvider>
  );
}
```

- [ ] **Step 3: Delete the store**

```bash
rm -rf src/lib/store
```

- [ ] **Step 4: Full typecheck, lint, and build**

```bash
npx tsc --noEmit
npx eslint src
rm -rf .next
npm run build
```

Expected: all three clean, build succeeds with every route still listed.

- [ ] **Step 5: Comprehensive Playwright walkthrough**

Using the dev server, verify each of these in a real browser (matching the manual testing approach used for every prior feature in this codebase):

1. Sign up with a brand-new email → redirected to `/dashboard?welcome=1` → empty-state banner and zeroed KPIs shown.
2. Create a workflow assigning an agent → agent appears in AI Agent Console and Dashboard Agent Status with fresh (zeroed) stats, workflow status dropdown works.
3. Connect an integration, add a webhook → both persist across a full page reload.
4. Upload a document → appears in the approval queue → approve it → status persists after reload.
5. Invite a user (use a real email you control) → confirm the invite email arrives → the invited profile shows `status: invited` in the Users table.
6. Change a user's role and status → both persist after reload; confirm corresponding audit log entries appear.
7. Toggle a role permission checkbox and a security policy switch → both persist.
8. Save organization settings with a new name → persists, and the org name change is reflected wherever it's shown.
9. Log out, log back in with the same account → every change from steps 2–8 is still there (this is the real end-to-end proof the localStorage architecture is gone — nothing here depends on the browser's local storage anymore).
10. Log in as the seeded demo account (`demo@nexxabyte.com`) → full populated dashboard, 11 agents, 4 workflows, 8 users, connected integrations, documents, matching today's canned experience.

- [ ] **Step 6: Add environment variables to Vercel**

```bash
cd "/Users/ren/Desktop/Projects 2/NexxaByte Agentic AI Solutions (GaaS) V2"
set -a && source .env.local && set +a
echo "$NEXT_PUBLIC_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "$SUPABASE_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "$DEMO_ACCOUNT_PASSWORD" | vercel env add DEMO_ACCOUNT_PASSWORD production
```

- [ ] **Step 7: Commit and deploy**

```bash
git add -A
git commit -m "Remove app-store.tsx; the Supabase backend migration is complete"
git push v2 main
vercel --prod --yes
```

- [ ] **Step 8: Verify the production deploy**

Repeat the signup → create workflow → logout/login round trip from Step 5 against the live `https://nexxabyte-ai-workflow-v2.vercel.app` URL to confirm the production environment variables are wired correctly.

---

## Self-Review Notes

- **Spec coverage:** every table from the spec's data model is created in Task 2; `org_settings` was folded directly into the `organizations` table (name/timezone/locale) rather than a separate table, since a separate table would have duplicated the same three columns for no benefit — this is noted here as an intentional, minor refinement of the original spec, not a deviation from its intent.
- **Type consistency:** `agent_key` / `integration_key` / `permission_key` naming is consistent across every task that touches those tables. `getCurrentProfile()`'s returned shape (`id, orgId, name, email, role, status`) is used identically in every Server Action across Tasks 5–10.
- **No placeholders:** every step contains complete, runnable code or an exact command — verified by re-reading each task above.
