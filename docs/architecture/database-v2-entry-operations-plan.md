# Database v2 Entry and Operations vertical-slice implementation plan

> **Status (2026-07-16): approved and implemented through the durability
> hardening checkpoint.** Schema contracts, fixed repositories, canonical
> routing, seven-step onboarding, Welcome and All set bookends, private Help
> cold start, canonical Offer handoff, classmate Connections, review-first
> LinkedIn/résumé Fast Fill, Settings, Notifications, account lifecycle
> workers, minimal admin operations, and shared system states are landed
> locally. Invitation terminal states, one-use password recovery, two-device
> onboarding resume, export/deletion finalization, offline notice, reduced
> motion, focus recovery, and 320px safety now have factory-owned browser roads
> that also pass with five parallel workers. The remaining exhaustive
> Notifications/admin/offline-form and full breakpoint roads stay follow-on
> work. No remote database, deployment, push, merge, or commit is authorized by
> this document.

## Goal

Complete the path into BridgeCircle and the quiet operational surfaces that
keep an account usable after entry:

`invite -> join -> authentication -> onboarding -> approval -> circle choice`

The slice also owns account recovery, settings, account lifecycle, durable
notifications, and the minimum administrator operations needed to invite and
approve members. It must use the database v2 identity and membership model,
preserve strict organization boundaries, remain retry-safe at every mutation,
and finish without compatibility routes or legacy table access.

This is not a new admin product, an engagement system, or a detailed matching
project. It completes member entry and essential operations around the five
finished member vertical slices.

## Success criteria

The slice is complete when:

- a new person can follow one valid invite through verified authentication,
  durable onboarding, approval when required, circle selection, and Home;
- invite expiry, reuse, revocation, resend, wrong-account, duplicate-submit,
  and concurrent-accept cases converge to explicit safe states;
- onboarding matches the accepted seven-step flow, saves each step durably,
  resumes on another device, and never publishes a private question silently;
- onboarding cold-start actions call the owning Help and Connections contracts
  and cannot create duplicate offers, requests, or conversations;
- administrators can issue, list, resend, revoke, approve, and reject within
  organizations they administer, without direct table access;
- sign-in, password recovery, email change, sign-out, deletion cancellation, scheduled
  deletion, cancellation, and final deletion have one documented lifecycle;
- Settings owns notification preferences, newsletter preference, Help
  availability, blocked-member management, and data export;
- Notifications has a durable paginated list, correct unread counts, deep
  links, mark-one/mark-all behavior, and bounded priority popovers;
- pending, denied, not-found, offline, loading, and recoverable-error states use
  the accepted system-state patterns;
- all public data is protected by RLS, private workflow data has no client
  grants, fixed `api` functions form the browser contract, and service-role
  authority remains server/worker only;
- the owned legacy routes and retired schema identifiers are deleted rather
  than shimmed;
- every gate in the companion test inventory passes with no owned TypeScript,
  lint, accessibility, or browser-road failures.

## Canonical sources and precedence

When sources disagree, use this order:

1. implemented database v2 invariants and security boundaries;
2. [ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md) and the
   [database v2 contract](database-v2-contract.md);
3. [`FLOWS.md`](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md),
   especially sections 0, 1, 7c, 7d, 8, and 9;
4. accepted Entry, Onboarding, Notifications, Settings, Signed Out, System
   States, and App Shell handoff templates;
5. the launch cut and current information architecture;
6. this approved plan;
7. older application code and archived specifications.

Code remains canonical after implementation. Any affected document that still
describes the previous routes or slice status must be corrected in the same
change.

## Scope boundaries fixed before implementation

### Included

- `/join`, `/sign-in`, authentication callback, password recovery, and password
  update;
- `/onboarding`, its import/review path, the cold-start sequence, `/pending`,
  and `/select-circle`;
- `/notifications` and the app-shell notification popover;
- `/settings` and `/cancel-delete`;
- minimal `/admin`, `/admin/invite`, and `/admin/approvals` operations;
- Resend/outbox delivery for invitations and transactional account messages;
- schema, fixed functions, repositories, operations, UI, tests, runbooks, and
  destructive removal of owned legacy paths.

### Explicitly excluded

- a new Admin visual system or redesigned admin information architecture;
- admin analytics, general member management, events, announcements, and
  newsletter authoring;
- weekly digest or engagement campaigns;
- detailed People search, ranking, embedding, or enrichment tuning;
- social-login providers beyond the currently approved authentication methods;
- billing, CRM, or alumni-management workflows;
- remote database reset, deployment, push, or merge without separate approval.

The accepted redesign marks Admin out of scope. The required invite and
approval tools will therefore be desktop-primary operational pages using the
shared BridgeCircle tokens and components. They will be polished and
accessible, but this slice will not invent a broader admin product.

## Architecture decisions

### One state machine, not route-local guesses

`api.get_my_member_context()` remains the authority for routing. Middleware
performs only cheap session protection; server route guards load the fixed
context and resolve one destination in this order:

1. no authenticated user -> signed-out route;
2. deletion scheduled -> `/cancel-delete`;
3. authenticated user with no membership and no valid entry session ->
   invitation state;
4. incomplete required profile -> `/onboarding`;
5. pending membership -> `/pending`;
6. more than one active membership and no valid selection -> `/select-circle`;
7. one selected active membership -> requested member route.

The resolver is a pure `/lib` function with exhaustive typed states. Routes do
not duplicate redirect logic, and query parameters cannot override a database
state. The authentication callback accepts only an allowlisted relative next
path so it cannot become an open redirect.

### Identity and membership ownership stays explicit

- Authentication, account state, email change, export, deletion, notification
  preferences, and notification inbox are user-scoped.
- Onboarding profile values can be user-scoped or membership-scoped according
  to the existing v2 profile contract; the selected organization is always
  explicit when organization-specific fields are saved.
- Invites, approvals, admin authority, cohort choices, and Help availability
  are organization/membership-scoped.
- A person may retain one account and conversations while a membership is
  pending, revoked, or changed. No operation substitutes email for a stable
  user or membership identifier after invite verification.

### Browser code uses fixed contracts only

Server components and server actions call typed repositories in
`src/db/repositories/`. Repositories call named `api` projections and commands.
Business decisions, mappings, and user-facing result handling live in
`src/lib/`. UI code does not read public tables, private tables, Auth internals,
or `admin_role_assignments` directly.

Each command returns a stable result code and current resource snapshot when
useful. Expected conflicts such as `already_accepted`, `already_decided`,
`expired`, `stale`, or `not_available` are normal results, not parsed database
error text.

### Invitation issue, verification, and acceptance

Keep raw invite tokens out of `public` storage and logs:

- generate at least 256 bits with the server cryptographic RNG;
- store only the token hash on `public.invites`;
- carry the raw token only in trusted server memory and the private outbox
  payload required to deliver the email;
- redact invite URLs and emails from application/Sentry metadata;
- expire invitations after 14 days;
- make resend revoke the previous usable token and issue a new invite version;
- make revoke and resend safe to retry using a client request ID;
- make acceptance transactional with the invite lock and membership upsert;
- never reveal whether an arbitrary email is already a member to an
  unauthenticated caller.

Add fixed admin projections/commands for issue, list, resend, and revoke.
Authorization is checked in the database against the target organization. One
normalized email may have only one usable invite per organization and intended
membership role. Concurrent attempts converge on the same current state.

Entry renders the accepted states: verifying, valid, expired, already used,
revoked/not available, and recovery from transient failure. A verified token is
bound to a short-lived, signed, HTTP-only entry session before authentication;
it is not copied through arbitrary URLs or browser storage.

### Authentication and recovery

Supabase Auth remains the identity provider. Application code uses supported
Auth APIs rather than writing `auth.users`.

- sign-in errors are non-enumerating;
- password reset always shows the same confirmation result;
- password recovery emails use a custom Supabase template that sends
  `token_hash` to `/auth/confirm`; the server verifies the one-use recovery OTP,
  writes the session cookies, and removes the secret from the destination URL;
- OAuth callback codes and recovery token hashes are single-use and
  time-bounded;
- session refresh and sign-out work across tabs;
- email change uses Auth's confirmation flow and displays pending confirmation
  without changing authorization identity prematurely;
- sign-out is local plus server session invalidation where supported;
- rate limits cover sign-in, reset, invite verification, and admin issuance;
- transactional email is queued through the existing outbox/Resend boundary,
  never sent inside a database transaction.

### Durable seven-step onboarding

The accepted sequence is:

1. You;
2. Fast fill/import and review;
3. Education;
4. Career;
5. Activities;
6. Help;
7. Say hi/cold start;
8. All set.

Every durable field saves through its existing profile or membership owner as
the member advances. Optional steps can be skipped; the required identity floor
cannot. The server derives the earliest valid step from durable state. A signed
HTTP-only cursor may improve navigation, but it cannot manufacture completion.
Refresh, duplicate submit, back navigation, and another-device resume must
produce the same state.

The existing import screen is ported off retired `base_profiles` and
`audit_log`. Provider parsing is isolated behind one adapter and produces a
reviewable proposal; it never writes profile truth automatically. Detailed
embedding/search tuning stays deferred.

### Cold-start actions respect owner-domain semantics

The handoff is adjusted in three deliberate ways to preserve product rules:

1. A private help question is saved as a membership-scoped onboarding draft;
   it is surfaced on Home/Help and must go through the canonical reach and
   recipient decision before it becomes an Ask. Onboarding never publishes it
   silently.
2. “Offer” opens the canonical Help offer composer and returns to onboarding;
   it does not create a note-less one-click offer. Existing accepted/closed or
   withdrawn outcomes converge safely.
3. “Connect” uses the existing Connections request command. The UI may select
   a cohort in bulk, but one submission is capped at 25 eligible members and
   excludes self, blocked, existing, pending, inactive, and wrong-organization
   identities.

Add a private onboarding-draft relation with no authenticated grants and fixed
self read/save/clear functions. Each real cold-start mutation carries a stable
client request ID. A retry cannot create a second offer, connection request,
or person-to-person message room.

Completing onboarding is one final command that validates the required floor,
sets `onboarding_completed_at` once, preserves optional drafts, and returns the
next context state. Approval-required members go to `/pending`; active members
go to circle selection or Home.

### Approval is a locked membership transition

The existing decision function remains the lifecycle authority. Add a bounded
admin queue projection with keyset pagination and no hidden-profile fields.

- only an active administrator of that organization may view or decide;
- approve/reject is transactional and retry-safe;
- concurrent opposite decisions yield one winner and one stable stale result;
- an administrator cannot approve into a conflicting revoked/deleted state;
- approval queues a transactional notification/email after commit;
- rejection supports the approved cushioned member-facing copy without
  exposing internal notes;
- the member pending screen polls/revalidates calmly and can recover from
  network loss without duplicate actions.

### Settings separates account, communication, and membership choices

Build `/settings` from the accepted Settings handoff:

- Account: email change, data export, sign out, scheduled deletion;
- Notifications: per-group bell/email choices mapped explicitly to exact
  notification types;
- School communication: newsletter email preference;
- Help: the same membership-scoped availability source used by Give Help;
- Safety: blocked-member list and unblock.

Exact notification types remain stored in `notification_preferences`. A typed
mapping in `/lib` expands each visual group to its types so adding a new type
cannot silently inherit the wrong behavior. Add one user-scoped communication
preference row for newsletter email rather than pretending a newsletter is an
in-app notification.

Blocked-member listing uses a fixed projection that returns only the minimum
identity required to recognize and unblock the person. It does not bypass the
block policy for profiles or messages.

### Export and deletion are durable jobs

Data export is not a synchronous browser query. Add a private export-request
record with one active request per user, stable status, expiry, and a worker
handoff through the outbox. The archive is written to private storage and
served by a short-lived signed link only to the owner. Repeated requests return
the current job; failures are retryable and auditable without storing secrets.

Deletion uses an explicit lifecycle:

`active -> deletion_scheduled -> deleted`

- scheduling records the deadline and reason through a self command;
- the grace period is seven days;
- `/cancel-delete` cancels safely before finalization;
- finalization is an idempotent service-only job using the existing cleanup
  contract and revoking active sessions;
- a schedule/finalize/cancel race locks the user row and produces one legal
  terminal state;
- deleted identity is tombstoned according to the v2 retention contract;
- retained messages do not retain public profile, notification, preference,
  invite-token, export-link, or onboarding-draft data.

### Notifications are durable and bounded

Extend the existing v2 notification repository rather than creating another
inbox:

- reverse-chronological keyset pagination with a stable ID tie-breaker;
- unread count from the same user-scoped source as the shell badge;
- mark one read before following its validated internal deep link;
- mark all read up to a server timestamp so concurrently arriving items stay
  unread;
- unknown, unauthorized, or retired targets fall back to `/notifications`;
- the bell popover is a bounded recent subset of durable notifications; read
  rows remain visible while unread rows retain explicit tint, weight, and dot
  treatment, and it is never used for marketing;
- Realtime invalidates counts/list state but cannot authorize or fabricate a
  row;
- newsletter and weekly digest do not enter this inbox.

### System states are first-class UI states

Use the accepted System States geometry for route not-found, permission denied,
offline/load failure, and retry. Loading skeletons follow the actual Entry,
Onboarding, Settings, Notifications, Pending, and admin page geometry. Errors
preserve user input where safe, focus the recovery action, and never expose SQL,
Auth, membership, or invite existence details.

## Schema and contract changes

The implementation migration will be generated by the Supabase CLI and will:

1. add private onboarding drafts and fixed owner functions;
2. add user communication preferences for school newsletter email;
3. add private account-export requests and safe owner projection/command;
4. add fixed admin invite issue/list/resend/revoke functions;
5. add a fixed approval-queue projection around the existing decision command;
6. add notification preference read/save functions and blocked-member list;
7. add self schedule/cancel-deletion commands and service finalization guard;
8. extend notification pagination/read contracts where current functions are
   insufficient;
9. add only indexes justified by the acceptance queries and `EXPLAIN`;
10. deny client grants on every `private` relation and grant only named `api`
    functions required by authenticated or service roles.

All functions use qualified names and an empty search path. Security-definer
helpers remain inaccessible unless deliberately wrapped. Every public relation
has RLS enabled and forced where appropriate. Authorization derives from
`auth.uid()` and database roles, never mutable user metadata.

## Application layout

Keep boundaries narrow:

- `src/lib/entry/` — route-state resolver, invite presentation, safe next path;
- `src/lib/onboarding/` — step derivation, validation, cold-start orchestration;
- `src/lib/settings/` — preference grouping and account result presentation;
- `src/lib/notifications/` — target validation and presentation mapping;
- `src/lib/admin/` — invite/approval operations only;
- `src/db/repositories/` — fixed database adapters and strict parsers;
- server actions — authentication/session calls and thin operation entrypoints;
- route components — rendering, local form state, focus, and responsive UI.

Shared design-system components are reused. Raw shadcn defaults, page-local
tokens, a generic workflow engine, and speculative repository abstractions are
not introduced.

## Numbered implementation plan

### 0. Freeze contracts and create failing gates

1. Capture accepted template states at stable desktop and mobile viewports.
2. Inventory owned routes, legacy identifiers, fixed functions, and current
   TypeScript failures; record the baseline in the test inventory.
3. Write failing pgTAP contracts for new relations/functions, grants, RLS,
   lifecycle races, and tenant isolation.
4. Add focused TypeScript projects and static cutover ratchets for this slice.
5. Verify: tests fail only for the missing approved contracts; no runtime or
   remote state has changed.

### 1. Land the database and repository foundation

1. Verify current Supabase Auth/RLS guidance before writing the migration.
2. Generate one CLI-named migration for the approved contract changes.
3. Implement fixed functions, constraints, grants, RLS, audit/outbox events,
   and measured indexes.
4. Regenerate database types twice and require identical output.
5. Add strict repository parsers and result unions.
6. Verify: clean local reset, shadow replay, database lint, advisors, pgTAP,
   repository tests, and no direct private/public table access in owned code.

### 2. Complete invite, authentication, and routing

1. Implement admin invite operations and outbox delivery.
2. Rebuild Entry states and bind the verified invite to the auth session.
3. Normalize sign-in, callback, recovery, password-update, and safe redirects.
4. Add the exhaustive member-context route resolver and `/pending`.
5. Verify: invite/auth concurrency tests and signed-out-to-pending/active browser
   roads, including expired, reused, revoked, and transient-failure states.

### 3. Rebuild onboarding and cold start

1. Replace the five-step and legacy import paths with the accepted seven steps.
2. Save every step durably through owner repositories and support resume/back/
   skip semantics.
3. Port import into a review-only adapter without retired tables.
4. Add the private question draft and canonical Help handoff.
5. Integrate offer composer and bounded idempotent Connection requests.
6. Finalize onboarding and route from returned context.
7. Verify: step-state matrix, retry tests, two-device resume, cold-start owner
   seams, no silent Ask, and responsive/accessibility browser roads.

### 4. Build Settings and account lifecycle

1. Implement account, notification, school communication, Help, and blocked
   member sections from the accepted handoff.
2. Wire Auth email change and session-safe sign-out.
3. Wire exact-type preference upserts and newsletter preference.
4. Wire Help availability and fixed blocked-list/unblock operations.
5. Implement export request/status/download and schedule/cancel deletion.
6. Verify: preference isolation, signed-link ownership, deletion races,
   deletion cancellation, keyboard/focus, and mobile layout.

### 5. Complete Notifications

1. Port the accepted list, filters/states, unread treatment, and shell popover.
2. Add keyset loading, mark-one-before-navigation, timestamp-bounded mark-all,
   validated targets, and Realtime invalidation.
3. Add empty, loading, offline, stale-target, and recoverable error states.
4. Verify: projection/operation tests, cross-tab count behavior, deep-link
   authorization, reduced motion, accessibility, and viewport matrix.

### 6. Complete minimal admin operations

1. Build the restrained admin landing, invite, and approval queue.
2. Enforce organization role checks in database and route guards.
3. Add issue/resend/revoke/approve/reject confirmations and stable conflicts.
4. Verify: two-organization privacy matrix, race tests, audit/outbox evidence,
   keyboard operation, and desktop/tablet behavior.

### 7. Destructive cutover and closeout

1. Delete owned legacy routes, queries, compatibility helpers, and obsolete
   onboarding/admin invite tests; do not redirect retired URLs unless a current
   canonical link needs one transition.
2. Update IA, launch cut, database contract/status, runbooks, and docs index.
3. Run the complete inventory, prior-slice regressions, clean reset, shadow
   replay, type generation, linters, accessibility, and browser roads.
4. Compare final screenshots against accepted templates and classify every
   intentional contract correction.
5. Record remaining repository-wide failures by later owner. This slice cannot
   claim global green while deferred search/enrichment code still fails, but it
   must leave zero Entry/Operations-owned failures.
6. Stop before any remote reset, push, merge, or deployment and present the
   measured checkpoint for separate approval.

## Failure and observability policy

- Log stable operation names, result codes, request IDs, and timings; never raw
  tokens, passwords, email links, private questions, export URLs, or notes.
- Sentry receives redacted domain context and no PII-rich form payloads.
- Outbox delivery has attempt count, next attempt, terminal failure, and
  idempotency key; a delivery retry cannot duplicate the underlying mutation.
- User-facing copy distinguishes retryable transport failure from completed,
  stale, or unauthorized outcomes without exposing implementation details.
- Every background job is resumable and every visible pending state has a
  truthful recovery path.

## Approval decisions

Approval of this plan also approves these explicit product/architecture
decisions:

1. Admin invite and approval pages are functional, polished shared-system
   surfaces, not a new Admin redesign.
2. `/pending` becomes the canonical approval-wait route.
3. An onboarding question is a durable private draft, not a published Ask.
4. Onboarding Offer opens the canonical offer composer; there is no note-less
   one-click offer.
5. Cold-start Connection submission is capped at 25 eligible members.
6. Data export is a durable private job, and deletion has a seven-day grace
   period.
7. Detailed search/ranking/enrichment tuning remains deferred and cannot block
   the visual and flow completion of this slice.

## Fast Fill implementation decision

Fast Fill is a private proposal workflow, not a direct profile write:

1. `profile_import_requests` owns retry/idempotency state before an external
   provider or résumé extractor is called.
2. LinkedIn providers and résumé extraction normalize into one validated
   `ExtractedProfile` contract.
3. Provider attempts, private source metadata, current values, and proposed
   values are persisted through fixed `api` functions only.
4. The member reviews a merged proposal and can keep, edit, remove, or discard
   every field before saving.
5. Applying identity, education, current role, history, and skills is one
   database transaction; any invalid section rolls back the whole proposal.
6. A proposal is owner-only, expires after seven days, can be consumed once,
   and is superseded by a newer pending proposal.
7. Résumé source objects use a stable private per-user path so retries replace
   abandoned uploads instead of accumulating them.

Provider ranking, matching, and enrichment freshness tuning remain deferred;
the review, safety, storage, failure, and fallback UX are not deferred.
