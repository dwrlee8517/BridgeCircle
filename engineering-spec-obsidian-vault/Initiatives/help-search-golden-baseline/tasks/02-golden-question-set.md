---
id: help-search-golden-baseline/02-golden-question-set
initiative: "[[Initiatives/help-search-golden-baseline/plan|Help search — golden dataset + deterministic baseline]]"
status: done
depends_on: [01]
pr: (not yet committed — lands with the dataset PR)
# 2026-08-15: 25 cases authored; sweep run; all five adversarial objections
# RESOLVED with Richard (Bela acceptable; Ben stays hit5; First jobs removed
# from the managing+startup pool; Ari stays acceptable with rationale; crowd
# consultants deliberately unlabeled — email labels for hand-authored, topic
# pools for crowd). Automated consistency lint lands with task 03.
---

# 02 — Golden question set v1 (~24 cases) + QA gate

> One PR. One focused session — **plus a blocking human step** (Richard corrects
> labels) in the middle.

## Cold start

Author the labeled question set that defines what "the right person" means for Help
candidate search, against the task-01 eval corpus. A draft with the right *schema and
regimes* but the wrong *org references* exists at
`app/src/lib/help/__fixtures__/golden-search.json` (it referenced Chadwick Local /
Harborview; those orgs were rejected — see plan Decisions log). Reauthor it fully
against Evalfield School, referencing members by `@eval.test` email only. The
non-obvious rule: **ambiguity is only allowed when labeled** — the schema has
`must_surface` / `acceptable_surface` (neutral: never required, never penalized) /
`must_not_surface`, and any plausible unlabeled candidate found later is a dataset bug.

## Scope

**In:**
- ~24 cases per the coverage matrix in the plan-approved spec (keyword 3, stem-variant 2,
  sentence 2, coverage-ranking 2, field-locus 3, sparse-vs-rich 3, crowded+tiebreak 2,
  eligibility 3, null 1, stopword-heavy 1, vocab-mismatch `fail_ok` 2), every regime
  with ≥1 trap-backed case, 2–3 ambiguous-by-design cases using `acceptable_surface`.
- Case criteria (all mandatory): one deciding signal; ground truth defensible from
  reading profiles alone; explicit negatives; distractor density (≥5 near-miss
  competitors per `must_surface` case, ≥8 same-topic competitors for `top1` cases);
  one-line rationale.
- Expectation kinds: `top1 | hit5 | pool_only | pool_hit | empty | stable`, `also`
  nesting, `fail_ok` flag, `layers: [unit, integration]`.
- **QA gate, in order:** (1) counter-candidate sweep — SQL query per case for every
  corpus member sharing any token/topic/field signal; human-read hits; every plausible
  unlabeled candidate dispositioned (promote to must / add to acceptable / convert to
  deliberate distractor with rationale / edit corpus profile); (2) adversarial label
  review — try to refute each label, surviving objections annotated for Richard;
  (3) **Richard corrects labels (blocking)**; (4) consistency lint (delivered
  properly in task 03; hand-check here: no member in two sets, all emails exist,
  density satisfied).
- Small corpus edits to `eval-org.sql` where the sweep demands them (same PR).

**Out:**
- The evaluator/runner code (tasks 03/04).
- Growing beyond ~24 cases — comprehensive (~60) is post-baseline.
- Korean/bilingual, typos, connections-tier — keep recorded in `deferred_axes`.

## Files

| Path | What changes |
|---|---|
| `app/src/lib/help/__fixtures__/golden-search.json` | rewritten against eval org |
| `app/supabase/seeds/eval-org.sql` | only where the QA sweep demands corpus fixes |

## Steps

1. Read the corpus (`eval-org.sql`) end to end → you can list every planted trap and
   which regime it serves.
2. Draft ~24 cases with labels + rationales → schema-valid JSON (hand-check against
   the shape in the old draft's `$comment`).
3. Counter-candidate sweep per case (psql token/topic queries) → every hit
   dispositioned, zero undispositioned.
4. Adversarial review pass → objections annotated in a `review_notes` field or PR
   description.
5. **Hand to Richard for label correction** → corrections folded in, disagreement
   resolutions recorded in rationale lines.
6. Final hand lint → clean.

## Verification

```bash
python3 -m json.tool app/src/lib/help/__fixtures__/golden-search.json > /dev/null
pnpm exec supabase db reset && pnpm db:test
```

- Every case satisfies the five criteria; density counts verified by query.
- Richard has explicitly approved the labels (this is the dataset's ground truth —
  do not mark done without it).

## Done when

- [ ] ~24 cases, all regimes covered, traps and ambiguous-by-design present
- [ ] QA gate passed end to end, including Richard's correction sitting
- [ ] Corpus edits (if any) keep task-01 verification green
- [ ] PR opened and CI green

## Handoff notes

*Filled in by the session that does this task, before marking it `done`.*

- **What diverged from the plan:**
- **What the next task needs to know:**
- **Logged to `Backlog/`:**
