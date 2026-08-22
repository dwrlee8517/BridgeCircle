---
id: event-composer-v2/01-schema-drop-campus-optional-end
initiative: "[[Initiatives/event-composer-v2/plan|Event composer v2]]"
status: done
depends_on: []
pr: https://github.com/dwrlee8517/BridgeCircle/pull/223
---

# 01 — Schema: drop campus, optional end time

## Cold start

Two contract changes to `public.events`, done end-to-end: remove the
Chadwick-shaped `campus` column everywhere, and stop requiring an end time in
the create/edit validation (`ends_at` is already nullable in the table — only
the zod schema forces it). The non-obvious part: `campus` is not just a form
field. It flows through the save RPC (`save_admin_school_event_v2`, both
`private.` and `api.` signatures in
`app/supabase/migrations/20260722010000_complete_admin_operations.sql`), the
member-facing event JSON, a member home-card fallback label
(`app/src/app/(member)/home-dashboard.tsx:406`), `campusTimeLabel` in
`app/src/lib/school/time.ts`, a GraphQL field
(`app/src/graphql/entities/school.ts:104`), and the web↔mobile **parity
manifest** (`app/src/graphql/parity/manifest.ts:377` and the `schoolEvent`
document) that CI enforces — all must change in this one PR or the parity gate
fails. Changing a `create or replace function` signature requires `drop
function` first when parameters are removed.

## Scope

**In:**
- Migration: drop `events_campus_check` and the `campus` column; recreate
  `save_admin_school_event_v2` (private + api) without `p_campus`; update any
  RPC that selects `campus` into JSON (`get_admin_school_events_v2`, member
  school reads).
- `ends_at` optional in `admin-schemas.ts` (keep the `> starts_at` check when
  present); RPC already tolerates null.
- Remove `campus` from: contracts, admin-schemas, event-form defaults/props,
  edit-page mapping, home-dashboard fallback (use
  `locationName ?? (format === 'online' ? 'Online' : 'In person')`),
  `time.ts` `campusNames`/`campusTimeLabel` (label becomes
  `"<Time zone> time · <tz>"` from the tz alone), GraphQL entity + manifest,
  seed rows in `app/supabase/seeds/seed.sql`, scene seeds if any.
- Regenerate `database.types.ts`.

**Out:**
- Any form layout change — task 02. This task keeps the `<select>` and simply
  deletes the campus field block.
- Mobile client changes — mobile is a boots-only scaffold; the parity manifest
  is the only mobile-facing artifact.

## Files

| Path | What changes |
|---|---|
| `app/supabase/migrations/<ts>_drop_event_campus.sql` | new — column drop + RPC recreation |
| `app/src/lib/school/admin-schemas.ts` | campus out; endsAt optional |
| `app/src/lib/school/contracts.ts` | campus out of both event types |
| `app/src/lib/school/time.ts` (+ test) | `campusTimeLabel` → tz-only label |
| `app/src/app/(admin)/admin/events/event-form.tsx` | delete campus field |
| `app/src/app/(admin)/admin/events/[id]/edit/page.tsx` | drop campus mapping |
| `app/src/app/(member)/home-dashboard.tsx` | fallback label without campus |
| `app/src/graphql/entities/school.ts` | drop field |
| `app/src/graphql/parity/manifest.ts` | drop from document + notes |
| `app/src/db/repositories/school.ts` | drop from row schema |
| `app/supabase/seeds/seed.sql` | drop column from event inserts |
| `app/src/db/database.types.ts` | regenerated |

## Steps

1. Write the migration; `pnpm db:reset` locally → seeds load clean, no campus
   column in `\d public.events`.
2. Sweep TypeScript (`rg -l campus app/src | grep -v test`), fix each site →
   `pnpm tsc --noEmit` green.
3. Make `endsAt` optional in the zod schema + form label ("End · optional") →
   the schema test for a missing end passes.
4. Update tests that set `campus`/`endsAt` (`admin-schemas.test.ts`,
   `admin-operations.test.ts`, school repo tests, GraphQL schema tests).
5. `pnpm db:types:local` twice → byte-identical.

## Verification

```bash
pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest
```

- `rg -i campus app/src app/supabase/migrations --files-with-matches` returns
  only historical migrations (which are immutable) and nothing under `src/`.
- Create an event without an end time through the real form; it saves and the
  School card renders a start-only time.
- Parity/GraphQL schema tests green with the field gone.
- migration-reviewer agent pass on the new SQL.

## Done when

- [x] Seed inserts verified against the migrated schema (rolled-back replay; full reset deferred, see handoff)
- [x] Event without end time creatable end-to-end; member card renders
- [x] No `campus` reference outside immutable historical migrations
- [x] PR opened: #223 (CI running at handoff time)

## Handoff notes

*Filled in by the session that does this task, before marking it `done`.*

- **What diverged from the plan:** Very little. Extra file sweep beyond the
  plan's table: the four fixture scripts (`test-school-{maintenance,concurrency,query-plans}.sh`,
  `seed-demo-org.sh`) also inserted campus literals. The legacy 7-arg
  `save_admin_school_event` (v1) was dropped in the same migration — no TS
  caller, and its body inserted a campus literal. `campusTimeLabel` was
  replaced by `eventTimeZoneLabel(timeZone)` ("Event time · <tz>") rather than
  a per-campus name map. `pnpm db:reset` was NOT run (the operator's populated
  scale org was in use); instead the migration was applied with
  `supabase migration up --local` and the seed's event inserts were replayed
  against the live schema in a rolled-back transaction — a full reset re-check
  is cheap insurance next time one happens anyway.
- **What the next task needs to know:** `SaveAdminSchoolEventInput.endsAt` is
  now `string | null` and the RPC pair is 21-arg. The form still has the plain
  `<select>` widgets; the format/timeZone grid is now `sm:grid-cols-2`. The
  member card renders start-only times fine (verified end-to-end via
  Playwright: created a no-end event as nadia@example.com, saw it on /school).
- **Logged to `Backlog/`:** nothing.
