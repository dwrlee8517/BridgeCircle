# Seeding development data

## Current rule

The v2 rebuild has one checked-in seed source:
`app/supabase/seeds/seed.sql`. It targets the local disposable Supabase stack,
hermetic CI, and the one explicitly authorized disposable hosted-development
reset. It is applied automatically by `supabase db reset` locally and by the
approved linked reset during the dev cutover.

The previous admin-API remote seed script was deleted during the Help cutover.
It encoded the retired schema and must not be restored as a compatibility
layer. Every v2 application domain is now ported, so hosted development reuses
the SQL seed instead of maintaining a second fixture graph.

## Reset and seed the local stack

From `app/`:

```bash
pnpm db:start
pnpm db:reset
```

`db:reset` drops the local database, reapplies the v2 baseline and later
migrations in order, and then runs `supabase/seeds/seed.sql`.

This command is intentionally destructive and is local-only. Before running
it, confirm `supabase status` points at `127.0.0.1` and not a linked remote
project.

## Current local personas

The seed file itself is canonical for exact rows and credentials. The primary
interactive account is:

- `richard@example.com`
- `devseed-password-richard`

Additional seeded members exist to exercise membership, Connection,
conversation, Help, Messages, matching, and School fixtures. The Messages
matrix includes pending Ask/Connection decisions, unread and resolved Ask
threads, disconnected history, blocked-hidden history, a deleted-member
tombstone, and more than one 30-row page with a tied cursor. Do not duplicate
the cast or UUIDs in this runbook; the executable seed is canonical.

## Extending the seed

Add data only when the corresponding v2 domain contract exists.

1. Use deterministic UUIDs grouped by domain.
2. Insert parents before children and preserve organization/membership composite
   foreign keys.
3. Use normalized v2 tables (`profiles`, `helper_topics`, `connections`,
   `conversations`, unified `asks`/`ask_offers`).
4. Avoid provider or external-service calls.
5. Keep every persona obviously fictional.
6. Run `pnpm db:reset`, database tests, and the domain's E2E after each change.

Do not add legacy-shaped adapter rows, dual-write columns, or old route data to
make an unported screen appear functional. Port that domain first, then add the
smallest credible fixture for it.

## Stateful test data

Hermetic Playwright suites that mutate data should create a unique organization
and users through `tests/e2e/helpers/foundation.ts`, then delete them in
`afterAll`. The checked-in seed is for stable browser inspection and read-only
fixtures, not cross-test coordination.

The focused Messages suite is the narrow exception: one serial, reset-owned
scenario intentionally advances the canonical Messages matrix and proves
durable lifecycle transitions. It normally runs locally after `pnpm db:reset`.
During the one-time hosted-dev acceptance pass it may run only when the exact
dev origin, `APP_ENV=dev`, and `E2E_ALLOW_DEV_SEED=1` all pass the checked-in
target guard. It must never run against production.

## Hosted development cutover

The development project has no real users or data to preserve. Its one-time v2
cutover is therefore a clean rebuild, not a data migration. Follow
[`database-v2-dev-cutover-plan.md`](../architecture/database-v2-dev-cutover-plan.md):

1. commit and verify one clean cutover SHA;
2. run `pnpm cutover:preflight:dev` from `app/` and retain only its non-secret
   target and count evidence;
3. obtain separate approval naming that SHA and the allowlisted dev project;
4. run the checked-in CLI linked reset, which replays active migrations and
   this seed;
5. deploy the same SHA to hosted dev and run the explicit acceptance matrix;
6. reset once more to restore the canonical fixture, then run the read-only
   smoke and start the same-SHA worker.

The preflight is deliberately read-only. It requires the exact branch, a clean
worktree, current `main` ancestry, the allowlisted linked project,
`APP_ENV=dev`, and matching Supabase API/database hosts. It rejects production
identifiers before collecting counts.

## Production

Production must never run this seed. Production reset, migration, deployment,
and approval remain a separate future plan. The hosted-development exception
does not create a general remote-seeding path.
