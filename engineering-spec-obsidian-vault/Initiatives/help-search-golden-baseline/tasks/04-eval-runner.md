---
id: help-search-golden-baseline/04-eval-runner
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: blocked
depends_on: [02, 03]
pr:
---

# 04 — Eval runner (`pnpm eval:search`) + legacy scoreboard

> One PR. One focused session.

## Cold start

Build the integration-layer runner that executes every golden case against the real
`api.search_help_candidates` RPC on the local stack, asserting through
`src/lib/help/golden.ts`. The key trick (why this is NOT a vitest integration test):
per case it opens a psql `begin/rollback` transaction, impersonates the viewer with
`select set_config('request.jwt.claim.sub', '<viewer uuid>', true); set local role
authenticated;` — the exact pattern pgTAP uses (see
`app/supabase/tests/database/010_help_vertical_slice.test.sql` ~lines 299-339) — and
shells out to psql like `app/scripts/test-help-query-plans.sh` does. The vitest
integration tier was rejected: its "APIs only" seeding rule can't touch seeded personas
or do raw setup inserts. **Final step of this task: run the runner against the CURRENT
(pre-baseline) algorithm and commit the scoreboard as `engine=legacy`** — the honest
"before" record.

## Scope

**In:**
- `app/scripts/eval-help-search.ts` (tsx), `"eval:search"` script in `app/package.json`.
- Connection: `SUPABASE_DB_URL` default `postgresql://postgres:postgres@127.0.0.1:54322/postgres`;
  spawn `psql --no-psqlrc --set ON_ERROR_STOP=1 -tA` per case block.
- Precondition check: eval org exists with expected member count, else print
  `pnpm db:reset` and exit 2.
- Identity prefetch: one query building email→(user_id, membership_id) + topic→members
  for the eval org (feeds `IdentityIndex`).
- Per case: `begin;` → set_config + set role → `select coalesce(jsonb_agg(to_jsonb(c)),'[]')
  from api.search_help_candidates('<viewer membership>', $q$<question>$q$, null, 40) c;`
  → `rollback;`. Parse JSON; `stable` runs the select twice in one transaction. Case
  `setup` (if the fixture ever needs runtime state beyond the seeded corpus) is a keyed
  built-in routine switch on case id — never free-text SQL from the fixture.
- Modes: default per-regime pass/fail table (exit 1 on any non-`fail_ok` failure);
  `--scoreboard --engine <label>` → `output/eval/help-search-<engine>-<date>.json`
  (per-case: expected members' ranks, top-5 with scores, pass/fail, regime);
  `--capture` → writes unit-layer snapshots (consumed by task 08; format there);
  `--case <id>` filter.
- Run `--scoreboard --engine legacy` against the current algorithm; commit the output
  file.

**Out:**
- Any change to the search SQL or TS (task 05/07).
- Latency measurement (task 09 owns the plan guard; scoreboard latency columns come
  when AI variants exist).

## Files

| Path | What changes |
|---|---|
| `app/scripts/eval-help-search.ts` | new |
| `app/package.json` | add `eval:search` script |
| `output/eval/help-search-legacy-<date>.json` | committed "before" scoreboard |

## Steps

1. Read `test-help-query-plans.sh` + pgTAP 010 impersonation lines → psql invocation
   shape settled.
2. Identity prefetch + one hardcoded case end-to-end → JSON rows parse, evaluator
   consumes them.
3. Full fixture loop + per-regime table + exit codes → `pnpm eval:search` runs all
   cases (most will FAIL against the legacy engine — that is expected and correct;
   `--scoreboard` still writes).
4. `--scoreboard --engine legacy` → commit `output/eval/help-search-legacy-<date>.json`.
5. Wire `lintFixture` as a pre-flight (fixture inconsistency = exit 2 before any case
   runs).

## Verification

From `app/` (local stack running, freshly reset):

```bash
pnpm db:reset
pnpm eval:search            # runs; failures reported per-regime (legacy engine)
pnpm eval:search --case keyword-topic-exact
pnpm eval:search --scoreboard --engine legacy
pnpm tsc --noEmit && pnpm biome check . && pnpm lint
```

- Runner is deterministic across two invocations on the same DB.
- Exit codes: 0/1 distinguish pass/fail; 2 = precondition or lint failure.

## Done when

- [ ] All 24 cases execute against the real RPC with viewer impersonation
- [ ] Per-regime reporting + `fail_ok` ledger; scoreboard file format stable
- [ ] `engine=legacy` scoreboard committed
- [ ] PR opened and CI green

## Handoff notes

*Filled in by the session that does this task, before marking it `done`.*

- **What diverged from the plan:**
- **What the next task needs to know:**
- **Logged to `Backlog/`:**
