# Database v2 Conversation Primitive test inventory

- **Status:** complete locally on 2026-07-14; not deployed
- **Plan:** [Conversation Primitive implementation plan](database-v2-conversation-plan.md)
- **Baseline:** Foundation has 210 passing pgTAP assertions, 22 focused Vitest
  assertions, four Foundation Playwright scenarios, and zero focused
  TypeScript errors
- **Conversation red baseline:** 29 of 30 focused pgTAP assertions fail for
  planned changes; the forced nonce race raises 19 of 20 callers; an authorized
  private Realtime join returns `CHANNEL_ERROR`
- **Completed checkpoint:** all 105 focused pgTAP assertions, the full
  concurrency contract, the expanded Realtime integration matrix, and five
  strict channel-adapter tests pass. The complete Conversation application
  slice has 20 passing Vitest assertions and zero focused TypeScript errors.

## Ownership rules

- pgTAP owns schema shapes, constraints, grants, RLS, API results, trigger
  effects, and transaction rollback.
- multi-session shell harnesses own lock ordering and concurrency outcomes.
- the Realtime integration harness owns private-channel authorization,
  delivery, revocation, reconnect, and cleanup.
- Vitest owns parsing, domain-result mapping, gap pagination orchestration, and
  channel-adapter behavior.
- Playwright owns rendered Messages behavior later; this primitive adds no
  temporary UI merely to obtain browser coverage.
- static checks own schema exposure, legacy identifier bans, service-client
  bans, and focused compiler boundaries.

## Database contract matrix

| Invariant | Primary owner |
|---|---|
| one conversation per unordered pair, across every origin | `001_schema_contract.test.sql` + `002_help_and_conversation_invariants.test.sql` + `009_conversation_primitive.test.sql` |
| multiple Asks for the same pair reuse one room | `002_help_and_conversation_invariants.test.sql` + `009_conversation_primitive.test.sql` |
| Ask-to-room participant correctness | `002_help_and_conversation_invariants.test.sql` + `009_conversation_primitive.test.sql` |
| user/system message shape is mutually exclusive | `009_conversation_primitive.test.sql` |
| system event key is unique per conversation | `009_conversation_primitive.test.sql` |
| system actor FK is indexed and nulls on account deletion | `003_rls_and_account_deletion.test.sql`, `009_conversation_primitive.test.sql` |
| read-cursor delete action nulls only the cursor | `009_conversation_primitive.test.sql` |
| raw conversation/message/read SELECT is denied | `009_conversation_primitive.test.sql` |
| fixed API functions are authenticated-only | `009_conversation_primitive.test.sql` |
| anon, outsider, blocked, inactive personas receive no detail/history | `009_conversation_primitive.test.sql` |
| disconnected participant retains direct history but cannot send | `009_conversation_primitive.test.sql` |
| resolved Ask participants retain history and may send | `009_conversation_primitive.test.sql` |
| counterpart identity is bounded and deleted user is a tombstone | `009_conversation_primitive.test.sql` |
| before/after page limits clamp to 1–100 | `009_conversation_primitive.test.sql` |
| keyset pages have no duplicate or missing fixture IDs | `009_conversation_primitive.test.sql` |
| duplicate user nonce returns one durable message | pgTAP + parallel nonce harness |
| duplicate system key returns one durable origin line | `009_conversation_primitive.test.sql` |
| a duplicate send creates no second outbox job | pgTAP + parallel nonce harness |
| send rolls back message/outbox together on invariant failure | `009_conversation_primitive.test.sql` |
| read cursor advances monotonically and lower retry is write-free | pgTAP + parallel read harness |
| notification payload contains IDs and no body | `009_conversation_primitive.test.sql` |
| typing state stores no content and throttles | `009_conversation_primitive.test.sql` |
| malformed Realtime topic returns false without raising | `009_conversation_primitive.test.sql` |
| `private` and `realtime` omitted from generated/Data API schemas | boundary script |
| messages absent from Postgres Changes publication | `009_conversation_primitive.test.sql` |
| notifications publication behavior remains unchanged | Foundation regression + `009_conversation_primitive.test.sql` |

## Concurrency matrix

| Race | Required outcome |
|---|---|
| 20 direct get/create calls | one conversation ID and one origin event |
| 20 sends with one nonce | one message, one outbox job, one database Broadcast |
| two different sends in one conversation | deterministic serialized IDs; both commit |
| block locks pair before send | send waits, then returns `not_available`; no message |
| send locks pair before block | one send commits, then block commits and later sends fail |
| disconnect locks pair before direct send | send waits, then returns `connection_required` |
| direct send locks pair before disconnect | one send commits, then conversation becomes read-only |
| high cursor races low cursor | final cursor is high; low retry is unchanged |
| two offer accepts | one offer/conversation wins without deadlock |
| Connection-accept retry | same connection/conversation, one origin event |

Harnesses must use explicit transaction barriers rather than timing-only
sleep assumptions. Every session gets a timeout so a deadlock or lock leak
fails quickly and diagnostically.

## Realtime integration matrix

| Scenario | Required proof |
|---|---|
| participant joins conversation and own control topics | both `SUBSCRIBED` after authenticated `setAuth()` |
| outsider joins a conversation or another member's control topic | denied/channel error without data |
| blocked participant opens the conversation topic | denied; own control topic remains owner-only and available |
| new message commits | one minimal `message.created` event with IDs only |
| transaction rolls back | no event |
| duplicate nonce retries | no duplicate event |
| read cursor advances | one `read.advanced`; unchanged retry emits none |
| disconnect while control topic open | `permissions_changed`; durable send then denies |
| block while control topic open | `revoked`; subsequent send and conversation join deny |
| typing call | authorized minimal event; repeated call throttles |
| typing stop is lost | local expiry clears state |
| one Broadcast deliberately ignored | after-cursor fetch recovers the durable row |
| channel unmount/navigation | both channels removed once; no channel leak |

Realtime is never tested by trusting the event's message content because the
approved payload contains no content. The harness always proves the durable
row through the authenticated API afterward.

## Application/unit matrix

| Invariant | Owner |
|---|---|
| detail row parses exact nullable fields | `src/db/repositories/conversations.test.ts` |
| user/system message projections parse exact shapes | repository test |
| unknown result code throws contract error | repository test |
| expected result codes map to domain unions | repository + `/lib` tests |
| before page reverses for chronological render | `src/lib/conversations/listMessages.test.ts` |
| after-page loop drains more than 100 missed rows | `/lib` test |
| duplicate row/event IDs dedupe in adapter | channel-adapter test |
| malformed event payload is ignored and reported safely | channel-adapter test |
| permission/revocation event invokes teardown/refetch callback | channel-adapter test |
| typing expiry and throttled result remain non-fatal | `/lib` + adapter test |
| no `/lib` file imports Next.js or Supabase | static boundary check |
| no new module names legacy thread tables/columns | static boundary check |

## Performance/query gates

Run targeted `EXPLAIN (COSTS OFF)` in a rolled-back synthetic fixture after
`ANALYZE`:

- one participant/conversation authorization lookup;
- one malformed/valid Realtime topic authorization lookup;
- 50 older messages from a deep cursor;
- 100 after-cursor gap messages;
- one nonce conflict lookup;
- one monotonic read-cursor UPSERT;
- one canonical direct-pair lookup.

Accepted plans use PK, unique, partial, or composite index scans. A sequential
scan is acceptable only for a deliberately tiny private table and must be
recorded; no index is added speculatively without a real query.

## Required local gates

Run database operations serially:

```bash
supabase db reset --local
supabase test db --local
bash scripts/test-conversation-concurrency.sh
bash scripts/test-conversation-realtime.sh
pnpm test:db:conversation-query-plans
supabase db lint --local --level warning --fail-on warning
supabase db diff --local --schema public,api,private
```

Then run application/static gates:

```bash
pnpm db:types:local
pnpm typecheck:v2-foundation
pnpm typecheck:v2-conversations
pnpm exec vitest run src/db/repositories/conversations.test.ts src/db/realtime src/lib/conversations
pnpm check:supabase-boundaries
pnpm check:conversation-boundaries
```

Generate types a second time and compare them byte-for-byte. Run the global
TypeScript inventory only after both focused slices pass. Hosted Supabase
advisors and Realtime product reports remain remote-cutover gates and require
separate approval.

## Completion evidence

- clean seeded reset rebuilt the single baseline; all 315 pgTAP assertions
  across nine files passed (210 Foundation + 105 Conversation);
- Foundation Vitest passed 22 assertions across nine files; Conversation
  Vitest passed 20 assertions across four files;
- both focused TypeScript gates passed with zero errors; the global inventory
  remains the classified 1,257 errors across 98 legacy files and contains no
  Conversation-slice error;
- Foundation and Conversation concurrency harnesses passed every invite,
  profile, outbox, pair-lock, nonce, block/send, disconnect/send,
  offer-accept, and monotonic-read scenario without timeout or deadlock;
- private Realtime authorization, delivery, rollback silence, duplicate
  silence, reconnect gap recovery, typing throttle/expiry, read receipts,
  permission changes, revocation, and cleanup passed locally;
- the integration runtime used Supabase CLI `2.109.1` and
  `@supabase/supabase-js` `2.104.1` on Node `22.22.2`;
- a rollback-only fixture with 5,000 direct conversations and 40,200 messages
  selected the conversation/user primary keys, direct-pair partial unique
  index, message keyset unique index, nonce partial unique index, and read
  cursor primary key; both valid and malformed topic checks remain bounded
  function result nodes;
- warning-level database lint reported no schema errors and the shadow schema
  diff was empty;
- two local type generations were byte-identical at SHA-256
  `4bc3f0ad1cec32342051361645198523d5c704ace6b4d4a1a9e24a2b59dac989`,
  with no generated `private` or `realtime` schema;
- Supabase and Conversation static boundary checks passed, including their
  deliberate violation self-tests;
- no remote project, push, merge, deployment, or remote database command was
  used. The local checkpoint commit SHA is reported in the task handoff.
