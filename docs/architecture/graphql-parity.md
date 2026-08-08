# GraphQL parity harness — contract

How the GraphQL data plane ([ADR 0017](../decisions/0017-graphql-data-plane.md))
is migrated and proven: the **strangler-fig / parallel-run** pattern. Each
feature is duplicated as GraphQL beside the existing path; integration tests
prove equivalence; then the old path is deprecated.

This doc is the contract between the **implementation session** (builds the
graph) and the **test session** (builds the parity suite). It is stable — read
it before writing either side.

## Strategy

- **Feature = a `/lib` capability**, not a REST endpoint. The current data
  surface is RSC + Server Actions over `/lib` (plus 4 real routes), so there is
  no REST API to duplicate 1:1.
- **Vertical slices.** Each feature ships reads *and* mutations together.
- **Parity by construction.** GraphQL resolvers delegate to the *same* `/lib`
  functions the Server Actions call, so data matches by design. The tests guard
  the **shape** (camelCase, enum casing, nullability, pagination) and the
  **auth/RLS** behavior — not business logic (that stays in `/lib`, already
  tested).
- **Deprecation gate:** remove a legacy path only once its manifest entry is
  green **and** its last caller is migrated.

## What the test session diffs

Per the agreed decision, the harness does **GraphQL (HTTP) vs `/lib` imported
directly** — no throwaway REST facades. For each operation in the manifest:

1. Run the GraphQL `document` against `POST /api/graphql` with bearer auth.
2. Call the `/lib` `fn` directly per `argsNote`, with a client scoped to the
   **same user**.
3. Assert equivalence, accounting for `shapeNotes`.

The manifest is the machine-readable source of truth:

```ts
import { PARITY_MANIFEST } from '@/graphql/parity/manifest'
```

Location: [`app/src/graphql/parity/manifest.ts`](../../app/src/graphql/parity/manifest.ts).

## Auth — both sides as the same user

Parity is meaningless unless both sides run as the **same authenticated user**
under RLS. The protocol:

1. Sign a test user in via Supabase and take `session.access_token`.
2. **GraphQL side:** send `Authorization: Bearer <access_token>` to
   `/api/graphql`. `buildContext` builds a user-scoped client from the token
   (`db/server.createClientWithToken`) and validates it with
   `auth.getUser(token)`.
3. **`/lib` side:** build the client the same way and inject it:

   ```ts
   import { createClientWithToken } from '@/db/server'
   const db = createClientWithToken(accessToken)
   const expected = await getOpenAskForUser(db, { userId })
   ```

Both paths hit the same RLS boundary as the same identity. Never use the
service-role admin client on either side — it would bypass RLS and invalidate
the comparison.

## Reads vs mutations

- **Reads** are idempotent — diff directly.
- **Mutations** run against a seeded test user on the dev DB (or a transactional
  fixture) and compare the response **and** resulting state. Mind idempotency:
  e.g. `createOpenAsk` has a one-open-ask-per-member unique constraint, so a
  second create returns `ALREADY_OPEN`, not a new row.
- **GraphQL-only guards** (e.g. `NOT_AUTHENTICATED`, `NO_MEMBERSHIP`) have no
  `/lib` equivalent — the wrapper adds them. Test them separately (unauthenticated
  request; a member with no active org), not as a diff.

## Re-pointed onto v2

Main's v2 rebuild replaced the pre-v2 tables and `/lib` this migration first
targeted. The data-access layer the graph delegates to is now the typed
**`db/repositories/*`** functions over the `api`-schema RPCs (e.g.
`getMemberContext`, `createProfileRepository`), not direct table queries. Where
this doc says `/lib`, read "the v2 `db/repositories` function named in the
manifest."

## Migrated so far

| Feature | Operations | v2 delegate |
|---|---|---|
| members | `me` | `member-context` (`getMemberContext`) |
| people | `memberProfile` (via DataLoader), `peopleSearch` (bounded top-N, not a connection) | `people` |
| help (reads) | `helpHome`, `ask(id)`, `myAsksConnection` (true cursor connection reusing `lib/help/cursors`) | `help` |
| help (commands) | `createDirectAsk`, `createCircleAsk`, `respondToDirectAsk`, `retractAsk`, `resolveAsk`, `offerToHelp`, `decideOffer`, `saveHelperPreferences` — status enums verbatim (incl. capacity valves), required client idempotency keys | `help` |
| messages (reads) | `messagesCounts`, `conversationsConnection` (3-part composite cursor, codec in `lib/pagination/messages-cursor`), `conversation(id)`, nested `conversation.messagesConnection` (backward-only, numeric-id cursor) | `messages`, `conversations` |

The authoritative, always-current list is the manifest itself
(`app/src/graphql/parity/manifest.ts`) — a schema test guards it against drift.
This table is the human-readable summary; update it per slice.

## Known shape conventions

- Snake_case DB columns → camelCase GraphQL fields (the `/lib` functions already
  camelCase, so this is usually a no-op).
- `{ ok, error }` result unions → a payload type with a nullable node + a nullable
  error enum (uppercased: `invalid_question` → `INVALID_QUESTION`).
- Dates are ISO-8601 **strings** for now (literal equality with `/lib`); a shared
  `DateTime` scalar is a later hardening step.
