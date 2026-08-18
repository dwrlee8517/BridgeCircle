---
id: help-search-golden-baseline/01-eval-org-corpus-seed
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: done
depends_on: []
pr: (not yet committed — lands with the dataset PR once labels are approved)
---

# 01 — Eval-org corpus seed

> One PR. One focused session.

## Cold start

Create a local-only evaluation organization ("Evalfield School") as a checked-in seed
file, so Help-search quality can be measured against a corpus we fully author. The
non-obvious part: local seeds run automatically on every `supabase db reset` via
`app/supabase/config.toml` `[db.seed] sql_paths = ["./seeds/*.sql"]` — so this file
must be idempotent-by-construction (fixed UUIDs, plain inserts into a namespace nothing
else uses) and must not disturb `app/supabase/tests/database/` pgTAP suites that assert
the exact roster of Chadwick Local (`11111111-…`). The existing
`app/supabase/seeds/seed.sql` shows the auth.users bcrypt insert pattern;
`app/scripts/seed-demo.sh` shows deterministic generation via `md5(seed||n)`.

## Scope

**In:**
- `app/supabase/seeds/eval-org.sql`: org `eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee`, slug
  `eval`, name "Evalfield School"; all row UUIDs in an `ee…` namespace.
- ~120 hand-authored members designed as a completeness-tier × signal-locus × trap-type
  matrix. Every member has a SQL comment naming the golden cases/traps it serves.
  Required trap members (multiple exemplars each where marked *): aspirant bios
  ("hoping to break into consulting")*, stem-collision ("production/product line"
  manufacturing text vs Product management)*, split-phrase ("venture" and "capital" in
  different fields), employer-collision (company name = common query word), tiebreak
  twin pair (identical except pending-ask load), paused helper, `open_to_help=false`
  member, no-helper-row members, permanently-at-capacity helper (seeded waiting direct
  asks = `max_pending_requests`).
- Completeness tiers: rich / partial / sparse-with-topics (topics only, empty
  headline+bio) / rich-but-no-topics (keyword-laden text, not opted into those topics).
- ~1,080 generated crowd members via `generate_series` + `md5('eval:'||n)` in the same
  file (self-contained; no dependency on seed-demo.sh), sharing the hand-authored topic
  vocabulary (≥30 holders of the designated crowded topics) and reproducing the
  completeness tiers (~half sparse).
- Every member gets an `auth.users` row: `helper-NNN@eval.test`, viewers
  `viewer-N@eval.test` (2–3 viewers with differing connection/block relationships).
- Helper opt-ins so the org has ~250–300 eligible helpers total.

**Out:**
- The question set (task 02) — but sketch candidate questions while authoring so
  distractor density is planted now, not retrofitted.
- Any embedding chunks — the eval corpus is deliberately chunk-free; the baseline must
  not depend on them.
- Seeding dev/prod — seeds are local-only by mechanism; do not port this to
  seed-demo.sh.

## Files

| Path | What changes |
|---|---|
| `app/supabase/seeds/eval-org.sql` | new — the whole corpus |

## Steps

1. Study `app/supabase/seeds/seed.sql` (auth.users insert with
   `extensions.crypt(...)`, org/membership/profile/helper inserts) and
   `app/scripts/seed-demo.sh` (deterministic md5 generation, tier logic) → you can
   name the exact insert pattern for each table.
2. Write the org + viewers + hand-authored core with per-member comments → file
   compiles: `pnpm exec supabase db reset` succeeds.
3. Add the generated crowd CTE → reset succeeds; counts match plan
   (`select count(*)` per tier/topic).
4. Determinism check: reset twice, `pg_dump --data-only` (or a sorted select) of the
   eval org's rows, diff is empty.
5. `pnpm db:test` → all existing pgTAP suites still green.

## Verification

From `app/`:

```bash
pnpm exec supabase db reset
pnpm db:test
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "select count(*) from public.organization_memberships where organization_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'"
```

- Member count ≈1,200; eligible-helper count 250–300 (query helper_preferences join).
- Reset-twice diff of eval-org rows is empty (crowd generation deterministic).
- All pgTAP suites green (Tier-1 rosters undisturbed).

## Done when

- [ ] `db reset` seeds Evalfield School with the planned tiers, traps, and crowd
- [ ] Determinism diff empty across two resets
- [ ] `pnpm db:test` green
- [ ] PR opened and CI green

## Handoff notes

*Filled in 2026-08-15 by the planning session (same session did tasks 00-01).*

- **What diverged from the plan:**
  - The whole seed body is wrapped in one `do $eval$ ... $eval$` block: the
    Supabase seed runner prepares a file's statements as a batch, so a temp
    table created mid-file is invisible to later statements unless they are
    planned at runtime (plpgsql). Any future seed using staging tables needs
    the same wrapper.
  - Eligible helpers landed at ~355 (target was 250-300) — crowd opt-in 22%
    plus a helper-heavy hand core. Accepted: more competition, not less.
  - Ember Nascimento (n 146) was re-topiced to {Managing people, Startups}
    during the fixture sweep — the pair had zero holders and the
    coverage-managing-startup case needed one.
- **What the next task needs to know:**
  - Corpus determinism verified: two resets, identical 1,203-row dump.
  - Both-topic crowd members for the negotiating+startups coverage case:
    member-1204@eval.test (Avery Eastman), member-1810@eval.test
    (Hollis Yamada) — stable as long as DEMO-style hash inputs are untouched.
  - One bcrypt hash is computed once and shared by all eval users
    (password 'eval-password'); reset time is unaffected.
- **Logged to `Backlog/`:** [[Backlog/2026-08-15-pgtap-failures-preexisting]] —
  two pre-existing pgTAP failures (demo_access_windows FK index; stale api
  allowlist). `pnpm db:test` shows exactly those two; a third failure is real.
- **Superseded 2026-08-15 (seed-pipeline reorganization):** the auto-load
  decision above was reversed — `eval-org.sql` no longer loads on every
  `supabase db reset` (config.toml's seed path now names the starter cast
  explicitly). The corpus is opt-in via `pnpm seed:eval`, whose wrapper
  deletes the previous corpus first (making the load rerunnable), and
  `pnpm eval:search` auto-seeds an absent corpus so the zero-setup property
  is preserved. Determinism and namespace rules are unchanged.
