# Migration Workflow

How to author and ship a Supabase migration in BridgeCircle. Updated 2026-07-25,
after the database-v2 cutover completed on both remotes.

## Setup

`bridgecircle-dev` is a separate shared-development project. The production
Supabase GitHub integration is disconnected, and
[`cd.yml`](../../.github/workflows/cd.yml) is the sole owner of production
migrations and deploys. Nothing else may apply a production migration — not a
direct CLI push, not the Supabase integration, not a dashboard edit.

The migration-ownership transfer that got us here is recorded in
[`production-migration-ownership-record.md`](../architecture/production-migration-ownership-record.md).

## Database-v2 transition exception — spent

[ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md) authorized one
pre-launch replacement of the active application migration history. **That
exception has been used and is now spent.** It is recorded here because the shape
of the active history depends on it:

- legacy migrations, the old seed, and a schema-only dump live under
  `app/supabase/legacy/`, archived and never pushed to a shared project;
- active history starts with the CLI-generated `20260713231344_v2_init.sql`
  baseline;
- both remote resets happened under their own explicit target/SHA approval —
  development on 2026-07-17, production on 2026-07-24.

Do not treat ADR 0015's archive or migration-repair procedure as precedent for an
ordinary migration. Every change from here is forward-only.

## Local validation gates

Before opening a PR that touches SQL, validate from `app/` with:

```bash
pnpm exec supabase db reset --local
pnpm db:test
pnpm exec supabase db lint --local --level warning --fail-on warning
pnpm exec supabase db diff --local --schema public,api,private
pnpm db:types:local
pnpm typecheck:v2-foundation
pnpm typecheck:v2-conversations
pnpm typecheck:v2-help
pnpm check:help-boundaries
pnpm check:help-cutover
pnpm test:db:conversation-concurrency
pnpm test:db:conversation-realtime
pnpm test:db:conversation-query-plans
```

An empty diff, clean lint, passing pgTAP suite, and deterministic types prove
the baseline can rebuild locally. They do not authorize a remote change. Do
not run linked generation, `db push`, reset, seed, or migration repair against
either shared project from an ordinary developer checkout.

**Both remotes are on v2 and the baseline is immutable.** Development cut over
2026-07-17; production cut over 2026-07-24 at SHA
`8d9036f89dd1ab55e73b798c4a6333f2768bcb6b` — see the
[production cutover record](../architecture/database-v2-production-cutover-plan.md#execution-record).
Every schema correction from here gets a new forward migration, even before the
first real signup. After the first real signup, destructive changes always use
expand/contract.

## Per-migration workflow

This is the ordinary workflow, active now:

```
1. edit / add SQL file in app/supabase/migrations/
2. rebuild, lint, diff, test, and regenerate deterministic types locally
3. open a PR and require CI + hermetic E2E
4. merge after review
5. cd.yml validates and applies the migration to development before code
6. hosted integration passes for the exact merge SHA
7. production approval releases the same SHA
8. cd.yml validates, dry-runs, and pushes ordinary migrations before code
```

The legacy ownership probe is archived at
`app/supabase/legacy/migrations/20260717213750_production_migration_ownership_probe.sql`
and must never be pushed to either shared project. Production is verified free of
it — the `legacy_probe_absent` postflight assertion covers this.

## Hard rules

- **Do not push to prod outside `cd.yml`.** Direct CLI pushes and the
  disconnected Supabase integration are not production owners.
- **Do not expect a Supabase Preview check.** Branch protection instead requires
  the always-report `CI gate` and `E2E gate`. For code changes those gates depend
  on lint/test, the migration-aware build, and hermetic Playwright; for docs-only
  changes they report a legitimate skip.
- **No destructive rollback in this setup.** If a migration ever needs to be rolled back: write a forward-only "revert" migration. A local stack *can* be reset destructively — it's throwaway by design — but both remotes' history is append-only.
- **ADR 0015 is the sole migration-history exception.** Do not use its archive
  or migration-repair procedure as precedent for an ordinary migration.
- **Never apply the legacy probe to a shared project.** It is archived outside the
  active v2 history; validate anything like it in an isolated local stack.
- **Use expand/contract for any non-additive change.** See the next section. This is the single most important authoring rule in this runbook.

## Classify the migration before writing it

`cd.yml` applies ordinary migrations before deploying the exact same application
SHA. The compatibility pattern that is safe still depends on what kind of change
is being made.

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
