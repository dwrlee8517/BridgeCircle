# End-to-end testing with Playwright

## Purpose

Playwright verifies rendered member flows across Next.js, server actions,
Supabase Auth, fixed database APIs, RLS, and Realtime. Use it for browser-visible
integration truth; use pgTAP and concurrency harnesses for database invariants,
and Vitest for pure behavior.

## Current rebuild status

The application and local database are v2 across Foundation, Conversation,
Help, Messages, People/Profile, School/Admin, Home, and entry/operations. The
complete local Playwright suite and production build are release gates. Hosted
development remains pending until the separately approved clean reset and
same-SHA deployment in the dev cutover plan.

Focused Help acceptance is recorded in
[`database-v2-help-test-inventory.md`](../architecture/database-v2-help-test-inventory.md).
Focused Messages acceptance is recorded in
[`database-v2-messages-test-inventory.md`](../architecture/database-v2-messages-test-inventory.md).

## Local hermetic mode

The default local workflow uses:

- app server: an E2E-owned port from `playwright.config.ts`, separate from the
  developer server on port 3000;
- database: disposable local Supabase;
- configuration: Doppler `bridgecircle/dev_local`;
- external providers: deterministic fakes or disabled keys;
- reset: `supabase db reset`, which loads `supabase/seeds/seed.sql`.

From `app/`:

```bash
pnpm db:start
pnpm db:reset
pnpm test:e2e tests/e2e/foundation/foundation-flow.spec.ts
pnpm test:e2e tests/e2e/help/help-settings.spec.ts
pnpm test:e2e tests/e2e/messages/messages.spec.ts --workers=1
```

Use `E2E_SKIP_RESET=1` only for a short local iteration when the test owns and
cleans up every mutation. Never use it as CI policy.

## Test organization

```text
tests/e2e/
├── helpers/          environment, auth, and v2 scenario helpers
├── foundation/       v2 identity/membership/profile boundary
├── help/             v2 Help settings and browser flows
├── messages/         v2 list, thread, Connection, safety, and responsive roads
├── home/             v2 dashboard composition and outcome consent
├── people,profiles/  directory, profile privacy, and Connection roads
├── school/           School reading and transactional member roads
├── dev-cutover/      opt-in read-only exact-dev smoke
├── api/              health and auth-proxy contracts
└── entry-operations/ destructive lifecycle durability, local-only
```

Retired Ask/Inbox E2E files were deleted with their routes. Do not preserve an
old test merely to document obsolete behavior; the v2 domain plan and test
inventory are the historical record.

## Isolation rules

- No spec depends on another spec having run.
- A mutating spec creates a unique organization and users with
  `helpers/foundation.ts`, then deletes them in `afterAll`.
- Stable seeded personas are for browser inspection and bounded read fixtures,
  not shared mutable state.
- Tests never call real AI or email providers in hermetic mode.
- Prefer accessible locators: `getByRole`, `getByLabel`, and `getByText`.
- Fail on browser console errors and uncaught page errors for critical roads.
- Trace and screenshot output belongs under Playwright's test-results output,
  not in committed source unless it is an approved design baseline.

## Help acceptance road

The focused Help browser gate covers:

1. private question search with no Ask side effect;
2. direct Ask create, recipient accept/decline, and idempotent retry;
3. circle Ask create, eligible offer, asker acceptance, and anonymity;
4. accepted conversation origin/opening message/send/refresh;
5. Ask resolution without disabling the conversation;
6. settings default-open, topic normalization, and manual pause;
7. error/fallback states, keyboard flow, reduced motion, and no horizontal
   overflow at 320, 390, 768, and desktop width.

Database truth for these roads is also asserted by the Help pgTAP,
concurrency, worker, maintenance, Realtime, and query-plan suites. Browser tests
do not replace those gates.

## Messages acceptance road

The focused Messages browser gate is serial and begins from a canonical local
reset because it deliberately walks lifecycle state across the fixed seed:

1. Waiting direct Ask acceptance into the unified thread, send, and reload;
2. Connection accept and quiet decline with durable database checks;
3. two authenticated contexts converging unread/read state through Realtime;
4. post-Ask Connection nudge, Ask resolution, and continued send;
5. report acknowledgement, disconnect retention, and block revocation;
6. All/Open asks/search/tied keyset paging and deleted-member fallback;
7. axe checks for root, dialogs, and mobile context plus no overflow at 1440,
   768, 390, and 320 px.

This file is one reset-owned scenario, not a dependency between independent
specs. Do not shard it. It may run against hosted development only during the
explicit one-time, reset-owned acceptance matrix described below.

## Integ mode and remote safety

`PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org` selects remote integ mode.
Remote tests must be fully self-seeding and self-cleaning because the dev
database is persistent. They must never reset a remote database.

Ordinary recurring integ mode remains factory-owned. Seed-dependent suites
stay skipped remotely unless all of these are present:

- `PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org` exactly;
- `APP_ENV=dev`;
- the explicit one-time `E2E_ALLOW_DEV_SEED=1` flag.

`pnpm test:e2e:dev-acceptance` supplies only the flag. The target helper throws
during Playwright configuration for production, preview, localhost, path, or
wrong-environment targets. Run this mode only immediately after the separately
approved clean dev reset, with the worker stopped. It intentionally advances
the fictional seed; restore the canonical seed with another approved linked
reset afterward.

The final seeded-state smoke is separate and read-only:

```bash
PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org \
APP_ENV=dev \
CUTOVER_SHA=<40-character-verified-sha> \
pnpm test:e2e:dev-smoke
```

Hosted smoke refuses every remote origin except exact dev and requires the
captured SHA. It verifies health, seeded member sign-in, all five primary
sections, and the four minimal admin surfaces without changing application
rows. The same smoke may be run against localhost during local preparation.

## Adding a test

1. Put the spec under the domain it proves.
2. Use the v2 fixed API and current route contract.
3. Create the minimum data for the scenario.
4. Assert the member-visible outcome and the durable database result after a
   refresh.
5. Add the test to that domain's inventory.
6. Run it alone, with the focused domain suite, and with all currently ported
   domain suites.

## Troubleshooting

- If reset fails, run `pnpm db:start` and confirm Docker/local Supabase is
  healthy.
- If the E2E port is occupied, stop the unrelated process; do not silently reuse
  the developer server on port 3000.
- If sign-in fails, compare configuration names/status only and confirm
  `dev_local` points to the local stack. Never print secret values.
- If a later-domain spec fails on a retired table or route, classify it as port
  inventory. Port that domain; do not add a compatibility column or redirect.

## Related documentation

- [Help test inventory](../architecture/database-v2-help-test-inventory.md)
- [Messages test inventory](../architecture/database-v2-messages-test-inventory.md)
- [Local seed](seed-dev.md)
- [Environment model](../architecture/environments.md)
- [Migration workflow](migration-workflow.md)
