# Production v2 cutover operator runbook

> **Status:** prepared, not authorized. Do not execute a production-changing
> command until PR C is merged and Richard approves the exact production
> project and 40-character merge SHA in the form required below.

This runbook turns the approved architecture plan into one fail-closed operator
sequence. The detailed rationale, abort matrix, and acceptance criteria remain
in [`../architecture/database-v2-production-cutover-plan.md`](../architecture/database-v2-production-cutover-plan.md).

## Fixed boundary

- Production project: `edumxwzilfgvamzarwvo`
- Run from a clean detached checkout of the approved merge SHA.
- Production environment comes from Doppler `bridgecircle/prd`.
- Never link the checkout to production.
- Never load `supabase/seeds/seed.sql`.
- Never reconnect the Supabase GitHub integration or Railway source deploy.
- A failed guard means stop; do not weaken it interactively.

The required destructive approval is:

`I approve the destructive production-v2 reset of project`
`edumxwzilfgvamzarwvo at SHA <40-character SHA>.`

## 1. Create the immutable operator checkout

From the repository root, substitute only the approved merge SHA:

```bash
git fetch origin main
git worktree add --detach /private/tmp/bridgecircle-production-v2 <APPROVED_SHA>
cd /private/tmp/bridgecircle-production-v2/app
pnpm install --frozen-lockfile
export CUTOVER_SHA=<APPROVED_SHA>
```

Verify `git status --porcelain` is empty, `git branch --show-current` prints
nothing, and `git rev-parse HEAD` exactly matches `CUTOVER_SHA`.

Every command below is wrapped by Doppler so `APP_ENV`, Supabase origins, and
the database URL are independently validated before access.

## 2. Read-only reset and snapshot plans

```bash
doppler run -p bridgecircle -c prd --preserve-env -- \
  pnpm exec tsx scripts/production-v2-reset.ts --mode=plan

export SNAPSHOT_OUTPUT_DIR=<ABSOLUTE_COLD_STORAGE_DIRECTORY>
export SNAPSHOT_GPG_RECIPIENT=<GPG_RECIPIENT>
doppler run -p bridgecircle -c prd --preserve-env -- \
  pnpm exec tsx scripts/snapshot-production-v2.ts --mode=plan
```

The reset plan must report zero Auth users, application users, memberships,
invites, messages, and Storage objects. Any nonzero value stops the clean-slate
cutover and requires data classification.

## 3. Pause writers and create the encrypted snapshot

Pause production web, worker, schedules, and manual deploys in Railway. Confirm
no outbox claim or deployment is active. Then:

```bash
export PRODUCTION_SNAPSHOT_EXECUTE=1
export PRODUCTION_SNAPSHOT_CONFIRM="SNAPSHOT edumxwzilfgvamzarwvo AT $CUTOVER_SHA"
export SNAPSHOT_DELETION_DATE=<YYYY-MM-DD>
doppler run -p bridgecircle -c prd --preserve-env -- \
  pnpm exec tsx scripts/snapshot-production-v2.ts --mode=execute
```

The command creates an encrypted custom-format database dump, encrypted Storage
metadata/configuration manifest, and checksums outside the repository. It never
prints the database URL. Restore the dump into a throwaway compatible database
and compare catalog/counts before continuing. A snapshot without a successful
restore test is not valid cutover evidence.

## 4. Execute the one-time reset

Only after the exact-SHA approval, zero-data proof, paused writers, encrypted
snapshot, and restore test:

```bash
export PRODUCTION_V2_RESET_EXECUTE=1
export PRODUCTION_V2_ZERO_DATA_ACK=1
export PRODUCTION_V2_RESET_CONFIRM="RESET edumxwzilfgvamzarwvo AT $CUTOVER_SHA"
doppler run -p bridgecircle -c prd --preserve-env -- \
  pnpm exec tsx scripts/production-v2-reset.ts --mode=execute
```

This is the only repository entry point allowed to run a remote reset. It uses
the pinned Supabase CLI with `--no-seed`, and it refuses a branch checkout,
dirty tree, wrong SHA, wrong project, wrong environment, or wrong confirmation.

## 5. Prove the v2 database before code

```bash
doppler run -p bridgecircle -c prd --preserve-env -- \
  pnpm exec tsx scripts/remote-v2-migrations.ts --target=production --mode=postflight

doppler run -p bridgecircle -c prd --preserve-env -- \
  pnpm exec tsx scripts/production-v2-postflight.ts
```

Both must pass. The second command checks exact migration history, core tables,
RLS, Auth trigger, Storage buckets, Realtime publication, sensitive anonymous
grants/policies, and removal of the legacy ownership probe.

## 6. Bootstrap one real organization and owner invite

Use the approved real organization name/slug and owner email. Generate the
token in memory; never paste it into Git or a file:

```bash
export BOOTSTRAP_ORGANIZATION_SLUG=<APPROVED_SLUG>
export BOOTSTRAP_ORGANIZATION_NAME=<APPROVED_NAME>
export BOOTSTRAP_OWNER_EMAIL=<APPROVED_OWNER_EMAIL>
export BOOTSTRAP_INVITE_TOKEN=$(openssl rand -base64 48 | tr -d '=+/\n' | head -c 48)
export PRODUCTION_BOOTSTRAP_EXECUTE=1
export PRODUCTION_BOOTSTRAP_CONFIRM="BOOTSTRAP edumxwzilfgvamzarwvo AT $CUTOVER_SHA"
doppler run -p bridgecircle -c prd --preserve-env -- \
  pnpm exec tsx scripts/bootstrap-production.ts
```

The script is idempotent for the same inputs and refuses GitHub Actions. It
prints the one-time `/join` URL only to the operator terminal. Record it in the
approved password manager, then clear `BOOTSTRAP_INVITE_TOKEN` from the shell.

## 7. Release the exact SHA

Approve the already-waiting GitHub `production` environment job for the merge
SHA. `cd.yml` revalidates and no-ops migrations, runs schema postflight, stamps
and deploys production web, waits for `/api/health` to report the exact SHA and
`APP_ENV=prod`, then deploys the private worker from the same checkout.

Do not approve if the production worker service, Doppler variable references,
single-replica private topology, or Railway source-trigger state differs from
the plan.

## 8. Accept the invite and grant the owner role

Complete the real `/join` and onboarding flow. After the expected email has one
active membership in the expected organization:

```bash
export PRODUCTION_OWNER_GRANT_EXECUTE=1
export PRODUCTION_OWNER_GRANT_CONFIRM="GRANT SUPER_ADMIN edumxwzilfgvamzarwvo AT $CUTOVER_SHA"
doppler run -p bridgecircle -c prd --preserve-env -- \
  pnpm exec tsx scripts/grant-production-owner.ts
```

The command refuses missing/ambiguous identity state and is idempotent. Then run
the smoke and 30-minute observation sequence in the production cutover plan.

## Abort rule

Before the reset, resume the unchanged legacy service after correcting the
problem. After deletion begins, keep production closed and fix forward on v2;
do not restore compatibility code or improvise migration-history repair.
