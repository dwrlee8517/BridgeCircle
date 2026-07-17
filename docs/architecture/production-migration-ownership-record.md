# Production migration ownership record

Operational evidence for the temporary production migration-ownership bridge
used during the database-v2 cutover. This record contains no credentials.

## Current boundary

- GitHub `CD` is manually disabled during the release freeze.
- Railway production web remains healthy on
  `19247789f2018f025fd5cf149730f6d54dbd1d2e`, with its repository source
  disconnected.
- The temporary `Production migration ownership` GitHub workflow can migrate
  production only after exact-SHA validation and protected-environment review.
- The no-op and one-migration ownership proofs are complete. The workflow is
  now the sole production migration owner until the database-v2 cutover
  replaces it with the reviewed `cd.yml` promotion path.
- No destructive database-v2 reset or production application deployment has
  been authorized by either proof.

## No-op ownership proof

- Project: `edumxwzilfgvamzarwvo`
- Main SHA: `af02523df30adaada93520b035ca1296dee3991b`
- Workflow run: `29614712165`
- Completed: `2026-07-17T21:27:28Z`
- Preflight and postflight: 27 local migrations, 27 remote migrations, none
  pending.
- Dry-run and apply steps both reported that the remote database was up to
  date. No schema or application deployment changed.

## Additive ownership proof

- Pull request: [#151](https://github.com/dwrlee8517/BridgeCircle/pull/151)
- Project: `edumxwzilfgvamzarwvo`
- Main SHA: `89b1578fb3aac26b09c6dde6a97f9f3b899e32d0`
- Workflow run:
  [29617130431](https://github.com/dwrlee8517/BridgeCircle/actions/runs/29617130431)
- Completed: `2026-07-17T22:12:58Z`
- Preflight: 28 local migrations, 27 remote migrations, with only
  `20260717213750` approved and pending.
- Dry-run listed only
  `20260717213750_production_migration_ownership_probe.sql`.
- Apply recorded that migration once; postflight reported 28 local migrations,
  28 remote migrations, and none pending.
- GitHub `CD` remained disabled and no application deployment ran.

## Legacy integration transfer

Before disconnection, the production Supabase GitHub integration used:

- repository `dwrlee8517/BridgeCircle`;
- working directory `app`;
- production branch `main`;
- production deployment enabled;
- automatic branching enabled with a three-branch limit;
- Supabase-changes-only filtering enabled.

No persistent branches, preview branches, scheduled deletions, or selectable
production workflow runs were present. The integration was disconnected on
`2026-07-17` between `21:33:09Z` and `21:34:21Z`. The dashboard then reported
`GitHub connection — Not connected`.

Evidence:

- [Configuration before disconnection](evidence/production-cutover/supabase-github-integration-before-20260717T213309Z.jpg)
- [Configuration after disconnection](evidence/production-cutover/supabase-github-integration-after-20260717T213421Z.jpg)

## Applied ownership probe

- Migration version: `20260717213750`
- Object: `private.production_migration_ownership_probe`
- Owner: `postgres`
- Data rows: zero
- RLS: enabled, with no policies
- Schema/table access: none for `PUBLIC`, `anon`, or `authenticated`

The probe is additive and private. The protected workflow connected as the
expected `postgres` owner and applied the reviewed migration transactionally;
there is no statement in the migration that inserts a row or creates an access
policy.

## Next exact-SHA boundary

The next production-changing operation is the one-time destructive database-v2
reset. It is not authorized by this record or by merging a preparation PR.
Before requesting that approval:

1. merge the updated `main` into `codex/redesign-v2` and reconcile the legacy
   ownership probe outside the active v2 migration history;
2. finish and validate database-before-code promotion, guarded reset,
   bootstrap, postflight, and same-SHA web/worker deployment tooling;
3. pass local CI, hermetic E2E, migration/RLS review, and hosted development
   verification on one frozen candidate;
4. merge the database-v2 PR while production remains paused at the protected
   environment gate; and
5. name the resulting immutable merge SHA in a new approval:

   `I approve the destructive production-v2 reset of project`
   `edumxwzilfgvamzarwvo at SHA <40-character SHA>.`

Any change to code, migrations, workflow, or cutover tooling after that SHA is
selected invalidates the approval and requires a new candidate and approval.
