# Dashboard visual redesign — design spec

Date: 2026-08-05
Status: Approved

## Context

A Figma-exported mockup (`Dashboard.svg`, 1920×1206) specifies a new visual
direction for the app shell and dashboard page: a warm off-white page
background, a floating rounded sidebar card instead of an edge-to-edge bar,
pastel icon-chip stat cards, and a new circular logo mark. The mockup's text
is vector-outlined glyphs (not `<text>` elements), so literal label strings
could not be extracted from the file — content mapping below is inferred from
icon semantics, card layout, and the existing mock-data model, then confirmed
with the user directly.

There is an existing `dashboard-redesign` branch/worktree that started a
similar direction (icon-chip stat cards, sparklines, softer shell), but the
user chose to implement this fresh on `main` rather than continue that
branch, and to keep sidebar text labels (the mockup shows icon-only nav,
which the user overrode).

## Scope

- `src/app/globals.css` — token updates
- `src/components/shell/topbar.tsx` — new topbar
- `src/components/shell/sidebar.tsx` — floating card sidebar (desktop `Sidebar`; `MobileNav` gets equivalent color/logo updates but keeps its existing sheet/full-list pattern since the mockup has no mobile spec)
- `src/app/(app)/layout.tsx` — shell layout adjustments (page bg visible around floating sidebar, spacing)
- `src/app/(app)/dashboard/page.tsx` — row/card restructure
- New shared components: `IconChip` (pastel circular icon badge) and a restyled `StatCard`
- `public/` — new logo mark asset (inline SVG component, not a new file, to keep it themeable — see Logo mark section)

Out of scope: other pages (`agents`, `knowledge`, `workflows`, `integrations`,
`admin`) are not touched. Only the app shell (topbar + sidebar) and the
dashboard page change.

## Design tokens (`globals.css`)

Replace existing values (not additive):

| Token | Old | New |
|---|---|---|
| `--background` | `#f9f9f9` | `#EAEAEA` |
| `--primary` | `oklch(0.62 0.19 35)` (~`#de5d38`) | `#F05223` |
| `--radius` | `0.6696rem` (~10.7px card corners) | `0.9375rem` (15px card corners) |

Dark mode keeps its existing structure (`--background`, `--primary`, etc. in
`.dark`) but the light-mode primary hue shift means the dark-mode primary
should be adjusted to the same hue family (`oklch` equivalent of `#F05223`,
lightened for dark surfaces) — not left as the old `#de5d38`-derived value.

New icon-chip variant tokens (used by `IconChip` + `StatCard`, light mode;
existing `dark:` pattern in the codebase — see `IconChip` in the
`dashboard-redesign` branch for the established dark-mode approach of dimmer
saturated text on a low-opacity chip — is reused here since the mockup has no
dark-mode spec):

| Variant | Chip bg | Icon/line color |
|---|---|---|
| `primary` (orange) | `#FFE3CA` | `#F05223` |
| `success` (green) | `#C7F2CE` | `#00A424` (up-trend arrow: `#0A9803`) |
| `info` (periwinkle) | `#CACDFF` | `#235DF0` |
| `warning` (amber) | `#FFEBCA` | `#FF8D28` |

Down-trend arrow color: `#FF0000`. Sidebar active-row background: `#F4F4F4`.
Sidebar active accent bar: `#F05223`, 3px, flush to the card's right edge.

## Topbar

- Height 79px (was 64px), white background, `#D9D9D9` border-bottom (was
  default `border-b`).
- Left: new circular logo mark (55px, black circle `#231F20` bg with two
  offset orange `#F05223` chevron shapes forming an abstract split "X", with
  white cutout gaps) implemented as a small inline SVG component
  (`components/shared/brand-mark.tsx`), replacing the current
  `nexxabyte-logo.svg` `<Image>` + "NexxaByte" text. Sidebar-collapse toggle
  button sits beside it (desktop only — the current `Sidebar` component
  doesn't have a collapse toggle wired to the topbar today; the mockup pairs
  them, so the collapse button moves from the sidebar's own footer into the
  topbar, next to the logo).
- Center: no search bar (matches mockup — current topbar has none either, so
  no change here beyond removing the "NexxaByte Enterprise Workspace" text
  label, which the mockup doesn't show).
- Right: bell icon (notifications — keep existing `Bell` button, no
  functional change) + avatar. Avatar becomes a solid dark circle (use
  `bg-foreground`/near-black fill) rather than the current default
  `AvatarFallback` styling, to match the mockup's plain filled circle.
  Dropdown menu behavior (sign out, etc.) is unchanged.

## Sidebar

Convert `Sidebar` (desktop) from an edge-to-edge, full-viewport-height bar to
a **floating card**:

- Width 250px (was 256px/`w-64`), positioned with margin from the viewport
  edge (not `h-screen`/sticky-full-height) — sized to its content instead.
  Rounded 15px, white (`#FFFDFD`), drop shadow (soft, ~10px blur, 10% black
  — matches the mockup's `filter` def).
- The page's `#EAEAEA` background remains visible in the margin around the
  floating card (left, top, bottom), which is the main visual difference
  from today's flush sidebar.
- Same 6 `NAV_ITEMS` (Dashboard, AI Agent Console, Knowledge Base, Workflow
  Builder, Integration Center, Administration) — unchanged hrefs/icons.
  Icon + label kept (per user decision — mockup shows icon-only, overridden).
- Active item: `#F4F4F4` row background + 3px `#F05223` bar on the card's
  right inner edge (new visual treatment; today's active state is a solid
  `bg-primary` pill).
- Collapse/expand behavior is preserved, but the toggle button itself moves
  to the topbar (see above) rather than living in the sidebar's own footer.
- `MobileNav` (the `Sheet`-based mobile drawer) is NOT restructured into a
  floating-card look — it keeps its current full-sheet list pattern, since
  the mockup has no mobile treatment to follow. It does get the new logo
  mark and active-state colors for consistency.

## Dashboard page

Content container width is unchanged (`max-w-[1200px]`) — this already
matches the mockup's content span exactly (1200px), so no layout-width
change is needed, only row/card restructuring and spacing (`gap-4` →
`gap-5`, 20px, matching the mockup's card gaps throughout).

**Row 1 — KPI stat cards** (`grid-cols-4`, `gap-5`, cards ~200px tall):
reuse the existing `getKpis()` data (`active-agents`, `tasks-automated`,
`avg-response`, `cost-saved`) with a restyled `StatCard`:
top-left 53px `IconChip` (pastel circle), a thin divider line colored to
match the chip, the metric value, and a bottom-row colored trend
arrow + `delta%` (green up / red down — `avg-response`'s "down" trend is
green-favorable in the data but the mockup shows red for that card's
down-arrow, so trend color follows the mockup's literal color per card, not
a semantic good/bad judgment — i.e. down = red regardless of whether down is
favorable for that metric).

| KPI | Icon | Chip variant |
|---|---|---|
| Active Agents | `Bot` | primary (orange) |
| Tasks Automated | `CheckCircle2` | success (green) |
| Avg Response Time | `Zap` | info (periwinkle) |
| Cost Saved | `PiggyBank` | warning (amber) |

**Row 2 — 3 cards** (`grid-cols-[437fr_437fr_284fr]`-equivalent via
`lg:grid-cols-[1fr_1fr_0.65fr]` or explicit `lg:col-span`, `gap-5`, ~350px
tall): Revenue chart (existing `RevenueChart`) · Workflow Health chart
(existing `WorkflowHealthChart`) · **Alerts** (moved up from row 3, existing
`getAlerts()` data, narrow card).

**Row 3 — 2 cards** (`grid-cols-2`, `gap-5`, ~350px tall): **Agent Status**
(existing `getAgents()` list, full 590px width instead of 2/3) ·
**AI Activity** (existing `getActivityFeed()` data, 590px width instead of
full-width; each row gets a small red dot marker matching the mockup's
8-dot column instead of the current bullet/no-marker treatment).

## Testing

- Visual check in browser at desktop width (≥1280px) comparing against the
  mockup screenshot for: page bg color, topbar height/logo, sidebar
  floating-card treatment + active state, stat card icon-chip colors and
  trend arrows, row 2/3 card proportions and gaps.
- Confirm existing functional behavior unchanged: sidebar nav links/active
  state routing, mobile nav sheet, notifications bell, sign-out, sidebar
  collapse toggle (now in topbar).
- Dark mode sanity check (not pixel-specified by the mockup, but must not
  regress — reuse the codebase's existing light-chip/dark-opacity pattern).
