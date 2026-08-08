@AGENTS.md

# BridgeCircle App

Next.js application for BridgeCircle — a verified alumni and community network. First pilot is a school alumni product for Chadwick School (Palos Verdes) and Chadwick International (Songdo).

There is no fixed launch deadline. The bar is product quality and competitive standing, not a calendar. Don't justify shortcuts with "we need this for the demo / launch event."

Product framing, MVP scope, and positioning live in `../project-summary.md` and `../AGENTS.md`. Do not reframe the product as "alumni management software" — the thesis is a member-first warm-network platform.

## Behavioral

See [`../CLAUDE.md`](../CLAUDE.md) for universal guardrails — surface assumptions, surgical changes, define success criteria.

## Source Of Truth

Read these before writing code. They override anything in this file if they disagree.

Start at [`../docs/INDEX.md`](../docs/INDEX.md) for the full wiki.

**Specs:**
- `../docs/product/feature-roadmap.md` — phase sequencing and pricing
- `../docs/decisions/0002-web-first-defer-native.md` — web-first decision and mobile gating criteria
- `../docs/architecture/information-architecture.md` — **canonical** route map, navigation model, screen-by-screen responsibilities
- `../docs/architecture/database-v2-contract.md` — **canonical** live schema; `../docs/architecture/schema-rationale.md` for why it is shaped that way
- `../product-spec-obsidian-vault/Production/phase-1/spec.md` — full Phase 1 product spec (data model, privacy, help, connections, events)
- `../product-spec-obsidian-vault/Production/phase-1/launch-cut.md` — week 1–2 narrowed scope, screen inventory
- `../product-spec-obsidian-vault/Production/phase-1/week-3-4.md` — week 3–4 additive features
- `../product-spec-obsidian-vault/Production/phase-1/user-flows.md` — member, helper, and admin flows with analytics events

> **Caution on the four phase-1 spec files above:** they predate the v2 rebuild and
> still use retired vocabulary (mentor/mentorship, friendship) — and in places they
> describe the pre-v2 *product shape*, not just old words. Trust the architecture
> docs and the code over them on anything structural.

**Runbooks (read when touching the relevant area):**
- `../docs/runbooks/supabase-conventions.md` — keys, clients, type generation, auth/users trigger, role grants
- `../docs/runbooks/migration-workflow.md` — forward-only migrations, db push, type regeneration, expand/contract, prod safety
- `../docs/runbooks/day-0-setup.md` — infra setup record and `/lib` discipline rationale
- `../docs/presentations/lib-pattern-slides.html` — the `/lib` pattern walkthrough

**Phase 1 launch:**
- `../product-spec-obsidian-vault/Production/phase-1/launch-checklist.md` — end-of-week-2 readiness criteria
- `../product-spec-obsidian-vault/Prototype/phase-1/post-launch-backlog.md` — deferred items, revisit post-launch

## Where Things Go

```
app/src/
├── app/                  Next.js routes — HTTP + UI layer only
│   ├── api/              route handlers
│   ├── (auth)/           sign-in, join, password reset
│   ├── (member)/         authenticated member shell — one folder per route family
│   └── (admin)/          admin takeover shell (its own route group, not nested
│                         under (member))
├── components/
│   └── ui/               shadcn primitives (we own this code)
├── lib/                  business logic, framework-agnostic — one folder per domain
├── db/                   typed Supabase wrappers + generated database.types.ts
├── workers/              outbox worker entry points
└── notify/               Resend wrappers

app/supabase/
├── config.toml           Supabase CLI config (project_id = "bridgecircle")
├── legacy/               pre-v2 history, archived — never push to a shared project
└── migrations/           forward-only SQL — once applied to any DB, immutable
```

The per-domain folders inside `app/` and `lib/` change as features land, so they
are deliberately not enumerated here — a stale inventory in this file is worse
than no inventory. Run `ls app/src/lib/` for the current set, and see
[`../docs/architecture/information-architecture.md`](../docs/architecture/information-architecture.md)
for which route owns what.

Add new `/lib` folders as features land. Do not create empty placeholders.

## The `/lib` Discipline

Every business rule lives in `src/lib/`. Route handlers and server actions only do four things:

1. parse input (zod)
2. check auth (`requireSession`)
3. call a `/lib` function with injected deps (`{ db, notify }`)
4. map the result to a response

`/lib` functions must not import Next.js, Supabase clients directly, or Resend. They take dependencies as arguments. This is what keeps mobile feasible later and what makes business logic testable.

See `../docs/runbooks/day-0-setup.md` Step 6 for the canonical example. If you find yourself writing business logic inside `src/app/api/.../route.ts`, stop and move it to `src/lib/`.

## Tech Stack Locked For Phase 1

- Frontend: Next.js App Router on Railway
- Backend: Next.js API routes + Supabase client
- Database: Supabase Postgres
- Auth: Supabase Auth (Google OAuth + email/password)
- Email: Resend with Chadwick-branded verified sender
- Background jobs: Railway outbox worker (matching, indexing, Help lifecycle, notification/email delivery)
- File storage: Supabase Storage (public `avatars`, private `resumes`)
- Error tracking: Sentry
- LLM/search: bounded provider adapters for Help drafting, matching, and profile
  indexing, with deterministic fallbacks. Bounded People search is implemented in
  `lib/people/` (scopes, structured filters, optional query embedding); what stays
  out of scope is unbounded agentic matching as the default page-load path — see
  Out Of Scope below and ADR 0009.

Do not introduce alternative providers or frameworks without checking with the user. Do not add Prisma, Drizzle, tRPC, or auth libraries other than Supabase Auth.

## Commands

From `app/`:

```bash
pnpm dev          # local dev at http://localhost:3000
pnpm build        # production build (also runs Sentry source map upload in CI)
pnpm start        # serve production build
pnpm lint         # eslint
pnpm biome format --write .   # format
pnpm biome check .            # lint via biome
pnpm vitest                   # run tests
pnpm db:types:local           # regenerate types from the local database
pnpm check:help-cutover       # prevent retired Help URLs/imports from returning
pnpm check:messages-cutover   # same boundary for Messages
```

There are 17 `check:*` guard scripts (per-domain `*-boundaries` and `*-cutover`,
plus `check:tokens`, `check:dev-cutover`, `check:production-cutover`). Run
`grep '"check:' package.json` for the current list; run the ones covering the
domain you touched.

Package manager is **pnpm 10.33.2** — do not use npm or yarn.

## Verification (per-task)

Before declaring a task done:

- `pnpm biome check . && pnpm lint`
- `pnpm tsc --noEmit`
- if you touched SQL: run `pnpm db:types:local` twice and confirm
  `database.types.ts` is byte-identical, then lint and shadow-diff the local
  schema per `../docs/runbooks/migration-workflow.md`
- if you touched a route: there is a Vitest covering the `/lib` function (or write one)

## Working Conventions

- Web-first; mobile responsiveness yes. The web app is still the product — native mobile *features* wait on repeat-engagement signals (see `../docs/decisions/0002-web-first-defer-native.md`), even though an Expo shell now exists at `../mobile/` (`../docs/decisions/0016-native-mobile-via-expo.md`)
- Single-engineer build — prefer the smallest credible thing that ships, not the most general one
- Connections, Asks, and conversations have distinct gates even though accepted
  interactions share the `conversations` and `messages` primitives. Connections
  are mutual; Help is one-sided until the recipient accepts or the asker accepts
  an offer.
- There is one Help availability state: `helper_preferences.open_to_help` plus
  pause metadata and normalized `helper_topics`. Pending capacity is enforced
  transactionally by the v2 command functions and is not a separate UI mode.
- Identity is user-scoped; organization context and all Help actions are
  membership-scoped. Never substitute a user ID for a membership ID.
- Field-level privacy UI is not built yet (`profile_field_visibility` exists in the schema but no settings surface writes it). Until it lands, hardcode the defaults from `../product-spec-obsidian-vault/Production/phase-1/spec.md` (name/year/city/employer/title/university/major org-visible; contact links connections-only) on the read path.
- Help lifecycle maintenance owns reminders, 14-day expiry, and the consecutive-
  timeout auto-pause rule through durable outbox work.
- Default to web-friendly responsive layouts. Admin tables can be desktop-primary.

## Routes And Ownership

Member navigation is five roots. Each owns its whole path prefix:

| Nav root | Owns |
|---|---|
| `/` | Home composition dashboard over other domains' projections |
| `/help` | `/help/*` — Ask composers, history, detail, offers |
| `/people` | `/people/*` — directory, bounded search, managed circle |
| `/messages` | `/messages/*` — conversation list and threads |
| `/school` | `/school/*` — events, announcements, newsletter |

Outside the nav roots: `/settings`, `/notifications`, `/profile/[id]`, and
`/profile/me` (one page). Admin lives in its own `(admin)/` route group at
`/admin/*`, not nested under `(member)/`.

Events, announcements, and newsletter are **School-scoped** (`/school/events/[id]`,
`/school/announcements`, `/school/newsletter`). There is no top-level `/events` or
`/announcements`.

`MEMBER_NAV_LINKS` in `src/app/(member)/nav-links.ts` is the single source of truth
for the desktop sidebar, tablet rail, and mobile tab bar.

**The full route contract — every route, its responsibility, and its ownership
boundary — lives in
[`../docs/architecture/information-architecture.md`](../docs/architecture/information-architecture.md).**
Do not restate per-route detail here; this file drifted precisely because it kept a
second copy. Update the architecture doc in the same change as a route move.

This is a pre-launch destructive rebuild. Retired `/ask`, `/inbox`, `/search`,
`/discover`, `/friends`, and `/mentorship/*` routes have no compatibility
redirects. Do not recreate them. Update callers to the canonical routes;
`check:help-cutover` and `check:messages-cutover` enforce this boundary.

Vocabulary (ADR 0011 + ADR 0015): user-facing copy says **Ask**, **Help**,
**Connect**, and **Messages**. The v2 schema uses these concepts directly; no
legacy mentorship columns or compatibility modules are retained. The canonical
retired-vs-current terminology table is
[`../docs/product/voice-guidelines.md`](../docs/product/voice-guidelines.md) §6.1 —
read it before writing any user-facing string.

## Out Of Scope For Phase 1

Do not build (without explicit user request):

- native mobile *features*. The Expo shell itself now exists at `../mobile/` per [ADR 0016](../docs/decisions/0016-native-mobile-via-expo.md), but it is a boots-only scaffold. Auth, screens, and parity work each still need explicit approval, and the repeat-engagement gate from [ADR 0002](../docs/decisions/0002-web-first-defer-native.md) still governs them.
- meetup proposals or ambassador role workflows
- mentorship scheduler or Zoom integration
- social feed
- a second standing-Ask model outside the unified v2 `asks` lifecycle
- direct LinkedIn scraping (browser automation against linkedin.com) — ban risk and ToS breach. The supported path is `lib/enrichment/` (LinkdAPI primary, Bright Data for the monthly sweep, PDL fallback) — see [`../docs/architecture/profile-enrichment.md`](../docs/architecture/profile-enrichment.md) for the full plan.
- unbounded agentic matching as the default page-load search path. Hybrid Ask
  matching is allowed only within the bounded ADR 0009 plan: hard gates,
  permission-safe retrieval, warm-network scoring, fallbacks, and evaluation.
- per-organization or viewer-specific privacy rules
- fundraising features

If a request implies any of the above, flag it before implementing.
