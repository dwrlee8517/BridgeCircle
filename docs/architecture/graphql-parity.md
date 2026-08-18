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

## Status: implemented (2026-08-17)

The harness lives at **`app/tests/integration/graphql/`** and runs in the
integration tier (`pnpm test:int`). Until it landed, the manifest was checked
only by `app/src/graphql/schema.test.ts`, which asserts that each entry's root
field *exists* in the schema — a name-existence guard that a resolver returning
garbage would pass. Read that history before trusting an old green build: no
authenticated GraphQL request had executed against a database at all.

| File | What it does |
|---|---|
| `harness/parityRunner.ts` | The two sides, bound to one identity |
| `harness/world.ts` | The fixture, built through real APIs only |
| `harness/parityCases.ts` | `argsNote`/`shapeNotes` made executable, plus `PARITY_PENDING` |
| `parity.int.test.ts` | The diff, plus the manifest-coverage guard |
| `authBoundary.int.test.ts` | HTTP + bearer, and unauthenticated behavior |

A second tier covers what in-process execution structurally cannot:
**`app/tests/e2e/api/graphql-endpoint.spec.ts`** drives `/api/graphql` over
real HTTP against a running server (`pnpm test:e2e`). It exists because the
integration suite calls the route handler directly and therefore skips
middleware — and middleware was silently breaking the endpoint. See "The proxy
gate" below.

**One deviation from the protocol below: the diff runs in-process, not over
HTTP.** The integration tier exists so that importing and calling the real
functions lets v8 record their coverage; firing HTTP at a dev server would
instrument nothing (`app/tests/integration/README.md`). In-process is also the
path the cutover actually takes — Server Components read through
`executeGraphQL`, not by self-calling the route. The HTTP + bearer contract is
covered separately in `authBoundary.int.test.ts`, asserting it resolves the
same member the in-process path does, so the external contract stays honest.

## What the test session diffs

Per the agreed decision, the harness does **GraphQL vs `/lib` imported
directly** — no throwaway REST facades. For each operation in the manifest:

1. Run the GraphQL `document` (in-process; see the deviation above).
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

## The proxy gate (fixed 2026-08-17)

`src/proxy.ts` bounces any unauthenticated request that is not a public prefix
to `/sign-in`, and its matcher excludes only `api/health`. `/api/graphql` was
not on `PUBLIC_PREFIXES`, so over real HTTP:

- anonymous requests got `307 → /sign-in?next=%2Fapi%2Fgraphql`, never reaching
  a resolver;
- **bearer requests got the same treatment** — the proxy reads cookies only, so
  a token-bearing caller looks anonymous to it.

That made the bearer contract this document specifies, and that
`createClientWithToken` exists to serve, unusable end to end. Only
cookie-bearing browser requests worked. Nothing caught it: the in-process
suites bypass middleware, and no UI consumes the graph yet.

The fix adds `/api/graphql` to `PUBLIC_PREFIXES` — not to the matcher
exclusion, so browser callers keep their session-cookie refresh. It is safe
because the endpoint authenticates itself (anonymous reads resolve to null,
commands return `NOT_AVAILABLE`) and RLS is enforced by the user-scoped client,
so the redirect was adding no protection while removing capability. The e2e
spec pins all of it, including two guards that the exemption stays narrow.

The general lesson for the cutover: **an in-process green build says nothing
about the endpoint's reachability.** Anything that changes middleware, routing,
or headers needs the e2e tier.

## Two guards that keep the harness honest

Both exist because a parity suite fails quietly in ways an ordinary suite does
not — it can be green while proving nothing.

- **Coverage.** Every manifest operation must have an executable case *or* an
  entry in `PARITY_PENDING` with a written reason. A new slice cannot land
  without saying what its parity story is, and a stale name in either map fails
  too. `PARITY_PENDING` is the honest edge: anything listed there is covered by
  the schema-shape guard and by nothing else.
- **Anti-vacuity.** An empty result compares equal to an empty result. Each
  case must produce something, or declare `allowEmpty` with the reason
  emptiness is the correct answer. Without this, a case passes on a world where
  the feature has no data — which is how most of the reads looked before the
  fixture grew an announcement, a connection, and materialized notifications.

## Known shape conventions

- Snake_case DB columns → camelCase GraphQL fields (the `/lib` functions already
  camelCase, so this is usually a no-op).
- `{ ok, error }` result unions → a payload type with a nullable node + a nullable
  error enum (uppercased: `invalid_question` → `INVALID_QUESTION`).
- Dates are ISO-8601 **strings** for now (literal equality with `/lib`); a shared
  `DateTime` scalar is a later hardening step.
