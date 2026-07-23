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

## Two organizations, two jobs

The seed creates both pilot schools, and they are not interchangeable:

- **Chadwick School (Local)** is the *tested* fixture. The pgTAP suite asserts
  against its directory roster, Home projections, Ask idempotency, and event
  offer lifecycle. Adding members or Asks here will break assertions in
  `supabase/tests/database/`. Change it only deliberately, and update the
  dependent assertions in the same commit.
- **Chadwick International (Local)** is the *rich* fixture. It carries the
  global chapter calendar, profile depth, circle offers, the paused helpers, the
  at-cap asker, and the admin review queue. Prefer adding new fixture richness
  here.

One member deliberately holds a membership in **both** organizations, with a
different class year in each. Identity is user-scoped and everything else is
membership-scoped, and that row is what proves it.

Between them the two organizations now cover every status the schema allows for
Asks (both kinds), Ask offers, invites, memberships, RSVPs, events,
announcements, newsletter issues, account state, admin roles, and helper pause
reasons. When you add a status to a constraint, add a row for it here too.

## Tier 2: the generated demo population

`app/supabase/seeds/seed.sql` is Tier 1 — small, hand-authored, deterministic,
and asserted against by pgTAP and the E2E suites. **It must stay small.**

`pnpm seed:demo` is Tier 2: a generated population sized to what one pilot
organization plausibly looks like after a year. It exists so the directory,
Help, and search surfaces can be judged at realistic scale instead of at eight
rows. Run it after a reset:

```bash
pnpm db:reset && pnpm seed:demo
```

Knobs, all optional:

| Variable | Default | Purpose |
|---|---|---|
| `DEMO_MEMBERS` | `1200` | Population size. Roughly one Chadwick International alumni base. |
| `DEMO_SEED` | `bridgecircle` | Changes the population while keeping it reproducible. |
| `DEMO_ORG_ID` | Chadwick International | Target organization. |

Properties worth knowing:

- **Deterministic.** Same seed and count always rebuild the same population.
  Every value is a pure function of `(seed, member index)`.
- **Re-runnable.** Every generated row carries a `dddddddd-` UUID prefix, and
  the script deletes its previous output before regenerating. Change
  `DEMO_MEMBERS` and re-run; no reset needed.
- **Additive.** It never modifies Tier 1 rows, and the pgTAP suite still passes
  with the demo population loaded.
- **Not loginable.** Generated members exist in `public.users` with no
  `auth.users` row. Sign in as a Tier 1 persona and look at the app around them.
- **Bridged.** The Tier 1 personas in the target organization are wired into the
  generated graph, so each lands with a circle of roughly 17–33 people in their
  own class year and the open-to-help ones get a Help inbox. Without this the
  generated population only connects to itself, and signing in as a persona
  shows a large directory but an empty circle — the exact thing this tier is
  meant to fix. Members still mid-onboarding are excluded so their cold-start
  empty state survives.
- **Local only.** It refuses non-local targets unless `DEMO_ALLOW_REMOTE=1`, and
  refuses production identifiers outright.

This is not a load test. The `test-*-query-plans.sh` scripts already generate
larger volumes inside a rolled-back transaction to validate indexes. The
difference is that this data persists, so you can actually look at it.

### Why the distributions are shaped the way they are

The counts matter far less than the shape, and three properties are deliberate:

- **Most members are nearly empty.** Roughly 12% have a full profile, 33% have a
  headline and employer, and the rest have little more than a name. The modal
  member of a real network has filled in almost nothing, and a fixture where
  everyone is complete makes every surface look better than it will in
  production.
- **Connections cluster and have hubs.** About 64% of edges are within a single
  class year and 79% within one year, with a thin tail of members holding 30+
  connections. Uniform random edges would produce almost no mutual connections
  (making that feature look broken) and no hot rows (making performance look
  better than it is). Around a third of members have no connections at all, so
  the empty states stay reachable.
- **Text lengths vary honestly.** Questions and headlines range from three words
  to well past every truncation threshold in the UI. Everyone remembers to test
  long text; the one-line ask is the case that actually breaks a card layout.

If you change a distribution, change the reason in the script comment too.

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
