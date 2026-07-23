# Database v2 development cutover plan

> **Status (2026-07-17): development cutover executed through hosted
> acceptance and private-worker verification. The final destructive reset used
> approved base SHA `e3f36fe6e38caf1711e40cb1f2e5dad875fbc6b9`; production
> was not touched. Phase 6 is making the resulting topology reproducible in the
> repository and CD. Production-v2 reset and deployment remain pending separate
> approval.**
> This plan moves the already verified `codex/redesign-v2` application,
> database, and worker to the shared development environment. It authorizes no
> destructive or remote mutation command by itself.

## Decision summary

BridgeCircle is pre-launch. The development database contains no real users or
data that must survive, and the retired application/schema do not need a
compatibility path. The development cutover is therefore a clean rebuild:

- retain the existing Supabase and Railway projects and their hosted settings;
- destroy all disposable development database/Auth/Storage state;
- replay only the active v2 migrations;
- load the canonical fictional v2 development seed;
- deploy the exact verified v2 commit to the development web and worker
  services;
- verify the deployed system, then treat v2 as the only development contract.

There is no legacy data migration, dual write, compatibility view, snapshot,
restore test, or legacy rollback. If the cutover fails, development remains on
v2 and is rebuilt again from the repository after the defect is fixed.

This is intentionally narrower than production. It does not merge
`codex/redesign-v2` into `main`, change production, or authorize a production
reset.

## Goal

After the cutover:

1. `bridgecircle-dev` is reproducible from the active v2 migrations and the
   canonical fictional seed;
2. `https://dev.bridgecircle.org` serves the exact v2 commit against that
   database;
3. the outbox worker runs the same commit and environment;
4. Auth, Home, Help, Messages, People/Profile, School, Notifications, Settings,
   Admin, Realtime, Storage, email safety, and account operations work against
   hosted development;
5. linked types, migration history, and schema match the repository;
6. the old schema and old code are no longer part of any development path.

## Surfaces touched while preparing the cutover

- `app/scripts/` — target preflight and post-cutover verification;
- `app/tests/e2e/` — explicit one-time hosted-dev acceptance mode;
- `app/supabase/seeds/seed.sql` — wording and guardrails allowing use only on
  local/CI and the explicitly confirmed disposable dev project;
- `.github/workflows/cd.yml` — later worker deployment and durable dev ownership;
- Railway `dev` — web service plus a private outbox-worker service;
- Supabase `bridgecircle-dev` — destructive linked reset and v2 seed;
- active architecture/runbook status docs after evidence is collected.

## Explicitly out of scope

- production reset, production seed, or production deployment;
- merging or pushing `codex/redesign-v2`;
- preserving any legacy row, Auth user, Storage object, or migration record;
- importing legacy identifiers into v2;
- expand/contract or a maintenance application for this one zero-user cutover;
- detailed People search/ranking work and the deferred conversational AI
  decline relay;
- changing Supabase/Auth/Google/Resend/Doppler secrets or provider accounts.

## Hard invariants

1. Every destructive command must prove the linked target is the allowlisted
   development project and must reject the production project.
2. The cutover SHA is captured once and used for reset evidence, web deploy,
   worker deploy, health checks, and the final record.
3. No command receives or prints secret values. Environment audits compare
   names, target hosts, and presence only.
4. The remote reset uses the checked-in Supabase CLI and active migrations. No
   handwritten `drop schema`, object-by-object removal, or manual migration
   repair is the normal path.
5. The canonical development seed may run only after the dev target assertion.
   It must never run against production.
6. The worker stays stopped during reset and destructive acceptance runs.
7. A failed gate stops the sequence. Do not continue to make later steps green
   around an earlier failure.
8. Production remains untouched even when development passes.

## Why the reset can be simpler now

The current Supabase CLI supports `db reset --linked`: it identifies and drops
user-created remote entities, rebuilds them from local migrations, and runs the
configured seed unless `--no-seed` is supplied. That is the intended operation
for disposable dev/staging projects. It makes the earlier custom removal,
migration-history repair, dump, restore-test, and rollback package unnecessary
for this zero-data development cutover.

Supabase-managed project configuration remains outside the application reset:
OAuth provider settings, Auth URL configuration, SMTP/template dashboard
configuration, project keys, and Railway/Doppler wiring are verified but not
recreated. Application-owned buckets, policies, triggers, publications,
functions, and tables are rebuilt by the v2 migrations.

## Plan

### Phase 1 — build the cutover guardrails locally

1. Add a read-only `dev-v2-cutover-preflight` script.
   - Require a clean worktree on `codex/redesign-v2`.
   - Capture `CUTOVER_SHA` from `HEAD`.
   - Assert local `main` is an ancestor of `HEAD`; if not, stop for a branch
     synchronization decision.
   - Assert the Supabase CLI linked project equals the allowlisted dev project.
   - Assert Doppler `dev` points at the same Supabase hostname and reports
     `APP_ENV=dev` without printing values or secrets.
   - Report disposable counts for Auth users, application memberships/content,
     Storage objects, outbox jobs, and migration records. Counts are evidence,
     not a backup gate.
   - Reject production identifiers anywhere in the resolved target set.

   **Verify:** the script passes for dev, fails for local/prod/missing/ambiguous
   targets, is read-only, and has deterministic unit coverage for every target
   rejection branch plus a static executable-boundary check.

2. Add explicit hosted-dev acceptance authorization.
   - Introduce one helper that returns true only when all three are present:
     `PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org`, `APP_ENV=dev`, and an
     explicit one-time `E2E_ALLOW_DEV_SEED=1` flag.
   - Let seed-dependent Home, Messages, People/Profile, and School suites run
     remotely only under that helper.
   - Keep local-Mailpit and destructive account-finalization roads local-only.
   - Keep the normal recurring integ mode factory-owned and non-destructive.

   **Verify:** tests refuse production and arbitrary remote URLs; the ordinary
   remote integ command still skips destructive seed-owned roads.

3. Add a small read-only hosted smoke suite for the final seeded state.
   - Health endpoint reports `env=dev` and the captured SHA.
   - Seeded member can sign in.
   - Home and all five primary sections render without server or console errors.
   - The seeded admin reaches Invite, Approvals, Events, and Announcements.
   - No test mutates canonical rows.

   **Verify:** the smoke suite passes locally against a production build and
   rejects any non-dev remote origin.

4. Update the seed/runbook contract.
   - Change “never remote” to “local/CI plus explicit disposable dev cutover.”
   - Keep direct production use forbidden.
   - Keep the SQL seed as the single source instead of duplicating its large
     cross-domain fixture graph in TypeScript.

   **Verify:** static checks fail if a production seed command is introduced.

### Phase 2 — re-run the full local release gate

5. Start from a clean local reset and replay every migration and the seed.

6. Run all database contracts and reliability harnesses: pgTAP, concurrency,
   maintenance, Realtime, query-plan, worker, lint, and shadow diff.

7. Generate local database types twice and require byte-identical output.

8. Run all focused TypeScript projects, repository TypeScript, Vitest, ESLint,
   Biome, design-token checks, and every boundary/cutover ratchet.

9. Run the complete local Playwright suite, the five-worker durability suite,
   and the production build.

   **Verify:** the worktree remains clean and all measured results are attached
   to the single cutover SHA. A code or migration change invalidates the SHA and
   restarts Phase 2.

### Local preparation evidence (2026-07-16)

Phases 1 and 2 are implemented and green in the working tree, pending the
single cutover-preparation commit that will create the clean candidate SHA:

- fail-closed target validation: 41 focused cases, including production,
  arbitrary remote, localhost, dirty-tree, wrong-branch, wrong-environment,
  missing-target, and bad-SHA rejection;
- database: clean reset, 19 pgTAP files / 698 assertions, 19 concurrency,
  Realtime, worker, maintenance, and query-plan harnesses, warning-as-error
  lint, and an empty `public,api,private` shadow diff;
- generated `public,api` types: two byte-identical passes at SHA-256
  `68bf8179cdf575cedcba010879b033416875f52bdb88e7cfa88a49d520d55019`;
- TypeScript: all eight focused projects and repository-wide no-emit compile;
- application on Node 22.22.2: 61 Vitest files / 313 tests, ESLint, Biome, all
  boundary and cutover ratchets, design-token checks, and the production build;
- browser: the ordinary hermetic matrix is 41 passed with the three opt-in
  smoke roads correctly skipped; all five factory-owned durability roads pass
  concurrently with five workers; the explicit local cutover smoke is 3/3.

The new smoke exposed and closed one previously untested contract bug: hosted
seed data includes a valid event with no physical location, while the Admin
Events repository had required a string. The repository now preserves the
database's nullable location contract, the admin UI already renders its `—`
fallback, and a strict projection regression test covers the case.

No remote preflight, reset, seed, deployment, worker provisioning, or hosted
test ran during this preparation. The exact `CUTOVER_SHA` is intentionally not
recorded yet: the preflight requires a clean committed tree and will reject the
current uncommitted preparation state.

### Phase 3 — one explicit destructive development reset

10. Obtain a separate execution approval naming the dev project and cutover
    SHA. Planning approval is not reset approval.

11. Stop or suspend the development outbox worker. It is currently not
    provisioned, so the first cutover records that as an expected no-op.

12. Run the read-only preflight and save only its non-secret evidence.

13. From `app/`, execute the checked-in CLI's linked reset with an explicit
    confirmation flag. The reset replays the active v2 migrations and the
    canonical fictional seed.

14. Immediately verify:
    - remote migration history contains exactly the active v2 versions;
    - expected v2 schemas, extensions, buckets, triggers, grants, RLS policies,
      Realtime publication entries, and analytics views exist;
    - legacy tables/functions/routes are absent;
    - seeded Auth identities can obtain real hosted sessions.

   **Verify:** linked schema diff is empty, linked lint is clean, linked types
   match the verified local types, and hosted security/performance advisors
   have no unexplained findings.

### Phase 4 — deploy the same SHA to development

15. Audit Doppler `dev` by variable name and target only.
    - Required app, Supabase, Resend, Sentry, provider, URL, environment, email
      guard, and worker settings must be present.
    - `APP_ENV` must be `dev`; the app URL must be the dev origin; Supabase URL
      must be the dev project; email must remain redirected/allowlisted.

16. Stamp the captured SHA on Railway `dev`, then deploy the current branch
    checkout to the existing web service with `railway up --ci`.

17. Poll `/api/health` until it reports the captured SHA and `env=dev`.

18. Provision `BridgeCircle Worker` in Railway `dev` as a private, non-HTTP
    service from the same repo root and commit, with start command
    `pnpm worker:outbox` from `app/`. Give it the same Doppler `dev` environment
    and no public domain.

19. Keep the worker stopped until the destructive hosted acceptance run has
    finished.

   **Verify:** Railway build/health is green, the rendered web environment has
   only dev targets, and no production service or variable changed.

### Phase 5 — hosted acceptance against the seeded v2 system

20. Run the one-time explicitly authorized hosted-dev Playwright matrix against
    the fresh seed. Cover:
    - sign-in, invite, approval, onboarding, and multi-circle routing;
    - Home composition and outcome consent;
    - direct and circle Help flows;
    - one conversation per pair, Messages read state, safety, and Realtime;
    - People/Profile privacy, Connect, disconnect, and block convergence;
    - School RSVP/waitlist/event/announcement/newsletter behavior;
    - notification unread/read behavior and Settings;
    - desktop/mobile overflow and accessibility roads.

21. Because those roads intentionally mutate the fictional seed, stop after the
    first failure. Fix locally, create a new commit/SHA, repeat Phase 2, and
    rerun the remote reset rather than patching the remote database by hand.

22. When the matrix is green, run the linked reset once more to restore the
    canonical development fixture state, then repeat the schema/type/lint
    checks and the read-only hosted smoke suite.

23. Start the worker on the same SHA. Create one factory-owned, dev-safe outbox
    scenario, verify claim/send/idempotency/cleanup and email redirection, then
    remove the test-owned records through supported contracts.

24. Observe Sentry, Railway logs, database logs, Realtime delivery, outbox
    retries, and email redirection long enough to see at least one maintenance
    interval. Logs must contain result codes and durable IDs only.

   **Verify:** the final seeded state passes read-only smoke, the worker has no
   stuck jobs or retry storm, and no test email reaches an unapproved address.

### Executed development evidence (2026-07-17)

- The explicitly approved linked reset rebuilt `ojpvahiuafdcynbdbmri` from
  base SHA `e3f36fe6e38caf1711e40cb1f2e5dad875fbc6b9`. Immediately after
  reset: 8 Auth users, 8 memberships, 33 Asks, 13 messages, 3 Storage objects,
  0 outbox jobs, and 11 migration records.
- Linked migration listing, warning-level lint, `public,api,private` schema
  diff, and two linked type generations were green. Generated types were
  byte-identical at SHA-256
  `68bf8179cdf575cedcba010879b033416875f52bdb88e7cfa88a49d520d55019`.
- Hosted acceptance passed all 36 executable seeded roads plus the 3-road
  read-only same-SHA smoke. Five destructive worker/account roads remained
  intentionally local-only under the checked-in remote guard.
- Railway dev service `BridgeCircle Worker`
  (`f39ee7fd-1ecc-4071-9794-f0c399b216b2`) deployed privately with deployment
  `ea198247-d40d-45c7-a1a3-bd05e6787bf2`: one `us-west2` replica,
  `pnpm worker:outbox`, no HTTP health check or public domain, on-failure restart
  capped at three retries, and 30-second draining.
- Initial worker startup exposed a real contract mismatch: the typed worker
  supplied eight job types while `private.claim_outbox_jobs` accepted six.
  Forward migration `20260717110427_align_outbox_claim_job_types.sql` aligns
  both private validation and the API default with the typed registry. The
  same change corrected a three-argument function-identity typo that had been
  skipping 13 pgTAP assertions. Final local evidence: 19 files / 701 assertions,
  clean warning-level lint, empty shadow diff, and deterministic types at the
  checksum above. Independent migration review reported no remaining finding.
- The hosted eight-type claim returned an empty queue without error after the
  migration. The live worker stopped its retry loop without a redeploy.
- A deterministic factory scenario sent one `offer_received` email job for a
  fictional `@example.com` recipient. The dev guard resolved it to
  `delivered@resend.dev`; the worker claimed it once, recorded the provider
  result, completed without error, and returned the same terminal result on
  replay. Its Ask, offer, and outbox rows were removed afterward.
- The worker's first maintenance interval legitimately created and completed
  two durable event-reminder jobs. They remain as normal worker history, not
  test residue. No job is pending, processing, failed, or retrying.
- A later authenticated CLI advisor check replaced the earlier connector-
  permission deferral. It found six profile-import RPCs still inheriting
  anonymous `PUBLIC` execution and one broad avatar-object listing policy.
  Forward migration `20260717190521_harden_advisor_permissions.sql` revokes the
  anonymous RPC surface, removes public Storage metadata listing, and adds an
  authenticated UUID-folder owner policy so upload and replacement remain
  supported while known public avatar URLs still work.
- Final permission evidence is green locally and on hosted development: 20
  pgTAP files / 705 assertions, warning-level schema lint, empty shadow diff,
  deterministic local/linked types at the checksum above, zero anonymous
  profile-import RPCs, zero anonymous Storage read policies, one owner avatar
  SELECT policy, and passing owner-upload/upsert/list, cross-member denial,
  anonymous non-listing, public-byte retrieval, and cleanup behavior. Hosted
  performance advisors report no warnings. Hosted security advisors retain 54
  explained authenticated `SECURITY DEFINER` API-boundary notices plus the
  dashboard-only leaked-password-protection warning; the latter remains an
  Auth configuration item when the project plan supports it.

### Phase 6 — make the development cutover durable

25. Record exact evidence in the v2 contract and test inventories: SHA,
    migration versions, linked type checksum, test counts, deployed health,
    advisor disposition, worker service/deploy, and any approved exceptions.

26. Update stale transition docs:
    - mark every application domain complete locally and development cut over;
    - replace the old snapshot/object-removal/migration-repair dev instructions
      with the checked-in linked-reset runbook;
    - mark the remote development seed as intentional and production-forbidden;
    - remove the v2 hold from the dev-stage rollout document;
    - keep production explicitly pending.

27. Make active v2 migrations immutable after the successful shared-dev reset.
    Every later schema change gets a new forward migration even while the
    product remains pre-launch. A full dev reset remains available when useful,
    but previously applied migration files are not edited.

28. Update CD so future `main` deployments eventually deploy both the web and
    worker services from one SHA. Do not merge the v2 branch yet: the current
    production Supabase GitHub integration could apply the v2 migration history
    before production has its own approved clean reset.

29. Commit the cutover evidence and leave `codex/redesign-v2` clean. No push,
    PR, merge, or production action occurs without another instruction.

   **Verify:** development is reproducible from the repository; the legacy
   application/schema are absent from the dev path; production topology and
   data are unchanged.

## Failure handling

There is no legacy rollback because nothing needs preserving and legacy code is
not a supported target.

- **Failure before reset:** fix locally; no remote state changed.
- **Reset/migration failure:** leave dev unavailable, fix the migration on the
  branch, repeat the complete local gate, and reset dev again.
- **Web deployment failure:** keep the worker stopped, fix/build locally, deploy
  a new verified SHA; do not restore the legacy schema.
- **Hosted test failure:** do not patch rows or functions in the dashboard;
  reproduce locally, fix in code/migration/seed, then reset and redeploy.
- **Worker failure:** stop the worker, preserve non-secret job/status evidence,
  fix locally, and redeploy the same corrected SHA to web and worker.
- **Unexpected production target:** stop immediately. No destructive command is
  permitted, even if all other checks are green.

## Approval boundary

The required project-and-SHA approvals for the development resets were granted
and consumed on 2026-07-17. They do not remain reusable authorization for a
future reset. Nothing in this plan authorizes a production reset, migration,
worker service, deployment, push, PR, or merge; each still requires its own
explicit instruction and target verification.
