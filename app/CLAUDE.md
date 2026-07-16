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
- `../product-spec-obsidian-vault/Production/phase-1/spec.md` — full Phase 1 product spec (data model, privacy, mentorship, friendship, events)
- `../product-spec-obsidian-vault/Production/phase-1/launch-cut.md` — week 1–2 narrowed scope, screen inventory
- `../product-spec-obsidian-vault/Production/phase-1/week-3-4.md` — week 3–4 additive features
- `../product-spec-obsidian-vault/Production/phase-1/user-flows.md` — member, mentor, and admin flows with analytics events
- `../docs/architecture/information-architecture.md` — navigation model, route map, screen-by-screen responsibilities

**Runbooks (read when touching the relevant area):**
- `../docs/runbooks/supabase-conventions.md` — keys, clients, type generation, auth/users trigger, role grants
- `../docs/runbooks/migration-workflow.md` — branching, db push, type regeneration, prod safety
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
│   ├── (auth)/           sign in / signup / invite landing
│   └── (member)/         authenticated app shell
│       ├── help/         v2 Help home, composers, history, detail, offers, settings
│       ├── messages/     v2 list, Waiting, Ask/Connection thread, context, safety
│       ├── people/       directory + NL search + direct-Help entry
│       ├── events/
│       ├── announcements/
│       ├── profile/[id]
│       └── admin/
├── components/
│   └── ui/               shadcn primitives (we own this code)
├── lib/                  business logic, framework-agnostic
│   ├── conversations/    shared v2 thread contracts and pure behavior
│   ├── messages/         v2 list/count contracts and pure behavior
│   ├── connections/      v2 Connection commands and pure behavior
│   ├── safety/           v2 report/block command boundary
│   ├── help/             v2 Help domain contracts and pure behavior
│   ├── outbox/           durable worker job contracts
│   ├── friendship/
│   ├── search/
│   ├── profile/
│   ├── notifications/
│   ├── events/
│   ├── announcements/
│   └── invite/
├── db/                   typed Supabase wrappers + generated database.types.ts
└── notify/               Resend wrappers

app/supabase/
├── config.toml           Supabase CLI config (project_id = "bridgecircle")
└── migrations/           forward-only SQL — once applied to any DB, immutable
```

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
  indexing, with deterministic fallbacks. People search remains a later v2
  port and must not be copied into Help.

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
pnpm db:types:local           # regenerate types from local v2 during the rebuild
pnpm check:messages-cutover   # prevent retired Messages URLs/imports from returning
```

Package manager is **pnpm 10.33.2** — do not use npm or yarn.

## Verification (per-task)

Before declaring a task done:

- `pnpm biome check . && pnpm lint`
- `pnpm tsc --noEmit`
- if you touched SQL during the rebuild: run `pnpm db:types:local` twice and
  confirm `database.types.ts` is byte-identical, then lint and shadow-diff the
  local schema per `docs/runbooks/migration-workflow.md`
- if you touched a route: there is a Vitest covering the `/lib` function (or write one)

## Working Conventions

- Web-first; mobile responsiveness yes, native mobile no until repeat-engagement signals appear (see `../docs/decisions/0002-web-first-defer-native.md`)
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
- Field-level privacy UI is week 3+. Until then, hardcode the defaults from `../product-spec-obsidian-vault/Production/phase-1/spec.md` (name/year/city/employer/title/university/major org-visible; contact links friends-only) on the read path.
- Help lifecycle maintenance owns reminders, 14-day expiry, and the consecutive-
  timeout auto-pause rule through durable outbox work.
- Default to web-friendly responsive layouts. Admin tables can be desktop-primary.

## Top-Level Routes (post-IA-reorg)

| Route | Purpose | Notes |
|---|---|---|
| `/` | Home and default post-sign-in destination | Home is a separate later v2 port; it must link into canonical domain roots |
| `/help` | Help home with **Get help / Give help** modes | Uses v2 fixed API projections only |
| `/help/ask/[membershipId]` | Private direct-Ask composer | Recipient is membership-scoped |
| `/help/ask-circle` | Circle-Ask composer | Supports matched or organization-wide reach |
| `/help/asks` | Member's Help history | Durable status and role-shaped links |
| `/help/asks/[askId]` | Ask detail or direct-recipient response | Projection is viewer-role shaped |
| `/help/asks/[askId]/offer` | Circle-offer composer | Private offer note and bounded AI assistance |
| `/help/settings` | Helper availability and topics | Sole settings surface for Help supply |
| `/people` | Member exploration — bounded search, All/Open-to-help/In-your-circle scopes, and profile preview | Was `/discover`; folded `/friends` in |
| `/people/circle` | Managed circle view | Per-row Message and confirmed, mutual Disconnect |
| `/school` | Member-facing School pulse hub — events + announcements together | Links to `/events` and `/announcements` archives |
| `/messages` | Canonical Messages root | Waiting, counts, filters/search, keyset list, and responsive workspace use fixed v2 projections |
| `/messages/[id]` | Unified v2 conversation thread | Ask and Connection origins share history, send/read/typing, context, and safety controls |
| `/events`, `/events/[id]` | Events list + detail | |
| `/announcements`, `/announcements/[id]` | Archive | Off top nav post-#55; entry via home banner + notifications |
| `/profile/[id]` | Profile detail with friendship + helper-ask CTAs | |
| `/profile/me/*` | Own-profile editing surfaces | |
| `/admin/*` | Admin — invites, members, events, announcements, analytics | Admin-only nav slot |

Member navigation: **Home · Help · People · Messages · School**. Help owns
`/help/*`; Messages owns `/messages/*`. `MEMBER_NAV_LINKS` in
`src/app/(member)/nav-links.ts` is the single source of truth for the desktop
sidebar, tablet rail, and mobile tab bar.

This is a pre-launch destructive rebuild. Retired `/ask`, `/inbox`, `/search`,
`/discover`, `/friends`, and `/mentorship/*` routes have no compatibility
redirects. Do not recreate them. Update callers to the canonical routes;
`check:help-cutover` and `check:messages-cutover` enforce this boundary.

Vocabulary (ADR 0011 + ADR 0015): user-facing copy says **Ask**, **Help**,
**Connect**, and **Messages**. The v2 schema uses these concepts directly; no
legacy mentorship columns or compatibility modules are retained.

## Out Of Scope For Phase 1

Do not build (without explicit user request):

- native mobile app
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
