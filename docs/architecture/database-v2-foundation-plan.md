# Database v2 Foundation implementation plan

- **Status:** approved for implementation
- **Branch:** `codex/redesign-v2`
- **Date:** 2026-07-14
- **Depends on:** [ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md) and the [database v2 contract](database-v2-contract.md)
- **Scope:** local schema and application port only; no shared-development or production mutation

## Goal

Make BridgeCircle's identity, organization, membership, self-profile, and
onboarding paths run correctly against the v2 database while preserving the
database-enforced tenant, privacy, blocking, audit, and reliability rules that
later Help, Messages, People, and School work will depend on.

At the end of this milestone, a locally invited member can create an account,
accept an invite atomically, complete profile setup, select the correct circle,
and enter the redesigned app shell. Pending, revoked, cross-organization, and
blocked personas cannot obtain data or perform commands outside their scope.

This is a backend-foundation milestone. It does not implement the redesigned
Help, Messages, People, or School domains.

## Current evidence

As of 2026-07-14:

- the clean v2 baseline, deterministic seed, and generated `public` + `api`
  types are committed;
- the baseline's last recorded local verification has 69 passing pgTAP
  assertions;
- the baseline has RLS, a centralized grant section, composite tenant foreign keys,
  supporting foreign-key indexes, block-aware helpers, audit storage, and an
  outbox claim primitive;
- the application still uses the legacy data contract;
- `pnpm tsc --noEmit` reports 1,356 expected migration errors across 108 files;
- those errors are the port inventory, not permission to weaken types or add
  an untyped client;
- the active local database may be destroyed and rebuilt, but neither shared
  Supabase project is authorized for reset or migration repair.

## Sources and precedence

1. [ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md)
2. [Database v2 contract](database-v2-contract.md)
3. Approved redesigned behavior in
   [`FLOWS.md`](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md)
4. Current code for behavior not yet superseded by those sources
5. Phase 1 spec and launch-cut documents for remaining product intent

When code and the approved target disagree, the implementation changes the
code and updates the active docs in the same slice. Accepted ADRs are not
silently rewritten.

## Scope

### In scope

- Supabase Auth shadow-user triggers;
- account-state reads needed for routing;
- organizations and membership lifecycle primitives;
- invite verification and atomic invite acceptance;
- deterministic multi-organization context selection;
- self-profile and organization-profile reads;
- staged onboarding writes for profile, education, experience, skills, helper
  availability, helper topics, and freshness consent;
- profile completion and avatar-path persistence;
- admin approval/rejection primitives required to test pending membership;
- the central block/unblock contract;
- audit writes for every Foundation state transition;
- outbox claim, complete, retry, and terminal-failure primitives for the
  service worker;
- notification list/unread summary and mark-read command needed by the member
  shell;
- typed repositories, pure business functions, server boundaries, local
  fixtures, pgTAP, Vitest, and focused Playwright coverage.

### Explicitly out of scope

- direct/circle Ask behavior, offers, matching, or reminders;
- conversation and message migration beyond the shell's notification summary;
- other-member profile projections, search, connections UI, or embeddings;
- School, events, announcements, analytics, or full admin UI migration;
- account-export generation;
- the redesigned email-confirmed 30-day account-deletion orchestration;
- remote development or production reset, migration repair, deployment, or
  secret/configuration changes;
- a legacy database compatibility schema, dual writes, `any`-typed Supabase
  client, hand-edited generated types, or broad service-role use.

The existing idempotent pseudonymization routine and Auth-delete trigger stay
covered by database tests. The member-facing deletion request/confirmation
workflow is implemented with Settings/account lifecycle later, when its email
token and 30-day behavior can be completed end to end.

## Decisions for this milestone

### 1. Keep the database as the authority for invariants

Expected product errors may be mapped to stable result codes. Tenant,
ownership, lifecycle, and concurrency rules remain in SQL. The application
does not duplicate those rules and then hope every caller remembers them.

### 2. Use API commands for every member-controlled Foundation table write

Member roles receive no raw INSERT, UPDATE, or DELETE access to Foundation
tables. Writes go through fixed-signature `api` functions backed by
empty-search-path `private` implementations. Service-role operations also use
explicit `api` wrappers rather than raw multi-table writes from `/lib`. Auth
triggers and owner-scoped Storage uploads remain their existing, separately
tested boundaries.

### 3. Make grants allowlist-based

Replace `grant execute on all functions in schema api to authenticated` with
an explicit function list. Do not grant authenticated users blanket sequence
access. Private mutation/query implementations must not be directly callable
by a member. Retain only the minimum private RLS-helper ACL that policy
evaluation demonstrably needs. A new service-only function must be
unreachable to `anon` and `authenticated` unless its grant is deliberately
added and tested.

### 4. Make invite acceptance one transaction

The current application creates membership/profile rows, updates the invite,
and writes audit state through separate admin-client calls. V2 replaces that
with one idempotent command that locks the invite and performs all changes or
none.

### 5. Select organization context explicitly

Never use `.limit(1)` as organization selection. An HTTP-only
`bc_membership_id` cookie identifies the preferred membership. The Next.js
boundary passes that UUID to the context RPC; the database—not the cookie—then
validates that it belongs to the current user and is active or pending.

Without a valid preference, the database selects the only active membership,
or the only pending membership when there is no active one. If several usable
memberships remain, it returns `requires_circle_choice = true` and the user
chooses a circle before the member shell renders. Rejected and revoked rows
remain visible in the account's context list for correct routing, but are not
selectable.

The cookie is a preference, not authorization. The database validates its
membership ID on every context read.

### 6. Keep normalized profile children normalized

Career, education, and skills are replaced transactionally through profile
commands. The application does not rebuild legacy JSON columns or maintain a
second profile representation.

### 7. Pull only true onboarding dependencies forward

Onboarding already asks for helper availability/topics and freshness consent.
The narrow commands needed to persist those values land in Foundation so the
flow is not rewritten twice. Full Help settings, matching, and enrichment
processing remain in their later domains.

### 8. Do not hide the transition with compatibility types

The integration branch remains intentionally non-mergeable while unported
domains reference the legacy contract. Foundation gets a focused TypeScript
configuration and focused tests. The global compiler error inventory must
decrease monotonically and may never gain a new error outside the active
domain. No `@ts-ignore`, `@ts-nocheck`, legacy `Database` alias, or untyped
Supabase client is allowed.

Full `pnpm tsc --noEmit`, build, and E2E become mandatory zero-error gates
before remote development cutover. Until then, the domain-specific green gate
is honest about the long-lived migration branch instead of masking runtime
incompatibility.

### 9. Keep one clean pre-cutover baseline

ADR 0015's one-time exception is still active because the v2 migration has not
been applied to a shared project. Foundation schema changes are folded into
`20260713231344_v2_init.sql`, with tests and generated types changed in the
same slice. A temporary local migration may be used while diagnosing a SQL
change, but it is not retained at the Foundation checkpoint. The baseline
becomes immutable immediately after the approved development cutover; all
later changes use forward-only migrations.

## Target architecture

```mermaid
flowchart LR
  UI["Server component / action / route"] --> B["Next boundary: parse, auth, redirect"]
  B --> L["Pure /lib operation"]
  L --> R["Typed repository interface"]
  R --> P["Supabase repository in src/db"]
  P --> PUB["public: RLS read surfaces"]
  P --> API["api: fixed query and command wrappers"]
  API --> PRIV["private: security-definer implementation"]
  PRIV --> AUD["private.audit_log"]
  PRIV --> OUT["private.outbox_jobs"]
  W["Service worker"] --> SAPI["service-only api outbox wrappers"]
  SAPI --> OUT
```

Responsibilities:

- `src/app`: HTTP/UI wiring, cookies, redirects, and Zod parsing only;
- `src/lib`: framework-agnostic orchestration and stable product results;
- `src/db`: Supabase clients and typed repository implementations;
- `public`: exact RLS-protected relational reads;
- `api`: approved projections and transactional commands;
- `private`: privileged helpers, audit, outbox, and implementation details;
- service worker: external email/Storage work after the database transaction
  commits.

External email, enrichment, AI, and Storage API calls never run while a SQL
lock is held.

## Foundation database contract additions

### Read projections

#### `api.get_my_member_context(p_preferred_membership_id uuid default null)`

Authenticated only. Returns exactly one typed row for the current Auth user,
including:

- account state and onboarding completion;
- validated selected membership ID, or null;
- `requires_circle_choice`;
- current unread-notification count;
- a fixed-shape `memberships` JSON array containing each owned membership's
  status, joined time, organization ID/slug/name/approval mode, self profile
  summary, and current roles.

The query starts from `public.users`, so a valid Auth user with zero
memberships still gets a routable account result with an empty array. The only
input is a membership preference; it never accepts a user ID. The repository
validates the fixed JSON shape with Zod.

#### `api.get_my_profile(membership_id)`

Authenticated owner only. Returns the complete self-edit model for the chosen
membership, including ordered career, education, skills, visibility overrides,
helper preference/topic data, and freshness policy. Nested collections use a
fixed JSON shape and are validated with Zod at the repository boundary.

#### `api.verify_invite(token)`

Service role only. Hashes the raw high-entropy token inside the database and
returns only safe join-page fields. It never returns `token_hash`. The public
join route calls this through the server-only service repository; browser code
does not receive a privileged client.

### Member commands

#### `api.accept_invite(token)`

Authenticated only. In one transaction:

1. hash and lock the invite row;
2. validate pending status, expiry, and normalized Auth email;
3. resolve approval mode;
4. create or reuse the unique membership;
5. create the organization profile;
6. create the global profile when invite/Auth metadata contains a nonblank
   display name, otherwise leave it for onboarding step 1;
7. mark the invite accepted by the current user;
8. write audit state and enqueue any approved notification/email work;
9. return membership ID, membership status, and a stable result code.

Repeating the same request for the same user returns the durable result. A
different user, email mismatch, expired invite, revoked invite, or already-used
invite produces a stable non-secret result and no partial writes.

#### Profile commands

Use command names based on data responsibility rather than UI component names:

- `api.save_profile_identity` — display/preferred/other name and graduation
  year for an owned membership;
- `api.save_profile_education` — university/major plus ordered normalized
  education rows;
- `api.save_profile_current` — employer/title/city/headline/LinkedIn URL;
- `api.save_profile_history` — ordered experiences and skills;
- `api.save_profile_preferences` — organization bio, helper availability,
  helper topics, and freshness consent;
- `api.set_my_avatar_path` — owner path after a successful Storage upload;
- `api.complete_onboarding` — validate the required floor, timestamp completion,
  audit, and enqueue profile indexing.

Each command:

- derives the user from `auth.uid()`;
- verifies the membership through `private.owns_membership`;
- locks the smallest stable row set;
- treats retries idempotently;
- replaces ordered child rows inside one short transaction;
- returns a stable result code for expected product states;
- never accepts `user_id` from the member caller.

#### Membership and safety commands

- `api.decide_membership(membership_id, decision)` — active org admin accepts
  or rejects a pending membership, sets approver/time fields, audits, and
  enqueues the result notification;
- existing `api.block_member` / `api.unblock_member` remain the sole member
  block mutation surface;
- existing `api.mark_notifications_read(notification_ids)` remains the sole
  notification mutation required by the shell;
- blocking continues to affect profile, Help, connection, conversation, and
  message policies through `private.is_blocked`.

### Service-only outbox commands

Add explicit wrappers, granted only to `service_role`:

- `api.claim_outbox_jobs(worker_id, limit)`;
- `api.complete_outbox_job(job_id, worker_id)`;
- `api.retry_outbox_job(job_id, worker_id, error, available_at)`;
- `api.fail_outbox_job(job_id, worker_id, error)`.

Completion and failure verify the lock owner. Retry clears the lock and moves
the job back to `pending`; terminal failure occurs at `max_attempts`. Multiple
workers claim disjoint rows through `FOR UPDATE SKIP LOCKED`. External work
occurs after claim commit and before the short completion/retry command.

### Policy and grant corrections

- let a membership owner read their own pending/rejected/revoked row while
  same-organization browsing still requires an active membership;
- provide pending users only the safe organization context returned by the
  self-context API;
- keep raw profile, invite, audit, outbox, and private-table access revoked;
- prevent authenticated direct execution of private mutation/query
  implementations; use reviewed `api` wrappers for those operations;
- allow only the minimum private helper execution/schema access that RLS
  evaluation requires, with pgTAP proving policy success and denial of every
  non-helper private function;
- explicitly grant each authenticated `api` function;
- explicitly grant service-only functions only to `service_role`;
- remove blanket authenticated sequence access unless a reviewed direct-write
  path proves it is needed;
- add pgTAP assertions for every grant and denial.

No new Foundation table is required. If implementation discovers a proposed
table, stop and amend this plan/contract before adding it.

### Query, index, and transaction rules

- `get_my_member_context` is the member-shell bootstrap query. It replaces the
  current repeated user/membership/profile/admin-role/count round trips.
- `get_my_profile` returns the bounded self-edit aggregate once; onboarding
  does not issue one query per education, experience, skill, or helper topic.
- notification rows use the existing `(recipient_user_id, created_at desc,
  id desc)` cursor index; unread count uses the existing unread partial index.
- every membership/RLS join column must have a supporting index. New indexes
  require a named query or constraint and an `EXPLAIN (ANALYZE, BUFFERS)` check
  on representative local data; do not add speculative indexes.
- RLS policies wrap stable Auth/helper calls in scalar `select` form where
  PostgreSQL can initialize them once per statement, while preserving the
  central helper contract.
- every security-definer function uses `set search_path = ''`, fully qualified
  names, a fixed return type, and an explicit caller grant test. An API wrapper
  that delegates to a privileged private implementation is itself a reviewed
  security-definer boundary, so its caller needs only the wrapper grant and
  never the private command grant.
- write commands lock rows in a documented order: root membership/invite first,
  then owned profile rows, then replaceable children. No command waits on an
  external API or starts a second database transaction.
- retries use durable uniqueness or dedupe keys, not a read-then-insert race.
- after each schema slice, run warning-level database lint; after Foundation,
  run Supabase security/performance advisors and disposition every finding.

## Application structure

### Typed database adapters

Create small repository modules rather than a generic data layer:

- `src/db/repositories/member-context.ts`
- `src/db/repositories/invites.ts`
- `src/db/repositories/profiles.ts`
- `src/db/repositories/memberships.ts`
- `src/db/repositories/blocks.ts`
- `src/db/repositories/outbox.ts`

Repositories own Supabase select/RPC syntax and translate generated rows into
domain values. They do not decide product copy or redirects.

### Pure domain operations

Keep or refactor the matching domain modules so they import no Next.js,
Supabase client, or Resend code:

- `src/lib/invite/verify.ts`
- `src/lib/invite/accept.ts`
- `src/lib/profile/savePartialProfile.ts`
- `src/lib/profile/uploadAvatar.ts`
- `src/lib/admin/decideMembership.ts`
- a small member-context selector under `src/lib/auth/` or
  `src/lib/membership/`.

Each receives a narrow repository interface, normalizes expected result codes,
and has Vitest fakes for success, retry, and denial paths.

### Next.js boundary

- move redirect/cookie behavior out of business functions;
- keep auth session extraction and membership-cookie handling in a server-only
  application boundary;
- use the context projection once in the member layout instead of repeating
  users/memberships/profile/admin-role queries;
- add a minimal circle chooser for multiple usable memberships;
- resolve `avatar_path` to a public Storage URL at the boundary; never store a
  signed/public URL in `profiles`;
- port the notification list through owner RLS, bootstrap unread count through
  member context, and mark-read through its command;
- remove `createAdminClient` from invite/profile/member business modules.

### Transition verification

Add `tsconfig.v2-foundation.json` and `pnpm typecheck:v2-foundation`. It includes
the v2 database clients, Foundation repositories and `/lib` modules, join,
callback, onboarding, member layout, circle chooser, shell notification
dependency, and focused tests.

This config is a temporary verification tool, not a second production type
contract. It is deleted when the global typecheck reaches zero errors.

## Implementation plan

Every numbered step is reviewable on its own. Proceed only when its verification
passes; diagnose failures before starting the next step.

### Milestone 0 — Freeze the local contract and verification baseline

1. After signoff, commit the approved planning docs, then record branch, commit,
   dirty state, Node/pnpm versions, and the 1,356-error / 108-file compiler
   baseline.
   **Verify:** `codex/redesign-v2` is current and no unrelated change is present.
2. Confirm active migration history contains only the v2 baseline and legacy
   history is archived.
   **Verify:** migration and archive file lists match ADR 0015.
3. Inspect Docker container names before starting Supabase; do not stop another
   project's stack without approval.
   **Verify:** BridgeCircle ports are free or the conflicting owner is known.
4. Add the focused Foundation typecheck script and initial include list.
   **Verify:** failures are limited to identified Foundation legacy calls.
5. Add a test inventory mapping each Foundation invariant to pgTAP, Vitest, or
   Playwright.
   **Verify:** every definition-of-done item below has an owning test.

### Milestone 1 — Correct the SQL security boundary first

6. Write failing pgTAP assertions for owner-pending membership reads, explicit
   function grants, raw profile denial, and service-only outbox denial.
   **Verify:** only the new assertions fail.
7. Replace blanket authenticated API/sequence grants with explicit allowlists,
   and remove direct grants on private command/query implementations. Preserve
   only the minimum ACL needed by RLS helpers.
   **Verify:** reviewed API calls and RLS policies work, while direct private
   commands, non-allowlisted API functions, sequences, anon, and cross-role
   calls fail.
8. Amend membership read policy so owners can read their own non-active row
   without granting organization data to another pending/revoked user.
   **Verify:** active, pending, revoked, cross-org, and anon personas pass.
9. Re-run database lint and the foreign-key/RLS schema contract.
   **Verify:** zero warnings and all existing assertions pass.

### Milestone 2 — Build the context and invite contract

10. Add failing tests for zero, one, multiple, pending, rejected, revoked,
    valid-preference, and tampered-preference context results.
    **Verify:** tests prove no user-ID argument or cross-user row is accepted.
11. Implement `private.get_my_member_context` and its fixed `api` wrapper.
    **Verify:** it returns one account row, validates the preferred membership,
    and produces the deterministic selection/chooser result above.
12. Add failing invite-verification tests for valid, missing, expired, revoked,
    and accepted tokens.
    **Verify:** safe fields only; no hash/raw-table privilege.
13. Implement the service-only invite verification projection.
    **Verify:** service role succeeds; anon/authenticated direct calls fail.
14. Add invite-acceptance tests for auto-approve, pending approval, email
    mismatch, missing display name, repeat acceptance, and competing users.
    **Verify:** tests fail before the command exists.
15. Implement atomic invite acceptance with a locked invite and idempotent
    inserts.
    **Verify:** acceptance tests and deferred constraints pass.
16. Add a concurrent acceptance test.
    **Verify:** one membership/org-profile result, one accepted invite, no
    duplicate profile, and no partial rows.
17. Add `api.decide_membership` with admin, cross-org, and repeat-decision tests.
    **Verify:** only an active same-org permitted admin can decide.

### Milestone 3 — Build the self-profile/onboarding contract

18. Add failing self-profile read tests for owner, cross-user, blocked orgmate,
    pending member, and invalid membership.
    **Verify:** only the owner receives the full edit projection.
19. Implement `api.get_my_profile`.
    **Verify:** ordered children and defaults match the fixed return contract.
20. Add profile-identity command tests, including profile creation when invite
    acceptance had no usable display name.
    **Verify:** non-owner and cross-org writes fail without partial updates.
21. Implement `api.save_profile_identity`.
    **Verify:** global and organization fields commit atomically.
22. Add and implement education replacement tests/command.
    **Verify:** invalid ranges fail; valid ordering is deterministic; retries do
    not duplicate rows.
23. Add and implement current-profile field tests/command.
    **Verify:** URL and length constraints produce stable results.
24. Add and implement experience/skills replacement tests/command.
    **Verify:** row lock prevents concurrent replacement constraint failures.
25. Add and implement organization bio, helper availability/topics, and
    freshness-consent tests/command.
    **Verify:** membership ownership and normalized topic ordering hold.
26. Add and implement avatar-path update tests/command.
    **Verify:** only the owner's allowed bucket/path prefix can be stored.
27. Add and implement onboarding completion tests/command.
    **Verify:** required identity/graduation floor is enforced, audit is written,
    and one profile-indexing outbox job is deduplicated.
28. Rebuild from empty, regenerate types, and confirm deterministic output.
    **Verify:** reset, tests, lint, empty diff, and a second generation produce
    no unexplained change.

### Milestone 4 — Finish block, audit, and outbox primitives

29. Expand the block matrix across profile context and existing downstream
    helpers.
    **Verify:** either direction blocks visibility/commands without revealing
    who initiated the block.
30. Audit every Foundation command and add missing action assertions.
    **Verify:** actor, organization, target, and payload contain no profile PII
    beyond the approved evidence.
31. Add failing outbox claim/complete/retry/fail ownership tests.
    **Verify:** authenticated and anon roles cannot call service wrappers.
32. Implement explicit service-only outbox wrappers.
    **Verify:** state constraints and lock ownership pass.
33. Run parallel-worker and stale-lock/retry tests.
    **Verify:** workers claim disjoint jobs, attempts cap correctly, and no
    external call occurs inside a database transaction.
34. Re-run account pseudonymization regression tests.
    **Verify:** profile PII is removed, shared accepted history remains, Storage
    deletion is queued once, and repeated cleanup is safe.

### Milestone 5 — Port the application boundary

35. Implement typed Foundation repositories using generated `public`/`api`
    types.
    **Verify:** repository unit tests map every stable database result.
36. Refactor invite `/lib` operations to injected repositories.
    **Verify:** no Supabase/admin/Next import remains in the business functions.
37. Port password signup and OAuth callback to verify/accept commands.
    **Verify:** invalid/mismatched invites never create partial accounts or
    memberships; successful paths set the membership cookie.
38. Implement the membership-context selector and secure cookie boundary.
    **Verify:** tampered/stale cookies are ignored and never authorize access.
39. Add the multiple-circle chooser and deterministic one-circle fast path.
    **Verify:** two-org E2E selects and persists the intended membership.
40. Port member layout to the single context projection and avatar-path resolver.
    **Verify:** no layout query uses `.limit(1)` for organization selection.
41. Port the cursor-paginated shell notification list through owner RLS, take
    initial unread count from member context, and mark read through the existing
    API command.
    **Verify:** the redesigned shell renders and updates read state without
    service-role, raw table-write access, or N+1 queries.
42. Refactor profile/onboarding `/lib` operations to injected repositories.
    **Verify:** focused Vitest covers each onboarding step and expected error.
43. Port onboarding page/actions to self-profile projection and commands.
    **Verify:** steps resume, skip, retry, and completion remain correct.
44. Port avatar upload persistence to `avatar_path`.
    **Verify:** upload/upsert policies and rendered public URL work locally.
45. Port pending-approval rendering and admin decision integration.
    **Verify:** pending members see only safe self/org context and gain access
    immediately after approval.
46. Remove obsolete Foundation direct-table/admin-client code paths.
    **Verify:** targeted `rg` finds no raw Foundation write outside repository,
    seed, test fixture, or approved service script.

### Milestone 6 — Verify and checkpoint Foundation

47. Run the complete database rebuild/verification chain.
    **Verify:** reset, pgTAP, warning-level lint, empty schema diff, deterministic
    types, advisor review, and FK/RLS/grant assertions all pass; active history
    contains the single v2 baseline.
48. Run `pnpm typecheck:v2-foundation`, Biome, ESLint, and focused Vitest.
    **Verify:** Foundation is green with no ignored errors.
49. Run focused Playwright for invite → signup → onboarding → circle selection
    → shell, plus pending approval and tenant-denial paths.
    **Verify:** no browser console errors and no outbound real email.
50. Re-run global TypeScript inventory.
    **Verify:** error count and error-file count are lower than 1,356/108 and
    no new out-of-domain error exists.
51. Update contract, runbooks, active data-model status, E2E fixture docs, and
    implementation status together.
    **Verify:** docs label legacy vs v2 accurately and use port 3000/current
    branch names.
52. Review the diff for secrets, broad grants, service-role leakage, raw token
    logging, non-determinism, and unrelated edits.
    **Verify:** clean `git diff --check`; no secrets or remote commands.
53. Commit one Foundation checkpoint only after every gate above passes.
    **Verify:** clean worktree and commit contains SQL, generated types, code,
    tests, and synchronized docs.

## Verification matrix

| Concern | Database test | App/unit test | E2E proof |
|---|---|---|---|
| Auth shadow | trigger creates one tombstone-capable user | session result mapping | password and OAuth signup |
| Invite safety | hashed token, expiry/status/email, idempotency | stable error mapping | invalid, used, and valid invite |
| Membership isolation | owner/pending/admin/cross-org personas | deterministic context selection | pending approval and two circles |
| Profile privacy | owner full projection, other denied | Zod projection parsing | onboarding resumes without leaks |
| Profile writes | ownership, validation, atomic child replace | each step retry/skip | complete staged onboarding |
| Blocking | symmetric helper effect | block result mapping | later full UI; DB gate now |
| Audit | exact action/actor/org/target | none beyond mapping | inspect only on failure |
| Outbox | claim ownership, retry, attempts, dedupe | worker state mapping | dummy email only |
| Storage | avatar policies and path prefix | URL/path adapter | avatar upload and render |
| Account deletion base | idempotent pseudonymizer and Auth trigger | deferred orchestration | deferred to Settings milestone |

## Local execution guardrails

- Run destructive commands only with `--local` or the local package script.
- Never run `supabase db push`, linked type generation, migration repair, or a
  remote reset during Foundation.
- Before a local reset, identify Docker container ownership; do not stop an
  unrelated project's stack by assumption.
- The committed legacy archive is the local rollback reference. Remote cold
  snapshots remain mandatory immediately before each separately approved
  remote cutover.
- Use deterministic local personas and dummy outbound-provider credentials.
- Never print Supabase secret keys, invite tokens, or service-role payloads in
  logs or test snapshots.

## Stop conditions

Stop and revise the contract before proceeding if:

- a new table appears necessary for Foundation;
- a member write appears to require raw table grants;
- a service-only function would need authenticated execution;
- an operation cannot be made idempotent under retry;
- a transaction would include email, Storage, enrichment, or AI work;
- multi-org behavior would require an arbitrary first membership;
- a schema change weakens block, tenant, or profile privacy behavior;
- the global compiler inventory gains a new error outside the active slice;
- a local command resolves to a linked/shared Supabase project;
- any database test, focused typecheck, or focused E2E gate fails.

## Definition of done

Foundation is complete only when:

- an empty local database rebuilds deterministically from the v2 baseline;
- all Foundation pgTAP assertions, lint, schema diff, and type generation pass;
- all member-controlled Foundation table writes use explicit API commands;
- no Foundation business module imports Supabase, Next.js, or a service client;
- invite acceptance is atomic, idempotent, email-bound, and concurrency-tested;
- membership selection is explicit and multi-org correct;
- onboarding persists the normalized v2 profile model and renders the app shell;
- pending/revoked/cross-org/block personas are denied correctly;
- outbox workers use service-only claim/complete/retry/fail commands;
- focused typecheck, unit tests, and E2E are green without ignored errors;
- the global legacy compiler inventory decreases without new drift;
- remote development and production remain untouched;
- code and active documentation describe the same Foundation contract.

## After Foundation

Proceed in the approved order:

1. conversation primitive;
2. Help end to end;
3. Messages aggregation and routes;
4. People/Profile, Connections, Search, and enrichment;
5. School/Admin, Settings/account lifecycle, events, announcements, analytics;
6. full global compile/build/E2E convergence;
7. separately approved remote-development snapshot and cutover;
8. stabilization, then a separate production-reset approval.

No partially ported v2 backend is merged to `main` or deployed to a shared
environment.

## Signoff

Richard approved this plan on 2026-07-14. The approval includes these
implementation choices for the Foundation milestone:

- API-command-only member-controlled Foundation table writes;
- explicit function grants rather than blanket grants;
- membership cookie plus circle chooser for multi-org context;
- atomic invite acceptance;
- normalized profile replacement commands;
- narrow onboarding dependency carve-ins for helper/freshness settings;
- focused green verification plus a monotonically shrinking global compiler
  inventory during the long-lived port;
- deferring full account-deletion request/confirmation orchestration to the
  Settings/account-lifecycle milestone;
- no remote database or deployment changes.
