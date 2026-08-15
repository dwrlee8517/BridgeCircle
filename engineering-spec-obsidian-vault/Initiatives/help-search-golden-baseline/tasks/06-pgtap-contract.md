---
id: help-search-golden-baseline/06-pgtap-contract
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: done
depends_on: [05]
pr:
---

# 06 — pgTAP contract test 025

> One PR. One focused session.

## Cold start

Add the pgTAP contract test for the new `search_help_candidates` shape, following the
repo rule that every migration ships with a pgTAP counterpart (see commit `e5a3682`:
`20260724090000_admin_overview.sql` + `024_admin_overview.test.sql`). The separation to
respect: pgTAP asserts the **contract** on the hand-authored Tier-1 personas (Chadwick
Local, `1111…`, seeded by `app/supabase/seeds/seed.sql`); search **quality** lives in
the eval org + `pnpm eval:search` and does not belong here. Impersonation pattern is in
`010_help_vertical_slice.test.sql` (~lines 299-339): `set_config('request.jwt.claim.sub',
'<user uuid>', true)` + `set local role authenticated`. Note 010 already asserts this
function's existence/signature (lines ~60, 88, 179) — those may need updating for the
new return columns.

## Scope

**In:**
- `app/supabase/tests/database/025_help_search_baseline.test.sql`, one
  `begin;`…`rollback;`:
  - `has_function` for `api.` + `private.` with the (unchanged) param signature;
    column assertions for the new return shape.
  - Privileges: `authenticated` can execute `api.`; cannot execute `private.`; `anon`
    can execute neither.
  - As Mei (`10000000-0000-4000-8000-000000000004`): `'consulting'` → Mark's
    membership (`20000000-0000-4000-8000-000000000003`) is row 1; `'a consultant''s
    perspective'` → Mark surfaces (stemming beats the old substring behavior).
  - Viewer exclusion (as Richard, `'venture capital'` → zero rows since he is the only
    VC helper); Sam/Amy (no helper prefs) never appear for any query.
  - Capacity gate: insert waiting direct asks up to Mark's `max_pending_requests`
    (inside the transaction), re-run `'consulting'` → Mark absent.
  - Determinism: `results_eq` on two identical calls.
- Update `010_help_vertical_slice.test.sql` only where it pins the old return columns
  or old plan-count arithmetic breaks.

**Out:**
- Quality/ranking assertions beyond the above — the golden set owns those.
- Eval-org rows — pgTAP stays on Tier-1.

## Files

| Path | What changes |
|---|---|
| `app/supabase/tests/database/025_help_search_baseline.test.sql` | new |
| `app/supabase/tests/database/010_help_vertical_slice.test.sql` | only if it pins old shape |

## Steps

1. Read 010 + 024 for conventions (`extensions.plan(N)`, schema-qualified pgTAP,
   impersonation) → conventions internalized.
2. Write 025 → `pnpm db:test` green.
3. Check 010 for stale pins → fix or confirm untouched.

## Verification

```bash
pnpm db:test
```

- 025 passes; all previous suites still pass; plan counts correct.

## Done when

- [ ] 025 green with contract, exclusion, capacity, and determinism assertions
- [ ] 010 consistent with the new shape
- [ ] PR opened and CI green

## Handoff notes

*Filled in 2026-08-15.*

- **What diverged from the plan:** the self-exclusion assertion originally
  expected zero rows for Richard's 'venture capital' search — wrong, because
  Jordan's employer 'Northstar Ventures' legitimately text-matches. The
  invariant is the viewer's own absence, not emptiness. 010 needed no changes
  (parameter signatures preserved).
- **What the next task needs to know:** 025 is 15 assertions, all green;
  db:test shows only the two pre-existing failures (see Backlog note).
- **Logged to `Backlog/`:** nothing new.
