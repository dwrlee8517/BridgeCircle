# 0005 — Hybrid Supabase setup: separate dev project + branching integration on prod

- **Status:** accepted (cost rationale partially superseded — see "Current state" below)
- **Date:** 2026-04-29
- **Decider:** Richard
- **Supersedes:** the pre-cutover manual `supabase link` workflow

> **Current state (2026-05-12):** Both `bridgecircle` and `bridgecircle-dev` now live under the same `bridgecircle` organization on the **Pro plan**. Supabase plans are billed per-org, so `bridgecircle-dev` is no longer on Free as the original rationale below assumed — it inherits Pro and pays second-project compute. The structural decision (two separate projects rather than a persistent dev branch on prod) still holds; the "$0 dev cost" consequence does not. Verify org/plan via the Supabase MCP (`list_organizations`, `list_projects`) before making any cost-driven changes.

## Context

Supabase offers two paths for safe schema evolution:

1. **One project + persistent dev branch** — official recommendation. ~$10/mo per persistent branch on a Pro plan.
2. **Two separate projects (dev + prod)** — what we had pre-cutover. Free tier covers dev. But applying to prod requires `supabase link --project-ref <prod>` + `db push`, which is manual and easy to misfire.

We want PR-gated migration safety (preview branches running migrations and failing the check on broken SQL) without paying for a persistent dev branch yet.

## Decision

Hybrid setup, effective 2026-04-29:

- **`bridgecircle-dev`** stays as a separate Supabase project for daily local development (`supabase db push` against it, `pnpm db:types` regenerates types from it). At decision time this was a Free-tier project; as of 2026-05-12 it sits under the same Pro org as prod — see "Current state" at the top.
- **`bridgecircle`** (prod) has the **Supabase + GitHub branching integration** enabled. PRs auto-create a preview branch off prod and run migrations; the "Supabase Preview" check turns green when migrations apply cleanly. Merging to `main` auto-applies migrations to prod.
- Branch protection on `main` requires the Supabase Preview check (currently advisory because GitHub Pro isn't enabled on the personal repo; treat as enforced anyway).

Full workflow in `docs/runbooks/migration-workflow.md`.

## Consequences

- **+** PR-level migration safety on prod without paying for a persistent dev branch.
- **+** Manual `supabase link` to prod is gone. Manual prod pushes are forbidden.
- **+** Free tier covers dev cost. *(No longer true as of 2026-05-12 — dev now under Pro org.)*
- **−** Dev/prod stay in sync only because we always run `pnpm dlx supabase db push` against dev before opening the PR. Skip that step → dev lags main → harmless until you try to test a future feature locally.
- **−** Two dashboards to context-switch between.
- **−** Schemas can drift between dev and prod if a migration is hand-applied to one and not the other. The PR workflow is the only safety net.

## Alternatives considered

- **Persistent dev branch on prod project (~$10/mo)** — would unify the dashboard and remove the manual `db push` step. Skipped at the 2026-04-29 cutover because the cost-vs-marginal-improvement math didn't justify it pre-launch. On the post-launch backlog (`docs/specs/phase-1/post-launch-backlog.md`).
- **Single project, destructive `db reset` for dev** — fast but loses dev data; no PR-level migration safety.
