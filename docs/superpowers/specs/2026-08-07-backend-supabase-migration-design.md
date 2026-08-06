# Real Backend: Supabase Migration (Phase 1 — DB + Auth Foundation)

Date: 2026-08-07
Status: Approved
Source: Follow-up to `2026-08-02-product-platform-design.md`, which explicitly deferred
"Real authentication / RBAC", "Real database or persistence", and "Real AI/LLM calls"
to a later phase. This spec is that phase — minus the AI/LLM part, which is its own
separate future phase (see Decomposition below).

## Purpose

Replace the current mock-data + client-side `localStorage` architecture
(`src/lib/store/app-store.tsx`) with a real backend: a real Postgres database, real
user accounts, and real organization-scoped data, so that data persists across
devices/browsers and access is enforced by the database itself rather than a
forgeable client cookie.

## Decomposition

The original ask ("start building the backend and use OpenAI") bundles three
independent subsystems. This spec covers only the first:

1. **DB + auth foundation** — this spec.
2. Real OpenAI-powered agent conversations — deferred. There is currently no chat/
   conversation UI anywhere in the app (agents only have a static `systemPrompt`
   field), so this requires its own design pass for the interaction surface, not
   just an API swap. Also deliberately deferred so the OpenAI key involved is
   configured carefully as a server-only secret, not rushed in alongside a large
   database migration.
3. Realtime cross-tab/cross-device sync (Supabase Realtime) — deferred fast-follow
   once this foundation is solid. Noted in the security/caching review as a real
   gap (`app-store.tsx` has no `storage` event listener), but out of scope here to
   keep this phase's blast radius contained.

## Goals

- Every domain currently in `src/lib/mock-data/*.ts` and `app-store.tsx` — workflows,
  agent deployments, integrations, webhooks, users, documents, role permissions,
  security policies, org settings, audit logs — is backed by real Postgres tables.
- Real authentication via Supabase Auth: real password verification, real sessions,
  real password-reset, real invite emails. The "any email/password works" mock login
  is removed.
- Multi-tenancy enforced by the database itself (Postgres Row-Level Security), not by
  application code trusting a cookie value.
- The existing "populated demo" experience (a prospect can explore a fully-populated
  org without signing up) is preserved via one seeded demo account, not by faking auth.
- No behavior regression for anything already built: wizard flow, status dropdowns,
  empty states for new orgs, dashboard KPIs, the works.

## Non-Goals (this phase)

- Real OpenAI/LLM calls or any chat interface (Phase 2, separate spec).
- Realtime multi-tab sync (fast-follow, separate spec).
- Automated test suite — this project has none by design (see original spec); this
  phase keeps that stance and relies on manual Playwright-driven verification, as
  every feature this session has been.
- Billing, SSO, MFA (the security-policy toggles for these remain UI-only switches,
  same as today — no actual SSO/MFA provider wired in).

## Tech Stack Additions

- **Supabase**: managed Postgres + Auth + (implicitly available) Storage, in one
  service. Chosen over separate Postgres+Auth.js or hand-rolled auth because it's the
  least code for the most correctness — real password hashing, session management,
  and transactional invite emails all come for free.
- `@supabase/ssr` for server-side session handling in Next.js App Router (Server
  Components, Server Actions, and middleware).
- No ORM. Supabase's generated TypeScript types (`supabase gen types typescript`)
  plus its JS client give type-safe queries without adding Prisma/Drizzle as an
  extra layer — the client already speaks directly to RLS-protected Postgres.

## Architecture

- **Reads**: every `page.tsx` under `src/app/(app)/` returns to being an `async`
  Server Component, querying Postgres via a new `src/lib/db/*.ts` layer (one file per
  domain, mirroring today's `src/lib/mock-data/*.ts` file layout) built on a Supabase
  server client scoped to the request's session.
- **Writes**: every mutation becomes a Server Action (`"use server"`), matching the
  existing `login`/`signup`/`logout` pattern already in the codebase. Each Server
  Action: (1) gets the caller's session + org via Supabase, (2) performs the write,
  relying on RLS as the enforcement layer, (3) calls `revalidatePath()` so the
  triggering page re-fetches fresh data on next render.
- **Removed**: `src/lib/store/app-store.tsx` and every `useAppStore()` call site.
  Client "workspace" components (`workflows-workspace.tsx`, `integrations-workspace.tsx`,
  etc.) keep their local UI state (dialog open/closed, form fields) but call Server
  Actions instead of store setters, and receive their initial data as props from the
  Server Component parent instead of from context.
- **Security boundary**: Postgres RLS, not application code. Every table's policy is
  shaped like `org_id = (select org_id from profiles where id = auth.uid())`. This
  directly fixes the "unsigned, forgeable session cookie" finding from the earlier
  security review — even a forged identity can't read another org's rows, because the
  database itself checks `auth.uid()` against a real, signed Supabase session.

## Data Model

Static reference data — the 11-agent catalog (name/description/type/icon/default
system prompt), the 10-integration catalog (name/description/category), and the 6
permission definitions — **stays as TypeScript constants**, exactly as it is today in
`src/lib/mock-data/agents.ts` / `integrations.ts` / `admin.ts`. It never varies per
org, so duplicating it into the database would just be denormalization for no benefit.
Only per-org, mutable state becomes tables.

```
organizations
  id            uuid pk
  name          text
  timezone      text
  locale        text
  created_at    timestamptz

profiles                         -- one row per Supabase auth.users, extended
  id            uuid pk refs auth.users(id)
  org_id        uuid refs organizations(id)
  name          text
  email         text
  role          text             -- 'Admin' | 'Manager' | 'Operator' | 'Viewer'
  status        text             -- 'active' | 'invited' | 'disabled'
  created_at    timestamptz

agent_deployments
  id                    uuid pk
  org_id                uuid refs organizations(id)
  agent_key             text     -- references the static catalog, e.g. "sales"
  status                text     -- 'active' | 'idle' | 'error'
  tasks_completed       int
  success_rate          int
  avg_latency_ms        int
  last_active           timestamptz
  system_prompt         text     -- null = use catalog default
  tool_permissions      jsonb
  short_term_memory     jsonb
  long_term_memory      jsonb
  performance           jsonb    -- 7-point chart series
  deployed_at           timestamptz
  unique (org_id, agent_key)

workflows
  id            uuid pk
  org_id        uuid refs organizations(id)
  name          text
  status        text             -- 'active' | 'draft' | 'paused'
  last_run      timestamptz
  success_rate  int
  created_at    timestamptz

workflow_agents               -- many-to-many
  workflow_id   uuid refs workflows(id)
  agent_key     text

integrations
  id            uuid pk
  org_id        uuid refs organizations(id)
  integration_key text          -- references the static catalog
  status        text             -- 'connected' | 'disconnected' | 'error'
  unique (org_id, integration_key)

webhooks
  id            uuid pk
  org_id        uuid refs organizations(id)
  url           text
  event         text
  created_at    timestamptz

documents
  id            uuid pk
  org_id        uuid refs organizations(id)
  name          text
  source_type   text
  version       int
  status        text             -- 'approved' | 'pending' | 'rejected'
  updated_at    timestamptz
  keywords      text[]

role_permissions
  org_id        uuid refs organizations(id)
  role          text
  permission_key text
  allowed       boolean
  primary key (org_id, role, permission_key)

security_policies
  org_id        uuid refs organizations(id)
  policy_key    text
  enabled       boolean
  primary key (org_id, policy_key)

org_settings
  org_id        uuid pk refs organizations(id)
  org_name      text
  timezone      text
  locale        text

audit_logs
  id            uuid pk
  org_id        uuid refs organizations(id)
  actor_name    text
  action        text
  resource      text
  created_at    timestamptz
```

Every table (except `organizations` itself, gated via `profiles`) has an RLS policy
restricting `SELECT`/`INSERT`/`UPDATE`/`DELETE` to rows whose `org_id` matches the
caller's own `org_id`, looked up from `profiles` by `auth.uid()`.

## Auth & the Demo Account

- **Signup**: Supabase Auth creates the `auth.users` row. A Postgres trigger on that
  table creates the matching `organizations` row and a `profiles` row
  (`role='Admin'`, `status='active'`) — this replicates today's "you're the first
  Admin for a new org" signup flow, now backed by a real account.
- **Login**: real password verification via Supabase Auth. The current "any
  email/password works" shortcut is removed.
- **Invite**: an admin's "Invite user" action is a Server Action that calls
  Supabase's Admin API `inviteUserByEmail()`. This creates a pending `auth.users` row
  and sends a real transactional email (Supabase's built-in sender, no separate email
  service needed) with a link to set a password. The `profiles` row starts
  `status='invited'` and flips to `'active'` once they complete setup.
- **Demo account**: one seeded organization + account (`demo@nexxabyte.com`)
  pre-populated via a one-time seed script with today's full canned dataset — 4
  workflows, all 11 agents deployed, 8 users, etc. Its password is generated at seed
  time and read from a `DEMO_ACCOUNT_PASSWORD` env var (server-only) — never
  hardcoded or committed — so the login page's "Try the demo" affordance can display
  it without the value living in source control.
- **Middleware**: `src/middleware.ts` swaps its current `SESSION_COOKIE` presence
  check for a real Supabase session check via `@supabase/ssr`'s middleware helper.

## Migration — What Changes

**Removed entirely:**
- `src/lib/store/app-store.tsx` and all `useAppStore()` call sites.
- The custom `SESSION_COOKIE` / `NEW_ORG_COOKIE` / `NEW_ORG_NAME_COOKIE` cookies and
  `isNewOrg()` / `getCurrentUser()` helpers in `src/lib/auth.ts`.
- The `get*()` functions in `src/lib/mock-data/*.ts` (dashboard/workflows/agents/
  integrations/knowledge/admin) — replaced by real queries.

**Kept as-is:**
- The static catalogs (agent templates, integration templates, permission
  definitions) — still plain TS constants.
- Every existing UI component (dropdowns, dialogs, tables, the automation wizard,
  empty states) — their shape and props don't need to change, only their data
  source and how mutations are triggered.

**Rewritten:**
- `src/app/login/actions.ts`, `src/app/signup/actions.ts` — call Supabase Auth
  instead of setting fake cookies.
- Every `page.tsx` under `src/app/(app)/` — async Server Components querying the new
  `src/lib/db/*.ts` layer instead of `mock-data`.
- Every `*-workspace.tsx` client component — Server Action calls instead of store
  setters; initial data passed as props instead of pulled from context.

## Error Handling

- Server Action failures surface through the existing `toast.error()` pattern already
  used throughout the app — no raw Postgres/Supabase error text is ever shown to a
  user.
- Auth-specific errors (wrong password, unverified/pending invite, duplicate signup
  email) map onto the existing `?error=` query-param pattern already used on
  `/login` and `/signup`, extended to cover the real Supabase Auth error codes.
- RLS-denied writes (shouldn't happen in normal use, but defensively) surface as a
  generic "Something went wrong" toast.

## Secrets

New environment variables, added to `.env.local` (already gitignored) and to the
Vercel project's Environment Variables — never committed, never pasted in chat:

- `NEXT_PUBLIC_SUPABASE_URL` — safe to expose to the client.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to expose; RLS is the actual protection.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used exclusively for admin operations
  like `inviteUserByEmail()`. Never sent to the client, never used inside a Client
  Component.

No `OPENAI_API_KEY` in this phase (Phase 2, deferred — see Decomposition). When that
phase happens, it will be a server-only secret used exclusively inside Server
Actions/Route Handlers.

## Testing

No automated test suite (matches this project's existing, deliberate stance). Verified
manually via the same Playwright-driven browser flow used throughout this project:
signup creates a real database row → log out → log back in → data resumes for real
(not localStorage-dependent) → CRUD spot-checks across every domain (workflow create/
status, integration connect/disconnect, invite user + confirm real email sent, role
change, security policy toggle, document upload/approve) → `tsc --noEmit` / `eslint` /
`next build` clean before every deploy, exactly as established this session.
