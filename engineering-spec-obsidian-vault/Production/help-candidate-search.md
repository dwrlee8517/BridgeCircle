---
title: Help candidate search
status: production
updated: 2026-08-15
product_spec: ../../product-spec-obsidian-vault/Production/phase-1/spec.md
initiative: "[[Initiatives/help-search-golden-baseline/plan|help-search-golden-baseline]]"
memory_note: "BridgeCircle Sync/memory/decisions/2026-08-15-0022-richard-help-search-deterministic-baseline-before-ai.md"
---

# Help candidate search

How the ask composer's "find people" search is actually built, as of the
deterministic baseline (2026-08-15). One SQL function owns retrieval, scoring,
and the display rule; the TypeScript layer is a passthrough with a dormant
AI seam; a golden evaluation dataset is the quality gate for any change.

## Data flow

```
help-question-form (700ms debounce, ≥12 chars)
  → POST /api/help/candidates            app/src/app/api/help/candidates/route.ts
  → findMemberHelpCandidates             app/src/lib/help/matching.ts   (providers: null)
  → repository.searchCandidates          app/src/db/repositories/help.ts
  → api.search_help_candidates           SQL, owns everything below
      eligibility → document → rarity-weighted scoring → structural display → tiebreaks
```

The worker's circle-ask matching (`run_ask_matching` in
`app/src/workers/outbox/handlers.ts`) reaches the same `private.` function via
`api.search_ask_matching_candidates` (service_role).

## The SQL baseline

Migration: `app/supabase/migrations/20260815090000_help_search_deterministic_baseline.sql`
(its header comment is the canonical inline description).

- **Eligibility (unchanged since v2, copied verbatim):** `open_to_help`, not
  paused, active user + membership, not the viewer, not blocked either
  direction, waiting direct asks < `max_pending_requests`.
- **Document:** ONE weighted tsvector per eligible helper, built inline —
  A `helper_topics` · B headline/title/industry · C employer/university/major/
  city · D org-profile bio + `profile_experiences` text. No stored document
  table (spans four tables; seeded corpora would miss hook-maintained state);
  the latency guard (below) is the tripwire for that escape hatch.
- **Query:** lexemes of `to_tsvector('english', question)`, OR-ed into one
  tsquery built from quoted lexemes (no tsquery injection). Zero informative
  lexemes → zero rows.
- **Topic hit:** a topic counts only when **all** its lexemes appear in the
  query ("for the first time" cannot claim "First jobs" via 'first').
- **Score:** `Σ_matched-lexeme (1/df) × Σ weight-classes` (A 1.0 · B 0.5 ·
  C 0.3 · D 0.2, each class once per lexeme; df = eligible docs containing the
  lexeme) `+ 0.5` topic bonus (`0.8` for ≥2 matched topics). Deliberately not
  BM25/TF-IDF: no TF (binary per class kills keyword-stuffing), raw `1/df`
  rarity (proper nouns are usually the query's point), no length
  normalization (documents are short and uniform). `ts_rank_cd` was measured
  and rejected (unnormalized, no rarity); a flat coverage term was measured
  and rejected (paid generic words like "talk" the same as the subject).
- **Display (structural, no numeric threshold):** topic hit or an A/B/C-class
  hit — D text alone never displays anyone. **Topic-cut:** when ≥3 candidates
  hit topics, only topic-hitters display (enough members explicitly offer the
  topic; text matches are padding). This is what kills the trap classes:
  aspirational bios, employer-name collisions, split phrases.
- **Ties:** fewer pending asks → most recent profile update → membership id.
- **Return:** `score`, `matched_fields` (`topics|headline|credentials|profile`),
  `match_reason` ("Speaks to <topic>" or the headline). Params kept identical
  to v2, `p_query_embedding` accepted and ignored — the semantic seam.

## The TypeScript layer

`findHelpCandidates` trusts SQL: `rankDeterministically` passes `score`
through; there is no app-side threshold or reordering. `compareCandidates`
compares score ONLY — JS stable sort preserves SQL's tie order (an id tiebreak
here inverted the load-spreading order; the golden unit case
`tiebreak-interview-twins` caught it). Display limit is 5. The embedding/
rerank pipeline skeleton stays dormant: the route injects `embeddings: null,
reranker: null`, so no AI budget is consumed. Degradation diagnostics are
still computed (and still discarded by the route — a known gap with its own
task).

## The golden dataset (the quality gate)

- **Corpus:** `app/supabase/seeds/eval-org.sql` — "Evalfield School"
  (`eeeeeeee-…`), local-only, seeded on every `db reset`. ~1,203 members: 123
  hand-authored (completeness × signal-locus × trap matrix, per-member case
  comments) + 1,080 deterministic crowd (`md5('eval:'||n)`), ~355 eligible
  helpers. All members sign in as `…@eval.test` / `eval-password`.
- **Cases:** `app/src/lib/help/__fixtures__/golden-search.json` — 25 labeled
  cases (v1.1, labels approved by Richard 2026-08-15). Kinds: top1 · hit5 ·
  pool_only · pool_hit · empty · invariants_only · stable · order;
  `acceptable_surface` marks labeled ambiguity; `fail_ok` cases are the
  vocabulary-mismatch ledger a future semantic stage must flip.
- **Evaluator:** `app/src/lib/help/golden.ts` — one pure implementation of
  pass/fail shared by both layers, plus the fixture consistency lint.
- **Integration layer:** `pnpm eval:search` (`app/scripts/eval-help-search.ts`)
  — per case, psql `begin/rollback` with viewer impersonation against the real
  RPC. `--scoreboard --engine <label>` writes `app/output/eval/…`;
  `--capture` writes unit snapshots. Exit 0 = all assertable cases green.
- **Unit layer:** `app/src/lib/help/matching-golden.test.ts` replays captured
  rows through the TS pipeline with zero DB, guarded by an `enginePrint` hash
  (corpus + fixture + migration) that fails with a re-capture instruction on
  drift.
- **Scoreboards:** `help-search-legacy-*.json` (12/25, upper bound on the old
  UX) vs `help-search-baseline-v1-*.json` (23/23 + 2 expected misses).

## Guards

- pgTAP `app/supabase/tests/database/025_help_search_baseline.test.sql` —
  shape, grants, gates, stemming, determinism on Tier-1 personas.
- Latency: `pnpm test:db:help-query-plans` seeds ~2,000 eligible helpers and
  hard-fails above 1000 ms. Measured 66 ms (2026-08-15) after the class-sum
  optimization; the first field-sum implementation measured 5,658 ms and was
  rewritten — if this guard trips again, the escape hatch is a
  trigger-maintained document table.

## Re-enabling AI stages

Any semantic/rerank stage must (1) run behind the existing provider seam,
(2) beat `baseline-v1` on the golden set — flipping `fail_ok` cases without
regressing others — and (3) justify its latency/cost against the scoreboard
diff. The decision requiring this gate lives in the memory vault (see
frontmatter).
