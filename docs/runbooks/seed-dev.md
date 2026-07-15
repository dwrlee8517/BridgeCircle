# Seeding development data

## Current rule

The v2 rebuild has one checked-in seed source:
`app/supabase/seeds/seed.sql`. It targets the local disposable Supabase stack
and is applied automatically by `supabase db reset`.

The previous admin-API remote seed script was deleted during the Help cutover.
It encoded the retired schema and must not be restored as a compatibility
layer. Remote dev seeding will be designed after every application domain has
been ported to v2.

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
conversation, Help, matching, and School fixtures. Do not duplicate the cast
in this runbook; keeping credentials in one executable source prevents drift.

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

## Remote development and production

Do not reset or seed either remote database during local vertical-slice work.
The later remote-cutover runbook must include:

1. a snapshot;
2. an explicit dev-project target check;
3. destructive reset/migration;
4. a new v2 remote seed or bootstrap path;
5. deployed application/worker verification;
6. a separate manual production approval.

The local seed succeeding is not evidence that the full application is ready
for remote cutover.
