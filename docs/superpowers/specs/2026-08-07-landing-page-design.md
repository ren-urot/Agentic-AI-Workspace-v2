# Investor/Demo Pitch Landing Page

Date: 2026-08-07
Status: Approved

## Purpose

The app currently has no public-facing page: `/` blindly redirects to `/dashboard`,
and unauthenticated visitors hitting any route (including `/`) are bounced to
`/login` by middleware. There is nothing to show an investor or prospect who
doesn't already have credentials.

This adds a static marketing/pitch page at `/` that sells the platform (the
enterprise agentic AI operations product described in
[`2026-08-02-product-platform-design.md`](2026-08-02-product-platform-design.md))
to an outside audience, with a "Book a demo" CTA. Existing users are unaffected:
`/login` and `/signup` behave exactly as they do today, and anyone with a session
is redirected straight past the pitch page to `/dashboard`.

## Goals

- Unauthenticated visitors to `/` see a real pitch page instead of being bounced
  to `/login`.
- Authenticated visitors to `/` still land on `/dashboard`, unchanged from today.
- Page pitches the product accurately: content is grounded in the six modules
  already built (Executive Dashboard, AI Agent Console, Knowledge Base, Workflow
  Builder, Integration Center, Administration). No fabricated metrics, customer
  logos, testimonials, or team bios.
- Primary CTA is a `mailto:inquiry@nexxabyte.com` link ("Book a demo" /
  "Talk to us"). Secondary CTA is "Sign in" linking to `/login`.
- Visually consistent with the rest of the app: existing design tokens
  (`--primary: #F05223`, Geist font, shadcn/ui), works in light and dark mode.

## Non-Goals

- No self-serve signup flow from this page (the existing `/signup` route serves a
  different purpose — org creation post-invite — and isn't linked from here).
- No new dependencies, no contact form/backend, no analytics wiring.
- No real traction data — this is a pre-revenue/demo product; the page must not
  imply real customers or metrics that don't exist.

## Routing Changes

`src/middleware.ts`:
- Add `/` to the set of paths that are exempt from the "no session → redirect to
  `/login`" rule (alongside `/login` and `/signup`).
- Add a new rule: if a session *does* exist and the path is exactly `/`, redirect
  to `/dashboard` — mirroring the existing behavior for `/login`/`/signup` when a
  session is present.

`src/app/page.tsx`:
- Remove the unconditional `redirect("/dashboard")`.
- Render the new landing page. Because middleware already redirects authenticated
  visitors away from `/`, this component only ever renders for signed-out
  visitors — no auth check needed inside it.

## Content & Components

New directory `src/components/landing/`, composed by `src/app/page.tsx` in this
order:

1. **`nav-bar.tsx`** — NexxaByte logo (`/nexxabyte-logo.svg`), "Sign in" link
   (→ `/login`), primary "Book a demo" button (mailto CTA).
2. **`hero.tsx`** — Headline + subheadline pitching the platform as a unified
   enterprise agentic AI operations product. Primary CTA (Book a demo, mailto)
   and secondary CTA (Sign in, → `/login`).
3. **`problem-solution.tsx`** — Short framing section: the problem (fragmented AI
   tooling, manual oversight, no unified operations layer) and the solution
   (one platform for agents, knowledge, workflows, integrations, and admin
   governance).
4. **`product-tour.tsx`** — Six feature cards, one per existing module, each with
   a `lucide-react` icon and copy grounded in what's actually built:
   - Executive Dashboard — KPIs, activity feed, agent status, alerts
   - AI Agent Console — roster of AI "employees" (Sales, Support, HR, etc.),
     prompt config, tool permissions, memory, performance monitoring
   - Knowledge Base — document management, semantic search, approval queue
   - Workflow Builder — visual canvas for agent-driven automations
   - Integration Center — CRM/ERP/communication/identity connections
   - Administration — users, roles & permissions, audit logs, security policies,
     usage monitoring
5. **`final-cta.tsx`** — Repeats the "Book a demo" mailto CTA as a closing band.
6. **`footer.tsx`** — Logo, © NexxaByte, Sign in link, contact email.

All content is static JSX (no data fetching, no client state beyond what
shadcn/ui components need internally). Built from existing `Button`/`Card`
components in `src/components/ui/` and existing design tokens in
`src/app/globals.css` — no new dependencies. Responsive (mobile → desktop) and
themed via the existing `next-themes` `ThemeProvider`.

## Testing / Verification

No automated tests (consistent with the rest of the frontend-only phase).
Verification: `tsc --noEmit` and `next build` pass cleanly; manual walkthrough
of `/` signed-out (desktop + mobile viewport, light + dark mode), and confirm
signed-in visitors hitting `/` still land on `/dashboard`.
