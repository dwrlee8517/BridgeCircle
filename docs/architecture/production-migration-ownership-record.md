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
- Merging an ownership-probe PR does not authorize applying it to production.

## No-op ownership proof

- Project: `edumxwzilfgvamzarwvo`
- Main SHA: `af02523df30adaada93520b035ca1296dee3991b`
- Workflow run: `29614712165`
- Completed: `2026-07-17T21:27:28Z`
- Preflight and postflight: 27 local migrations, 27 remote migrations, none
  pending.
- Dry-run and apply steps both reported that the remote database was up to
  date. No schema or application deployment changed.

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

## Ownership probe candidate

- Migration version: `20260717213750`
- Object: `private.production_migration_ownership_probe`
- Owner: `postgres`
- Data rows: zero
- RLS: enabled, with no policies
- Schema/table access: none for `PUBLIC`, `anon`, or `authenticated`

The probe is additive and private. It is applied to production only through a
separately approved run of the protected workflow after its PR merges.
