---
id: help-search-golden-baseline/10-docs-and-tech-spec
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: done
depends_on: [06, 08, 09]
pr:
---

# 10 — Docs + Production tech spec + close

> One PR. One focused session. Closes the initiative.

## Cold start

The behavior change is live; this task makes the documentation truthful and writes the
durable tech spec. Repo rule: when code and docs disagree, fix the doc in the same
change and flag the drift — the return-shape change to `api.search_help_candidates`
and the new scoring model must land in the canonical schema doc. The initiative is the
*change*; the tech spec is the *end state* — write the spec as a description of how
Help candidate search works now, not as a diff.

## Scope

**In:**
- `docs/architecture/database-v2-contract.md`: new return shape + scoring/display
  semantics of `search_help_candidates`; note the dormant `p_query_embedding` param.
- Root `FUNCTIONS.md`: check for stale signature references; fix if present.
- New tech spec `Production/help-candidate-search.md` (this vault): the baseline
  algorithm (document weights, OR-lexeme query, bigram topic matching, score formula
  with the FINAL tuned constants from task 05, structural display rule, tiebreaks),
  the golden dataset (corpus design, fixture schema, QA gate), the eval workflow
  (`pnpm eval:search`, scoreboards, `fail_ok` ledger as the AI gate), and the dormant
  AI seam (what re-enabling requires: beat `baseline-v1` on the golden set). Link the
  memory-vault decision; set `product_spec:` frontmatter.
- Update plan.md frontmatter `tech_spec:` to the real file; set initiative
  `status: done`, `closed:` date; all task boards consistent.
- Memory-vault `_log/richard.md` entry (append at top, own file only): what shipped,
  the legacy→baseline scoreboard delta, and any reversals.

**Out:**
- Rewriting ADR 0009 — it still governs; the tech spec links it.
- Product-vault changes (no member-facing behavior semantics changed beyond match
  quality; if the ask-composer UX copy changed in task 07, flag it instead).

## Files

| Path | What changes |
|---|---|
| `docs/architecture/database-v2-contract.md` | function contract update |
| `FUNCTIONS.md` | only if stale |
| `engineering-spec-obsidian-vault/Production/help-candidate-search.md` | new tech spec |
| `engineering-spec-obsidian-vault/Initiatives/help-search-golden-baseline/plan.md` | close out |
| `~/…/BridgeCircle Sync/_log/richard.md` | session entry |

## Steps

1. Diff what docs say vs what shipped → list of stale statements.
2. Update contract doc + FUNCTIONS.md → grep for old column names returns nothing.
3. Write the tech spec from the shipped code (not from this initiative's plan) →
   spec references real file paths and final constants.
4. Close the initiative; write the vault log entry.

## Verification

```bash
rg 'lexical_score|semantic_score|evidence_chunk_ids' docs/ FUNCTIONS.md
rg -l "^status: active" engineering-spec-obsidian-vault/Initiatives   # excludes this one
```

- Tech spec readable standalone by a session with no initiative context.

## Done when

- [ ] Docs match shipped behavior; tech spec exists in `Production/`
- [ ] Initiative closed; task boards consistent; vault log written
- [ ] PR opened and CI green

## Handoff notes

*Filled in 2026-08-15.*

- **What diverged from the plan:** FUNCTIONS.md had no stale references (no
  edit needed). database-v2-contract.md gained a new baseline-search
  subsection plus a drift note on profile_embedding_chunks (no longer read by
  candidate search). The whole initiative ran in one session (2026-08-14/15)
  rather than task-per-session; every task file still carries real handoff
  notes for auditability.
- **What the next task needs to know:** everything is UNCOMMITTED in the
  working tree (branch was ci/split-cd-concurrency at session start) — the
  next step is branching + PR(s). Out-of-scope leftovers: dev embedding
  backfill; diagnostics logging (session chip); two pre-existing pgTAP
  failures (Backlog note + session chip).
- **Logged to `Backlog/`:** [[Backlog/2026-08-15-pgtap-failures-preexisting]]
  (during task 01).