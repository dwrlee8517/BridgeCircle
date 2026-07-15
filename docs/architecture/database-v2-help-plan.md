# Database v2 Help vertical-slice implementation plan

- **Status:** approved — Milestones 1–6 complete locally; Milestone 7 in progress; no remote changes
- **Prepared:** 2026-07-14
- **Approved:** 2026-07-14 by Richard
- **Branch:** `codex/redesign-v2`
- **Depends on:** Conversation Primitive checkpoint `4a07b47`
- **Approved-plan checkpoint:** `3b9815b`
- **Contract:** [Database v2 contract](database-v2-contract.md)
- **Behavior:** [`FLOWS.md` §3](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md)
- **UI source:** [BridgeCircle Help templates](../experience/ui/design-system/handoff/bridgecircle/project/templates/help/)
- **Test inventory:** [Help vertical-slice test inventory](database-v2-help-test-inventory.md)

## Goal

Ship Help as the first complete database-v2 product loop: a member can describe
what they need, privately find suitable people, ask one person or the circle,
receive or make an offer, accept or decline with a cushioned note, continue in
the unified Messages conversation, resolve the Ask, and recover every durable
state after a refresh or provider outage.

This is intentionally not a UI-only port. The slice includes the member routes,
fixed database APIs, matching and drafting boundaries, Realtime invalidation,
outbox worker, transactional notifications, lifecycle maintenance, seeds,
hermetic browser coverage, and deployment/runbook changes needed for the loop
to work outside a developer's browser.

"Error-proof" cannot mean that networks or providers never fail. Here it means:

- every durable command is atomic and idempotent;
- expected races return a stable result instead of a unique-constraint error;
- provider calls happen outside database transactions and always have a useful
  fallback;
- asynchronous work is durable, retryable, deduplicated, observable, and safe
  to resume after a process restart;
- private or anonymous data is never recovered from a Realtime payload, log, or
  client-side raw table query;
- each milestone has a stop gate, so a failed invariant is fixed before the
  next layer is built.

## Canonical sources and precedence

Use this order when sources disagree:

1. [ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md) and the approved
   [database v2 contract](database-v2-contract.md);
2. [`FLOWS.md`](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md)
   §§3, 5, 7c, and 8;
3. ADR [0009](../decisions/0009-hybrid-ask-matching.md) for matching and ADR
   [0011](../decisions/0011-two-verbs-one-inbox.md) for the Help/Messages seam;
4. the final Help templates for visual hierarchy, interactions, responsive
   behavior, and copy details;
5. current code only as evidence to retain deliberately or replace.

The final Help template's explicit **Find people** action is the implementation
contract. It avoids paid AI work on every keystroke, keeps the question private
until the member asks for a search, and still preserves the question-first flow.
The older `FLOWS.md` phrase saying matches appear while typing will be reconciled
in the documentation milestone.

Current Supabase guidance recommends private Broadcast over Postgres Changes
for scalable, authorized database-change subscriptions. Help will extend the
already verified `user:<uuid>` private topic and send IDs-only invalidations;
the client will always refetch a fixed API projection. Resend sends will use a
stable provider idempotency key as an additional defense around outbox retries.

## Slice specification

### Member outcomes

#### Get help

- `/help` opens in the member's last mode; a first-time visitor starts in Get.
- The member writes one question, then chooses **Find people** or **Ask the
  circle**. The question is never put in a URL.
- Find people returns 5–10 evidence-backed, asker-only results without creating
  an Ask or notifying a candidate.
- Selecting a person opens the direct composer with the question carried over.
  The default is AI-assisted drafting; `?skip=1` is a fully usable plain form.
- Ask the circle opens the shaping flow, then lets the member choose immutable
  reach (`matched` or `organization`) and anonymous-until-accepted.
- Publishing is one idempotent command. A sixth active Ask returns a calm,
  recoverable result; it never partially inserts.
- `/help/asks/[id]` is the canonical target for every Ask notification and
  shows waiting, offers, declines, acceptance, closure, resolution, and the
  last-three-days warning.
- `/help/asks` is keyset-paginated history and includes recovery actions without
  mutating a published Ask.

#### Give help

- Give mode contains the open-to-help switch and the same maximum-five topics
  saved during onboarding; there is no time-based availability expiry.
- The page has three distinct arms: topic-based suggestions, search, and direct
  requests naming the member. Direct requests stay visually highest priority.
- Private matched asks are never browsable. They appear only when a durable
  `private.ask_matches` row grants that member access. Organization-reach asks
  are searchable by active members in that organization.
- Offering is private, idempotent, and includes a default, custom, or AI-assisted
  note. The asker sees offers only on the Ask status view.
- Accepting a direct Ask or accepting one offer creates the Ask conversation,
  origin line, opening message, Ask transition, offer closures, audit event,
  notification jobs, and Realtime invalidations in one transaction.
- Declining in either direction always requires a cushioned note. AI may help
  draft it but never sends without an explicit human submit.

#### Messages and closure

- An accepted Ask redirects to `/messages/[conversationId]`; it is an ordinary
  conversation thereafter.
- Either participant may mark an accepted Ask resolved and optionally add one
  outcome note. The conversation remains available and sendable.
- Retract removes pending direct work, pending offers, and private matches from
  member surfaces without a guilt-producing recipient notification.
- Day 5 sends one gentle reminder to an unanswered direct recipient. Day 14
  closes only `waiting`/`open` Asks; accepted Asks keep their slot until
  resolved. Only the direct-recipient silence path increments the three-strike
  helper timeout.
- The last-three-days warning is derived from `expires_at`; it is not a daily
  notification or stored countdown.

### Route contract

| Route | Responsibility | Template |
|---|---|---|
| `/help` | Get/Give home, explicit matching, preferences, three Give arms | `Help.dc.html` |
| `/help/ask/[membershipId]` | Direct composer; `?skip=1` plain fallback | `AskCompose.dc.html` |
| `/help/ask-circle` | Circle shaping, reach, anonymity, publish | `AskCircle.dc.html` |
| `/help/asks` | Owned Ask history and recovery actions | `AskHistory.dc.html` |
| `/help/asks/[askId]` | Role-shaped Ask/direct-request/status view | `AskStatus.dc.html`, `GiveDirect.dc.html` |
| `/help/asks/[askId]/offer` | Offer composer for an eligible circle Ask | `GiveOffer.dc.html` |
| `/messages/[conversationId]` | Minimal accepted-Ask thread seam | `Messages.dc.html` thread state |

Legacy routes are removed from the product graph in the same cutover:

- `/ask` redirects to `/help`;
- `/ask/[id]` redirects to `/help/asks/[id]`;
- `/help/settings` redirects to `/help?mode=give`;
- old new/thread routes redirect to the nearest safe new landing because the
  pre-launch reset deliberately preserves no legacy thread identifiers.

All application links, notification targets, and route ownership tests switch
in one change. No compatibility reads or writes to legacy Ask/thread tables are
added.

The slice includes the minimum v2 Messages detail needed to close the Help
loop: origin line, paginated/gap-recovered history, send, Ask context, report,
and either-participant resolve. It reuses the completed Conversation Primitive
rather than adding a second thread implementation. Accepted Asks do not expire,
so their Messages thread never shows an expiry warning; the last-three-days
warning belongs only to unanswered status rows. The full Messages list, Waiting
group, filters, responsive split-pane inbox, connection-request grouping, and
inbox polish stay in the next Messages slice; until then, direct requests remain
complete and actionable from Help's Give arm.

## Architecture

### Layer boundaries

```text
Help route / client island / POST endpoint
        │  parse, authenticate, map result only
        ▼
src/lib/help                 framework-free workflows and contracts
        │  injected interfaces
        ├──────────────► src/db/repositories/help.ts
        │                fixed api RPCs only; member session client
        └──────────────► src/integrations/ai/help.ts
                         Anthropic/Voyage adapters; no database access

Database transaction ──► private.outbox_jobs
                              │
                              ▼
scripts/run-outbox-worker.ts (thin process entry)
                              │
                              ▼
src/workers/outbox + src/lib/outbox
  typed dispatch, service RPCs, AI/index handlers, Resend adapter
```

Rules enforced by a Help boundary script and focused TypeScript config:

- `src/lib/help` and `src/lib/outbox` import no Next.js, Supabase client,
  Resend, provider SDK, `server-only`, or environment variables;
- member repositories call only fixed `api` functions and never raw Help,
  profile-embedding, notification, or outbox tables;
- no member route or repository constructs a service client;
- service-role code is confined to the worker and explicitly service-only
  repository functions;
- no TypeScript suppression or compatibility cast hides v2 drift;
- no new module names a retired legacy Ask/thread table or column.

### Server/client split

- Server Components load the initial Help snapshot, history, and status detail.
- Small client islands own the mode toggle, draft state, match expansion,
  pending buttons, dialogs, and Realtime invalidation.
- Explicit Find people and AI assistance use authenticated POST requests so
  question/decline text never appears in browser history, referrers, or cache
  keys. Routes remain thin and invoke `/lib/help`.
- Give search may debounce a database-only POST, cancels superseded requests,
  and ignores stale response sequence numbers. It never invokes paid AI.
- Private data is `no-store`; no user-specific Help response enters a shared
  Next.js cache.
- A versioned, membership-scoped `sessionStorage` draft with a short TTL keeps
  an unsubmitted question through refresh/back navigation. It contains no
  server authority, is never synced, and clears after successful publication.
- A versioned `SameSite=Lax` cookie stores only `get` or `give`, allowing the
  server to render the remembered mode without a hydration flash.

### UI component plan

Translate the handoff into reusable product components rather than one copied
prototype component:

- `HelpModeToggle`, `HelpHero`, and `HelpCapacitySummary`;
- `QuestionForm`, `HelpMatchList`, `HelpMatchCard`, and `MatchEvidence`;
- `AskComposer`, `CircleAskComposer`, and shared `AiWritingPanel`;
- `AskStatusHeader`, `DirectRequestCard`, `OfferRow`, and `AskHistoryRow`;
- `GiveHelpPreferences`, `HelperTopicEditor`, `SuggestedAskList`, and
  `GiveHelpSearch`;
- shared `DeclineFlow`, `InlineResult`, `HelpEmptyState`, and `HelpErrorState`.

Use existing BridgeCircle tokens and owned shadcn/Radix primitives only where
they match the handoff. Do not install a component library or introduce raw
shadcn styling as a second design system. Repeated status colors, spacing,
radius, typography, and responsive rules remain token-backed. Keyboard flow,
visible focus, reduced motion, live-region announcements, dialog focus return,
and 44px mobile targets are acceptance criteria, not polish backlog.

## Database and API changes

### Keep the approved core model

Retain `helper_preferences`, `helper_topics`, unified `asks`, `ask_offers`,
`private.ask_matches`, `private.ask_events`, conversations, messages,
notifications, embedding chunks, and outbox jobs. Do not add a draft-Ask table,
search-history table, helper-capacity ledger, participant table, or duplicate
accepted-offer FK.

Schema changes are limited to evidence-backed indexes/columns needed by the
queries below, a lexical search vector on permission-safe profile chunks if its
red query-plan fixture proves it necessary, and a small private AI usage-window
table that stores only user/action/window/count—not prompts or outputs.

### Harden command contracts

Replace expected lifecycle exceptions with fixed result rows. Programming and
constraint defects still raise and fail the transaction; member-expected states
return discriminated codes.

| Command | Required result data |
|---|---|
| `api.create_direct_ask` / `api.create_circle_ask` | result code, Ask ID, active count, created/existing flag |
| `api.respond_to_direct_ask` | result code, Ask ID, optional conversation ID |
| `api.retract_ask` / `api.resolve_ask` | result code, Ask ID, optional conversation ID |
| `api.offer_to_help` | result code, Ask ID, offer ID, created/existing flag |
| `api.decide_offer` | result code, Ask ID, offer ID, optional conversation ID |
| `api.save_helper_preferences` | result code, final availability, pause state, topics |

Expected codes include `created`, `existing`, `accepted`, `declined`,
`retracted`, `resolved`, `saved`, `not_available`, `already_decided`,
`active_limit_reached`, `helper_limit_reached`, `idempotency_conflict`, and
`invalid_input`. Unauthorized/not-found/blocked cases collapse to
`not_available` at the public boundary where distinguishing them could leak
identity or anonymous-Ask access.

Idempotency behavior is payload-aware:

- the same caller key and same normalized payload returns the first durable
  result;
- the same key with a different payload returns `idempotency_conflict`;
- simultaneous identical calls converge through `ON CONFLICT`/locked reread;
- a retry never creates a second event, message, offer, notification job, or
  Broadcast.

### Lock order and race safety

Document and test one Help lock protocol:

1. acquire the canonical user-pair lock when a command concerns a known pair;
2. acquire Ask-owner slot and helper-capacity advisory locks in sorted stable-key
   order when both are needed;
3. lock the Ask row;
4. lock offer rows by ascending UUID;
5. write child rows and outbox jobs.

Commands that need only an Ask row do not acquire a later pair lock. This keeps
retract/expiry from forming a lock cycle with accept. Direct creation adds a
helper-scoped capacity lock before counting `waiting` requests, closing the
current race that can exceed `max_pending_requests`.

`resolve_ask` authorizes either conversation participant, rechecks the accepted
Ask after locks, writes one idempotent `ask_resolved` system line, and does not
make the conversation read-only.

### Fixed query projections

Add or replace bounded APIs rather than exposing raw tables:

- `api.get_help_home(membership_id)` — owned context, active-slot count,
  availability/topics, recent status rows, direct priority rows, and initial
  suggestions in one bounded snapshot;
- `api.search_help_candidates(membership_id, question, embedding?, limit)` —
  hard-gated permission-safe candidate evidence for the signed-in asker;
- `api.get_help_ask_detail(ask_id)` — one caller-shaped Ask plus safe participant
  previews and only the offers that caller may see;
- `api.list_my_asks(membership_id, before_created_at, before_id, limit)` —
  membership-scoped owner-only tuple keyset pagination;
- `api.list_give_help(membership_id, arm, query?, before_created_at, before_id,
  limit)` — direct, suggested, or searchable rows with tuple keysets;
- `api.get_helper_preferences` / `api.save_helper_preferences` — one coherent
  preference/topic transaction, including explicit reactivation after an
  unresponsive pause.

Every projection derives the viewer from `auth.uid()`, validates the active
membership and organization, applies `private.is_blocked`, clamps limits, and
returns only fields needed by the template. Anonymous circle detail returns
`A member`, class year, and Ask-derived evidence until one accepted helper is
entitled to the real profile. Nonaccepted helpers and unrelated org members
never receive the author ID, even as a nullable raw field they could probe.

All history/feed pagination uses `(created_at, id)` cursors. Timestamp-only
cursors are removed because equal timestamps can skip or duplicate rows.

### Matching and profile indexing

Use the accepted ADR 0009 pipeline rather than porting the legacy admin-client
search function:

1. hard-gate active organization, open/unpaused helper, self, blocks, profile
   visibility, invisible capacity, and account state in SQL;
2. retrieve structured, lexical, raw-chunk vector, and semantic-passage vector
   evidence in bounded parallel paths;
3. dedupe by membership and preserve raw factual evidence;
4. score deterministic warm-network signals and current helper load;
5. rerank only the top 20–40 with Voyage;
6. return 5–10 results with templated reasons from raw visible facts;
7. optionally polish final reasons with Haiku when enabled, never replacing the
   underlying evidence.

Direct search uses the signed-in member client and persists no Ask, candidates,
or query history. A circle Ask queues `run_ask_matching`; the worker fetches a
service-only, privacy-shaped candidate set, runs the same pure matcher, and
commits through one `apply_ask_matches` transaction that rechecks Ask status,
reach, helper eligibility, blocks, and model version before replacing rows and
queuing deduplicated match notifications.

Fallbacks are mandatory:

- no Voyage embedding: structured + lexical retrieval;
- no semantic passage: raw factual chunks only;
- no reranker: deterministic merged score;
- no Haiku: templated explanation and editable default copy;
- weak/no evidence: an honest empty state plus Ask the circle, never fabricated
  people or a fake "people you can help" list.

External calls have bounded timeouts and a total request budget. The explicit
Find people action prevents paid calls while typing. Match telemetry contains
only correlation ID, pipeline/model version, counts, latency, and fallback
codes—never question text, profile content, drafts, or decline notes.

Profile indexing becomes a real outbox handler in this slice. It reuses the
existing content-hash/version contract, upserts all chunks for one profile,
removes obsolete chunks in the same commit, and keeps synthetic passages
strictly retrieval-only. At pilot scale, no HNSW index is added unless a
representative `EXPLAIN (ANALYZE, BUFFERS)` fixture shows the exact scan needs
it; a small exact vector scan can be faster and simpler.

### Realtime contract

Extend the existing authorized `user:<uuid>` private Broadcast topic with one
minimal event:

```text
help.changed { id, askId, offerId? }
```

The payload contains only identifiers and a unique event ID. Mutations emit it
to affected users in the transaction: asker, direct recipient, relevant offer
helper, or accepted helper. Matching completion can emit it only to the newly
matched helper. Block/retract/expiry send invalidations before access disappears.

The Help adapter:

- authenticates before subscribing and uses `private: true`;
- validates an exact Zod payload, dedupes event IDs, and ignores unknown data;
- refetches the fixed projection rather than trusting state in the event;
- refetches on subscription/reconnection to fill missed-event gaps;
- removes the channel exactly once on navigation;
- treats channel loss as nonfatal—the durable page remains usable and manual or
  focus refetch recovers it.

Do not add Ask/offer tables to Postgres Changes or Broadcast question text,
notes, identities, status snapshots, or matching evidence.

## Outbox, notifications, email, and lifecycle worker

### One generic worker, typed handlers

Add one long-lived Railway worker process, not one cron or process per feature.
The thin entry point calls a testable runner with a handler registry. For this
slice it claims only supported types:

- `create_notification`;
- `send_email`;
- `run_ask_matching`;
- `index_profile`.

Account-deletion/storage job types remain pending for their owning slice and
are never claimed by this worker until handlers exist. Extend the claim API with
an allowed-type array and add a matching pending index only if the query-plan
gate needs it.

The loop uses bounded batches, small provider concurrency, idle backoff with
jitter, `SIGTERM` drain, per-handler timeouts, stale-lock recovery, sanitized
errors, and maximum attempts. One poison job becomes terminal and alerts
without preventing later jobs from running. Two workers may run simultaneously;
`FOR UPDATE SKIP LOCKED` gives them disjoint jobs.

### Materialization flow

`create_notification` is materialized by a service-only database function that
validates the claimed job, derives organization/actor/target from durable rows,
honors the recipient's preference (default enabled), inserts with the outbox
dedupe key, and—when email is enabled and that type has a template—queues one
`send_email` job in the same transaction.

The outbox payload carries typed IDs and event codes only. It never carries an
Ask question, offer/decline note, email address, profile content, or message
body. A service-only email-context projection resolves the minimum current
recipient/template data immediately before sending.

Resend receives a stable idempotency key derived from the durable email job.
The database records the returned provider ID before completion. The retry
schedule remains inside Resend's idempotency window; database dedupe and the
provider key jointly prevent ordinary duplicate sends. The existing non-prod
recipient guard remains the single send choke point and is tested for every
Help template.

### Lifecycle maintenance

The same worker periodically invokes one service-only maintenance transaction:

- claim due day-5 direct reminders with `SKIP LOCKED`, set
  `reminder_sent_at`, append one event, and enqueue one notification;
- claim due day-14 `waiting`/`open` Asks with `SKIP LOCKED`, close pending
  offers with the correct no-fault reason, append events, enqueue owner/helper
  notifications where the flow requires them, and invalidate affected pages;
- increment/reset direct helper timeout counters exactly once and auto-pause on
  the third unanswered timeout;
- leave accepted Asks untouched regardless of `expires_at`.

The sweep is catch-up-safe after downtime and idempotent if two worker replicas
run it. Time is injected/overridable in tests; production uses database time.

## Security and privacy gates

- Raw Help tables, matching rows, events, embeddings, outbox jobs, and AI usage
  windows remain unavailable to `anon` and `authenticated` clients.
- Every member query goes through a fixed `api` projection; every member command
  derives the actor from `auth.uid()`.
- The existing centralized `private.is_blocked(a,b)` remains the only block
  predicate used by queries and commands.
- Anonymous author identity is proven absent from direct API output, JSON
  payloads, Realtime, notification payloads, outbox payloads, logs, match
  evidence, and provider prompts visible to helpers.
- Provider inputs contain only fields the caller or matching job is entitled to
  use. Synthetic passages are never display evidence.
- User question/draft/decline text is never logged or sent to analytics. Sentry
  receives operation, result/fallback code, duration, and correlation ID only.
- AI output is strict-schema parsed, length bounded, fact checked against the
  supplied evidence, editable, and never auto-submitted.
- Member AI endpoints have a private per-user/action fixed-window cost guard
  that stores counts only. Limits return a calm retry result and cannot be
  bypassed into a provider call by invoking a raw database API.
- Report actions cover Ask, offer, and resulting message targets. Permission
  denial and not-found render the same calm system state.

## Performance and observability

### Query targets

Use representative rolled-back fixtures for:

- active-slot count and helper pending-capacity count;
- Help home snapshot for a member with asks, offers, and matches;
- deep owner history and each Give arm cursor;
- direct recipient lookup;
- organization-public and matched-private Give search;
- lexical and vector candidate retrieval;
- notification/outbox claim by supported type;
- due reminder/expiry claims;
- user-topic authorization.

Require appropriate PK, unique, partial, composite, GIN, or exact-vector plans.
Do not add speculative indexes. Every standalone FK remains left-prefix indexed.
Use `EXPLAIN (ANALYZE, BUFFERS)` only inside rolled-back local fixtures and keep
transactions short.

### Operational signals

Emit structured, text-free events for:

- command result code and duration;
- matching source counts, fallback code, model/version, and duration;
- outbox claim/complete/retry/fail counts and oldest pending age;
- maintenance reminder/close/pause counts;
- Realtime join/error/reconnect and malformed-event counts;
- provider timeout/rate/error class;
- email accepted provider ID and terminal failure.

Terminal jobs, repeated provider failures, stale processing locks, and growing
oldest-pending age go to Sentry. Logs never include secrets, tokens, raw provider
responses, questions, notes, prompts, or email addresses.

## Current repo evidence and gaps

At planning time, `codex/redesign-v2` is clean at Conversation checkpoint
`4a07b47`. Foundation and Conversation focused gates are green. The global v2
port inventory still reports 1,257 TypeScript errors across 73 reported legacy
source files; 342 errors across 14 current Help/search files are owned by this
slice. The existing 11 Ask/matching Vitest files pass 57 assertions, but they
prove legacy behavior and become salvage/reference tests, not v2 acceptance.

The v2 baseline already supplies roughly four-fifths of the durable model:

- strong per-kind Ask constraints and immutable-published transitions;
- direct/circle active-slot counting and helper preference/topic tables;
- offers with acceptance consistency and transactionally created conversations;
- block-aware authorization, private matches, audit events, notifications, and
  outbox jobs;
- profile embedding chunks and a privacy-aware vector helper;
- outbox claim/complete/retry/fail APIs with `SKIP LOCKED`;
- a verified private Broadcast and gap-recovery pattern from Conversations.

The implementation must close these confirmed gaps:

1. direct search currently requires a persisted Ask, violating search-before-
   create and private asker-only results;
2. direct helper capacity and create-key retries can race;
3. expected Help states still raise exceptions instead of stable result rows;
4. resolve is owner-only even though either conversation participant may end;
5. Help detail lacks complete caller-shaped previews/offers/history and Give
   pagination uses a timestamp-only cursor;
6. availability/topic APIs do not yet support the complete Give-mode contract;
7. matching still depends on legacy tables/admin access and no worker applies
   circle matches;
8. the durable outbox has no production runner or Help handlers;
9. day-5 reminder, close notifications, offer no-fault closures, and match
   notifications are incomplete;
10. Help has no authorized IDs-only Realtime invalidation;
11. current pages implement the older UI and even fabricate potential helpers
    from recent joiners when no true Ask exists;
12. notification links, IA docs, route docs, and ADR 0011's decline behavior
    still point at the legacy workflow.

### Milestone 1 red-baseline record

Recorded locally on 2026-07-14 from approved-plan checkpoint `3b9815b` with
Node 22.22.2, pnpm 10.33.2, Supabase CLI 2.109.1, and PostgreSQL client 18.3.
No remote project, deployment, push, merge, or secret value was touched.

- The nine inherited Foundation/Conversation pgTAP files remain green with 315
  assertions. The new 42-assertion Help contract is intentionally red at 33
  assertions and green at nine raw-access/service-role/publication guards.
- The focused Foundation and Conversation compilers, boundary checks,
  concurrency suites, query-plan checks, and Conversation Realtime suite remain
  green at this checkpoint.
- `typecheck:v2-help` is green only as an empty-boundary guard. The Help static
  boundary check is intentionally red because the v2 domain, repository,
  Realtime, provider, and worker modules do not exist yet.
- Eight concurrent identical direct-Ask creates currently produce one row and
  seven failed callers instead of one idempotent result for every caller.
- Two concurrent direct Asks against a helper limit of one currently both
  commit, proving the missing helper-capacity lock.
- The worker baseline is red because outbox claiming cannot filter supported
  job types. Realtime is red because `help.changed` is not yet an authorized
  control event. Query-plan coverage is red because `api.get_help_home(uuid)`
  and the other fixed Help projections do not exist.
- The inherited global port inventory remains 1,257 TypeScript errors across 73
  reported legacy files, including 342 errors across 14 Help/search paths. It
  is an inventory, not a green Help gate.

### Milestone 2 schema/API record

Completed locally on 2026-07-14. The baseline migration now supplies
payload-aware Ask/offer idempotency, deterministic Help capacity locks, stable
mutation results, participant resolution, bounded caller-shaped projections,
atomic preferences, count-only AI budgets, typed worker claims, matching and
maintenance transactions, notification/email materialization boundaries, and
IDs-only Help invalidations.

- All 10 pgTAP files pass 358 assertions. The new Help contract is green at
  42/42 while all nine inherited files remain green.
- Foundation concurrency (invite, profile aggregate, disjoint outbox), all
  seven Conversation concurrency scenarios, and both Help creation races pass.
  The Conversation offer race now proves one `accepted` and one
  `already_decided` result without a failed caller or deadlock.
- Conversation query plans and full Realtime integration remain green. Help
  Realtime proves own-topic authorization, IDs-only delivery, retry dedupe,
  missed-event recovery, and channel cleanup.
- Help query plans use `asks_asker_created_idx` and
  `asks_recipient_status_created_idx`. PostgreSQL deliberately chooses a
  sub-millisecond sequential lexical scan for the bounded 2,000-chunk pilot
  fixture; the GIN index exists and the gate also accepts it when growth makes
  it cheaper.
- Database lint reports no warnings. A shadow diff over `public`, `api`, and
  `private` reports no schema drift. Two generated type passes are byte-for-byte
  identical at SHA-256
  `2fb42b8f70dade7a870d99fe3d57d2ba9f3bf7c2c48b8181df27f3c4ada8659c`.
- Foundation, Conversation, and empty-boundary Help focused compilers pass;
  Supabase and Conversation static boundaries remain green. Help's own boundary
  check stays intentionally red until Milestone 3 creates its repository,
  domain, provider, Realtime, and worker modules.
- No remote project, deploy, push, merge, or secret value was touched.

### Milestone 3 repository/domain record

The v2 Help application boundary now has exact domain contracts, tuple-cursor
helpers, local command validation, a member-only fixed-API repository with
strict Zod projections, injected provider/worker seams, and one authenticated
IDs-only user-topic Realtime adapter. Anonymous projections fail closed if an
identity field appears, and command rows are checked against their
status-specific shape before they enter the domain.

- The focused Help compiler passes with zero errors, and the Help static
  boundary is green. Member Help code has no service client or raw Help table;
  pure Help/outbox code has no framework, provider, database, or environment
  import.
- Four focused Vitest files pass 25 assertions covering projections, malformed
  result rows, identity leakage, cursor round trips, local validation,
  preference normalization, event validation/deduplication, reconnect refetch,
  and exactly-once channel removal.
- Foundation and Conversation focused compilers plus their static boundaries
  remain green. The complete 10-file pgTAP suite remains green at 358
  assertions after the optional query-embedding signature was regenerated.
- Two consecutive local type generations are byte-for-byte identical at
  SHA-256 `ac7e01f6d623e18d134393e5327e4f21a594b58a3f5da89a1b98b311f0215ed0`.
- Provider and worker modules at this checkpoint are typed injection seams;
  external matching behavior and the durable runner remain owned by
  Milestones 4 and 5. No provider or remote service was contacted.

### Milestone 4 matching/provider/index record

The Help matching pipeline now separates database-enforced eligibility from
pure ranking and provider assistance. The database hard gate removes inactive,
blocked, self, paused, and capacity-full candidates before any provider call.
The pure matcher then applies deterministic relevance thresholds, stable tie
ordering, bounded reranking, factual reason templates, and no evidence padding.

- Ten focused test files passed 49 assertions at checkpoint `e4b859f`, including
  the privacy-reviewed golden fixture, weak-evidence filtering, deterministic
  fallbacks, provider timeout/error handling, and strict Anthropic/Voyage output
  schemas.
- Voyage receives at most the bounded eligible pool and reranks at most 20
  candidates. Anthropic assistance is optional and fail-open to editable
  deterministic text; neither provider can submit a member command.
- Profile indexing uses content-, model-, prompt-, and pipeline-aware SHA-256
  fingerprints. Atomic synchronization inserts only changed chunks and deletes
  obsolete fingerprints; synthetic passages can improve retrieval but can
  never become display evidence.
- No real provider, remote database, or secret value was contacted.

### Milestone 5 outbox/lifecycle record

One generic Help worker now claims only its four registered job types, runs
bounded concurrent handlers, retries with capped exponential backoff, isolates
poison jobs, recovers queue-cycle outages without a hot loop, and responds to
`SIGTERM`/`SIGINT`. Continuous, one-batch (`--once`), and bounded drain
(`--drain`) modes share the same handlers.

- Notification materialization, email context, Resend provider-result
  persistence, Ask matching, and profile indexing are service-only fixed APIs.
  Email retries use the durable job key at Resend and skip a replay after a
  provider result has been recorded.
- The maintenance transaction passes time-travel coverage for one day-5
  reminder, day-14 direct/circle closure, pending-offer closure, three-strike
  helper pause, accepted-Ask preservation, and zero-effect replay.
- The stateful worker harness passes supported/unsupported claims, matching
  context and candidate hard gates, capacity removal, profile-index sync,
  email-context idempotency, and provider-result replay. The inherited
  Foundation harness still proves two workers receive disjoint jobs.
- The current focused suite passes 13 files and 79 tests. The full pgTAP
  suite passes 10 files and 374 assertions. Database lint is clean, the shadow
  replay has no `public`/`api`/`private` drift, and two generated type passes are
  byte-identical at SHA-256
  `f55507e958b0067fe28ae06d4e39f778096544f901bca0b47889834f1e5fe687`.
- Logs and Sentry receive sanitized operation codes and durable IDs only. The
  development email redirect log no longer prints either the original or sink
  address. Railway/Doppler topology is documented but not provisioned.
- Repository-wide Biome, ESLint, token, and Vitest checks are green (ESLint has
  three pre-existing script warnings). The global v2 port inventory remains
  exactly 1,257 TypeScript errors, with zero errors in Help-owned modules.

### Milestone 6 Realtime record

The existing strict Help adapter and database invalidations have now been
reverified against the completed worker/schema state. Help Realtime passes
own-topic authorization, IDs-only commit delivery, duplicate suppression,
missed-event recovery, malformed-event rejection, and exact cleanup. The
inherited Conversation Realtime and Conversation query-plan suites remain
green. Broadcast is still only an invalidation signal; every durable result is
reloaded through a fixed projection.

## Out of scope

- group conversations, attachments, reactions, voice/video, scheduling, public
  replies, Ask comments, read receipts on waiting requests, and presence;
- a social/help feed, view counts, popularity ranking, or public outcome cards;
- editing a published Ask, widening it in place, or contacting multiple direct
  recipients from one Ask;
- persisting unsubmitted drafts or Ask-search history on the server;
- alternative LLM/search providers, an ORM, a new auth system, or a second
  component library;
- broad People/Profile/School redesign work except the fixed profile previews,
  links, and index hooks Help needs;
- Resend delivery webhooks and bounce-suppression product UI; provider send
  acceptance and durable retry are sufficient for this slice;
- remote database reset, Railway service creation, deployment, push, merge, or
  production data change without separate explicit approval.

## Numbered execution plan and stop gates

### 1. Freeze the checkpoint and record red baselines

- Confirm branch, clean worktree, tool versions, checkpoint relationship, and
  no remote operation.
- Add the focused pgTAP, concurrency, query-plan, Realtime, worker, matching,
  repository, domain, and E2E skeletons from the test inventory.
- Add `tsconfig.v2-help.json`, `check:help-boundaries`, and package commands.
- Record exact red/green counts in this plan and inventory before implementation.

**Verify:** Foundation and Conversation gates still pass; each new red test
fails for its planned reason; harness syntax/cleanup/local-only guards pass.
Stop if an existing slice regresses or a supposedly red assertion already
passes through an unsafe legacy path.

### 2. Harden Help schema, commands, locks, and projections

- Implement payload-aware idempotency, helper-capacity locking, stable result
  rows, either-participant resolution, fixed projections, tuple keysets,
  preference save/reactivation, and minimal evidence-backed indexes.
- Preserve the published-state and accepted-offer deferred invariants.
- Extend block/retract/expiry behavior and audit events where the new projections
  reveal a missed lifecycle edge.
- Regenerate public/api types; private schemas remain absent.

**Verify:** focused pgTAP contract, all nine existing database files,
concurrency races, database lint, shadow-schema diff, query plans, two identical
type generations, and Supabase boundary checks. Stop on any deadlock, raw grant,
anonymity leak, non-idempotent retry, or unexplained sequential scan.

### 3. Build the v2 repository and pure Help domain

- Add exact Zod row parsers, member repositories, domain contracts, matching
  interfaces, command orchestration, cursor helpers, result mapping, and static
  boundaries.
- Port only genuinely reusable deterministic scoring/formatting tests; delete or
  quarantine legacy DB-coupled Ask modules as their callers move.
- Keep provider and framework implementations injected.

**Verify:** focused TypeScript zero errors, repository/domain Vitest matrix,
malformed/unknown result rejection, no raw tables/service clients/framework
imports, and unchanged Foundation/Conversation focused compilers.

### 4. Implement matching, AI assistance, and profile indexing

- Implement permission-safe hybrid retrieval, deterministic warm scoring,
  Voyage adapters, templated evidence, optional Haiku polish, direct search,
  circle-match application, AI cost guard, draft/shape/decline assistance, and
  all fallbacks.
- Implement the profile-index job with content hashes and obsolete-chunk cleanup.
- Build a representative, privacy-reviewed golden matching fixture.

**Verify:** deterministic matching unit/golden tests, provider timeout/error
tests, no-provider fallback tests, prompt/output schema tests, anonymity evidence
tests, cost-limit tests, and lexical/vector query plans. Stop if a generated
passage becomes display evidence or a service client enters a member path.

### 5. Implement outbox handlers and lifecycle maintenance

- Add typed allowed-type claims, generic runner, notification materialization,
  email-context lookup, Help email templates/links, Resend idempotency option,
  matching/index handlers, reminder/close maintenance, retries, graceful drain,
  and structured monitoring.
- Add local one-shot/drain modes for tests without weakening the production loop.
- Document the future Railway worker service and Doppler/CD variables without
  provisioning or deploying it yet.

**Verify:** two-worker disjoint claims, crash-after-side-effect replay,
duplicate job delivery, backoff/terminal failure, unsupported-type preservation,
day-5/day-14/three-strike time travel, notification preference/dedupe, email
guard/idempotency, and no PII payload assertions. Stop if a provider call occurs
inside a transaction or a failed job blocks the queue.

### 6. Add Help Realtime invalidation

- Extend the user control-event allowlist/policies and implement the strict Help
  channel adapter.
- Emit `help.changed` from each relevant transaction and matching/maintenance
  commit.
- Refetch fixed projections on event, reconnect, window focus, and permission
  change; keep the durable UI usable when Realtime is down.

**Verify:** authorized/outsider topic joins, commit delivery, rollback silence,
duplicate silence, block/retract revocation, reconnect gap recovery, malformed
payload handling, and channel cleanup. Stop if any event exposes content or if
the UI treats Broadcast as authoritative state.

### 7. Build the Help routes and template-faithful UI

**Progress (2026-07-14):** `/help` now uses the v2 home/search/preferences
projections, and the private search → `/help/ask/[membershipId]` direct road is
operational with membership-scoped draft carry, AI/plain composition, a bounded
provider fallback, idempotent send, and refresh-safe recent-Ask rendering. A
forward-only repair keeps `list_my_asks.recipient_preview` aligned with the
strict profile-preview contract. Automated/runtime gates pass. The direct
composer now passes exact-source desktop design QA plus 1440, 768, 390, and
320 px responsive capture checks, including the route-specific shell header,
full-height desktop workspace, and shrink-safe mobile tab bar. The circle
composer is also operational against `api.create_circle_ask`: empty direct
entry plus membership-scoped draft carry, editable and assisted shaping,
immutable reach, anonymous-until-accepted, payload-aware idempotent publish,
and calm recovery. Its supplied-source 2546 × 1281 comparison and
1440/768/390/320 responsive captures now pass with no remaining P0/P1/P2
drift. History/status/direct-detail, give/offer responses, redirects, and the
remaining Help template matrix remain in this milestone.

- Implement `/help`, both composers, history, status/direct detail, offer
  composer, result/error/loading/offline states, remembered mode, draft carry,
  last-three-days warning, and redirects.
- Wire all commands, matching, assistance, Realtime refresh, reports, and
  notification targets, plus the minimal v2 accepted-Ask Messages thread needed
  to finish the loop.
- Remove fabricated Give content and all v2 Help callers of legacy Ask/thread
  modules.
- Match desktop/tablet/mobile handoff geometry and copy with existing tokens.

**Verify:** component/accessibility tests, token ratchet, focused compiler,
Playwright direct/circle/decline/cap/expiry/block/fallback scenarios, console-
error guard, 320/768/1440 viewport checks, keyboard-only flow, reduced motion,
and screenshot comparison to every Help template. Stop on a fake row, raw-color
drift, missing system state, inaccessible dialog, or legacy database call.

### 8. Cut over the domain and reconcile documentation

- Update Home/Profile/Notifications/Messages entry links and remove or redirect
  legacy Help routes atomically.
- Update `app/CLAUDE.md`, information architecture, screen map, v2 contract,
  ADR 0011 decline amendment, environment/Doppler worker topology, migration,
  Supabase, seed, E2E, and CD runbooks.
- Delete superseded Help implementation only after `rg` and compiler prove no
  production caller remains.
- Classify the new global TypeScript inventory; Help-owned errors must be zero.

**Verify:** no legacy Help identifiers/callers, all focused database/application/
browser gates, global Biome/ESLint/Vitest where they are already baseline-green,
docs links, and a classified global TypeScript inventory. Help-owned errors must
be zero and the total inventory must not gain an unexplained non-Help error.
The full compiler/build are not falsely declared green while later v2 domains
remain unported. Stop if deletion changes an unrelated domain or any Help error
remains hidden in the global baseline.

### 9. Prepare, but do not execute, remote cutover

- Make the runbook's first precondition explicit: every remaining v2 application
  domain must be ported and the global TypeScript/build gates must be green.
  A locally complete Help checkpoint is not independently deployable while the
  rest of the app still references the retired schema.
- Produce an exact dev-first runbook: snapshot, remote dev reset/migrate/seed,
  provision the Railway worker service, deploy the same commit to worker and web,
  verify queue/realtime/email/matching, run deployed integ, then require manual
  production approval.
- Define rollback as application/worker rollback plus the pre-reset snapshot;
  never run old code against v2 or new code against legacy schema.
- Keep `main`, remote Supabase projects, Railway, Doppler, and production
  untouched during local implementation.

**Verify:** dry-run command review, secret-name-only environment audit, dev/prod
service topology checklist, health/oldest-job inspection query, and explicit
user approval boundary. The actual reset/deploy is a separate task.

## Completion definition

The Help slice is locally complete only when:

- every test and performance gate in the linked inventory passes;
- focused Help TypeScript has zero errors and the classified global inventory
  contains no Help-owned error or unexplained regression, without suppressions;
- all direct/circle lifecycle and concurrency outcomes are durable and
  idempotent;
- matching has deterministic, no-provider, weak-evidence, and privacy-safe
  behavior;
- worker restart/retry cannot lose database effects or ordinarily duplicate
  notifications/email;
- anonymous identity is absent from every unauthorized surface;
- every Help template has a verified responsive production route;
- no production Help caller uses legacy tables, service-role member access, or
  fabricated data;
- the worktree is clean after a local checkpoint commit, with no push, merge,
  remote migration, or deployment performed.

Global compiler/build green remains a mandatory remote-cutover gate owned by
the final all-domain v2 integration, not a result this one domain can honestly
claim while later legacy modules are still in the port inventory.
