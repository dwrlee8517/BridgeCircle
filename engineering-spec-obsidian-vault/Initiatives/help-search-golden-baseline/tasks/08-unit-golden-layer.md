---
id: help-search-golden-baseline/08-unit-golden-layer
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: done
depends_on: [07]
pr:
---

# 08 — Unit golden layer + snapshots

> One PR. One focused session.

## Cold start

Make the golden set runnable with **zero database** in the unit Vitest tier, by
replaying captured RPC rows through the TS layer. What this layer genuinely proves: the
TS layer (passthrough scoring, top-5 slice, merge, diagnostics) preserves the SQL
contract — SQL correctness itself is `pnpm eval:search`'s job. The honesty mechanism is
the non-obvious part: snapshots are a frozen guess about what SQL returns, so they
carry an `enginePrint` hash over the inputs that determine SQL behavior; the unit test
recomputes it and fails with "re-run `pnpm eval:search --capture`" when anything
drifts.

## Scope

**In:**
- `--capture` mode in `app/scripts/eval-help-search.ts` (stub landed in task 04):
  writes `app/src/lib/help/__fixtures__/golden-candidate-snapshots.json` =
  `{enginePrint, capturedAt, cases: {[id]: {viewerMembershipId, rows: <raw RPC rows,
  40-limit, for cases whose layers include 'unit'>}}}`.
- `enginePrint` = sha256 over ordered contents of: the baseline migration file,
  `app/supabase/seeds/eval-org.sql`, `golden-search.json`. Comment at the file list:
  any future migration that replaces the function must be added here.
- Rewrite `app/src/lib/help/matching-golden.test.ts`:
  - staleness guard (recompute hash via `node:fs`/`node:crypto`);
  - per unit-layer case: repository mock returns snapshot rows →
    `findHelpCandidates` (null providers) → assert via `evaluateCase` from
    `golden.ts`;
  - keep one legacy-style diagnostics assertion (fallbacks empty, retrievedCount).

**Out:**
- Any change to SQL or fixture labels.
- Capturing for integration-only cases (capacity-gate etc. need live DB state).

## Files

| Path | What changes |
|---|---|
| `app/scripts/eval-help-search.ts` | `--capture` implementation |
| `app/src/lib/help/__fixtures__/golden-candidate-snapshots.json` | new, generated |
| `app/src/lib/help/matching-golden.test.ts` | rewritten as snapshot replay |

## Steps

1. Implement `--capture` → snapshot file written, rows present for all unit-layer
   cases.
2. Rewrite matching-golden.test.ts → `pnpm vitest src/lib/help` green with Docker
   stopped (prove the zero-DB claim).
3. Tamper test: touch a hashed file, confirm the staleness guard fails with the
   re-capture message, then restore.

## Verification

```bash
pnpm eval:search --capture
pnpm vitest src/lib/help          # with local stack stopped
pnpm tsc --noEmit && pnpm biome check . && pnpm lint
```

## Done when

- [ ] Snapshots captured and checked in; unit tier green with no DB
- [ ] Staleness guard demonstrably fires on drift
- [ ] PR opened and CI green

## Handoff notes

*Filled in 2026-08-15.*

- **What diverged from the plan:**
  - Snapshots embed a slim `identity` block (emails, topic holders,
    never-eligible) so the evaluator runs with zero DB — the plan hadn't
    accounted for IdentityIndex needing corpus knowledge.
  - enginePrint is a shared pure helper (`computeEnginePrint` in golden.ts)
    used by both the runner and the test; the hashed file list lives in two
    places (runner + test) with keep-in-sync comments.
  - tsx compiles scripts as CJS: no top-level await — the runner's tail is an
    async `finish()`.
- **What the next task needs to know:** 21 unit-layer cases replay green with
  the stack stopped; staleness guard verified by the enginePrint equality test.
- **Logged to `Backlog/`:** nothing.
