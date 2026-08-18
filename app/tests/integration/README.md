# Integration tests

A third test tier, between the DB-free unit specs under `src/` (vitest) and the
browser E2E suite under `tests/e2e/` (Playwright).

**What it tests:** the service APIs themselves — server actions and route
handlers — driven **in-process** against a **real Supabase** (real Postgres,
Auth, and RLS). Nothing is stubbed except Resend (the one external boundary).

**Why in-process, not HTTP:** importing and calling the exported action/handler
functions is what lets v8 record their **line coverage**. Firing HTTP at a
running dev server would exercise the same code but instrument nothing.

## Running

```bash
# Local Supabase (default). Requires Docker + `npx supabase start`.
pnpm test:int

# A single file, or any vitest flag:
pnpm test:int tests/integration/auth/joinFlow.int.test.ts
pnpm test:int --coverage        # → coverage/integration/

# The SAME suite against the shared dev DB (opt-in, double-guarded).
INTEGRATION_ALLOW_DEV=1 pnpm test:int:dev
```

`run-local.sh` pulls connection env straight from `supabase status`, so there's
no `.env` juggling and no way to point at a remote DB by accident. Only the four
vars below are needed — Resend and the other outbound services are stubbed — so
this target does not require the Doppler `dev_local` config the e2e suite uses.

CI runs this suite on every PR — the `Integration (API-driven vs local stack)`
job in `.github/workflows/ci.yml`, folded into the required `CI gate`. CI runs
with `--coverage`, which arms the ratchet floor in
`vitest.integration.config.ts`: raise the thresholds when your PR raises
coverage; never lower them silently. The
operational guide lives at
[`docs/runbooks/integration-testing.md`](../../../docs/runbooks/integration-testing.md);
this file covers the harness internals.

**Troubleshooting**

| Symptom | Cause | Fix |
|---|---|---|
| `Invalid schema: api` | containers were started from an older `config.toml` that didn't expose the `api` schema | `npx supabase stop --no-backup && npx supabase start` |
| API gateway on `:54321` unreachable | stale/exited containers after a machine sleep | same as above |
| Schema errors on tables/columns | local DB is behind the migrations | `npx supabase db reset` |

## The "APIs only" rule

Orgs and accounts are created **through real endpoints**, never by raw DB
writes:

```
provisionOrg  →  POST /api/admin/provision-org   (mints org + first super_admin)
invite        →  inviteFromForm  (admin action)  →  enqueues send_invite_email
token         →  api.claim_outbox_jobs           (same RPC the worker uses)
join          →  signUpWithPassword (join action) →  member account + membership
```

`bootstrapTenant()` runs the first step and signs the admin in; from there a
test builds its world through the same actions the app uses.

**Recovering the invite token.** v2 never persists the raw token:
`private.issue_invite` mints it in SQL, stores only `token_hash` (sha256), and
hands the raw value to the outbox as a `send_invite_email` payload — the sent
email is the only other copy. So `latestInviteToken()` claims the job through
`api.claim_outbox_jobs`, exactly as the production worker does, and completes
it afterwards so no job is left locked. There is no "read the token column"
shortcut, because there is no token column.

The only direct DB access is in **reads** (verifying what an action wrote) and
in **teardown** (cleanup isn't creation).

## Provisioning and the v2 model

`provisionOrganization` writes in the order v2's model requires:

```
organizations → auth user → organization_memberships → profiles
→ organization_profiles → admin_role_assignments
```

The membership comes before the role grant because v2 attaches admin roles to a
**membership** (`organization_membership_id`), not to a user, and the
person-scoped profile is `profiles.display_name` (there is no `base_profiles`).
This mirrors `supabase/seeds/seed.sql`, the reference bootstrap. Each step
compensates on failure so a half-built tenant never blocks a retry.

## Isolation & cleanup — one shared DB, per-run seeds

- Each test file owns a `SeedScope` with a unique run id. Every seeded email
  (`it+<runId>-…`) and org slug (`it-<runId>-…`) carries that id, so runs never
  collide and the app's own org isolation keeps tenants from seeing each other.
- `afterAll(() => teardownScope(scope))` deletes exactly what the run created
  (orgs cascade to org-scoped rows; auth-user deletes cascade to user-scoped
  rows; `audit_log` is cleared explicitly since it's `on delete set null`).
- `globalTeardown` runs `sweepAllTestData()` when `INTEGRATION_SWEEP=1` (set by
  both scripts) — the backstop that purges `it+/it-` leftovers from a crashed
  run. This is what makes the dev-DB target safe.

## Adding a test

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bootstrapTenant, type Tenant } from '../harness/bootstrapTenant'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'

const scope = new SeedScope()
let tenant: Tenant
beforeAll(async () => { tenant = await bootstrapTenant(scope) })
afterAll(async () => { await teardownScope(scope) })

it('does the thing', async () => {
  // Drive a real action as the admin (or any user) via callAction(jar, () => action(...)).
  // See harness/apiClient.ts for the drivers.
})
```

Drive actions through `harness/apiClient.ts` so a `CookieJar` is bound (real
session cookies) and Next's `redirect()` / `notFound()` are normalized into an
outcome. One `CookieJar` == one signed-in identity.

## The GraphQL parity suite

`tests/integration/graphql/` is a distinct kind of test in this tier. The rest
of the suite asserts that an API does the right thing; parity asserts that
**two APIs do the same thing** — every operation in
`src/graphql/parity/manifest.ts` run both through the graph and through the
`db/repositories` function it delegates to, as the same user, and diffed.

It follows this tier's rules (real APIs only, in-process for coverage, one
`SeedScope` per file) with two additions specific to proving equivalence:

- Every manifest operation needs an executable case or a written
  `PARITY_PENDING` reason — a new slice cannot land silently uncovered.
- Every case must return something. Empty equals empty, so a case with no data
  proves nothing; say `allowEmpty` with a reason when emptiness is correct.

Protocol and the in-process-vs-HTTP deviation:
[`docs/architecture/graphql-parity.md`](../../../docs/architecture/graphql-parity.md).

## Env

`run-local.sh` supplies these from `supabase status`; the dev target reads them
from Doppler (`dev_personal`). `PROVISION_SECRET` must be added to the dev
config — it guards the provisioning route.

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | user-scoped client key |
| `SUPABASE_SECRET_KEY` | service-role key (admin client, teardown) |
| `PROVISION_SECRET` | bearer token for `POST /api/admin/provision-org` |
