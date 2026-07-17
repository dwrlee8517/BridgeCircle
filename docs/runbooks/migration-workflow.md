# Migration Workflow

How to author and ship a Supabase migration in BridgeCircle. Effective post-2026-04-29.

## Setup

`bridgecircle-dev` remains a separate shared development project. During the
active database-v2 release freeze, the production Supabase GitHub integration
is disconnected and the protected, manual-only GitHub workflow is the sole
production migration owner. The current evidence is recorded in
[`production-migration-ownership-record.md`](../architecture/production-migration-ownership-record.md).

## Temporary production-ownership proof during the database-v2 cutover

The manual-only **Production migration ownership** GitHub Actions workflow is
a temporary bridge for the database-v2 cutover. It proves that the repository
can validate and apply one explicitly approved production migration before the
final application CD pipeline takes ownership. It does not deploy application
code and it cannot reset, repair, or seed a database.

Do not run or merge the workflow until the cutover release freeze is active:
the current `main` application is not compatible with the already-reset dev
database, so both the existing GitHub CD workflow and Railway source deploy
triggers must be paused first. The no-op proof succeeded and the release owner
disconnected the Supabase GitHub integration on 2026-07-17. Do not reconnect
it during the cutover.

The protected `production` environment must provide `DOPPLER_TOKEN_PRD`. Its
`bridgecircle/prd` config must provide these names (never copy their values into
GitHub, logs, or this repository):

- `APP_ENV=prod`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_DB_URL`

Dispatch from the exact `main` commit to be proven. Enter `none` for the no-op
proof, or the one approved 14-digit migration version for the later additive
probe, and type `RUN_PRODUCTION_MIGRATION_OWNERSHIP`. The workflow fails closed
unless the repository, branch, full commit SHA, production API origin,
production database identity, clean checkout, and local/remote migration
histories all match. It then performs preflight, `db push --dry-run`, the
non-interactive push, and a zero-pending postflight in that order.

This section and the temporary workflow are removed when the redesigned
application's final CD pipeline becomes the sole migration owner.

## Per-migration workflow

The following temporary sequence applies only while the database-v2 release
freeze is active:

```
1. edit / add SQL file in app/supabase/migrations/
2. rebuild and test in an isolated local Supabase stack
3. open a PR and require CI + hermetic E2E
4. merge only with the migration version explicitly approved
5. confirm production still lacks the migration
6. dispatch the protected workflow with that exact version and merge SHA
7. require preflight, dry-run, push, and zero-pending postflight
```

Do not push the legacy ownership probe to `bridgecircle-dev`; shared
development already runs database v2 while `main` still contains the legacy
history. PR C replaces this temporary sequence with the normal scripted CD
pipeline.

## Hard rules

- **Do not push to prod outside the protected workflow.** Direct CLI pushes and
  the disconnected Supabase integration are not production owners.
- **Do not expect a Supabase Preview check during the freeze.** Require the
  repository CI and hermetic E2E gates before merging.
- **No destructive rollback in this setup.** If a migration ever needs to be rolled back: write a forward-only "revert" migration. Preview branches *can* be deleted destructively — they're throwaway by design — but prod's history is append-only.
- **Never apply the legacy probe to shared development.** Validate it in an
  isolated local stack; PR C reconciles the legacy probe into the v2 history.
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
