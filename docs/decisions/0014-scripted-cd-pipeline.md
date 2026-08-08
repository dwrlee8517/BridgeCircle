# 0014 — Scripted CD pipeline: dev stage → integ gate → prod promote

**Status:** accepted (Richard, 2026-07-10) · amended 2026-08-08 — the pipeline
is now two workflows, see [Amendment](#amendment-2026-08-08--one-pipeline-two-workflows)
**Supersedes:** the prod-side halves of [0005](0005-hybrid-supabase-branching.md)
(Supabase↔GitHub integration owning prod migrations) and
[0008](0008-deploy-ordering-expand-contract.md) (deploy ordering as an
uncontrollable race). Expand/contract discipline from 0008 **remains in force**.

## Context

Until now, merging to `main` triggered two automations we didn't control:

1. The Supabase↔GitHub branching integration applied migrations to prod
   (~30 s), gated on nothing.
2. Railway auto-deployed the app from `main` HEAD (~2–5 min).

Supabase always won the race, so schema-before-code was forced, and nothing
validated a deploy against a running environment before prod moved. There was
also no deployed dev stage: local dev talked to `bridgecircle-dev`, but no
URL exercised the built app against the dev database.

## Decision

One mainline (`main`, PRs in). One pipeline owns every promotion — split
across two workflow files since the 2026-08-08 amendment below:

```
push to main
 └─ ci.yml       lint · types · tests · integration · build · mobile
                 (also on PRs, where `CI gate` is the required check)
 └─ cd.yml       ① wait-for-ci   block until CI is green for this exact SHA
                 ② deploy-dev    supabase db push → dev DB (idempotent)
                                 railway up → dev env → https://dev.bridgecircle.org
                 ③ integ         Playwright vs the deployed dev URL + dev DB
     ── gate: ③ green + manual approval (GitHub production environment) ──
 └─ promote.yml  ④ promote       supabase db push → prod DB
                                 railway up → prod env
```

- **Railway auto-deploy is disabled in both environments.** Only `railway up`
  from the pipeline (project-scoped tokens) moves them.
- **The Supabase↔GitHub branching integration is disabled.** Prod migrations
  apply via `supabase db push` inside the gated `promote` job. The dev
  project keeps the existing local `/migrate` workflow; the pipeline re-push
  is an idempotent no-op safety net.
- **Migration ordering is now chosen, not raced.** Default is schema→code
  (additive-safe, same semantics as before). Contract steps may flip to
  code→schema within a promote when that is the safe order.
- **A manual approval** (GitHub `production` environment, required reviewer)
  sits before `promote`. Removing it later is a settings toggle, not a
  pipeline change.

## Consequences

- **Gained:** a real dev stage at a stable URL; integ tests against deployed
  code + dev schema before prod moves; commit-precise prod builds (the exact
  tested SHA, no HEAD race); schema and code promoted together behind one
  gate; per-deploy ordering control.
- **Lost:** Supabase preview branches (the per-PR SQL validation check). The
  dev-stage apply + integ run replaces it. If a bad migration ever slips
  through, revisit ephemeral-branch validation in CI.
- **Risk accepted:** CI holds prod-write credentials (`SUPABASE_ACCESS_TOKEN`,
  prod DB password, Railway prod token). They live only in GitHub environment
  secrets behind the reviewer gate.
- **Still true:** migrations are forward-only; expand/contract for anything
  destructive. A promote that fails between `db push` and `railway up` leaves
  prod on old code + new schema — the same window 0008 describes, now bounded
  by the pipeline rather than by luck.
- `railway up` builds from CI-uploaded source, so Railway's UI no longer
  links deploys to commits. The pipeline run is the audit trail.

## Rollout

Phased, never-broken: see
[`../architecture/dev-stage-cd-rollout.md`](../architecture/dev-stage-cd-rollout.md).
The integration and auto-deploys are switched off only when their scripted
replacement is proven.

## Amendment (2026-08-08) — one pipeline, two workflows

**What went wrong.** `cd.yml` carried all four stages under a single
workflow-level `concurrency: cd-main` group. A GitHub `concurrency` group
covers a run for its *entire* lifetime, including the time a job spends
waiting on an environment approval — and only one run may sit pending in a
group, so each new arrival cancels the one already queued. Run `30233957345`
finished its dev stage on 2026-07-27 and then waited 12 days for the
production approval. Every push to `main` in that window queued behind it and
was cancelled having executed **zero jobs**: nine commits, none of which ever
reached the dev stage. The next run started `deploy-dev` three seconds after
the promote was finally approved.

The design mistake was making a stage that waits on a *human* share a
concurrency group with the stages that must keep flowing.

**The change.**

- `promote` moves to its own workflow, `.github/workflows/promote.yml`,
  triggered by `workflow_run` when **CD** concludes success on `main`. It
  holds group `cd-prod`; `cd.yml` holds `cd-dev`. A pending approval can no
  longer stall the dev stage.
- `workflow_run` fires against the branch tip, not the tested commit, so
  everything in `promote.yml` resolves its commit from
  `github.event.workflow_run.head_sha` (exported as `CUTOVER_SHA`). Using
  `github.sha` there would promote whatever landed on `main` after the tests
  ran. The `check:production-cutover` ratchet enforces this.
- The approval UX is unchanged: promotion still queues automatically after a
  green dev run and still waits for a required reviewer on the `production`
  environment.
- A new `wait-for-ci` job gates the dev stage on CI passing for that exact
  SHA. Branch protection's `CI gate` certifies each PR branch, but CD and CI
  triggered off the same push and ran in parallel, so nothing checked the
  merge commit *itself* before it deployed — two PRs that each pass alone can
  break together on `main`. It fails closed — no CI run for the commit means
  no dev deploy — which is why `cd.yml` and `ci.yml` must keep identical
  `paths-ignore` lists.
- Because approvals queue, `promote.yml` refuses to move production backwards:
  it compares the commit under promotion against the SHA production currently
  serves and fails if that would be a rollback. Advisory — if prod's health
  endpoint is unreadable it warns and continues.

**Accepted tradeoff.** Approvals still accumulate one per push, and GitHub
keeps at most one queued behind the one awaiting review. Approving an older
entry ships an older (still fully tested) commit; the backwards guard catches
only the case where it would actually regress production. Promoting on a
cadence — rather than letting approvals pile up — keeps this a non-issue.
