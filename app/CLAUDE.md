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
- `../docs/product/build-plan.md` — phase sequencing, web-first decision, mobile decision criteria
- `../docs/specs/phase-1/spec.md` — full Phase 1 product spec (data model, privacy, mentorship, friendship, events)
- `../docs/specs/phase-1/launch-cut.md` — week 1–2 narrowed scope, screen inventory
- `../docs/specs/phase-1/week-3-4.md` — week 3–4 additive features
- `../docs/specs/phase-1/user-flows.md` — member, mentor, and admin flows with analytics events
- `../docs/architecture/information-architecture.md` — navigation model, route map, screen-by-screen responsibilities

**Runbooks (read when touching the relevant area):**
- `../docs/runbooks/supabase-conventions.md` — keys, clients, type generation, auth/users trigger, role grants
- `../docs/runbooks/migration-workflow.md` — branching, db push, type regeneration, prod safety
- `../docs/runbooks/day-0-setup.md` — infra setup record and `/lib` discipline rationale
- `../docs/presentations/lib-pattern-slides.html` — the `/lib` pattern walkthrough

**Phase 1 launch:**
- `../docs/specs/phase-1/launch-checklist.md` — end-of-week-2 readiness criteria
- `../docs/specs/phase-1/post-launch-backlog.md` — deferred items, revisit post-launch

## Where Things Go

```
app/src/
├── app/                  Next.js routes — HTTP + UI layer only
│   ├── api/              route handlers
│   ├── (auth)/           sign in / signup / invite landing
│   └── (member)/         authenticated app shell
│       ├── people/       directory + NL search + request-start actions
│       ├── ask/          internal ask workflow routes (new/detail/thread)
│       ├── inbox/        asks + friend requests + DMs in one surface
│       ├── messages/[id] DM conversation viewer (list folded into /inbox)
│       ├── events/
│       ├── announcements/
│       ├── profile/[id]
│       └── admin/
├── components/
│   └── ui/               shadcn primitives (we own this code)
├── lib/                  business logic, framework-agnostic
│   ├── asks/             advice + mentorship asks (renamed from mentorship/)
│   ├── friendship/
│   ├── dm/               direct messages
│   ├── search/
│   ├── profile/
│   ├── notifications/
│   ├── events/
│   ├── announcements/
│   ├── home/             home-feed aggregation
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
- Background jobs: Railway worker (invite fan-out, mentor inactivity sweeps, email retries)
- File storage: Supabase Storage (public `avatars`, private `resumes`)
- Error tracking: Sentry
- LLM (week 3): Claude Haiku for resume extraction and NL search entity extraction

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
pnpm db:types                 # regenerate src/db/database.types.ts after migration
```

Package manager is **pnpm 10.33.2** — do not use npm or yarn.

## Verification (per-task)

Before declaring a task done:

- `pnpm biome check . && pnpm lint`
- `pnpm tsc --noEmit`
- if you touched SQL: `pnpm db:types` and confirm `database.types.ts` regenerated cleanly
- if you touched a route: there is a Vitest covering the `/lib` function (or write one)

## Working Conventions

- Web-first; mobile responsiveness yes, native mobile no until repeat-engagement signals appear (see `../docs/product/build-plan.md` Phase 7 criteria)
- Single-engineer build — prefer the smallest credible thing that ships, not the most general one
- Friendship, asks (advice + mentorship), and direct messages are separate tracks at the data layer. They share a unified surface on /inbox but the gates differ: DMs require mutual friendship; asks require helper acceptance. Do not collapse the gating.
- Asks are polymorphic (one `asks` table, `ask_type` enum: `advice` | `mentorship`). Helper opt-in is a per-type checkbox on `helper_preferences` (`open_to_advice`, `open_to_mentorship`). Mentorship still has the cap + paused-at fields; advice is intentionally lower-friction.
- Use one combined profile in the UI for now. The `base_profile` / `organization_profile` separation lives in the schema for multi-org later (unlocks when Chadwick International onboards as org #2).
- Field-level privacy UI is week 3+. Until then, hardcode the defaults from `../docs/specs/phase-1/spec.md` (name/year/city/employer/title/university/major org-visible; contact links friends-only) on the read path.
- Mentor inactivity auto-pause: 14 days without responding to any pending request → "paused while away", unpause on next login.
- Default to web-friendly responsive layouts. Admin tables can be desktop-primary.

## Top-Level Routes (post-IA-reorg)

| Route | Purpose | Notes |
|---|---|---|
| `/` | Home — greeting, mentees waiting, new alumni, featured event, announcement banner, recent activity | Default after sign-in |
| `/people` | Alumni directory — NL search, structured filters, "People I know" toggle, friend signal and ask CTAs on cards | Was `/discover`; folded `/friends` in |
| `/ask` | Redirects to `/inbox`; not a member destination | Workflow routes stay: `/ask/new`, `/ask/[id]`, `/ask/thread/[id]` |
| `/inbox` | Unified request lifecycle — friend requests, incoming asks, active threads, direct messages, sent requests | Folded in `/messages` (root), `/friends` (incoming reqs), and top-level `/ask` |
| `/messages/[id]` | DM conversation viewer | Linked from `/inbox`; root `/messages` 308 → `/inbox` |
| `/events`, `/events/[id]` | Events list + detail | |
| `/announcements`, `/announcements/[id]` | Archive | Off top nav post-#55; entry via home banner + notifications |
| `/profile/[id]` | Profile detail with friendship + helper-ask CTAs | |
| `/profile/me/*` | Own-profile editing surfaces | |
| `/admin/*` | Admin — invites, members, events, announcements, analytics | Admin-only nav slot |

Top nav (members): **People · Inbox · Events**. The `MEMBER_NAV_LINKS` in `src/app/(member)/member-nav.tsx` is the single source of truth — desktop nav and the mobile dropdown both render from it.

Legacy URLs redirect (308): `/search → /people`, `/discover → /people`, `/friends → /people?peopleIKnow=on`, `/ask → /inbox`, `/mentorship/request/* → /ask/*`, `/mentorship/thread/* → /ask/thread/*`, `/messages → /inbox`. See `next.config.ts`.

## Out Of Scope For Phase 1

Do not build (without explicit user request):

- native mobile app
- meetup proposals or ambassador role workflows
- mentorship scheduler or Zoom integration
- social feed
- saved mentor interest / passive matching
- LinkedIn scraping or third-party enrichment APIs (Proxycurl, PDL)
- semantic vector search (NL search uses entity extraction → structured match)
- per-organization or viewer-specific privacy rules
- fundraising features

If a request implies any of the above, flag it before implementing.
