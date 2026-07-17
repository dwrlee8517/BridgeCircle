# Database v2 production cutover plan

> **Status:** preparation plan approved by Richard on 2026-07-17; exact-SHA
> production execution remains unapproved
>
> **Prepared:** 2026-07-17; refreshed after merging `main` at `4394ea0` into
> `codex/redesign-v2`; candidate SHA not yet frozen
>
> **Production target:** `bridgecircle` / `edumxwzilfgvamzarwvo`
>
> This document does not authorize a push, pull request, merge, production
> database command, dashboard change, or deployment. The eventual destructive
> execution requires a second approval that names the exact production project
> and immutable merge SHA.

## Goal

Move production from the legacy application/schema to the already proven v2
application/schema without preserving legacy compatibility code or legacy
application data. After the cutover:

- `main`, development, and production use the same active v2 migrations;
- one GitHub Actions pipeline owns database-before-code promotion;
- the Supabase GitHub integration no longer races the scripted pipeline;
- production web and the private outbox worker run the same tested SHA;
- production contains only intentional bootstrap records, not development
  personas or the local seed;
- every later database change is an ordinary immutable forward migration.

BridgeCircle is pre-launch and has no real users. That removes the need for a
dual-write, compatibility, or legacy rollback path. It does **not** remove the
need to prove the target, take a cheap snapshot, keep schema and application
versions together, and stop on ambiguous state.

## Surfaces touched

- `.github/workflows/cd.yml` — explicit dev/prod migration ownership, exact-SHA
  web/worker deployment, target checks, and post-deploy gates;
- `app/scripts/` and `app/src/lib/cutover/` — read-only production preflight,
  fail-closed target validation, one-time reset orchestration, bootstrap, and
  post-cutover verification;
- `app/supabase/migrations/` — immutable v2 history plus normal forward
  migrations;
- `app/supabase/legacy/` — historical ownership-probe migration after the v2
  branch absorbs the latest `main`;
- Railway production web/worker configuration and deploy triggers;
- Supabase production database, Auth, Storage, Realtime, URL/email/provider
  configuration, and the legacy GitHub integration;
- Doppler `prd` and GitHub's protected `production` environment, names and
  presence only in logs and documentation;
- the migration, environment, deployment, and cutover runbooks.

## Out of scope

- preserving legacy application rows, URLs, tables, or compatibility adapters;
- loading local/dev personas or `app/supabase/seeds/seed.sql` in production;
- changing the product flows, search ranking, or visual design;
- introducing another database, ORM, auth provider, queue, or deployment tool;
- making the destructive reset a reusable CD operation;
- weakening the manual GitHub production approval gate;
- deploying a migration directly from a developer-linked production checkout
  after the one-time cutover.

## Current state and remaining boundary

Development database, web, and private worker have completed their v2 cutover.
PR A proved a production no-op, PR B proved one additive migration, and the
production Supabase GitHub integration was disconnected. Production now has 28
legacy migration records including ownership probe `20260717213750`; the proof
and integration evidence are preserved in
[`production-migration-ownership-record.md`](production-migration-ownership-record.md).

`main` at `4394ea0` has been merged into `codex/redesign-v2`. The probe is
archived outside active v2 migrations, the temporary ownership workflow is
removed, and PR C prepares database-before-code dev/prod promotion, exact-SHA
web/worker deployment, a separately guarded one-time reset, bootstrap, and
postflight checks. Production itself remains unchanged on application SHA
`19247789f2018f025fd5cf149730f6d54dbd1d2e`.

The remaining boundary is candidate proof, not architecture ambiguity: finish
the local release suite, prove the frozen SHA on development, confirm the
production worker/dashboard prerequisites, merge PR C without approving its
production gate, and then request the separate target-and-SHA destructive reset
approval.

## Locked cutover decisions

### One owner at a time

The legacy Supabase integration and scripted `db push` must never both be
treated as production owners. That transfer is complete: the integration is
disconnected after the protected path proved both a no-op and the harmless
ownership probe. Do not reconnect it; PR C's `cd.yml` is the reviewed successor.

### The v2 reset is manual; later migrations are automatic

The one-time removal of BridgeCircle-owned legacy objects and replacement of
migration history is too destructive and unusual for an ordinary repeatable
workflow. A reviewed, guarded operator command performs that reset once.

After the reset, `cd.yml` runs ordinary `supabase db push --db-url ...` before
deploying production code. The seed flag is never supplied. Supabase records
applied versions in `supabase_migrations.schema_migrations`, so subsequent
promotions skip versions already applied during the reset.

### Merge is the synchronization point, not the authorization

The v2 PR may merge only after its dev evidence and all dashboard prerequisites
are green. The merge starts the same-SHA dev deployment and integration suite,
then the `promote` job waits at GitHub's protected `production` environment.
The merge alone must not reset or deploy production.

The exact merge SHA becomes the cutover SHA. The second explicit approval names
that SHA and production project before the manual reset begins.

### No legacy rollback

Once the production schema reset starts, failure recovery is forward-only:
keep production unavailable, correct the v2 migration/application, rerun the
entire verification gate, and finish on v2. The snapshot is an emergency
forensic/recovery artifact, not an instruction to revive the legacy product.

## Release topology

There are three deliberately separate PRs.

| PR | Base | Purpose | Production effect |
|---|---|---|---|
| A — migration-only capability | current `main` | add a protected, manual-only ownership workflow; pin the Supabase CLI; add masked, fail-closed prod target checks; run prod `db push --dry-run` and then no-op `db push` | no schema or application change; proves credentials, target, and command path while code deployment is frozen |
| B — ownership probe | updated `main` | one harmless additive legacy migration created by `supabase migration new` | first real migration applied only by the manual scripted workflow after the legacy integration is disconnected; no code deploy |
| C — database v2 | updated `codex/redesign-v2` | remove the temporary ownership workflow; finish the normal `cd.yml`; ship v2 app/schema, dev DB push, production worker deploy, guarded reset/bootstrap/postflight tooling, and settled docs | waits at the production gate; manual reset and explicit approval precede prod deploy |

PR A and PR B stay small so a problem in migration ownership cannot be hidden
inside the redesign diff. Before either merges, the current `CD` workflow and
Railway deploy triggers are placed in a recorded release freeze. This exception
is necessary because `main` is the legacy application while the shared dev
database is already v2: allowing today's `cd.yml` to run would roll dev back to
incompatible code before its integration gate. Existing production keeps
serving its current deployment during the freeze. PR C is the already developed
integration branch; it is not split into compatibility slices because ADR 0015
explicitly approves the clean replacement.

## Detailed implementation plan

### Phase 0 — refresh facts without changing state

1. Record `git status`, `git rev-parse HEAD`, `main...HEAD`, active migration
   filenames, and the local toolchain.
   - **Verify:** clean worktree; `main` is an ancestor; Supabase CLI is pinned to
     the locally proven `2.109.1`, not installed as unbounded `latest` in CI.
2. Inspect production using read-only dashboard/CLI calls and record counts for
   `auth.users`, memberships, asks, messages, Storage objects, outbox jobs, and
   migration versions.
   - **Verify:** zero real users and zero irreplaceable application/Storage data.
   Any unexpected row/object stops the clean-reset plan for classification.
3. Verify names and status only for Doppler/GitHub/Railway configuration. Never
   print secret values.
   - **Verify:** protected GitHub `production` environment has a working
     reviewer; `prd` exposes the required DB and Railway variable names only to
     the promote job; the production web target is unambiguous.
4. Verify Railway deploy triggers and Supabase integration state from their
   control planes.
   - **Verify:** record whether auto-deploy is on and whether the Supabase GitHub
     integration is connected; do not change either yet.

### Phase 1 — freeze code promotion and prove migration-only connectivity

5. Put code promotion in a recorded temporary freeze before merging PR A:
   disable the current GitHub `CD` workflow and turn off Railway source deploy
   triggers for dev and production. Do not stop the currently running services.
   - **Verify:** a harmless branch/metadata push moves neither Railway
     environment, current production remains healthy, and the freeze owner and
     start time are recorded. The Supabase GitHub integration remains connected
     until step 13.
6. Add a shared cutover target validator with independent assertions for
   `APP_ENV=prod`, the exact production project ref, API origin, DB host/user,
   clean checkout, expected SHA, and repository root.
   - **Verify:** unit tests reject the dev ref, unknown refs, malformed URLs,
     wrong database users, dirty trees, wrong SHAs, and missing inputs.
7. Add `.github/workflows/production-migration-ownership.yml` with only
   `workflow_dispatch`, the protected GitHub `production` environment, and no
   Railway/application deployment. Install Supabase CLI `2.109.1` explicitly;
   never use an unversioned global install.
   - **Verify:** the workflow prints only the CLI version, project ref, and SHA;
     the DB URL/password remain masked and are never echoed; static tests reject
     any `railway up`, seed, reset, or repair command in this temporary workflow.
8. Before any migration call, run the production target validator and a
   read-only SQL identity query through the same connection.
   - **Verify:** project/database identity matches `edumxwzilfgvamzarwvo` and a
     deliberate dev credential causes a hard failure before `db push`.
9. Add `supabase db push --db-url "$SUPABASE_DB_URL" --dry-run`, followed by the
   ordinary non-interactive push only when the dry-run reports no pending
   versions for PR A.
   - **Verify:** the protected promote job completes as a no-op and production
     schema/migration checksums remain unchanged.
10. Update workflow tests/static ratchets so the temporary ownership workflow
    cannot deploy code and the eventual normal pipeline must put prod migration
    before production web deployment without `--include-seed`, `db reset`, or
    migration repair.
    - **Verify:** mutation tests fail when code deploy is added to the temporary
      workflow, ordering is reversed, or a forbidden flag/command is introduced.
11. Run the full ship suite, open PR A, and merge only after checks pass while
    the release freeze remains active.
    - **Verify:** neither dev nor production code deploys and no database changes;
      the manual ownership workflow is now available on `main`.
12. Dispatch the protected ownership workflow for PR A's merge SHA and approve
    its no-op database run.
    - **Verify:** target validation, dry-run, and no-op push succeed; production
      schema/migration checksums and currently serving SHA remain unchanged.

### Phase 2 — transfer ownership and prove one harmless migration

13. After PR A succeeds, disconnect the production Supabase GitHub integration.
    Preserve a screenshot/export of its prior configuration and record the
    timestamp.
    - **Verify:** the integration is disconnected and no preview/production
      deployment remains in progress.
14. Create PR B from the updated `main` with one harmless, private, additive
    ownership-probe migration created by `supabase migration new`.
    - **Verify:** local reset, pgTAP, lint, empty shadow diff, deterministic
      types, and PR CI/E2E pass; the probe exposes no API surface and grants no
      anonymous/authenticated access.
15. Merge PR B while the code-release freeze remains active. Confirm the probe
    is still absent, then dispatch and approve the manual ownership workflow.
    - **Verify:** neither app environment deploys; the migration appears once in
      `supabase_migrations.schema_migrations` only after the protected workflow,
      and its probe object has the intended owner/grants. This is the required
      harmless real migration proof; the v2 reset is not the pipeline's first
      database write.
16. Update the operational record to name the temporary workflow as the sole
    production migration owner during the freeze, and `cd.yml` as its reviewed
    successor that becomes active only with PR C.
    - **Verify:** no active runbook still instructs the legacy integration to
      apply production migrations.

### Phase 3 — synchronize and freeze the v2 candidate

17. Merge the updated `main` into `codex/redesign-v2` once.
    - **Verify:** resolve the legacy ownership-probe migration into
      `app/supabase/legacy/migrations/`; active v2 history remains only the
      timestamped v2 baseline and forward migrations.
18. Add ordinary dev `db push` before the dev web deploy now that `main` will
    contain the v2 history. Reuse the dev target guard and never include seed.
    - **Verify:** against already-cut-over development it is an idempotent no-op;
      a production URL/ref fails the dev guard.
19. Complete production private-worker deployment in `promote`: stamp the same
    SHA, validate production-only variables by name/presence, build the clean
    worker bundle, deploy web, wait for web health, then deploy the worker.
    - **Verify:** both services report/record the same SHA; the worker is private,
      single-region/single-replica, and uses the reviewed drain/restart contract.
20. Add a read-only production preflight and a separate guarded one-time reset
    entry point. The reset requires the exact project ref, exact 40-character
    approved SHA, `APP_ENV=prod`, clean `main` checkout at that SHA, an explicit
    execution flag, and a typed confirmation string.
    - **Verify:** no missing or mismatched input can reach the first destructive
      statement; the static cutover ratchet permits only this reviewed entry
      point to contain production reset/repair operations.
21. Add production bootstrap tooling that creates only the real organization
    record and one short-lived owner invite. It must never invoke the local seed
    or embed an email/token in Git.
    - **Verify:** dry-run prints intended non-secret changes; execution outputs
      the one-time join URL only to the operator terminal; replay is idempotent;
      a second guarded command grants `super_admin` only after the invited owner
      has an active membership with the expected email and organization.
22. Add read-only postflight checks for schema versions, grants/RLS, Auth trigger,
    Storage buckets/policies, Realtime publications, advisors, worker/outbox
    state, and exact deployed SHA.
    - **Verify:** each check has a failure fixture; advisor exceptions require an
      explicit documented allowlist and never pass by total-count comparison.
23. Replace the temporary ownership workflow with the completed normal
    `cd.yml`; its promote job validates prod, dry-runs/pushes ordinary migrations,
    deploys web, verifies health, and deploys the worker from one SHA.
    - **Verify:** only `cd.yml` has a production database credential path; the
      one-time destructive reset remains outside repeatable CD.
24. Run the complete local release gate from an empty database:
    - local reset and all 20 pgTAP files / current assertion count;
    - schema warning lint and empty `public,api,private` shadow diff;
    - two byte-identical generated type runs;
    - all focused typechecks, boundary/cutover ratchets, Vitest, ESLint, Biome,
      design-token check, production build, concurrency, Realtime, worker,
      maintenance, query-plan, and Playwright suites.
    - **Verify:** one evidence record ties every result to the candidate SHA.
25. Deploy that exact candidate SHA to development web and worker, run hosted
    integration/acceptance, avatar behavior, advisor, email safety, and
    controlled outbox recovery checks.
    - **Verify:** development health and both deploy records match the SHA; no
      production resource changed.
26. Freeze the candidate. Any code, migration, workflow, or cutover-tool change
    invalidates the SHA and repeats steps 24–25.

### Phase 4 — PR C review and merge without production movement

27. Push `codex/redesign-v2` and open PR C only after Phase 3 is green. Start as
    draft because the diff is intentionally large and destructive.
    - **Verify:** PR description names the reset, deleted legacy contract,
      migration-ownership proof, dev evidence, production gate, and no-rollback
      rule.
28. Review database migrations, RLS, API/lib boundaries, workflow ordering,
    production target guards, bootstrap, and reset tooling as independent
    checklists.
    - **Verify:** migration reviewer, RLS audit, security diff, and CI/E2E have no
      unresolved actionable findings.
29. Confirm the dashboard prerequisites immediately before merge:
    - legacy Supabase integration disconnected;
    - Railway auto-deploy off for web and worker targets;
    - production worker service provisioned but not running old code;
    - GitHub production reviewer and Doppler `prd` access intact;
    - no production deploy/database job active;
    - current GitHub `CD` workflow still frozen, with a recorded owner ready to
      re-enable it immediately before the merge.
30. Re-enable GitHub `CD`, then merge PR C. Keep Railway source triggers off and
    do **not** approve the production environment.
    - **Verify:** `cd.yml` applies/no-ops v2 migrations on development, deploys
      the merge SHA to dev web/worker, and passes hosted integ; production DB and
      deploy SHA remain unchanged while `promote` waits.

### Phase 5 — exact-SHA production preflight and snapshot

31. Record the merge SHA and request the destructive execution approval in this
    exact form:

    `I approve the destructive production-v2 reset of project`
    `edumxwzilfgvamzarwvo at SHA <40-character SHA>.`

32. Run the guarded production preflight from a clean detached checkout of that
    SHA using `prd` credentials.
    - **Verify:** project/SHA/host/app-env checks pass; row/object counts still
      confirm the clean-reset premise; migration history matches the recorded
      legacy state including the ownership probe.
33. Pause the production web service, worker, scheduled jobs, and all manual
    deploys. Since there are no users, accept explicit downtime instead of
    building a permanent maintenance subsystem.
    - **Verify:** the app cannot write; worker/outbox claim count is zero; no
      deployment or scheduled task is running.
34. Create the recovery artifacts:
    - encrypted custom-format schema+data dump for the application, Auth,
      Storage metadata, and migration history as supported by the chosen dump
      tool;
    - separate Storage bucket/object manifest and byte export;
    - configuration inventory for Auth URLs/providers/templates, Storage,
      Realtime, extensions, and scheduled jobs;
    - checksums, timestamp, owner, encrypted location, and deletion date.
    - **Verify:** restore the application portion into a throwaway compatible
      Postgres/Supabase environment and validate counts/catalog shape. A dump
      that was not restore-tested is not a cutover artifact.

### Phase 6 — one-time production schema replacement

35. Execute the reviewed reset entry point. Remove only BridgeCircle-owned
    objects and application migration records. Preserve Supabase-managed
    infrastructure and project configuration; never use an unscoped
    `drop schema public cascade`.
    - **Verify:** the operator sees the planned object/version list before the
      transaction; unexpected objects, dependencies, or row counts abort.
36. Apply the active v2 baseline and forward migrations with `--no-seed`; do not
    load `app/supabase/seeds/seed.sql`.
    - **Verify:** active local and production migration version lists are
      identical, a second dry-run is empty, and the ownership-probe object is
      gone with the legacy application schema.
37. Run database postflight before any application deploy:
    - grants/RLS/view/function/trigger/index/FK assertions;
    - Auth `users` synchronization trigger;
    - avatars/resumes bucket rows and owner/public behavior;
    - Realtime publication membership;
    - schema lint/diff/type checksum;
    - security and performance advisors with the documented authenticated
      `SECURITY DEFINER` API-boundary allowlist;
    - no anonymous profile-import RPC access and no anonymous Storage listing.
    - **Verify:** a failure leaves web/worker paused and blocks deployment.
38. Run the organization/owner-invite bootstrap; no personas, example.com users,
    fake conversations, asks, events, or school content are inserted.
    - **Verify:** exactly one intended organization and one pending owner invite
      exist; all domain-content counts remain zero.

### Phase 7 — deploy, bootstrap the owner, and accept production

39. Approve the already-waiting GitHub `production` environment for the exact
    merge SHA.
    - **Verify:** ordinary prod `db push` is now a no-op; workflow deploys the
      same SHA, waits for `/api/health`, and only then deploys the private worker.
40. Use the one-time invite to create the owner account through the real Auth
    callback/onboarding flow, then run the guarded owner-role grant.
    - **Verify:** email identity, membership, organization, profile, and
      `super_admin` assignment match exactly; the bootstrap invite is accepted
      and cannot be reused.
41. Run production smoke in increasing blast-radius order:
    1. health, sign-in/recovery/callback and sign-out;
    2. profile view/edit, avatar upload/upsert/public retrieval;
    3. People and privacy-safe profile reads;
    4. Help compose/list/detail/retract using the owner account;
    5. Messages empty state and notification read/unread behavior;
    6. School/admin empty states;
    7. issue then revoke an invite to a Resend test sink; verify the worker
       claims the durable job once without emailing an unintended recipient;
    8. account export/recovery job wiring without deleting the owner.
    - **Verify:** no 5xx/Sentry spike, no stuck or duplicate outbox job, correct
      Realtime events, and no private identity/content disclosure.
42. Re-enable scheduled jobs after smoke. Keep automatic deploy triggers off;
    Actions remains the only deploy owner.
    - **Verify:** one worker replica claims supported job types, maintenance is
      idempotent, and unsupported jobs are surfaced rather than silently lost.
43. Observe for a bounded 30-minute window: health, Auth, database errors,
    Realtime, worker logs, outbox retry/dead-letter state, email events, and
    Sentry environment/SHA.
    - **Verify:** no unresolved severity-1/2 error and no unexplained queue
      growth. Otherwise keep the launch closed and fix forward.

### Phase 8 — make the cutover durable

44. Commit a non-secret production cutover record: exact SHA, migration list,
    schema/type checksum, snapshot checksum/location class, dashboard settings
    checklist, deploy IDs, test counts, advisor disposition, bootstrap counts,
    and incident notes.
45. Set ADR 0015's one-time production exception to spent. Update
    `migration-workflow.md`, `environments.md`, `app/CLAUDE.md`, the v2 contract,
    ADR 0014 rollout, and `docs/INDEX.md` to describe only the live pipeline.
46. Archive the transitional rollout document and keep the guarded destructive
    reset tool disabled or remove it after its evidence is committed. Retain the
    read-only preflight/postflight checks for future releases.
47. Confirm the normal path with one later harmless forward migration:
    local → dev DB → dev web/worker → hosted integ → production approval → prod
    DB → prod web/worker.
    - **Verify:** no dashboard integration or auto-deploy participates; one
      pipeline owns the full sequence.

## Abort and recovery matrix

| Point | Action |
|---|---|
| Before the production reset | Stop. Production remains legacy; fix the plan/code and repeat candidate verification. |
| Snapshot/restore verification fails | Stop. Keep production legacy and paused only as long as needed to resume it. |
| Reset discovers unexpected data/object dependencies | Stop before deletion. Reclassify the data and revise the reviewed object list. |
| Migration fails after deletion starts | Keep web/worker paused. Fix forward on v2, repeat the full local/dev gate, and rerun the reset/apply path. Do not revive compatibility code. |
| Database postflight fails | Do not approve `promote`. Fix schema/migration forward and repeat postflight. |
| Web deploy fails | Keep worker paused; correct the app, prove a new SHA in dev, then deploy that newly approved SHA. |
| Worker deploy/claim fails | Keep the worker stopped; web may remain available only if no required job is silently lost. Fix and redeploy the same approved code path. |
| Smoke exposes privacy/auth corruption | Close launch access, preserve evidence without secrets/PII, and fix forward before admitting members. |
| Any target assertion names development/unknown infrastructure | Stop immediately. No destructive command is permitted. |

## Approval gates

1. **Plan approval:** authorizes implementation of PR A/B/C preparation only.
2. **PR A merge approval:** authorizes a protected production no-op migration
   command and unchanged-code deploy.
3. **Integration disconnect approval:** authorizes transfer away from the
   legacy Supabase integration after PR A proves the replacement path.
4. **PR B merge approval:** authorizes one harmless ownership-probe migration.
5. **PR C merge approval:** authorizes dev deployment/integ and a waiting
   production job; it does not authorize production reset or promote approval.
6. **Exact-SHA destructive approval:** names project
   `edumxwzilfgvamzarwvo` and the 40-character merge SHA; authorizes Phases 5–7.

No broader statement such as “ship it” substitutes for the target-and-SHA
destructive approval.

## Completion criteria

The production-v2 cutover is complete only when:

- the production application, worker, database migrations, and cutover record
  name the same SHA/history;
- production contains no legacy application objects or development seed data;
- the owner can complete Auth/onboarding and use the redesigned member flows;
- RLS/grants/Storage/Realtime/advisors and outbox behavior pass on production;
- the Supabase GitHub integration and Railway auto-deploys are off;
- `cd.yml` is the sole documented and observed promotion owner;
- ordinary forward migration discipline is active and the destructive reset
  path cannot run accidentally again.

## Current references

- [ADR 0014 — scripted CD pipeline](../decisions/0014-scripted-cd-pipeline.md)
- [ADR 0015 — pre-launch v2 database reset](../decisions/0015-prelaunch-v2-database-reset.md)
- [Database v2 contract](database-v2-contract.md)
- [Development cutover record](database-v2-dev-cutover-plan.md)
- [Migration workflow](../runbooks/migration-workflow.md)
- [Supabase CLI `db push` reference](https://supabase.com/docs/reference/cli/supabase-db-push)
- [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
