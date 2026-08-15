---
id: help-search-golden-baseline/09-latency-guard
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: done
depends_on: [05]
pr:
---

# 09 — Latency guard

> One PR. One focused session (short).

## Cold start

The baseline computes the weighted helper-card tsvector **inline per query** (no stored
column — the document spans 4 tables), which is O(eligible helpers) per search. This
task adds the tripwire that tells us when that stops being acceptable. Extend
`app/scripts/test-help-query-plans.sh` (invoked as `pnpm test:db:help-query-plans`),
which already seeds a large fixture inside `begin;…rollback;` and asserts on EXPLAIN
output — follow its structure and its `81000000-…`-style disjoint UUID namespace
convention (pick an unused prefix).

## Scope

**In:**
- Inside the existing rolled-back block (or a sibling block in the same script): seed
  ~2,000 eligible helpers (memberships + users + helper_preferences + profiles + a few
  topics each; sparse text is fine — volume is the point).
- `explain (analyze, buffers, costs off) select * from
  private.search_help_candidates('<org>', '<viewer>', 'consulting startup offer',
  null, 40);` — parse execution time; hard-fail above 1000 ms; print the time either
  way.
- Keep the existing `to_regprocedure` signature assertion (params unchanged — it
  should already pass).

**Out:**
- Optimizing the function (that is the escape-hatch initiative decision if this
  trips: trigger-maintained document table — see plan Risks).
- App-level latency measurement.

## Files

| Path | What changes |
|---|---|
| `app/scripts/test-help-query-plans.sh` | add fixture + explain-analyze guard |

## Steps

1. Read the script's existing fixture block → reuse its psql conventions.
2. Add seeding + explain block → runs green locally, prints timing.
3. Sanity: bump the threshold to 1ms temporarily, confirm it fails, restore.

## Verification

```bash
pnpm test:db:help-query-plans
```

- Prints baseline execution time at ~2k helpers; passes under 1s.

## Done when

- [ ] Guard runs in the rolled-back fixture and enforces the ceiling
- [ ] Timing printed for the record (note it in handoff)
- [ ] PR opened and CI green

## Handoff notes

*Filled in 2026-08-15.*

- **What diverged from the plan:** the guard TRIPPED on first run — 5,658 ms
  at ~2k eligible helpers. Root cause: nine to_tsvector constructions per
  helper plus per-field tsquery probes. Fix (kept inline, escape hatch not
  needed): ONE weighted tsvector per helper, unnested once into
  (member, lexeme, weight-class) rows; scoring became a rarity-weighted CLASS
  sum (class counted once per lexeme). Golden set stayed fully green through
  the change — the dataset adjudicated the optimization. Result: 66 ms.
- **What the next task needs to know:** matched_fields output is now
  class-granular ('topics'/'headline'/'credentials'/'profile'). Recorded
  timing: 66.084 ms at ~2,000 eligible helpers, ceiling 1000 ms.
- **Logged to `Backlog/`:** nothing.
