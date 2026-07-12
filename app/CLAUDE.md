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
- LLM/search: Claude Haiku for resume extraction, legacy NL search
  extraction/rerank, semantic passage generation, and optional Ask explanation
  polish. Ask also has a feature-gated Voyage hybrid path
  (`ASK_MATCHING_PIPELINE=voyage_hybrid`) for embeddings + dedicated reranking
  per `../docs/decisions/0009-hybrid-ask-matching.md`; People remains the broad
  directory/filter surface.

Do not introduce alternative providers or frameworks without checking with the user. Do not add Prisma, Drizzle, tRPC, or auth libraries other than Supabase Auth.

## Commands

From `app/`:

```bash
pnpm dev          # local dev at http://localhost:3001
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

- Web-first; mobile responsiveness yes, native mobile no until repeat-engagement signals appear (see `../docs/decisions/0002-web-first-defer-native.md`)
- Single-engineer build — prefer the smallest credible thing that ships, not the most general one
- Friendship, asks, and direct messages are separate tracks at the data layer. They share a unified surface on /inbox but the gates differ: DMs require mutual friendship; asks require helper acceptance. Do not collapse the gating.
- There is ONE ask type (ADR 0011 Phase 2). The `asks.ask_type` enum column still exists until the Phase 6 contract migration; `createAsk` writes the constant `'advice'`. Helper availability is one state: saves write `open_to_advice` and `open_to_mentorship` together, and reads treat either flag as open (`isOpenToHelp` in `lib/utils`). `max_pending_requests` is enforced invisibly in `createAsk` (the abuse valve); `max_active_mentees`, `commitment`, and `screening_prompt`/`screening_answer` are no longer written or read — they drop in Phase 6. The composer is the conversational `chat-composer.tsx` (default) + `request-form.tsx` (`?skip=1`).
- Use one combined profile in the UI for now. The `base_profile` / `organization_profile` separation lives in the schema for multi-org later (unlocks when Chadwick International onboards as org #2).
- Field-level privacy UI is week 3+. Until then, hardcode the defaults from `../product-spec-obsidian-vault/Production/phase-1/spec.md` (name/year/city/employer/title/university/major org-visible; contact links friends-only) on the read path.
- Mentor inactivity auto-pause: 14 days without responding to any pending request → "paused while away", unpause on next login.
- Default to web-friendly responsive layouts. Admin tables can be desktop-primary.

## Top-Level Routes (post-IA-reorg)

| Route | Purpose | Notes |
|---|---|---|
| `/` | The Help hub — one page with a segmented **Ask for help / Give help** toggle (`?mode=give` = give). Ask side = `AskHome` (NL ask prompt, people who can help); give side = `GiveHelpPanel` (requests needing reply, availability). Default after sign-in | Ask + Help tabs collapsed into one "Help" nav tab pointing here |
| `/ask` | Question-driven matching results — `?nl=` → hybrid retrieved/reranked matches; `?edit=1` → composer front door | Workflow routes stay: `/ask/new`, `/ask/[id]`, `/ask/thread/[id]`; matching plan is ADR 0009 |
| `/help` | 307 → `/?mode=give` (folded into the Help hub) | Give-side body lives in `help/give-help-panel.tsx`; `/help/settings` still resolves |
| `/people` | Alumni exploration — NL search, structured filters, "People I know" toggle, match-brief result cards | Was `/discover`; folded `/friends` in |
| `/school` | Member-facing School pulse hub — events + announcements together | Links to `/events` and `/announcements` archives |
| `/inbox` | Unified request lifecycle — needs reply, helping, getting help, connections, direct messages | Folded in `/messages` (root), `/friends` (incoming reqs) |
| `/messages/[id]` | DM conversation viewer | Linked from `/inbox`; root `/messages` 308 → `/inbox` |
| `/events`, `/events/[id]` | Events list + detail | |
| `/announcements`, `/announcements/[id]` | Archive | Off top nav post-#55; entry via home banner + notifications |
| `/profile/[id]` | Profile detail with friendship + helper-ask CTAs | |
| `/profile/me/*` | Own-profile editing surfaces | |
| `/admin/*` | Admin — invites, members, events, announcements, analytics | Admin-only nav slot |

Top nav (members): **Help · People · School · Messages**. The Help tab is the combined ask/give hub at `/` (the former Ask and Help tabs merged into it); the Messages tab points at the `/inbox` route (route rename deferred to a later ADR 0011 phase). The `MEMBER_NAV_LINKS` in `src/app/(member)/nav-links.ts` is the single source of truth — desktop nav and the mobile dropdown both render from it.

Legacy URLs redirect (308): `/search → /people`, `/discover → /people`, `/friends → /people?peopleIKnow=on`, `/mentorship/request/* → /ask/*`, `/mentorship/thread/* → /ask/thread/*`, `/mentorship/settings → /help/settings`, `/messages → /inbox`. `/ask` is a current top-level member page, not a redirect. See `next.config.ts`.

Vocabulary (ADR 0011 Phases 1–2, applied 2026-07-03): user-facing copy never says "mentor", "mentee", or "mentorship" — an ask is just an **ask**, helper availability is one state ("open to helping"), and friend requests read as **connect** language. Database columns and enum values (`open_to_mentorship`, `ask_type 'advice'|'mentorship'`) intentionally keep the old names until the ADR 0011 Phase 6 contract migration.

## Out Of Scope For Phase 1

Do not build (without explicit user request):

- native mobile app
- meetup proposals or ambassador role workflows
- mentorship scheduler or Zoom integration
- social feed
- saved mentor interest / passive matching — **except** the bounded standing-ask slice (user-approved 2026-06-11): one `open_asks` row per member per org, 14-day TTL with auto-expiry, nightly sweep re-match with count-only notifications (`lib/asks/openAskSweep.ts`). Anything beyond that slice (helper-side /help surfacing, event-driven triggers, renewal flows) still needs explicit approval
- direct LinkedIn scraping (browser automation against linkedin.com) — ban risk and ToS breach. The supported path is `lib/enrichment/` (LinkdAPI primary, Bright Data for the monthly sweep, PDL fallback) — see [`../docs/architecture/profile-enrichment.md`](../docs/architecture/profile-enrichment.md) for the full plan.
- unbounded agentic matching as the default page-load search path. Hybrid Ask
  matching is allowed only within the bounded ADR 0009 plan: hard gates,
  permission-safe retrieval, warm-network scoring, fallbacks, and evaluation.
- per-organization or viewer-specific privacy rules
- fundraising features

If a request implies any of the above, flag it before implementing.
