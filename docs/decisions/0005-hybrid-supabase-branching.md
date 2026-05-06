# 0005 — Hybrid Supabase setup: separate Free dev project + branching integration on prod

- **Status:** accepted
- **Date:** 2026-04-29
- **Decider:** Richard
- **Supersedes:** the pre-cutover manual `supabase link` workflow

## Context

Supabase offers two paths for safe schema evolution:

1. **One project + persistent dev branch** — official recommendation. ~$10/mo per persistent branch on a Pro plan.
2. **Two separate projects (dev + prod)** — what we had pre-cutover. Free tier covers dev. But applying to prod requires `supabase link --project-ref <prod>` + `db push`, which is manual and easy to misfire.

We want PR-gated migration safety (preview branches running migrations and failing the check on broken SQL) without paying for a persistent dev branch yet.

## Decision

Hybrid setup, effective 2026-04-29:

- **`bridgecircle-dev`** stays as a separate Free Supabase project. Used for daily local development (`supabase db push` against it, `pnpm db:types` regenerates types from it).
- **`bridgecircle`** (prod) has the **Supabase + GitHub branching integration** enabled. PRs auto-create a preview branch off prod and run migrations; the "Supabase Preview" check turns green when migrations apply cleanly. Merging to `main` auto-applies migrations to prod.
- Branch protection on `main` requires the Supabase Preview check (currently advisory because GitHub Pro isn't enabled on the personal repo; treat as enforced anyway).

Full workflow in `docs/runbooks/migration-workflow.md`.

## Consequences

- **+** PR-level migration safety on prod without paying for a persistent dev branch.
- **+** Manual `supabase link` to prod is gone. Manual prod pushes are forbidden.
- **+** Free tier covers dev cost.
- **−** Dev/prod stay in sync only because we always run `pnpm dlx supabase db push` against dev before opening the PR. Skip that step → dev lags main → harmless until you try to test a future feature locally.
- **−** Two dashboards to context-switch between.
- **−** Schemas can drift between dev and prod if a migration is hand-applied to one and not the other. The PR workflow is the only safety net.

## Alternatives considered

- **Persistent dev branch on prod project (~$10/mo)** — would unify the dashboard and remove the manual `db push` step. Skipped at the 2026-04-29 cutover because the cost-vs-marginal-improvement math didn't justify it pre-launch. On the post-launch backlog (`docs/specs/phase-1/post-launch-backlog.md`).
- **Single project, destructive `db reset` for dev** — fast but loses dev data; no PR-level migration safety.
