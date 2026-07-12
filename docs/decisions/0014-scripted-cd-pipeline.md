# 0014 — Scripted CD pipeline: dev stage → integ gate → prod promote

**Status:** accepted (Richard, 2026-07-10)
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

One mainline (`main`, PRs in). One pipeline (`.github/workflows/cd.yml`,
push-to-main) owns every promotion:

```
push to main
 └─ cd.yml
     ① quality gates (existing CI remains on PRs)
     ② deploy-dev    supabase db push → dev DB (idempotent)
                     railway up → dev env → https://dev.bridgecircle.org
     ③ integ         Playwright vs the deployed dev URL + dev DB
     ── gate: ③ green + manual approval (GitHub production environment) ──
     ④ promote       supabase db push → prod DB
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
