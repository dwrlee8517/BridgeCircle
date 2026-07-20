# Database v2 Entry and Operations test inventory

> **Status (2026-07-16): destructive cutover and durability hardening
> complete.** The database, focused application contracts, authenticated
> operational roads, complete seven-step onboarding cold start,
> provider-backed Fast Fill, account lifecycle workers, one-use recovery, and
> shared system states are green. Retired pre-v2 callers and routes are
> removed, the repository-wide compiler/build are green, and the complete
> current E2E suite passes hermetically. Five new factory-owned durability roads
> also pass concurrently with five workers. The remaining exhaustive
> Notifications/admin/offline-form and full breakpoint matrix remains
> follow-on work. No remote environment action is authorized.

## Planning checkpoint

- branch: `codex/redesign-v2`;
- starting commit: `bc65900 feat: build Home vertical slice`;
- worktree at approval: only the approved plan, test inventory, and docs-index
  additions were uncommitted;
- latest migration before this slice:
  `20260716025544_home_vertical_slice.sql`;
- database contract files before this slice: 15;
- accepted HTML handoffs are present for Entry, Onboarding, Notifications,
  Settings, Signed Out, and System States;
- direct `file://` capture was rejected by the in-app browser's URL policy, so
  Milestone 0 preserves the HTML handoffs as source truth and will create image
  references only through an allowed browser surface; the policy was not
  bypassed;
- the initial slice contract intentionally fails until the approved migration,
  `/pending`, `/settings`, repository cutover, and route boundaries land.

## Measured implementation checkpoint

- clean local reset replayed the baseline and all ten follow-up migrations,
  then rebuilt the development seed successfully;
- migrations `20260716061606_entry_operations_vertical_slice.sql`,
  `20260716143000_onboarding_fast_fill.sql`, and
  `20260716195725_complete_account_lifecycle_workers.sql` are active with
  database contracts through `019_school_transactional_email.test.sql`;
- pgTAP: 19 files and 698 assertions passed after the clean reset, including
  import idempotency, owner-only proposal reads, atomic apply, one-time review,
  privilege allowlists, foreign-key index coverage, export state convergence,
  delayed deletion, cancellation/rescheduling, idempotent finalization, and
  preference-aware School notification email fan-out;
- generated `public,api` TypeScript types were produced twice with identical
  SHA-256 output
  (`68bf8179cdf575cedcba010879b033416875f52bdb88e7cfa88a49d520d55019`);
- all eight focused vertical-slice TypeScript projects, repository-wide ESLint
  and Biome, the design-token ratchet, every domain boundary/cutover ratchet,
  and `git diff --check` passed;
- project-owned database lint (`public,api,private`) passed at warning level;
  migration diff against a shadow rebuild was empty;
- Vitest: 59 files and 270 tests passed after the destructive removal of
  retired search, enrichment-sweep, analytics, member-management, and legacy
  E2E modules;
- Playwright authenticated browser suite: 3 tests passed after its own clean
  reset, covering member Settings and Notifications, administrator Invite and
  Approvals, and Welcome through all seven onboarding steps, canonical Offer,
  one classmate Connection, and All set against localhost:3000;
- automated axe checks passed on Welcome, the 390px cold-start composition, and
  the 390px All set screen; the pass fixed the unnamed progress indicator and
  all detected onboarding contrast failures;
- verified screenshots: `/private/tmp/bridgecircle-entry-settings.png`,
  `/private/tmp/bridgecircle-entry-notifications.png`,
  `/private/tmp/bridgecircle-entry-admin-invites.png`, and
  `/private/tmp/bridgecircle-entry-admin-approvals.png`, plus
  `/private/tmp/bridgecircle-onboarding-welcome.png`,
  `/private/tmp/bridgecircle-onboarding-import-review.png`,
  `/private/tmp/bridgecircle-onboarding-import-review-mobile.png`,
  `/private/tmp/bridgecircle-onboarding-cold-start-mobile.png`, and
  `/private/tmp/bridgecircle-onboarding-complete-mobile.png`;
- a live LinkdAPI test with the owner-provided LinkedIn profile completed
  successfully without applying the proposal. The provider returned seven
  ended roles, so the hardened mapper proposed no current employer or title,
  kept both questionable current fields unchecked, and produced no browser
  console errors or warnings. The 390px review measured equal viewport and
  document widths with no horizontal overflow;
- live Fast Fill evidence is preserved at
  `/private/tmp/bridgecircle-fast-fill-hardened-desktop.png`,
  `/private/tmp/bridgecircle-fast-fill-hardened-mobile.png`, and
  `/private/tmp/bridgecircle-fast-fill-hardened-mobile-profile-fields.png`;
- the onboarding browser fixture uses its own deterministic local organization,
  classmate, and matched Ask so it cannot change existing Help, Messages, or
  People acceptance counts;
- repository-wide `tsc --noEmit`, the production build, all eight active
  vertical-slice TypeScript projects, and the complete route manifest pass;
- the destructive cutover removed the detached pre-v2 search/embedding tree,
  retired proposal-token and enrichment-cron routes, legacy admin
  member-management/analytics expansion, old account-operation helpers, and
  the obsolete E2E factory/onboarding duplicate instead of preserving dead
  compatibility code;
- the default Playwright suite now uses one worker because current acceptance
  roads intentionally mutate the canonical disposable seed. A clean reset
  happens before the browser run, and pgTAP must run after its own clean reset;
- Playwright: all 41 current E2E tests passed, covering Foundation, Help, Home,
  Messages, People/Profile, School, auth, minimal Admin, responsive layouts,
  keyboard behavior, and automated accessibility checks;
- the five new Entry/Operations durability roads cover expired/revoked/reused
  invitations, one-use recovery plus password update, two-device onboarding
  resume, private export generation/download plus deletion
  cancel/reschedule/finalize, and shared not-found/offline/focus/reduced-motion/
  320px behavior;
- those five roads passed again with `--workers=5 --fully-parallel`, proving
  their factory-owned organizations, users, and artifacts are order-independent;
- production build passed on the supported Node 22.22.2 runtime with Sentry
  source-map upload and Next telemetry disabled for the local validation run;
- the complete 17-road browser/accessibility matrix is not claimed green yet.
  Fast Fill now implements LinkedIn primary/fallback providers, private PDF or
  Word résumé extraction, explicit review, atomic apply, resumable pending
  proposals, safe errors, and deterministic non-network browser fixtures.
  Welcome, All set, private-question preservation, canonical Offer, and
  classmate Connect orchestration are implemented and exercised. Remaining
  follow-on work is the Notifications cross-tab/pagination race, admin
  resend/revoke and opposite-decision race, email-change round trip, input
  preservation across interrupted forms, and the full 1440/1024/768/390/320
  visual matrix.

## Required evidence matrix

| Area | Required evidence | Primary gates |
|---|---|---|
| member-context routing | exhaustive legal destinations; no loop or query override | pure tests + Playwright |
| invite storage | hash only, expiry, revocation, one usable invite invariant | schema pgTAP |
| invite operations | issue/list/resend/revoke authorization and idempotency | pgTAP + repository tests |
| invite acceptance | one membership under retry/concurrency; non-enumerating failures | race pgTAP + browser |
| Auth | safe callback, recovery, email change, sign-out, cross-tab session | operation + browser |
| onboarding | durable seven-step state, required floor, optional skips, resume | pgTAP + Vitest + browser |
| onboarding draft | private membership ownership, no silent publication | grants/RLS + browser |
| cold-start offer | canonical composer and no duplicate offer | existing Help race tests + browser |
| cold-start Connect | eligibility, 25 cap, idempotency, one person room | pgTAP + combined browser |
| approval | org-scoped queue and locked approve/reject race | pgTAP + admin browser |
| notification preferences | exact type mapping and user isolation | pgTAP + Vitest |
| newsletter | separate user communication preference | pgTAP + Settings browser |
| Help availability | same membership source as Give Help | cross-slice operation test |
| blocked list | minimum identity, owner-only, safe unblock | privacy matrix + browser |
| export | one active job, private artifact, expiring owner link | pgTAP + worker test |
| deletion | schedule/cancel/finalize legal states and cleanup | race pgTAP + browser |
| notifications | keyset paging, unread parity, mark-one/all, safe targets | pgTAP + browser |
| popovers | bounded recent history; read rows retained and unread rows explicitly marked | Vitest + browser |
| admin | only invite/approval scope and database role authorization | privacy matrix + browser |
| system states | accepted loading/error/offline/denied/not-found geometry | browser + visual QA |
| responsive/a11y | 320 through wide desktop, keyboard, axe, reduced motion | Playwright + manual QA |
| destructive cutover | no owned legacy routes/tables/helpers | static ratchet + `rg` |
| regression | Foundation plus five finished member slices stay green | full local suite |

## Database contract cases

### Invitations

Prove that:

- only a valid organization administrator can issue, list, resend, or revoke;
- administrators cannot act on another organization by changing an ID;
- authenticated members and anonymous clients have no raw invite-table access;
- raw tokens never appear in database rows, audit records, or function results;
- normalized email and intended role participate in the usable-invite invariant;
- concurrent issue requests converge without two usable invites;
- resend makes the previous token unusable before the new token is delivered;
- duplicate resend/revoke with one request ID returns the same outcome;
- expired, revoked, accepted, and unknown tokens do not leak account existence;
- two users accepting one invite produce one membership and one safe loser;
- one user accepting twice receives the current membership, not a duplicate;
- an existing compatible membership is returned safely;
- an incompatible revoked/deleted state cannot be resurrected by acceptance;
- audit and outbox rows are committed atomically with the mutation.

### Onboarding and context

Prove that:

- user- and membership-scoped profile fields cannot cross owners or circles;
- the server-derived step cannot move past missing required identity fields;
- optional step skips do not erase previously saved values;
- duplicate saves and completion calls are idempotent;
- completion timestamp is written once;
- pending membership returns pending context after completion;
- one active membership routes directly and multiple active memberships require
  a valid selected membership;
- a revoked/deleted membership cannot be selected;
- a private question draft is visible only to its member owner through fixed
  functions and disappears on explicit clear/account deletion;
- saving a question creates no Ask, offer, notification, or conversation;
- import proposals cannot write profile truth without an owner-confirmed save.

### Connections and offer handoff

Prove that:

- cohort results contain only active same-organization eligible members;
- self, block in either direction, existing connection, pending request, and
  deleted/revoked membership are excluded;
- more than 25 requested recipients is rejected atomically;
- retrying a batch cannot create duplicate requests;
- partial stale recipients return per-recipient stable outcomes without
  undoing valid new requests;
- accepting later still creates at most one direct person conversation;
- onboarding never creates an offer without the canonical Help note contract;
- an Ask that closes during the handoff returns the accepted stale outcome.

### Approval and admin authorization

Prove that:

- queue rows are organization-scoped, keyset ordered, and minimally shaped;
- inactive, revoked, or wrong-organization administrators receive no rows;
- approve versus reject concurrency yields one legal decision;
- retrying the winning decision is idempotent;
- decision cannot mutate an already revoked or deleted membership;
- member-facing notification and email are queued once after a decision;
- internal rejection/audit details are not exposed to the member.

### Preferences, blocking, and communication

Prove that:

- each notification preference is user-owned and constrained to known exact
  notification types;
- group saves expand to the documented exact type set without touching other
  groups;
- simultaneous preference changes upsert one row per type;
- newsletter preference is independent from in-app notification settings;
- Help availability changes only the selected membership and is immediately
  reflected in Give Help matching eligibility;
- blocked list returns only the minimum approved identity fields;
- a different user cannot list or unblock the viewer's blocks;
- unblock is idempotent and does not restore a connection automatically.

### Export and account lifecycle

Prove that:

- an owner can create or read only their export request through fixed APIs;
- concurrent requests return one active job;
- authenticated users have no direct private-request or storage access;
- a worker claim is exclusive, retryable, and bounded;
- completed artifacts have expiry and only the owner gets a short-lived link;
- expiry removes artifact reachability without changing account data;
- schedule deletion moves only active to `deletion_scheduled` and records a
  seven-day deadline;
- cancel succeeds only before finalization and is idempotent;
- schedule/cancel/finalize races yield only active or deleted, never a hybrid;
- finalization is service-only and idempotent;
- cleanup removes preferences, notification rows, private drafts, export
  artifacts, active invites, and public profile identity according to ADR 0015;
- retained conversation records contain no newly exposed deleted identity.

### Notifications

Prove that:

- only the owner can page or mark notifications;
- `(created_at, id)` keyset pagination has no duplicate or gap under tied times;
- mark-one changes only the named owned row;
- mark-all uses a server cutoff and leaves later rows unread;
- unread count and list use the same durable source;
- malformed or unauthorized target data cannot generate an external/open URL;
- Realtime publication exposes no row the fixed read contract would deny;
- account deletion removes notification data;
- representative owner queries remain selective at pilot scale.

### Grants and function hygiene

Prove for every new object that:

- public relations enable appropriate RLS and have no policy-free client path;
- private relations grant no access to authenticated/anon;
- fixed `api` wrappers grant only the intended role;
- security-definer functions use qualified names and an empty search path;
- helper functions are not executable by clients unless deliberately exposed;
- authorization is based on `auth.uid()` and database roles, not user metadata;
- new indexes demonstrate a better relevant plan before acceptance.

## Framework-free and repository tests

### Entry and route resolution

- all context states map to exactly one destination;
- requested member paths survive only when legal;
- absolute, protocol-relative, encoded, and backslash next paths are rejected;
- invitation states map to accepted copy without revealing account existence;
- result-code unions are exhaustive and unknown database shapes fail closed;
- no token, private question, or email link enters logs or telemetry.

### Onboarding

- required-field validation and normalization for every step;
- durable-state-to-step derivation across partial and complete profiles;
- Back, Skip, refresh, duplicate advance, and resume semantics;
- import proposal diff and explicit confirmation behavior;
- private question length/whitespace handling and Home/Help handoff;
- eligible cohort filtering and 25-recipient cap presentation;
- per-recipient Connection outcomes preserve successful selections;
- completion routing for pending, one-active, and multi-circle members.

### Settings and account operations

- visual groups expand to the exact expected notification types;
- untouched preference groups remain untouched;
- pending email change, resend confirmation, cancel, and expired-link states;
- export queued/running/ready/failed/expired presentation;
- deletion deadline copy, cancel, stale, and already-finalized outcomes;
- sign-out clears sensitive client state and returns to the signed-out surface;
- block rows never become profile-directory bypasses.

### Notifications and admin

- notification target allowlist and fallback behavior;
- bounded popover selection, retained read history, explicit unread treatment,
  and bounded queue behavior;
- optimistic mark-read reconciliation under stale/retry outcomes;
- invite/approval repository parsers reject extra or malformed authority fields;
- admin forms preserve safe input on transport failure and converge on stable
  duplicate/conflict outcomes.

## Durable browser roads

1. **Valid invitation to active member** — open invite, authenticate, finish all
   seven onboarding steps, enter cold start, complete, and reach Home.
2. **Approval-required entry** — complete onboarding, reach `/pending`, approve
   in admin, receive durable notification, revalidate, and reach Home.
3. **Expired/reused/revoked invites** — render correct safe states with a useful
   recovery path and no account enumeration.
4. **Authentication recovery** — request reset, consume one valid link, reject
   reuse, update password, and preserve safe destination behavior.
5. **Multi-circle entry** — complete onboarding, choose one active circle,
   switch/return without cross-organization data bleed.
6. **Onboarding resume** — stop after each major step, reload/new context, resume
   from durable state with prior data intact.
7. **Private question** — save during onboarding, confirm no Ask exists, complete,
   surface the draft on Home/Help, then publish only through canonical Help.
8. **Offer handoff** — choose an open Ask, complete canonical offer note, return
   with Offered state; retry and closed-during-compose converge safely.
9. **Say hi** — select eligible classmates, submit Connections, retry, and prove
   no duplicates and one eventual person room.
10. **Settings** — change each preference group, newsletter, Help availability,
    blocked list, email confirmation, sign out, and return.
11. **Export** — request, observe queued/running/ready, obtain owner-only expiring
    link, and handle retry/expiry.
12. **Deletion cancellation** — schedule, sign back in to the cancellation state, cancel,
    schedule again, finalize with test worker, and confirm deleted state.
13. **Notifications** — paginate, receive Realtime row, mark one via deep link,
    mark all while a later row arrives, and verify badge parity across tabs.
14. **Admin invite operations** — issue, duplicate, resend, revoke, and verify
    target organization isolation plus audit/outbox outcomes.
15. **Admin approval race** — two tabs decide oppositely; one wins and both UIs
    converge without duplicate notification.
16. **Offline and recovery** — interrupt each form/list at safe points, preserve
    input, retry, and avoid duplicate durable changes.
17. **Responsive and accessibility** — core Entry, Onboarding, Settings,
    Notifications, Pending, and admin states at 1440/1024/768/390/320; axe,
    keyboard-only operation, focus recovery, reduced motion, and no overflow.

Each road creates test-owned data, can run independently, and cleans up through
supported contracts. Test order must not matter.

## Visual fidelity ledger

Capture accepted reference and final application images for:

- every Entry token state;
- Welcome, each onboarding layout family, cold start, and All set;
- Settings normal, pending email, export, deletion confirmation, and blocked
  member states;
- Notifications normal, unread/read mix, empty, loading, and offline;
- signed-out and deletion-cancellation states;
- system not-found, denied, loading, and recoverable failure;
- minimal admin invite and approval desktop/tablet states.

Compare hierarchy, shell width, responsive reflow, typography, tokens, fields,
focus, validation, disabled/loading treatment, empty/error geometry, and copy.
Every discrepancy is fixed or recorded as an approved contract correction.

## Destructive-cutover ratchet

Owned production code must contain none of the following after closeout:

- `base_profiles`;
- legacy `audit_log` calls;
- direct client queries to `invites`, `organization_memberships`,
  `notification_preferences`, `notifications`, `member_blocks`, or admin role
  tables;
- the retired five-step onboarding flow;
- route-local membership redirect logic;
- raw invite tokens in database/log payloads;
- compatibility aliases for removed Entry/Operations URLs;
- admin analytics/member-management expansion introduced by this slice.

The ratchet is scoped to the active v2 application. Detailed matching/search
algorithms remain deliberately deferred product work; their removed pre-v2
implementation is not retained as dormant production code. Provider adapters
used by onboarding Fast Fill remain, while retired manual-refresh and scheduled
sweep callers stay absent until those flows receive a new approved slice.

## Closeout commands and evidence

The implementation record must include measured results for:

1. clean local Supabase reset and seed;
2. migration shadow replay and diff;
3. all pgTAP files and assertion counts;
4. generated type reproducibility;
5. database lint and relevant advisors;
6. focused Entry/Operations TypeScript projects;
7. complete Vitest suite and counts;
8. ESLint, formatting, and static cutover ratchet;
9. current durable browser roads and accessibility scans, run after their own
   clean reset with one worker while fixed seed personas remain shared;
10. prior Foundation, Help, Messages, People/Profile, School, and Home
    regression roads;
11. visual comparison paths and disposition;
12. repository-wide build result on a supported Node version. Turbopack needs
    permission to bind its internal localhost port in sandboxed agent runs.

The required local order is:

1. reset and run the browser suite;
2. reset again before pgTAP, because browser roads intentionally mutate seed
   state;
3. run lint, diff, typechecks, unit tests, boundary ratchets, and production
   build.

Remote reset, deployment, push, merge, and production verification remain
separate, explicit approvals.
