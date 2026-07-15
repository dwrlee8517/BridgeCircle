# Database v2 Help vertical-slice test inventory

- **Status:** approved — Milestone 1 red baselines recorded
- **Plan:** [Help vertical-slice implementation plan](database-v2-help-plan.md)
- **Starting checkpoint:** Conversation Primitive `4a07b47`
- **Rule:** a milestone cannot proceed while its owned verification is red

## Milestone 1 baseline — 2026-07-14

Environment: approved-plan checkpoint `3b9815b`; Node 22.22.2; pnpm 10.33.2;
Supabase CLI 2.109.1; PostgreSQL client 18.3. All checks were local-only.

| Gate | Baseline result | Planned missing contract |
|---|---|---|
| inherited database suite | green: 9 files, 315 assertions | none |
| new Help pgTAP | red: 33 of 42 assertions; 9 guards already green | Help storage, fixed APIs, grants, worker and Realtime contracts |
| Help focused compiler | green with no implementation modules yet | becomes meaningful as each owned module lands |
| Help static boundary | red | required v2 Help/outbox/provider/worker modules are absent |
| identical-create race | red: 7 failed callers, 1 row | payload-aware idempotent convergence |
| helper-capacity race | red: 0 failed callers, 2 waiting rows at limit 1 | shared helper-capacity lock |
| worker claim | red | allowed job-type filter on atomic outbox claim |
| Help Realtime | red | authorized IDs-only `help.changed` control event |
| Help query plans | red | fixed projection signatures and representative fixtures |

Harness syntax and local transaction cleanup are green. The failures above are
the required implementation gaps, not setup, parsing, connection, or cleanup
errors. The global compiler remains a port inventory (1,257 errors across 73
legacy files; 342 across 14 Help/search paths), not a milestone acceptance gate.

## Milestone 2 schema/API evidence — 2026-07-14

| Gate | Result |
|---|---|
| pgTAP | green: 10 files, 358 assertions; Help 42/42 |
| Foundation concurrency | green: invite, profile aggregate, disjoint outbox |
| Conversation concurrency | green: 7 scenarios, including stable accepted/already-decided offer race |
| Help concurrency | green: identical-key convergence and helper limit |
| worker claim | green: supported types claimed; unsupported types remain pending |
| Help Realtime | green: authorization, IDs-only delivery, dedupe, recovery, cleanup |
| query plans | green: owned-history/direct-feed indexes; bounded 2,000-row lexical pilot scan |
| database lint | green: no schema warnings |
| shadow diff | green: no drift in public/api/private |
| type generation | green twice; SHA-256 `2fb42b8f70dade7a870d99fe3d57d2ba9f3bf7c2c48b8181df27f3c4ada8659c` |
| focused regressions | Foundation, Conversation, Supabase boundaries, Conversation boundaries green |

The Help compiler remains an empty-boundary guard until Milestone 3. The Help
boundary check remains intentionally red only because its owned modules have
not been created yet. No remote system or secret value was touched.

## Milestone 3 repository/domain evidence — 2026-07-14

| Gate | Result |
|---|---|
| focused Help compiler | green: zero errors across Help domain, repository, Realtime, provider, and worker seams |
| focused Vitest | green: 4 files, 25 assertions |
| Help static boundary | green: fixed member APIs, no raw tables/service client, pure domain imports enforced |
| parser/privacy matrix | green: strict unknown-field rejection and anonymous identity leak rejection |
| Realtime adapter | green: private user topic, IDs-only strict payload, dedupe, reconnect refetch, one cleanup |
| inherited application checks | Foundation and Conversation focused compilers/boundaries green |
| inherited database suite | green: 10 files, 358 assertions |
| type generation | green twice; SHA-256 `ac7e01f6d623e18d134393e5327e4f21a594b58a3f5da89a1b98b311f0215ed0` |

The provider and worker files are dependency-injection contracts only at this
checkpoint. Provider fallback behavior, golden matching fixtures, profile
indexing, dispatch, retry, and graceful drain remain explicit red work for the
next two milestones. No remote system, provider, or secret value was touched.

## Test ownership

- pgTAP owns schema shape, constraints, grants, fixed API results, transaction
  effects, rollback, RLS/authorization, anonymity, and service/member roles.
- multi-session shell harnesses own advisory/row lock order and race outcomes.
- worker integration tests own claim/retry/crash recovery and external-effect
  idempotency with fake providers.
- Realtime integration owns private-topic authorization, transactional delivery,
  revocation, reconnect, and cleanup.
- Vitest owns parsers, domain-result mapping, ranking, fallback orchestration,
  provider boundaries, worker dispatch, and client adapters.
- Playwright owns the rendered member loop, accessibility behavior, system
  states, responsive layouts, and the database result visible after a refresh.
- static checks own layer boundaries, legacy identifier bans, PII/log bans,
  raw-table bans, service-client bans, token use, and TypeScript suppressions.
- query-plan harnesses own representative planner evidence; indexes are not
  accepted from intuition alone.

## Database contract matrix

| Invariant | Primary proof |
|---|---|
| direct/circle CHECK and immutable published fields remain intact | existing `002` + new Help pgTAP |
| one active cap covers waiting/open/accepted and frees only on terminal end | Help pgTAP + concurrency |
| sixth simultaneous create never commits | concurrency |
| helper pending limit cannot be exceeded by parallel direct creates | concurrency |
| identical create key/payload returns one Ask | pgTAP + concurrency |
| reused create key/different payload returns `idempotency_conflict` | pgTAP |
| identical offer request returns one offer/event/job | pgTAP + concurrency |
| same helper cannot create two offers for one Ask | pgTAP |
| two offer accepts yield one winner/conversation without deadlock | existing Conversation + Help concurrency |
| direct accept/decline race yields one terminal decision | concurrency |
| retract/accept, expire/accept, block/accept races serialize safely | concurrency |
| expected lifecycle states return result rows, not constraint errors | pgTAP |
| either accepted participant can resolve exactly once | pgTAP + concurrency |
| resolve adds one system line and conversation remains sendable | pgTAP + Conversation regression |
| day 14 ignores accepted Asks | pgTAP + maintenance harness |
| direct day-5 reminder is emitted once | maintenance harness |
| direct timeout increments once; response resets; third timeout pauses | pgTAP + maintenance harness |
| explicit reactivation clears only allowed pause state | pgTAP |
| topics normalize, dedupe, preserve order, and cap at five | Foundation regression + Help pgTAP |
| Ask/offer/match/event/outbox raw access is denied | pgTAP + static check |
| all member API functions are authenticated-only | pgTAP |
| service worker APIs are service-role-only | pgTAP |
| query limits clamp and invalid cursor pairs are rejected | pgTAP |
| `(created_at,id)` pages have no gap or duplicate at timestamp ties | pgTAP |
| block uses `private.is_blocked` and removes every affected Help access | pgTAP |
| report target validation works for Ask and offer | pgTAP |

## Projection and anonymity matrix

Test each fixed projection as:

- Ask owner;
- direct recipient;
- matched helper;
- organization member viewing a public Ask;
- pending-offer helper;
- accepted helper;
- same-org outsider;
- blocked party in either direction;
- other-organization member;
- inactive/deleted member;
- anonymous role.

Required assertions:

- direct search is owner-only, creates no Ask/match/event/notification, and
  exposes only profile fields visible to that caller;
- anonymous circle author ID/name/avatar/profile URL are absent until that
  specific helper's offer is accepted;
- class year remains visible with the exact anonymity warning contract;
- match reason for anonymous Asks contains no asker profile fact;
- an offer helper sees only their own offer state/note unless accepted;
- the Ask owner sees all offers but helpers never see competing offer notes;
- decline notes are visible only to their intended sender/recipient roles;
- unrelated permission denial and missing ID have indistinguishable public
  result shapes;
- history is owner-only;
- private matched Ask is absent without a match row and public Ask remains
  same-org only;
- blocked rows are absent even when an old match row still exists;
- JSON projections contain no undocumented keys or raw membership IDs that the
  screen does not need.

## Concurrency matrix

Every harness uses explicit transaction barriers and statement timeouts—not
sleep-only timing.

| Race | Required outcome |
|---|---|
| 20 identical direct creates | one Ask/event/notification job; all callers receive same ID |
| 6 distinct creates for one asker at four existing active rows | one new Ask; five `active_limit_reached` |
| 20 direct creates at helper limit minus one | one new Ask; rest `helper_limit_reached` |
| direct create vs helper closing availability | one serial truth; no request to a closed helper |
| accept vs decline direct | one decision; loser gets `already_decided` |
| accept direct vs day-14 sweep | accepted or closed, never both/inconsistent |
| accept offer A vs offer B | one accepted offer/Ask conversation |
| accept offer vs retract | one accepted or retracted Ask; no orphan conversation |
| accept offer vs block | one fully committed pre-block accept followed by close/revoke, or no accept |
| two identical offers | one offer/event/job |
| resolve from both participants | one transition/system line; both receive resolved result |
| two maintenance workers | disjoint reminders/expiries; exact counters |
| match apply vs retract | no durable matches/notifications on retracted Ask |
| topic saves vs preference toggle | coherent final row/topics; no partial delete |

The harness fails on timeout, deadlock, uncaught unique violation, duplicate
side effect, wrong result code, or leaked transaction.

## Matching and AI matrix

### Retrieval/ranking fixtures

- exact helper topic wins lexical evidence;
- narrative career-transition Ask finds semantically relevant history without
  exact wording;
- explicit school/employer/title constraints remain strong;
- open/unpaused, self, block, organization, visibility, and helper-load gates
  remove candidates before reranking;
- deterministic tie order is stable;
- top 20–40 only are sent to the reranker;
- result count is 5–10 and low-evidence results are not padded;
- user-facing reasons cite raw visible evidence only;
- synthetic passages can retrieve but never appear as evidence;
- model/prompt/content version changes invalidate/rebuild the expected chunks;
- direct search and circle matching use the same deterministic scoring core;
- circle match commit rechecks eligibility after provider latency;
- repeated match jobs converge on one ranked set and one notification per
  ask/helper.

### Fallback fixtures

- Voyage embedding timeout -> structured + lexical;
- vector RPC failure -> structured + lexical;
- semantic passage unavailable -> raw chunks;
- reranker timeout/invalid output -> merged deterministic score;
- Haiku unavailable/invalid JSON -> templated reason/default copy;
- all external providers absent in `dev_local` -> complete deterministic user
  flow with honest copy;
- weak/no pool -> honest empty + Ask the circle, no fabricated people;
- stale browser search response is ignored;
- AI cost window exhausted -> retry state, no provider call;
- malicious prompt text cannot add fields, execute tools, auto-submit, or make
  unsupported factual claims.

### Privacy/log assertions

- test logger/Sentry sinks never receive question, draft, decline note, profile
  passage, email address, or provider response;
- direct search writes no query/search history row;
- outbox and notification payloads contain IDs/event codes only;
- anonymous worker prompts and match evidence exclude author profile fields;
- generated explanations are checked against supplied raw evidence IDs.

## Outbox and worker matrix

| Scenario | Required proof |
|---|---|
| two worker replicas claim one queue | disjoint supported jobs via `SKIP LOCKED` |
| unsupported deletion/storage jobs exist | Help worker does not claim or fail them |
| handler succeeds | complete with one durable side effect |
| process crashes after notification insert | retry observes dedupe and completes without duplicate |
| process loses Resend response then retries | same stable provider idempotency key |
| retryable provider error | bounded future availability and sanitized error |
| attempts exhausted/nonretryable schema error | terminal failed + Sentry alert; later jobs continue |
| stale processing lock | safely reclaimed once |
| malformed payload | terminal validation failure with no raw payload log |
| disabled in-app preference | no bell row; email decision still follows email preference |
| disabled email preference | no email job |
| self-notification | skipped where contract requires |
| duplicate materialization call | one notification and one email job |
| graceful `SIGTERM` | stop claiming, finish/return in-flight work, exit cleanly |
| zero jobs | idle backoff; no hot loop |
| old pending queue after downtime | catches up in key order without dropping jobs |
| non-prod email recipient | central guard redirects unless exact allowlist/sink rule permits |

Fake provider adapters own deterministic worker tests. One optional
`dev_local_live` smoke may exercise real providers only when explicitly run;
it is never a CI requirement and never sends an unguarded email.

## Realtime integration matrix

| Scenario | Required proof |
|---|---|
| signed-in user joins own `user:<uuid>` | subscribed after `setAuth()` |
| outsider joins another user topic | denied/channel error |
| Ask/offer transaction commits | one IDs-only `help.changed` to each entitled user |
| transaction rolls back | no event |
| idempotent command retry | no duplicate event |
| offer accepted/declined | helper and owner refetch correct projection |
| match job commits | newly matched helper invalidates; no author identity in event |
| retract/expiry/block | stale page refetches to terminal/denied state |
| event deliberately missed | subscribe/reconnect refetch recovers durable state |
| malformed/unknown event | ignored and safely reported |
| channel error | durable UI remains usable and reports nonfatal state |
| navigation/unmount | channel removed exactly once; no listener leak |

No Realtime test asserts state from event content. It always proves the durable
row through the authenticated fixed API after delivery.

## Repository, domain, and client matrix

- exact parsers accept every documented nullable field and reject additions or
  malformed unions where strictness is required;
- unknown result codes fail loudly as contract drift;
- expected codes map to exhaustive domain unions;
- idempotency UUID remains stable across a client retry and rotates only for a
  new intent;
- cursor encode/decode preserves timestamp + UUID and rejects partial cursors;
- matching orchestration calls providers only after hard-gated retrieval;
- assist output remains editable and never calls a command automatically;
- draft session TTL/version/membership isolation and success clearing work;
- mode cookie precedence is explicit query -> valid cookie -> Get default;
- Give search cancels/ignores stale calls;
- Realtime adapter dedupes event IDs and refetches on reconnect/focus;
- all mutation buttons prevent accidental double-submit while keeping the same
  server idempotency key on retry;
- stale helper/offer results preserve the question/note and show recovery;
- no `/lib` domain imports framework/infrastructure;
- no repository uses a raw Help/private table or service client;
- worker service repository is unreachable from member route bundles.

## Browser/E2E matrix

Each mutating spec creates a fully isolated organization/scenario and destroys
it afterward so it can run locally and against the persistent dev stage.

### Direct road

1. sign in -> `/help` defaults Get -> write question -> Find people;
2. only evidence-backed helpers appear; asker changes/filters the question;
3. choose helper -> question carries to AI composer;
4. provider-off/plain `?skip=1` path remains complete;
5. double submit produces one waiting Ask and status route;
6. recipient sees priority direct row/Waiting-on-you echo;
7. recipient accepts with opening message -> Messages conversation;
8. refresh proves origin + opening message once;
9. either side resolves with/without outcome and conversation still sends.

### Direct decline/timeout road

- recipient uses each default/custom/AI-assisted decline path;
- empty bare decline is impossible;
- asker receives generic notification and sees exact cushioned note on status;
- decline frees the slot and recovery preserves question;
- day-5 reminder appears once; day-14 item vanishes for recipient and owner gets
  terminal status;
- three unanswered direct timeouts pause helper; one response resets; explicit
  reactivation works.

### Circle road

- shape question with and without AI;
- publish matched/private anonymous and organization/public variants;
- matched helper sees `A member · Class of …`, Ask-derived evidence, and no
  identity;
- public same-org member can search; outsider/private-unmatched member cannot;
- helper offers with default/custom/AI note;
- asker declines one offer with a note while Ask remains open;
- asker accepts another; remaining offers get no-fault closure;
- accepted helper alone sees the revealed profile and resulting conversation;
- retry/reload produces no duplicate offer, conversation, messages, or notices.

### Cross-cutting road

- five active Asks allow no sixth; decline/retract/resolve/close frees one slot;
- history keyset pagination remains complete at tied timestamps;
- last-three-days copy appears only for unanswered Asks in the final three days;
  no running countdown or accepted-thread expiry warning appears;
- retract removes recipient/match/offer surfaces quietly;
- block/report produces the safe terminal/not-found state and no identity leak;
- notification deep links land on new Help/Message routes;
- provider/database/Realtime offline states keep retry/plain-form paths usable;
- no browser console errors, uncaught exceptions, hydration mismatch, duplicate
  React keys, or failed network request left unexplained.

## Design, accessibility, and responsive matrix

Compare production at 1440px, 1024px, 768px, and 320–390px against:

- `Help.dc.html` Get edit/search/result/empty and Give on/off/search/direct states;
- `AskCompose.dc.html` AI and plain variants;
- `AskCircle.dc.html` shaping/reach/anonymity/result states;
- `AskHistory.dc.html` mixed status/history states;
- `AskStatus.dc.html` direct/circle/warning/terminal states;
- `GiveDirect.dc.html` accept/decline states;
- `GiveOffer.dc.html` default/custom/AI offer states.

Acceptance:

- correct wash identity, toggle geometry, type scale, card hierarchy, evidence
  lines, status tints, spacing, and responsive order from tokens;
- no horizontal scroll or clipped action at 320px;
- logical heading landmarks and form labels;
- keyboard-only completion of every command and dialog;
- visible `:focus-visible`, focus trap/return, Escape behavior, and no focus loss
  after a result refresh;
- `aria-live` for search/results/inline completion but no repeated screen-reader
  spam from countdowns or Realtime;
- reduced motion removes nonessential transitions;
- color contrast and non-color status cues pass automated and manual checks;
- loading skeletons preserve layout; denied/offline/empty states use the final
  system-state language.

## Query-plan gates

Use rolled-back synthetic fixtures at pilot-plus scale (at least 5,000 members,
20,000 Asks, 40,000 offers, 50,000 notifications/outbox rows, and realistic
embedding chunks) after `ANALYZE`.

Capture plans for:

- active asker count and helper pending count under lock;
- exact create/offer idempotency lookup;
- Ask detail authorization for each role;
- 50-row deep owner history cursor;
- direct, suggested, and search Give arms;
- matched-private and organization-public Ask eligibility;
- structured/lexical candidate retrieval;
- exact vector top-80 retrieval and any candidate vector index comparison;
- supported-type outbox claim and stale-lock recovery;
- day-5 reminder and day-14 expiry claims;
- notification recipient/unread query;
- user-topic authorization.

Preferred plans use PK, unique, partial, composite, GIN, or evidence-backed
vector scans. A sequential scan is acceptable only for a deliberately tiny
bounded table and must be recorded. No index is added without a query that uses
it, and redundant indexes are removed only after write/read tradeoff evidence.

## Required local gates

Database and stateful gates run serially:

```bash
supabase db reset --local
supabase test db --local
bash scripts/test-foundation-concurrency.sh
bash scripts/test-conversation-concurrency.sh
bash scripts/test-help-concurrency.sh
bash scripts/test-help-worker.sh
bash scripts/test-help-realtime.sh
bash scripts/test-help-query-plans.sh
supabase db lint --local --level warning --fail-on warning
supabase db diff --local --schema public,api,private
```

Application/static gates:

```bash
pnpm db:types:local
pnpm typecheck:v2-foundation
pnpm typecheck:v2-conversations
pnpm typecheck:v2-help
pnpm vitest run src/db/repositories/help.test.ts src/db/realtime/help-channel.test.ts src/lib/help src/lib/outbox src/workers/outbox
pnpm check:supabase-boundaries
pnpm check:conversation-boundaries
pnpm check:help-boundaries
pnpm check:tokens
pnpm biome check .
pnpm lint
pnpm vitest run --passWithNoTests
```

Generate types a second time and compare byte-for-byte. Then run:

```bash
pnpm test:e2e tests/e2e/help
pnpm test:e2e tests/e2e/asks
```

The old `tests/e2e/asks` suite is either ported to the new route contract or
deleted only after equivalent Help coverage is green; it must not remain a
passing test of retired behavior.

Record, but do not mislabel as a green domain gate, the global port inventory:

```bash
pnpm exec tsc --noEmit --pretty false
```

Help-owned errors must be zero and the total must not gain unexplained errors.
`pnpm build` becomes mandatory only at the all-domain v2 integration gate,
because later legacy domains still reference the retired schema at this
checkpoint. A Help slice is never remotely deployed before that global compiler
and build are green.

## Remote/dev/prod gates (separate approval)

No item below is executed as part of local implementation:

- first require every v2 domain port plus green global TypeScript and
  `pnpm build`; the Help checkpoint alone is not deployable;
- snapshot both remote databases before the approved reset;
- reset/migrate/seed remote dev first;
- create Railway dev/prod worker services from the same commit and Doppler
  configs, with the worker start command and no web healthcheck assumption;
- deploy dev schema -> worker -> web in the documented compatible order;
- verify queue drain, oldest-pending age, match generation, private Realtime,
  guarded email, direct/circle browser loops, and Sentry;
- run the full deployed integ suite;
- obtain the manual production gate;
- repeat snapshot/reset/migrate/worker/web verification for production;
- run Supabase security/performance advisors and record every finding.

Rollback requires the pre-reset snapshot plus a matched application/worker
checkpoint. Mixing v2 code with the legacy schema—or legacy code with v2—is not
an accepted rollback.

## Completion evidence to record

At completion, replace this draft section with exact:

- pgTAP files/assertion counts and Foundation/Conversation regressions;
- concurrency scenario counts and maximum observed duration;
- worker retry/idempotency scenarios and supported job types;
- Realtime authorization/delivery/reconnect outcomes;
- matching fixture count, provider/fallback paths, and privacy review result;
- focused/global TypeScript error counts and owned-error classification;
- Vitest files/assertions and E2E scenarios/viewports;
- query-plan index names and fixture sizes;
- database lint/diff and repeatable type-generation hashes;
- design/accessibility review evidence;
- confirmation that no remote project, deploy, push, merge, or secret value was
  touched during local implementation.
