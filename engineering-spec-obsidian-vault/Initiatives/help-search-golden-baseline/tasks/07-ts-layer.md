---
id: help-search-golden-baseline/07-ts-layer
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: done
depends_on: [05]
pr:
---

# 07 — TS layer cutover

> One PR. One focused session.

## Cold start

Point the TypeScript layer at the new RPC return shape and make it **trust the SQL
score** — the app-layer re-ranking formula (`topic*0.35 + lexical*0.25 + semantic*0.30
+ evidence*0.10`, substring topic test, 0.12 display threshold in
`app/src/lib/help/matching.ts`) is deleted, because SQL now owns scoring and the
display rule. The non-obvious part: `findHelpCandidates` keeps its embedding/rerank
pipeline skeleton **dormant** (providers injected, route passes nulls) — that seam is
how a future AI stage gets compared against the baseline, so don't strip it. Passing
null providers also means no AI budget is consumed (`authorizeProviderUse` only fires
when a provider exists, matching.ts:86-91).

## Scope

**In:**
- `app/src/lib/help/contracts.ts`: `HelpCandidate` → `{membershipId, userId,
  displayName, headline, avatarPath, graduationYear, topics, score, matchedFields,
  matchReason}`.
- `app/src/db/repositories/help.ts`: `candidateRowSchema`/`parseHelpCandidateRow`
  (~lines 370-385) to new columns; `searchCandidates` call shape unchanged.
- `app/src/lib/help/matching.ts`: `rankDeterministically` → passthrough
  (`deterministicScore = candidate.score`); delete `hasDisplayEvidence` + old formula +
  substring test; `mergeCandidates` merges on `Math.max(score)` + union
  topics/matchedFields; result limit top 5; keep diagnostics/fallback codes untouched.
- `app/src/app/api/help/candidates/route.ts`: `embeddings: null, reranker: null`,
  `limit: 5`; response mapping picks up `matchReason` (verify it already flows).
- `app/src/workers/outbox/handlers.ts`: compile-driven updates where the circle-ask
  matching handler consumes `HelpCandidate` fields.
- `app/src/lib/help/matching.test.ts`: fixtures to new shape; keep
  fallback-diagnostics coverage (dormant-stage behavior is still contract).
- Grep sweep: `rg 'lexicalScore|semanticScore|evidenceChunkIds' app/src` must end empty.

**Out:**
- `matching-golden.test.ts` rewrite (task 08 owns it — expect it red or skipped in
  this PR only if tasks are merged separately; prefer merging 07+08 together if so).
- Removing the Voyage/Anthropic provider modules — they stay for the future comparison.

## Files

| Path | What changes |
|---|---|
| `app/src/lib/help/contracts.ts` | HelpCandidate reshape |
| `app/src/db/repositories/help.ts` | row parser |
| `app/src/lib/help/matching.ts` | passthrough scoring |
| `app/src/app/api/help/candidates/route.ts` | null providers, limit 5 |
| `app/src/workers/outbox/handlers.ts` | field usage updates |
| `app/src/lib/help/matching.test.ts` | fixture reshape |

## Steps

1. Reshape contracts + parser → `pnpm tsc --noEmit` reveals every consumer;
   fix each.
2. matching.ts passthrough + tests → `pnpm vitest src/lib/help` green.
3. Route + worker updates → `pnpm build` (route handler changed — tsc alone is not
   enough).
4. End-to-end sanity: local `pnpm dev`, sign in as `viewer-1@eval.test`, ask a
   sentence question, right helper appears with a sensible match reason.

## Verification

```bash
pnpm tsc --noEmit && pnpm vitest src/lib/help && pnpm build
pnpm biome check . && pnpm lint && pnpm check:help-cutover
```

- Observed in the running app (state what you saw, per repo rule).

## Done when

- [ ] TS compiles + tests green on the new shape; no references to dropped columns
- [ ] Candidates route serves baseline results with null providers, top 5
- [ ] Manual end-to-end observation recorded
- [ ] PR opened and CI green

## Handoff notes

*Filled in 2026-08-15.*

- **What diverged from the plan:**
  - `compareCandidates` bug found BY the golden unit layer: its membership-id
    tiebreak silently inverted the SQL's load-spreading order for tied scores
    (tiebreak-interview-twins caught it). Fix: compare score only — JS sort is
    stable, so SQL row order (pending load, recency, id) survives ties.
  - `matchedFields` replaces chunk ids in the worker's ask_matches evidence.
- **What the next task needs to know:** end-to-end observed in the running app
  (viewer-1@eval.test, business-school sentence question → 5 topic holders
  with 'Speaks to X' reasons). `pnpm build`, vitest (543), biome, eslint,
  check:help-cutover all green.
- **Logged to `Backlog/`:** nothing.
