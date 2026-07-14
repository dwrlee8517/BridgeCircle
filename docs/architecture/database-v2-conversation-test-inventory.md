# Database v2 Conversation Primitive test inventory

- **Status:** approved — implementation pending; expected assertions begin red
- **Plan:** [Conversation Primitive implementation plan](database-v2-conversation-plan.md)
- **Baseline:** Foundation has 209 passing pgTAP assertions, 22 focused Vitest
  assertions, four Foundation Playwright scenarios, and zero focused
  TypeScript errors

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
| one direct conversation per unordered pair | `002_help_and_conversation_invariants.test.sql` + `009_conversation_primitive.test.sql` |
| multiple Ask conversations for the same pair | `002_help_and_conversation_invariants.test.sql` |
| direct/Ask origin shape and participant correctness | `009_conversation_primitive.test.sql` |
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
| participant joins private topic | `SUBSCRIBED` after authenticated `setAuth()` |
| outsider joins private topic | denied/channel error without data |
| blocked participant opens a new topic | denied |
| new message commits | one minimal `message.created` event with IDs only |
| transaction rolls back | no event |
| duplicate nonce retries | no duplicate event |
| read cursor advances | one `read.advanced`; unchanged retry emits none |
| disconnect while channel open | `permissions_changed`; durable send then denies |
| block while channel open | `revoked`; subsequent send and new join deny |
| typing call | authorized minimal event; repeated call throttles |
| typing stop is lost | local expiry clears state |
| one Broadcast deliberately ignored | after-cursor fetch recovers the durable row |
| channel unmount/navigation | one remove call; no channel leak |

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

Run targeted `EXPLAIN (ANALYZE, BUFFERS)` in a rolled-back synthetic fixture
after `ANALYZE`:

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

## Completion evidence to record

- exact pgTAP and Vitest assertion counts;
- exact focused and global TypeScript counts;
- concurrency session outcomes and timeout values;
- Realtime client/library/CLI versions and scenario results;
- query plans or summarized node/index names;
- lint and schema-diff output;
- deterministic generated-type hash;
- staged file inventory and secret scan;
- final commit SHA;
- explicit statement that no remote project, push, or merge was touched.
