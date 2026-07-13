# Migration Workflow

How to author and ship a Supabase migration in BridgeCircle. Updated
2026-07-13 for the one-time database-v2 reset.

## Setup

We currently use a **hybrid branching setup**: `bridgecircle-dev` is a separate
project for shared development, while the prod project (`bridgecircle`) still
uses the Supabase + GitHub branching integration. ADR 0014 is replacing that
prod automation with the gated scripted pipeline in phases; do not assume its
database phase is live until the rollout checklist says so. See
[`../architecture/dev-stage-cd-rollout.md`](../architecture/dev-stage-cd-rollout.md)
and [ADR 0014](../decisions/0014-scripted-cd-pipeline.md).

## Database-v2 transition exception

[ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md) authorizes one
pre-launch replacement of the active application migration history. The
exception is narrow:

- legacy migrations, the old seed, and a schema-only dump live under
  `app/supabase/legacy/`;
- active history starts with the CLI-generated
  `20260713231344_v2_init.sql` baseline;
- the baseline, seed, pgTAP suite, and generated types are developed only in
  the isolated `codex/database-v2-baseline` worktree until the backend port is
  compatible;
- no one may push the baseline to shared development or production merely
  because it passes locally;
- each remote reset still requires its own approved snapshot and cutover
  runbook.

During this transition, validate from `app/` with:

```bash
pnpm dlx supabase db reset --local
pnpm db:test
pnpm dlx supabase db lint --local --level warning --fail-on warning
pnpm dlx supabase db diff --local --schema public,api,private
pnpm db:types:local
```

An empty diff, clean lint, passing pgTAP suite, and deterministic types prove
the baseline can rebuild locally. They do not authorize a remote change. Do
not run `supabase db push`, `pnpm db:types` (linked), or migration repair
against either shared project until the matching development cutover step is
approved.

Once development and production have cut over, the exception is spent. The
baseline is immutable and every later change follows the normal forward-only
workflow below. After the first real signup, destructive changes always use
expand/contract.

## Per-migration workflow

This is the ordinary workflow outside the active v2 reset exception. It stays
in force until ADR 0014 Phase 4 replaces the prod integration with the gated
pipeline.

```
1. edit / add SQL file in app/supabase/migrations/
2. pnpm dlx supabase db push                       (applies to bridgecircle-dev)
3. pnpm db:types                                   (regenerate database.types.ts)
4. test locally
5. git push branch + open PR
6. → Supabase auto-creates a preview branch off prod and runs migrations
   → "Supabase Preview" status check on the PR turns green
7. merge PR → Supabase auto-applies migrations to bridgecircle (prod)
8. preview branch auto-deletes
```

## Hard rules

- **Do not push to prod manually.** The integration owns the prod side; manual pushes risk drift. (Step 7 replaced the old manual `supabase link --project-ref <prod>` + `db push --dry-run` + `db push` + re-link dance.)
- **Branch protection on `main` requires the Supabase Preview check to pass before merging.** Don't merge a PR with a failing migration check.
- **No destructive rollback in this setup.** If a migration ever needs to be rolled back: write a forward-only "revert" migration. Preview branches *can* be deleted destructively — they're throwaway by design — but prod's history is append-only.
- **ADR 0015 is the sole migration-history exception.** Do not use its archive
  or migration-repair procedure as precedent for an ordinary migration.
- **Always run step 2 before opening the PR.** The local dev project (`bridgecircle-dev`) and prod stay in sync only because of this. If you skip step 2, dev will be behind main; harmless until you try to test a future feature locally that depends on the missed migration.
- **Use expand/contract for any non-additive change.** See the next section. This is the single most important authoring rule in this runbook.

## Classify the migration before writing it

On merge, Supabase auto-applies the migration to prod (~30s) and Railway redeploys the app (~2–5 min). Supabase almost always wins the race, which means there's a 2–5 minute window where the new schema is live but the old code is still serving traffic. The pattern that's safe depends on what kind of change you're making.

**Additive** — safe to ship in a single PR. The old code in the deploy window doesn't see the new shape, so it can't break.

- Add a column (nullable, or NOT NULL with a default)
- Add a table
- Add an index
- Add a function, trigger, or RLS policy
- Add a foreign key on a *new* table (no existing rows to violate it)
- Add a CHECK constraint that's strictly weaker than the existing one (rare)

**Destructive** — must use expand/contract (next section). Old code in the deploy window will reference dropped/renamed shapes or violate new rules.

- Drop a column, table, or index
- Rename a column or table
- Tighten a CHECK constraint or change `nullable → NOT NULL` without a default
- Add a foreign key on an *existing* table (existing rows may violate it)
- Change a column type
- Change an RLS policy in a way that revokes existing access

When unsure, treat it as destructive. The cost of an extra PR is small; the cost of a 5-minute prod outage is not.

## Expand/contract for destructive changes

Split the change into independently-safe PRs, each shipped through a full deploy cycle before the next:

1. **Expand** — add the new shape alongside the old. Code writes to both, reads from the old.
2. **Migrate code** — switch reads to the new shape. Keep writing to both. Both schemas remain valid; deploy ordering no longer matters.
3. **Contract** — drop the old shape. No live code references it.

Architectural rationale and the rejected alternatives (Railway pre-deploy hook, blue-green, canary) live in [ADR 0008](../decisions/0008-deploy-ordering-expand-contract.md).

### Worked example: renaming `users.full_name → users.display_name`

The naïve one-PR version (`alter table users rename column full_name to display_name` + code rewrite) breaks 100% of traffic touching the `users` table for the full 2–5 min Railway build window. Don't do this. Instead:

**PR 1 — Expand**

```sql
-- migration
alter table users add column display_name text;
update users set display_name = full_name where display_name is null;
```

Code change: every write site sets *both* columns (`full_name` and `display_name`). Reads still come from `full_name`. Merge, wait for Railway to finish, verify in prod.

**PR 2 — Migrate code**

No migration. Code change only: every read site now reads `display_name`. Writes still set both. Merge, wait for Railway to finish, verify in prod.

(At this point, the deploy window is fully safe regardless of ordering — both columns are populated, both are readable, both are written.)

**PR 3 — Contract**

```sql
-- migration
alter table users drop column full_name;
```

Code change: drop the dual-write to `full_name`. Merge.

Three PRs, three deploys, zero downtime. The window after each merge is safe because either (a) no live code references the changed shape (PRs 1 and 3) or (b) no schema change happened (PR 2).

### Other common patterns

- **Adding a NOT-NULL column with no default to an existing table** → Expand: add nullable, backfill via update, then in a later migration add the NOT-NULL constraint.
- **Adding a foreign key on existing data** → Expand: add the column (or backfill it), validate that all existing rows satisfy the FK, then in a later migration add the constraint with `not valid` + `validate constraint` to avoid a long lock.
- **Tightening a CHECK constraint** → Audit existing data first, fix offending rows in app code (deployed) before the migration that adds the constraint.
- **Dropping a table** → Stop writing to it (deploy), stop reading from it (deploy), drop (deploy).

### When expand/contract isn't worth it

Pre-launch, with zero users, the window doesn't matter — you can ship destructive migrations in one PR and accept the brief breakage. Just be deliberate about the moment you switch on the discipline (no later than the first real user signup).

For genuine emergencies post-launch where expand/contract would take too long: put the site in maintenance mode before merge, wait for both Supabase and Railway to settle, re-enable. Treat as a fallback, not a normal path.
