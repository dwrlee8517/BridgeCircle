@AGENTS.md

# BridgeCircle App

This is the Next.js application for BridgeCircle — a verified alumni and community network. The first pilot is a school alumni product for Chadwick School (Palos Verdes) and Chadwick International (Songdo). Hard demo deadline: 2026-05-25 alumni board meeting.

Product framing, MVP scope, and positioning live in `../project-summary.md` and `../AGENTS.md`. Do not reframe the product as "alumni management software" — the thesis is a member-first warm-network platform.

## Source Of Truth

Read these before writing code. They override anything in this file if they disagree:

- `../docs/build-plan.md` — phase sequencing, web-first decision, mobile decision criteria
- `../docs/phase-1-spec.md` — full Phase 1 product spec (data model, privacy, mentorship, friendship, events)
- `../docs/phase-1-launch-spec.md` — week 1–2 narrowed scope, screen inventory, launch readiness checklist
- `../docs/week-3-4-plan.md` — week 3–4 additive features (LinkedIn import, NL search, friendship/DM, privacy UI, analytics, announcements, notifications)
- `../docs/user-flows.md` — member, mentor, and admin flows with analytics events
- `../docs/information-architecture.md` — navigation model, route map, screen-by-screen responsibilities
- `../docs/day-0-setup.md` — infra setup record and `/lib` discipline rationale
- `../docs/lib-pattern-slides.html` — the `/lib` pattern walkthrough

## Current Progress

Day 0 (scaffold) and Day 1 (schema) are complete. The app is deployable and the database is alive.

Scaffolded and wired:

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4 + shadcn/ui (`radix-nova` style, `neutral` base)
- Supabase clients in `src/db/` (`client.ts`, `server.ts`, `admin.ts`), all typed as `createClient<Database>()` against generated `src/db/database.types.ts`
- Sentry instrumentation (`src/instrumentation.ts`, `src/instrumentation-client.ts`, `next.config.ts` wraps with `withSentryConfig`)
- Biome formatter + linter, ESLint with `eslint-config-next`
- Vitest + Testing Library installed (no tests yet)
- shadcn primitives in `src/components/ui/`: button, input, textarea, select, card, dialog, tabs, table, avatar, badge, sonner (toast), dropdown-menu, radio-group, checkbox, label
- Sentry + Supabase + Railway MCP servers configured in `.mcp.json`. **Supabase MCP points at `bridgecircle-dev`, never prod** — prod work happens via CLI with explicit `--project-ref`.
- Supabase CLI bootstrapped (`supabase/config.toml`, `supabase/migrations/`); first migrations applied: `0001_init` (full 20-table schema + auth.users → public.users trigger) and `grant_public_schema` (role grants, see Supabase Conventions).
- `pnpm db:types` regenerates `src/db/database.types.ts` from the linked dev project.
- Dev seed: `app/scripts/seed-dev.ts` writes 9 personas + 3 mentorship requests + 2 events (see `../docs/seed-dev.md`).

Not yet built (next up = remaining Week 1 of `phase-1-launch-spec.md`):

- RLS policies (`0003_rls.sql` — prerequisite for any user-scoped reads from feature code)
- auth (Supabase Auth + Google OAuth + invite-token signup)
- any `src/lib/*` business logic
- Resend integration for invite emails
- any feature route groups under `src/app/`

## Where Things Go

```
app/src/
├── app/                  Next.js routes — HTTP + UI layer only
│   ├── api/              route handlers
│   ├── (auth)/           sign in / signup / invite landing
│   └── (member)/         authenticated app shell
├── components/
│   └── ui/               shadcn primitives (we own this code)
├── lib/                  business logic, framework-agnostic
│   ├── mentorship/
│   ├── profile/
│   ├── search/
│   ├── invite/
│   └── events/
├── db/                   typed Supabase wrappers + generated database.types.ts
└── notify/               email / push wrappers (create when adding Resend)

app/supabase/
├── config.toml           Supabase CLI config (project_id = "bridgecircle")
└── migrations/           forward-only SQL — once applied to any DB, immutable
```

The `/lib` folders are not all created yet — add them as features land. Do not create empty placeholder files.

## The `/lib` Discipline

Every business rule lives in `src/lib/`. Route handlers and server actions only do four things:

1. parse input (zod)
2. check auth (`requireSession`)
3. call a `/lib` function with injected deps (`{ db, notify }`)
4. map the result to a response

`/lib` functions must not import Next.js, Supabase clients directly, or Resend. They take dependencies as arguments. This is what keeps mobile feasible later and what makes business logic testable. See `../docs/day-0-setup.md` Step 6 for the canonical example (`createMentorshipRequest`).

If you find yourself writing business logic inside `src/app/api/.../route.ts`, stop and move it to `src/lib/`.

## Tech Stack Locked For Phase 1

From `phase-1-launch-spec.md`:

- Frontend: Next.js App Router on Railway
- Backend: Next.js API routes + Supabase client
- Database: Supabase Postgres
- Auth: Supabase Auth (Google OAuth + email/password)
- Email: Resend with Chadwick-branded verified sender
- Background jobs: Railway worker (invite fan-out, mentor inactivity sweeps, email retries)
- File storage: Supabase Storage (public `avatars`, private `resumes` for week 3 resume extraction)
- Error tracking: Sentry
- LLM (week 3): Claude Haiku for resume extraction and NL search entity extraction

Do not introduce alternative providers or frameworks without checking with the user. Do not add Prisma, Drizzle, tRPC, or auth libraries other than Supabase Auth.

## Supabase Conventions

- Use `sb_publishable_*` and `sb_secret_*` keys (the new format). Do not use the deprecated `anon` / `service_role` JWT names in code or env var names.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe in the client.
- `SUPABASE_SECRET_KEY` is server-only — never import it from a client component or `'use client'` file.
- Use `src/db/client.ts` from client/browser code, `src/db/server.ts` from server components and route handlers, `src/db/admin.ts` only for privileged server-side operations (invite verification, admin actions). All three are typed `<Database>` against `src/db/database.types.ts`.
- After applying any migration, run `pnpm db:types` and commit the regenerated `database.types.ts`. Otherwise the next build fails on missing tables/columns.
- `auth.users → public.users` is wired by the `on_auth_user_created` trigger in `0001_init`. Code that creates users via `supabase.auth.admin.createUser` does **not** need to insert into `public.users` separately, but it does need to insert `base_profiles` / `organization_memberships` / `organization_profiles` rows itself (those are not triggered).
- Tables created via `supabase db push` do **not** auto-receive role grants the way the dashboard does. The `alter default privileges` block in `grant_public_schema.sql` covers future tables in `public` — but if you add a table in a custom schema or run `db reset` in unusual contexts, the same `42501 permission denied` error will resurface. See `../docs/environments.md`.

## Commands

From `app/`:

```bash
pnpm dev          # local dev at http://localhost:3000
pnpm build        # production build (also runs Sentry source map upload in CI)
pnpm start        # serve production build
pnpm lint         # eslint
pnpm biome format --write .   # format
pnpm biome check .            # lint via biome
pnpm vitest                   # run tests (none yet)
```

Package manager is pnpm 10.33.2 — do not use npm or yarn.

## Working Conventions

- Web-first; mobile responsiveness yes, native mobile no until repeat-engagement signals appear (see `build-plan.md` Phase 7 criteria)
- Single-engineer build — prefer the smallest credible thing that ships, not the most general one
- Friendship and mentorship are separate tracks. Direct messaging is gated by mutual friendship; mentorship chat is gated by mentor acceptance. Do not collapse them.
- Use one combined profile in the UI for now. The `base_profile` / `organization_profile` separation lives in the schema for multi-org later (unlocks when Chadwick International onboards as org #2).
- Field-level privacy UI is week 3+. Until then, hardcode the defaults from `phase-1-spec.md` (name/year/city/employer/title/university/major org-visible; contact links friends-only) on the read path.
- Mentor inactivity auto-pause: 14 days without responding to any pending request → "paused while away", unpause on next login.
- Default to web-friendly responsive layouts. Admin tables can be desktop-primary.

## Out Of Scope For Phase 1

Do not build (without explicit user request):

- native mobile app
- meetup proposals or ambassador role workflows
- mentorship scheduler or Zoom integration
- social feed
- saved mentor interest / passive matching
- separate Discover home (Search covers it at launch)
- LinkedIn scraping or third-party enrichment APIs (Proxycurl, PDL)
- semantic vector search (NL search uses entity extraction → structured match)
- per-organization or viewer-specific privacy rules
- fundraising features

If a request implies any of the above, flag it before implementing.

## Launch Readiness (End Of Week 2)

From `phase-1-launch-spec.md`:

- 20–50 real alumni profiles seeded
- 10+ mentors marked open-to-mentor
- core loop verified end-to-end: invite → signup → profile → search → mentor request → accept → chat
- Resend production domain verified (SPF/DKIM)
- Sentry instrumentation on API routes
- at least one real test event
- admin can approve members from the queue without touching SQL

## Post-Launch Backlog

Not blockers for the May 25 demo. Revisit after launch.

- **Migrate to Supabase branching** (account is on Pro). Today the dev/prod separation is two independent projects (`bridgecircle-dev` + `bridgecircle`); migrations are pushed via `supabase link --project-ref ...` to each in turn. Branching would replace this with one project + a long-lived `dev` branch + ephemeral PR-preview branches, which gives drift detection on merge and per-PR isolated environments. Migration cost ~2 hours; adds usage-based realtime/compute billing per branch. Not urgent — current setup is working.
- **CI drift check** for migrations. Fail the PR build if `supabase migration list --linked` against prod is missing migrations that exist locally. Currently relies on memory.
- **`pnpm db:promote` script** that automates link → push → re-link-to-dev so prod schema promotion is one command.
- **Cost monitoring on Anthropic API** — every NL search query hits Haiku twice; resume import hits it once. No observability today. Consider Sentry breadcrumbs or a counter row.
