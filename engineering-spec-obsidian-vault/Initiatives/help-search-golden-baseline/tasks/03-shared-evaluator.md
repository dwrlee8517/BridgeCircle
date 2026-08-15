---
id: help-search-golden-baseline/03-shared-evaluator
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: blocked
depends_on: [01]
pr:
---

# 03 — Shared evaluator (`golden.ts`)

> One PR. One focused session.

## Cold start

Build the single pure module both test layers (unit Vitest + psql eval runner) assert
through, so "what counts as passing a case" has exactly one implementation. It consumes
`app/src/lib/help/__fixtures__/golden-search.json` (schema documented in that file's
`$comment`; task 02 may still be in flight — the schema is stable even while labels
change, coordinate if a field is added). Pattern precedent for pure lib + colocated
test: everything in `app/src/lib/help/` (e.g. `cursors.ts`/`cursors.test.ts`). No
Next.js/Supabase imports — `/lib` discipline.

## Scope

**In:**
- `app/src/lib/help/golden.ts`:
  - zod schema for the fixture (`GoldenCase`, `Expectation` kinds
    `top1|hit5|pool_only|pool_hit|empty|stable`, `also` nesting, `acceptable_surface`,
    `must_not_surface`, `fail_ok`, `layers`, `regime`, `rationale`).
  - `evaluateCase(caseDef, runs: ResolvedRow[][], identity: IdentityIndex): CaseResult`
    — pure. `ResolvedRow = {membershipId, email, topics}`; `IdentityIndex` maps fixture
    emails → membership ids and knows viewer + non-opted-in members for universal
    invariants. `stable` consumes two runs. `acceptable_surface` neutral. `must_not`
    violations and invariant violations are hard failures. Empty-correctness for
    `empty` kind. Pool kinds resolve topic names → member sets via the identity index.
  - `lintFixture(fixture, corpusIndex): LintError[]` — consistency lint: no member in
    two assertion sets of one case; every referenced email exists; distractor-density
    check (needs corpus topic counts — part of `IdentityIndex`/`corpusIndex`);
    `fail_ok` cases still carry labels.
  - Per-regime aggregation: `summarize(results): RegimeSummary[]` — hit@5 per regime,
    hard-failure list, `fail_ok` ledger separated; never a single blended average.
- `app/src/lib/help/golden.test.ts` — unit tests for the evaluator itself with
  hand-built tiny fixtures (each kind passes and fails at least once; neutrality of
  acceptable; invariants; lint errors).

**Out:**
- Reading the DB or running psql (task 04 owns I/O).
- Scoreboard file format details beyond types (task 04).

## Files

| Path | What changes |
|---|---|
| `app/src/lib/help/golden.ts` | new |
| `app/src/lib/help/golden.test.ts` | new |

## Steps

1. Read the fixture `$comment` + one case of each kind → schema captured in zod.
2. Implement types + `evaluateCase` → golden.test.ts cases for each kind green.
3. Implement `lintFixture` + `summarize` → tests green.
4. Validate the real fixture parses: tiny test that `zod.parse` succeeds on the
   checked-in JSON (skip label semantics — task 02 owns those).

## Verification

From `app/`:

```bash
pnpm vitest src/lib/help/golden.test.ts
pnpm tsc --noEmit && pnpm biome check . && pnpm lint
```

- Every expectation kind has a passing and failing test.
- The checked-in fixture parses under the zod schema.

## Done when

- [ ] `evaluateCase` + `lintFixture` + `summarize` pure and fully unit-tested
- [ ] Real fixture parses
- [ ] PR opened and CI green

## Handoff notes

*Filled in by the session that does this task, before marking it `done`.*

- **What diverged from the plan:**
- **What the next task needs to know:**
- **Logged to `Backlog/`:**
