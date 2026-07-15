# Database v2 Messages vertical-slice implementation plan

- **Status:** approved by Richard; Milestone 1 complete; Milestone 2 next; local-only
- **Prepared:** 2026-07-15
- **Approved:** 2026-07-15
- **Branch:** `codex/redesign-v2`
- **Starting checkpoint:** Help domain cutover `f0a09e1`
- **Depends on:** completed Conversation Primitive and Help vertical slice
- **Contract:** [Database v2 contract](database-v2-contract.md)
- **Behavior:** [`FLOWS.md` §5](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md)
- **UI source:** [BridgeCircle Messages template](../experience/ui/design-system/handoff/bridgecircle/project/templates/messages/Messages.dc.html)
- **Test inventory:** [Messages vertical-slice test inventory](database-v2-messages-test-inventory.md)

## Goal

Ship Messages as the one durable room for every accepted Ask and accepted
Connection. A member can see what needs attention, find and filter every
conversation, handle incoming Connection requests, open a responsive thread,
send and receive messages in real time, advance read state correctly, resolve
an Ask without closing its conversation, request a Connection after a useful
Ask, and use report/block/disconnect controls without leaking hidden data.

This is not a second messaging backend. The completed Conversation Primitive
already owns transactional creation, idempotent sends, bounded history,
monotonic read cursors, block-aware authorization, private Broadcast, typing,
and reconnect gap reads. This slice adds the missing inbox projections,
Connection application boundary, shell attention state, responsive Messages
workspace, and end-to-end verification around that primitive.

“Error-proof” means the design deliberately handles the failures the product
can encounter:

- expected races and retries return stable result rows instead of leaking
  constraint errors;
- a lost HTTP response cannot turn one send or Connection request into two;
- Broadcast is only an IDs-only invalidation signal and Postgres is always
  refetched as the source of truth;
- unread state advances only when a visible member has actually reached the
  newest message;
- one authenticated owner-topic subscription serves the shell, Help, Messages,
  and conversation permission changes instead of opening competing copies;
- list and history reads are bounded and keyset-paginated;
- blocked, inactive, deleted, disconnected, and unauthorized states have an
  explicit safe result;
- every milestone has a stop gate, so a failed invariant is fixed before the
  next layer starts.

## Canonical sources and precedence

Use this order when sources disagree:

1. [ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md) and the approved
   [database v2 contract](database-v2-contract.md);
2. [`FLOWS.md`](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md)
   §§5, 7b, 7c, and 8;
3. [ADR 0011](../decisions/0011-two-verbs-one-inbox.md);
4. the final Messages template for visual hierarchy and interaction detail;
5. current code only as evidence to keep deliberately or replace.

The v2 contract therefore resolves four visible specimen drifts:

- accepted Asks do not expire, so an accepted thread has no “days left” flag;
- attachments and shared-file storage are not approved Phase 1 schema, so the
  attachment button and fabricated file/photo rail do not ship;
- presence/last-seen is not modeled, so the UI shows verified class/context
  rather than inventing “Active now”;
- bilateral “share this win” consent has no complete persistence or second-
  participant flow. This slice keeps the approved optional outcome note and
  defers public outcome cards until Home owns a separately approved consent
  contract.

The Messages implementation must update the handoff notes/docs for these
differences. It must not silently add dead controls or client-only fake state.

## Slice specification

### Member outcomes

#### Inbox and attention

- `/messages` is the canonical root. It shows a pinned, foldable **Waiting on
  you** group followed by durable conversations.
- Waiting contains pending direct Asks and incoming Connection requests. A
  direct Ask links to its canonical `/help/asks/[askId]` decision surface;
  Messages does not duplicate Help lifecycle logic.
- Incoming Connection requests support inline Accept and Decline. Accept is
  atomic and opens the resulting direct conversation. Decline is quiet.
- The list has chip filters **All / Unread / My circle / Open asks** and a
  bounded search over counterpart name and Ask question only. It is not full-
  text message search.
- Conversation priority is deterministic: needs-reply rows first, then other
  sendable conversations, then read-only history; each tier is ordered by
  latest durable activity and ID.
- Unread styling is derived from the viewer's monotonic read cursor. System
  lines and the viewer's own messages do not count as unread.
- Desktop and mobile navigation show one Messages attention badge equal to
  unread-conversation count plus Waiting count. The badge is separate from the
  notification-bell count and is capped visually at `99+`.
- Empty, filtered-empty, loading, partial-realtime, and transport-error states
  are truthful and recoverable. No seed-only or fabricated row appears.

#### Threads

- `/messages/[conversationId]` renders accepted Ask and direct Connection
  conversations with the same thread component and route.
- The origin is a quiet structured system line. A Connection intro becomes the
  requester's first durable user message after acceptance; it is not lost in
  the request row.
- History loads in 50-row ID-keyset pages. New messages recover through the
  verified after-cursor path after every subscription/reconnect.
- A send uses one client nonce for the complete attempt. If the response is
  lost, Retry reuses the nonce and converges on the same durable message.
- Read state advances only when the document is visible and the latest-message
  sentinel is visible. Loading older history never marks unseen new content.
- Read receipts appear only on the newest relevant outgoing message, not under
  every historical outgoing bubble.
- Typing is ephemeral, throttled, content-free, clears on blank input/unmount,
  and never blocks durable sends.
- A disconnected direct conversation remains visible and read-only. A resolved
  Ask conversation remains visible and sendable. A blocked conversation is
  hidden and revoked.

#### Context and safety

- The context rail shows only fixed, authorized fields: counterpart name,
  avatar, class year, current headline/context, circle state, Help availability
  in the relevant shared organization, profile link, and Ask context when the
  conversation came from an Ask.
- Either accepted participant can resolve an Ask with an optional outcome note.
  Resolving adds one system line and closes only the Ask.
- After both participants have written in an Ask conversation, a member who is
  not connected and has no pending request can send one quiet **Add to your
  circle** request. The durable pending/connected state removes the nudge.
- Reporting captures the immutable message evidence through the safety
  boundary. Blocking immediately revokes both parties' conversation access and
  hides the pair across member surfaces. Disconnecting preserves history but
  makes the direct thread read-only.
- Expected stale/race outcomes produce calm inline copy; no database error text
  reaches the member.

### Route contract

| Route | Responsibility |
|---|---|
| `/messages` | list, Waiting group, filters/search, empty state |
| `/messages/[conversationId]` | selected thread and authorized context |
| `/api/messages/conversations` | bounded list/filter/search pagination |
| `/api/messages/counts` | attention and filter counts |
| `/api/connections/requests` | post-Ask Connection request command |
| `/api/connections/requests/[requestId]/response` | accept/decline incoming Connection |
| `/api/connections/[userId]/disconnect` | preserve history and remove send permission |
| `/api/members/[userId]/block` | shared member-block command |

Existing conversation routes remain canonical:

- `GET/POST /api/conversations/[conversationId]/messages`;
- `POST /api/conversations/[conversationId]/read`;
- `POST /api/conversations/[conversationId]/typing`;
- `POST /api/conversations/[conversationId]/messages/[messageId]/report`.

No `/inbox`, `/ask/thread/*`, legacy redirect, legacy thread identifier, or
compatibility adapter is reintroduced.

### Responsive route behavior

- **Below 768 px:** `/messages` is the list; `/messages/[id]` is the full thread.
  The back target is always `/messages`. Context opens as an accessible sheet.
- **768–1199 px:** list and selected thread form a two-pane workspace; context
  opens as a sheet so the conversation keeps usable width.
- **1200 px and above:** list, fluid thread, and collapsible 290–310 px context
  rail fill the member shell's available width. The page does not use the
  Help-style centered max-width canvas.
- The context-rail preference and Waiting fold preference store only booleans
  in versioned, user-scoped browser keys. No message, search, or identity data
  enters local storage.
- Acceptance sizes are 1440-class desktop plus the source-capture width, 768,
  390, and 320 px. Horizontal overflow is a failure.

## Architecture

### Layer boundaries

```text
Messages Server Components / client islands / API routes
        |  parse, authenticate, map result only
        v
src/lib/messages + src/lib/connections + src/lib/safety
        |  framework-free operations and contracts
        v
src/db/repositories/messages.ts / connections.ts / safety.ts
        |  strict Zod parsing; fixed api RPCs only
        v
api schema wrappers
        v
private projections, commands, locks, and centralized block checks
        v
public conversations/messages/reads/connections/asks

Postgres commit
        +--> conversation:<id>  message/read/typing invalidations
        +--> user:<userId>      help/messages/connections/control invalidations
                                  |
                                  v
                         one UserControlProvider
                                  |
                    +-------------+-------------+
                    |             |             |
                nav badge     Messages list   Help refresh
```

Rules enforced by a Messages boundary script and focused TypeScript config:

- `/lib/messages`, `/lib/connections`, and `/lib/safety` import no Next.js,
  Supabase client, provider SDK, environment variable, or `server-only` module;
- member repositories call fixed `api` functions only and never raw
  conversation, message, read, Connection, Ask, report, or outbox tables;
- route handlers authenticate, parse, invoke one operation, and map one stable
  result; they contain no business rules;
- the Messages UI does not import the Help repository or a legacy friendship/
  DM module;
- no service client, broad raw grant, compatibility cast, or TypeScript
  suppression enters the member path;
- user-topic payloads contain identifiers only and are never treated as data.

The existing legacy `src/lib/friendship` files remain part of the classified
People/Profile port inventory until that slice replaces their callers. This
slice neither imports nor wraps them. The later People/Profile cutover deletes
them; Messages does not broaden itself into a second directory implementation.

### Server/client split

- `app/(member)/messages/layout.tsx` loads initial counts, Waiting items, and
  the first conversation page in parallel. The nested layout persists while a
  member switches threads.
- `/messages/[id]/page.tsx` loads detail and the first history page in parallel
  with the parent layout. It never loads the complete inbox or history.
- The list client island owns query/filter state, keyset “Load more,” Waiting
  fold state, optimistic request decisions, and debounced invalidation refresh.
- The thread client island owns draft/send state, visible-end read advancement,
  content-topic Realtime, history paging, typing, context rail, and dialogs.
- The member-shell `UserControlProvider` owns the single private `user:<id>`
  subscription, reconnect state machine, attention refresh, and domain
  revisions. Help and Messages consume it rather than opening duplicate owner
  channels.
- Private responses are always `Cache-Control: private, no-store, max-age=0`.
- Search/filter requests use an AbortController and a monotonically increasing
  request sequence so stale responses cannot replace newer input.
- Independent server reads use `Promise.all`; dependent awaits start only after
  the key they require is known. Only minimal serializable fields cross from
  Server Components into client islands.

### UI component plan

Build small product components instead of copying the 854-line prototype:

- `MessagesWorkspace`, `ConversationList`, `ConversationRow`, and
  `MessagesFilterChips`;
- `WaitingGroup`, `DirectAskWaitingRow`, and `ConnectionRequestWaitingRow`;
- `ConversationPane`, `MessageTimeline`, `MessageBubble`, `SystemLine`, and
  `TypingIndicator`;
- `MessageComposer`, `SendState`, and `RealtimeStatus`;
- `ConversationContext`, `AskContextCard`, `ConnectionNudge`, and
  `ConversationSafetyActions`;
- `MessagesEmptyState`, `MessagesFilteredEmpty`, `MessagesErrorState`, and
  `MessagesSkeleton`.

Reuse the current BridgeCircle tokens and owned shadcn/Radix primitives where
they match the handoff. Do not add a component library or create a raw shadcn
look beside the design system. Keyboard navigation, visible focus, dialog/sheet
focus return, live-region feedback, reduced motion, 44 px touch targets, screen-
reader labels for unread/selected state, and time semantics are acceptance
criteria.

## Database and API changes

### Keep the approved model

Keep `connection_requests`, `connections`, `member_blocks`, `conversations`,
`messages`, `conversation_reads`, `asks`, and the existing private Realtime
topology. Do not add a participant table, inbox table, unread counter column,
last-message foreign key, archive table, attachment table, message-search
index, presence table, or duplicated Ask context.

Any new index must be justified by the representative EXPLAIN harness. The
existing participant, `(conversation_id,id)`, read, pending-Connection, and
pending-direct-Ask indexes are expected to be sufficient; implementation does
not add speculative indexes before the red query proves a need.

### Fixed read projections

Add four authenticated-only projections:

1. `api.list_conversation_summaries(text,text,smallint,timestamptz,uuid,integer)` — bounded, filterable, searchable,
   priority-keyset conversation rows;
2. `api.list_messages_waiting()` — pending direct Asks plus incoming Connection
   requests, capped at 50;
3. `api.get_messages_counts()` — All, Unread, My circle, Open asks, and Waiting
   counts from one canonical definition;
4. an extended `api.get_conversation_detail` — authorized context, Connection
   state, minimal Ask context, and post-Ask nudge eligibility.

`list_conversation_summaries` returns this stable shape:

| Field group | Contract |
|---|---|
| identity | conversation ID/kind/organization/Ask ID |
| counterpart | user ID, display/preferred name, avatar path, class year |
| relationship | connected flag, can-send flag, read-only reason |
| Ask context | question and accepted/resolved status only when kind is Ask |
| preview | latest message ID/kind/sender/body/timestamp |
| attention | unread counterpart-user-message count, needs-reply boolean |
| cursor | priority tier, activity timestamp, conversation ID |

The projection first narrows the two participant indexes with `UNION ALL`, then
does indexed lateral latest-message/read work for only the bounded candidate
set. It uses `private.is_blocked(a,b)` for the sole block decision. It does not
scan message bodies for search.

Priority tiers are:

1. latest unread user message came from the counterpart;
2. conversation is currently sendable;
3. retained read-only history.

Within a tier, order by `coalesce(last_message_at, created_at) desc, id desc`.
The cursor includes all three order components; timestamp-only and OFFSET
pagination are forbidden.

`list_messages_waiting` returns a strict discriminated union:

- direct Ask: Ask ID, organization ID, asker safe preview, question, request
  message, and created time;
- Connection: request ID, origin organization ID, requester safe preview,
  optional intro, and created time.

Rows require active caller/other accounts and pass the centralized block check.
No circle Ask, outgoing request, declined row, accepted row, or anonymous author
can enter this projection.

`get_messages_counts` is the only definition of badge/filter counts. The
member-context projection reuses it so shell and page cannot drift.

### Harden Connection commands

Replace expected Connection exceptions with strict result rows while retaining
constraint failures for programming defects.

| Command | Stable result contract |
|---|---|
| `api.send_connection_request` | `created`, `existing`, `incoming_pending`, `already_connected`, `not_available`, `invalid_input`, or `idempotency_conflict`; optional request ID |
| `api.respond_to_connection_request` | `accepted`, `declined`, `already_decided`, `not_available`, or `invalid_input`; optional connection and conversation IDs |
| `api.disconnect` | `disconnected`, `unchanged`, or `not_available` |
| `api.block_member` | `blocked`, `unchanged`, or `not_available` |

Their result shapes are fixed as `(result_code, request_id)`,
`(result_code, connection_id, conversation_id)`, and `(result_code)` for each
of disconnect and block. A success code cannot omit an ID required by the UI.

All pair mutations use the existing ascending user-pair lock before reading or
changing pair state. Same-key/same-payload retries return the original durable
result; same-key/different-payload returns `idempotency_conflict`. Opposite-
direction pending Connection requests return `incoming_pending` instead of
hitting the unordered-pair unique index.

Accepting a Connection performs one transaction:

1. lock and revalidate recipient, accounts, block, and pending state;
2. mark the request accepted;
3. create/reuse the canonical Connection;
4. create/reuse the one direct conversation;
5. insert the idempotent `connection_accepted` system line;
6. if the request has an intro, insert it once as a user message from the
   requester, using the request's client key as the message nonce;
7. enqueue the existing deduplicated acceptance notification;
8. emit IDs-only user/control invalidations;
9. return the conversation ID needed by the UI.

Decline changes only the request state, emits no requester notification, and
invalidates the recipient's Waiting count.

### Owner-topic Realtime

Standardize `private.broadcast_user_control_event` so every event receives one
generated event ID and strict event-specific payload validation. Existing
conversation control payloads are corrected to include this dedupe ID.

The owner topic supports:

| Event | Minimal payload | Consumer action |
|---|---|---|
| `help.changed` | Ask ID, optional offer ID | Help refresh; Messages Waiting/count refresh |
| `messages.changed` | conversation ID | list/count refetch |
| `connections.changed` | optional request/conversation ID | Waiting/list/count refetch |
| `conversation.permissions_changed` | conversation ID | detail/list permission refetch |
| `conversation.revoked` | conversation ID | close selected thread and refetch |

Message insert broadcasts `messages.changed` to both participants. Read advance
broadcasts it to the reader for cross-tab badge/list convergence. Connection
request create/decision broadcasts `connections.changed` to affected owners.
Existing Help commands already emit `help.changed`; no duplicate Ask trigger is
added.

The `UserControlProvider` strictly parses this union, deduplicates IDs, closes
once, reconnects with capped exponential backoff plus online/focus signals, and
performs a full count/domain refetch after every subscribe. It never applies
payload fields as durable UI state.

### Attention count and shell contract

Extend `api.get_my_member_context` with `messages_attention_count`, sourced from
`get_messages_counts.unread_count + waiting_count`. Pass the initial value into
the provider and render it in desktop rail/full sidebar and mobile tab bar.

After an owner invalidation, the provider debounces `GET /api/messages/counts`.
On failure it keeps the last known count, exposes a non-blocking stale state,
and retries on the next reconnect/focus. It never zeroes the badge because a
network call failed.

## Application contracts

### Framework-free domains

`src/lib/messages` owns:

- summary/count/waiting types and filter/cursor schemas;
- list pagination and merge helpers;
- system-line presentation mapping;
- unread/needs-reply semantics;
- visible-end read decision and retry-send state transitions.

`src/lib/connections` owns:

- send/respond/disconnect result unions;
- local input validation;
- expected result mapping without framework copy;
- post-Ask nudge eligibility inputs supplied by the projection.

`src/lib/safety` owns:

- report and block command contracts used across Help, Messages, and later
  Profile work;
- no UI dialog, Next route, or Supabase dependency.

Repositories own strict snake_case to camelCase parsing. Unknown fields,
impossible union shapes, unsafe integer message IDs, invalid timestamps, and a
success result missing required IDs fail closed in tests and at the boundary.

### Thin route behavior

Every route:

1. authenticates with the member session client;
2. validates params/query/body with a strict Zod schema;
3. invokes one framework-free operation with one repository;
4. maps stable expected results to HTTP status and generic member copy;
5. captures unexpected failures to Sentry without message/intro body or PII;
6. returns private no-store headers.

Expected unavailable/blocked/missing cases collapse to the same external shape
when distinguishing them would expose another member or conversation.

### Send and draft state

The composer keeps a versioned `sessionStorage` record per conversation with
only the unsent draft, pending body, and pending nonce. It is scoped to the
signed-in user, capped at 10,000 characters, cleared after confirmed
`sent|duplicate`, and removed when the tab session ends.

State transitions are explicit:

```text
editing -> sending(nonce, body) -> confirmed -> cleared
                         |
                         +-> uncertain -> retry same nonce
                         +-> rejected  -> editable with safe reason
```

Changing the body after an uncertain send starts a new attempt only after the
member deliberately discards or resolves the pending attempt. This prevents a
lost response from creating a duplicate with a fresh nonce.

### Read state

The thread owns an end sentinel. It may call mark-read only when:

- the selected conversation is still mounted;
- `document.visibilityState === 'visible'`;
- the newest message is from the counterpart and is above the current cursor;
- the end sentinel intersects the scroll viewport;
- no equal-or-higher mark-read call is already pending.

Failures are non-destructive and retried on focus, reconnect, or the next new
message. The monotonic database command remains the final concurrency guard.

### Realtime reconnect state machine

Refactor the current thread integration into a tested hook/state machine:

- one content channel handle at a time;
- close the failed handle before reconnecting;
- exponential delays of 1, 2, 5, 10, and max 30 seconds with jitter disabled in
  deterministic tests;
- immediate retry on browser `online` and visible-window focus;
- after-cursor refetch before declaring the channel live;
- abort all timers/fetches and publish typing false on unmount;
- durable send/history remain usable while Realtime is paused.

The current copy may say “this page will keep retrying” only after this loop is
actually implemented.

## Milestone plan and stop gates

Implementation steps are intentionally small. Each code step should stay near
30 changed lines where practical; schema function bodies and test fixtures may
be larger but are split by invariant and committed only after their gate is
green.

### Milestone 0 — approve and checkpoint the plan

1. Review member outcomes, route ownership, specimen drifts, and out-of-scope.
   **Verify:** Richard explicitly approves this plan.
2. Commit the approved plan/test inventory separately from implementation.
   **Verify:** clean `codex/redesign-v2`; `main` untouched; no push/merge.

Stop if Ask decisions are being duplicated in Messages, if attachments/
presence/outcome-sharing are implicitly added, or if the user-topic ownership
model is not accepted.

### Milestone 1 — capture a red, classified baseline

3. Record branch relationship, tool versions, clean status, and starting commit.
   **Verify:** evidence is copied into the test inventory.
4. Re-run Foundation, Conversation, Help, worker, maintenance, Realtime, and
   query-plan gates.
   **Verify:** inherited green baseline is unchanged.
5. Add an empty focused `tsconfig.v2-messages.json` and boundary script.
   **Verify:** compiler is green before new modules; script proves its violation fixture.
6. Add red pgTAP assertions for read projections, counts, Connection result
   rows, intro preservation, grants, and owner events.
   **Verify:** failures map only to planned contracts.
7. Add red concurrency scenarios for Connection decision, opposite request,
   block/accept, and read/message races.
   **Verify:** harness setup/cleanup succeeds and only planned outcomes fail.
8. Add red Realtime and query-plan fixtures.
   **Verify:** authorization works but new events/signatures/plans are absent.
9. Snapshot the remaining global TypeScript error inventory by domain.
   **Verify:** Messages-owned baseline is named separately from later ports.

Stop on an unexplained inherited regression, non-local URL, dirty unrelated
file, secret output, harness leak, or failure that does not belong to the plan.

### Milestone 2 — implement database projections and Connection commands

10. Add the participant-narrowed conversation-summary projection.
    **Verify:** participant/block/account personas and strict shape pgTAP pass.
11. Add unread, needs-reply, relationship, Ask-context, and preview fields.
    **Verify:** own/system messages do not count unread; blocked rows are absent.
12. Add filter semantics and all-component keyset cursor.
    **Verify:** tied timestamps and tier transitions have no duplicate in a stable snapshot.
13. Add bounded name/Ask-question search.
    **Verify:** message-body-only text does not match; query length clamps/rejects.
14. Add Waiting projection for direct Asks.
    **Verify:** recipient only; direct/waiting only; Help URL has Ask ID.
15. Add Waiting projection for incoming Connections.
    **Verify:** recipient/pending only; quiet decline data stays private.
16. Add canonical counts and reuse them in member context.
    **Verify:** shell and page counts match every persona and state transition.
17. Extend conversation detail with authorized profile/relationship/Ask fields.
    **Verify:** no Help repository is required and no hidden profile field leaks.
18. Convert send-Connection to a locked stable result contract.
    **Verify:** identical retry, payload conflict, reverse pending, block, and connected states.
19. Convert respond-Connection to a locked stable result contract.
    **Verify:** accept/decline/idempotent/stale result rows and returned conversation ID.
20. Preserve a nonblank Connection intro as one durable opening message.
    **Verify:** origin precedes intro; retry inserts neither twice.
21. Convert disconnect and block to stable result contracts.
    **Verify:** retained-history and symmetric-block effects stay intact.
22. Standardize owner event IDs/payload validation and add messages/connections events.
    **Verify:** commit delivery, rollback silence, strict IDs-only payloads.
23. Add only EXPLAIN-proven indexes, if any.
    **Verify:** realistic fixtures select required participant/message/pending indexes.
24. Regenerate public/api types twice.
    **Verify:** byte-identical files; no private/realtime schema leaks.

Stop on raw-table member access, OFFSET/unbounded reads, content in Broadcast,
an expected unique/constraint exception, a second intro/system line/job, or a
speculative index without plan evidence.

### Milestone 3 — implement repositories, domains, and thin routes

25. Add Messages contracts and strict repository row parsers.
    **Verify:** valid fixtures map; unknown/impossible/malformed rows fail closed.
26. Add list/count/waiting repository calls to fixed APIs only.
    **Verify:** repository mocks assert exact function and argument names.
27. Add pure list paging/filter/cursor helpers.
    **Verify:** merge/dedupe/order tests cover ties and invalid cursors.
28. Add Connection contracts, operations, and repository.
    **Verify:** expected results preserved; invalid local input performs no I/O.
29. Add safety report/block contracts and repository seam.
    **Verify:** message evidence target and generic unavailable mapping.
30. Add conversations/counts GET routes.
    **Verify:** auth, strict query, no-store, bounded limits, sanitized failures.
31. Add Connection request/response/disconnect routes.
    **Verify:** one operation per route and stable HTTP mapping.
32. Add shared member-block route and port the Messages caller.
    **Verify:** no direct client RPC; Help regression remains green.
33. Refactor the message-report route off the Help repository.
    **Verify:** same report evidence and acknowledgement; no cross-domain import.
34. Expand the Messages boundary and focused compiler.
    **Verify:** zero Messages errors and all deliberate violations are rejected.

Stop if `/lib` imports framework/infrastructure, a repository calls raw tables,
a route contains a business rule, error text includes a body/name/database
message, or compatibility code is introduced.

### Milestone 4 — unify owner Realtime and shell attention

35. Implement the strict user-control channel adapter.
    **Verify:** event-union parsing, dedupe, malformed handling, single cleanup.
36. Implement one reconnecting `UserControlProvider` in the member layout.
    **Verify:** one channel per tab, capped backoff, online/focus recovery.
37. Expose domain revisions and conversation control callbacks.
    **Verify:** unrelated events do not mutate another domain's state.
38. Port Help refresh from its private owner subscription to the provider.
    **Verify:** Help Realtime integration and browser refresh roads remain green.
39. Reduce conversation Realtime to the content topic; consume permissions from
    the provider.
    **Verify:** block/disconnect/revoke and message/read/typing tests remain green.
40. Add the debounced counts refresh endpoint integration.
    **Verify:** reconnect refetch, failure preserves prior count, retry converges.
41. Render the badge in sidebar, icon rail, and mobile tab.
    **Verify:** `0` hides, `1–99` reads exactly, `100+` renders `99+` with full aria label.

Stop on duplicate owner subscriptions, authoritative payload application,
content-bearing events, a badge that zeroes on transport error, timer/channel
leaks, or any Help/Conversation Realtime regression.

### Milestone 5 — build the Messages list workspace

42. Add persistent nested Messages layout and full-width workspace geometry.
    **Verify:** list persists across thread navigation and fills available shell width.
43. Render the initial bounded conversation list with selected/unread semantics.
    **Verify:** row hrefs are canonical; no fabricated data.
44. Add chip filters with canonical counts.
    **Verify:** All/Unread/My circle/Open asks match database definitions.
45. Add debounced bounded search and cancellation.
    **Verify:** stale response cannot overwrite the newest query.
46. Add keyset “Load more.”
    **Verify:** tied activity timestamps produce no duplicate/skip in stable fixture.
47. Add the foldable Waiting group and persisted boolean preference.
    **Verify:** group disappears at zero and folded badge remains visible.
48. Link direct Ask rows to Help detail.
    **Verify:** no Ask response modal or duplicated lifecycle code in Messages.
49. Add inline Connection accept/decline with pending/error states.
    **Verify:** double-click/retry converges; accept navigates to returned thread.
50. Add empty, filtered-empty, loading, and error states.
    **Verify:** keyboard and screen-reader flow; retry works; no dead action.
51. Refresh the current list on relevant provider revisions.
    **Verify:** debounced refetch preserves filter/selection and removes revoked rows.

Stop on a centered/fixed specimen canvas, full-history fetch, client-side-only
authority, fake Waiting row, Ask decision duplication, inaccessible selection,
or horizontal overflow at an acceptance width.

### Milestone 6 — harden and finish the unified thread

52. Move the existing accepted-Ask thread into the shared workspace.
    **Verify:** `/messages/[id]` back target/header ownership is Messages.
53. Remove the Help-detail repository dependency using extended conversation detail.
    **Verify:** Ask and direct threads share one input contract.
54. Add responsive list/thread/context composition and context sheet.
    **Verify:** mobile one-pane, tablet two-pane, desktop three-column behavior.
55. Add collapsible context rail and user-scoped boolean preference.
    **Verify:** fluid thread gains width; no sensitive browser storage.
56. Implement retry-stable pending-send state and session draft recovery.
    **Verify:** lost-response retry reuses nonce and renders one durable message.
57. Implement content-channel reconnect state machine.
    **Verify:** close-before-retry, gap recovery, offline send, and cleanup tests.
58. Correct typing blank/unmount behavior.
    **Verify:** false publishes on blank/leave; throttle remains non-blocking.
59. Implement visible-end read advancement.
    **Verify:** hidden/offscreen/older-page states do not mark; focus/end does.
60. Reduce read receipts to the latest relevant outgoing message.
    **Verify:** counterpart cursor changes the correct receipt only.
61. Add context profile/Ask/circle/open-to-help presentation.
    **Verify:** deleted/no-shared-org fallbacks and authorized-field matrix.
62. Keep resolve in Help's operation boundary but render it in context.
    **Verify:** either side resolves once; conversation still sends; no expiry chip.
63. Add post-Ask Connection nudge and stable send-request command.
    **Verify:** both-written gate, no connected/pending/blocked duplicate.
64. Add report, block, and conditional disconnect dialogs.
    **Verify:** evidence/report acknowledgement, revoke-to-root, retained read-only history.
65. Remove dead attachment/files/presence/share-win controls.
    **Verify:** zero dead buttons and documentation records the intentional drift.

Stop on a fresh nonce after an uncertain send, mark-read while hidden/offscreen,
a reconnect copy without a reconnect loop, duplicated thread implementations,
unauthorized profile data, or safety action without confirmation/recovery.

### Milestone 7 — seed, browser, accessibility, and whole-slice verification

66. Extend the disposable v2 seed with a compact Messages state matrix.
    **Verify:** pending Ask, pending Connection, unread Ask, direct Connection,
    resolved Ask, disconnected history, and blocked-hidden fixtures reset deterministically.
67. Add component/accessibility tests for list, Waiting, thread, context, and dialogs.
    **Verify:** axe/roles/focus/live regions/keyboard/reduced-motion assertions.
68. Add Playwright roads for direct Ask acceptance into Messages.
    **Verify:** Waiting -> Help decision -> thread -> send -> refresh -> resolve -> send.
69. Add Playwright roads for Connection accept/decline.
    **Verify:** intro preservation, origin line, quiet decline, circle badge, direct send.
70. Add Playwright roads for unread/read/realtime/reconnect.
    **Verify:** badge/list/thread converge across two authenticated contexts and reload.
71. Add Playwright roads for block/disconnect/report.
    **Verify:** revocation, hidden pair, retained read-only history, report acknowledgement.
72. Capture and compare desktop/tablet/mobile/narrow screenshots.
    **Verify:** handoff hierarchy, responsive adaptation, full-width use, no overflow.
73. Run token, Biome, ESLint, Vitest, focused compilers/boundaries, pgTAP,
    concurrency, Realtime, query plans, worker/maintenance, and relevant E2E.
    **Verify:** every owned and inherited gate is green.
74. Re-run and classify global TypeScript/build inventory.
    **Verify:** zero Messages-owned errors; no unexplained later-domain regression.

Stop on console errors, hydration warnings, fake data, accessibility violations,
visual drift without an explicit rationale, a flaky timing-only test, or an
unclassified compiler regression.

### Milestone 8 — destructive domain cutover and documentation

75. Remove any replaced legacy inbox/DM/Connection caller that no longer has a
    production importer.
    **Verify:** `rg` and compiler prove deletion; later People callers are not accidentally removed.
76. Add `check:messages-cutover` for retired URLs/imports/raw calls/duplicate owner channels.
    **Verify:** the script catches deliberate fixtures and passes the real tree.
77. Update the v2 contract, Conversation plan, IA, screen map, app conventions,
    seed/E2E/Realtime runbooks, ADR 0011 amendment, and FLOWS drift notes.
    **Verify:** links and route/data ownership agree with code.
78. Record completed evidence in this plan and the test inventory.
    **Verify:** exact commands/counts/checkpoints, no unsupported “deployable” claim.
79. Create one local checkpoint commit after all local gates pass.
    **Verify:** clean branch; no push, merge, remote migration, or deployment.

Remote dev/prod reset remains blocked until People/Profile, School/Admin,
account lifecycle, the global compiler, and the production build are green.
Messages completion does not authorize a remote database or Railway change.

## Test strategy summary

The linked inventory is the executable acceptance contract. Ownership is:

- **pgTAP:** projections, grants, authorization, result rows, transaction
  effects, dedupe, unread/count semantics, and Realtime payload shape;
- **multi-session shell tests:** lock order and Connection/message/read/block
  races;
- **Realtime integration:** owner/content topic authorization, commit/rollback,
  cross-tab invalidation, revocation, reconnect, and cleanup;
- **query-plan harness:** participant list, latest/unread lateral reads, Waiting,
  counts, and bounded search at representative volume;
- **Vitest:** strict parsers, operations, cursor/list merge, send/read state
  machines, system copy, adapters, and reconnect timers;
- **Playwright:** the rendered member roads, durable refresh results, responsive
  behavior, keyboard/accessibility, and two-context realtime convergence;
- **static gates:** layer boundaries, legacy bans, raw-table/service-client bans,
  user-topic ownership, no content logging, tokens, and suppressions.

## Out of scope

- group conversations or participant tables;
- attachments, uploads, shared-file/photo galleries, link indexing, reactions,
  edits, deletes, forwarding, voice/video, or calendar actions;
- full-text message-body search;
- presence, online state, or last-seen tracking;
- archive, mute, pin, folders, bulk read, or message retention controls;
- public outcome-story cards or bilateral identity-sharing consent;
- complete People/Profile Connection send UI and deletion of every legacy
  friendship caller; that is the next domain port;
- native app or push-notification work;
- any remote Supabase reset, deploy, Railway service change, push, or merge.

## Completion definition

Messages is locally complete only when:

- the canonical root and thread routes implement the approved responsive
  workspace with no legacy fallback;
- list, Waiting, counts, filters, search, pagination, attention badge, and all
  empty/error states read fixed v2 projections;
- Connection request/response/retry races converge without expected database
  exceptions and the intro survives as one message;
- one owner-topic provider serves shell/Help/Messages/control invalidations;
- history, sends, reads, typing, receipts, reconnect, resolution, Connection
  nudge, report, block, and disconnect pass their durable browser roads;
- every database, concurrency, Realtime, performance, application, accessibility,
  and visual gate in the inventory is green;
- focused Messages TypeScript has zero errors and the global inventory has no
  unclassified Messages regression or suppression;
- documentation matches code and no dead specimen control is represented as
  implemented;
- the branch is clean at a local checkpoint commit, with `main` and every
  remote system untouched.

The full application is still not deployable after this slice while later v2
domains remain in the classified port inventory.
