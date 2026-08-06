# Integration testing (API-driven, in-process)

## Purpose

Integration tests exercise the **service APIs themselves** — server actions and
route handlers — in-process against a real local Supabase (real Postgres, Auth,
and RLS). Only Resend is stubbed.

They sit between the other tiers and cover what none of them do:

| Tier | Covers | Runs |
|---|---|---|
| Vitest unit (`src/**/*.test.ts`) | pure `/lib` behavior, no database | `pnpm vitest` |
| **Integration (`tests/integration/`)** | **actions + route handlers, with line coverage, against real RLS** | `pnpm test:int` |
| pgTAP / concurrency (`scripts/test-*.sh`) | database invariants, RPCs, indexes, realtime | `pnpm test:db:*` |
| Playwright (`tests/e2e/`) | rendered member flows in a browser | `pnpm test:e2e` |

The tier is **in-process on purpose**: importing and calling the exported action
and handler functions is what lets v8 collect their line coverage. Driving the
same code over HTTP would exercise it but instrument nothing.

## Running

From `app/`:

```bash
pnpm test:int                 # local Supabase (default)
pnpm test:int --coverage      # → coverage/integration/
pnpm test:int tests/integration/auth/joinFlow.int.test.ts
```

`pnpm db:start` must be up first. The runner reads connection values straight
from `supabase status`, so there is no `.env` to maintain and no way to point it
at a remote database by accident — unlike the E2E suite, it needs no Doppler
config.

## Seeding rule

Orgs and accounts are created **through real endpoints**, never by raw inserts:
provisioning (`POST /api/admin/provision-org`) mints the first org and
`super_admin`, then invite and join build members. Direct database access is
allowed only for verification reads and teardown.

This is the deliberate contrast with the E2E suite, which reads the static
`supabase/seeds/seed.sql` cast. Integration tests own the data they create and
delete it again, namespaced per run (`it+…` emails, `it-…` slugs).

## CI

The `Integration (API-driven vs local stack)` job in [`ci.yml`](../../.github/workflows/ci.yml)
boots the same local stack the E2E job uses and runs `pnpm test:int` on every
PR. It is folded into the required `CI gate`. The job holds **no secrets**.

## The dev-database target

`pnpm test:int:dev` runs the identical suite against the shared dev database.
It is opt-in and double-guarded — it refuses to start without
`INTEGRATION_ALLOW_DEV=1`, and it needs `PROVISION_SECRET` in the Doppler
`dev_personal` config. Because dev is shared, the run-scoped namespacing and the
end-of-run sweep are what keep it safe; prefer the local target unless you are
specifically validating against dev.

## Further detail

Harness internals — the cookie jar that carries real Supabase sessions across
action calls, the `next/*` shims, how invite tokens are recovered from the
outbox, teardown semantics, and how to add a test — live next to the code in
[`app/tests/integration/README.md`](../../app/tests/integration/README.md).
