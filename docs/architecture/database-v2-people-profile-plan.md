# Database v2 People/Profile vertical-slice implementation plan

- **Status:** approved and in progress; local-only; not deployed
- **Prepared:** 2026-07-15
- **Approved:** 2026-07-15 — the user explicitly asked to make the plan and
  begin building from it in the same task
- **Branch:** `codex/redesign-v2`
- **Starting checkpoint:** completed Messages slice `c9a1b77`
- **Depends on:** completed Foundation, Conversation Primitive, Help, and
  Messages vertical slices
- **Contract:** [Database v2 contract](database-v2-contract.md)
- **Behavior:** [`FLOWS.md` §§4, 7, 7b, 7c, and 8](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md)
- **UI sources:** [People](../experience/ui/design-system/handoff/bridgecircle/project/templates/people/People.dc.html),
  [profile preview](../experience/ui/design-system/handoff/bridgecircle/project/templates/profile-slideover/ProfileSlideOver.dc.html),
  [member profile](../experience/ui/design-system/handoff/bridgecircle/project/templates/profile/Profile.dc.html),
  and [self profile](../experience/ui/design-system/handoff/bridgecircle/project/templates/profile-self/ProfileSelf.dc.html)
- **Test inventory:** [People/Profile vertical-slice test inventory](database-v2-people-profile-test-inventory.md)

## Goal

Ship People and Profile as one privacy-safe relationship-discovery slice. A
member can browse their selected organization, search in ordinary language or
with explicit filters, understand why a person is relevant, inspect a concise
preview without losing their place, open the same canonical full profile from
any member surface, ask for help, connect, message, report, block, disconnect,
and maintain their own profile in place.

The slice is complete only when the database shapes every result for the
current viewer. Hiding data in React is not privacy. Search, previews, full
profiles, contact links, explanations, embeddings, relationship actions, and
errors must all apply the same selected-organization, active-membership,
visibility, Connection, and block rules before data leaves Postgres.

“Efficient and robust” means:

- one bounded database projection returns at most the 50 strongest directory
  rows; the UI does not issue one query per person;
- structured and semantic search share one result contract and one privacy
  definition;
- the 20/20/10 desktop pages and 20/40/50 mobile load-more states are local
  views over the same intentionally bounded result set, not OFFSET queries;
- a row fetches profile depth only after an intentional preview/full-profile
  action;
- every write has a fixed API, SQL validation, owner/participant authorization,
  stable expected results, audit/index invalidation, and a calm error mapping;
- external AI calls are optional enhancements with timeouts and deterministic
  lexical/structured fallback;
- the application never uses a service client, a private table, or raw profile,
  Connection, block, report, or embedding table from a member path;
- the old `base_profiles`, friendship, raw-search, edit-page, and enrichment
  compatibility paths are deleted rather than wrapped;
- every milestone stops on a red owned gate.

## Canonical sources and resolved decisions

Use this order when sources disagree:

1. [ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md) and the approved
   [database v2 contract](database-v2-contract.md);
2. `FLOWS.md` People, Profile, navigation, safety, and cross-cutting rules;
3. [ADR 0011](../decisions/0011-two-verbs-one-inbox.md), then the still-relevant
   People portion of [ADR 0006](../decisions/0006-nl-search-entity-extraction.md)
   and shared low-level retrieval rules from
   [ADR 0009](../decisions/0009-hybrid-ask-matching.md);
4. the final BridgeCircle handoff templates;
5. current code only as evidence to keep deliberately or replace.

The implementation resolves these visible or architectural drifts explicitly:

- **Routes:** current information architecture keeps `/profile/[id]`; the
  older flow prose calls the other-member route `/people/[id]`. The stable,
  shareable route remains `/profile/[id]`. In-app links are intercepted into a
  slide-over, so route stability and “close exactly where you were” both hold.
- **Self profile:** `/profile/me` becomes the intentional self destination and
  renders the real inline-edit experience. It is no longer a redirect.
  `/profile/edit` is removed; maintaining two profile representations would
  violate the approved “what others see is what you edit” rule.
- **Enrichment:** provider import, sweeps, and proposal review remain the later
  enrichment slice in ADR 0015 step 6. The legacy `/profile/import` and
  `/profile/proposals/*` application routes are removed now because they use
  the superseded schema. The self profile renders an enrichment queue only
  after the later slice supplies real authorized proposals; no fake queue or
  fabricated “last checked” date ships.
- **Initial directory sort:** the specimen says “Recently active,” but the
  schema has no presence or activity fact. The product says “Recently
  updated,” derived from durable profile timestamps, until an approved
  activity signal exists.
- **Contact privacy:** the approved self profile requires multiple links with
  independent audiences. A single `profiles.linkedin_url` plus one
  `contact_links` section setting cannot implement it and could expose an
  enrichment identifier. The baseline moves member-visible links into a
  membership-scoped, per-item-visibility table.
- **Privacy enforcement:** existing v2 detail-table RLS proves shared
  organization but does not enforce every field audience, and raw `profiles`
  includes columns that are not directory-safe. Authenticated member reads
  move to fixed viewer-shaped APIs; React never receives hidden fields.
- **Search explanations:** “Why this match” appears in searched directory
  rows/preview only, never on a full profile. Explanations are assembled from
  authorized evidence returned by the database. A model may rank evidence but
  may not invent the displayed factual reason.
- **Profile availability:** “Ask for help” is shown only when the same Help
  eligibility contract says a direct Ask can be created. The UI does not show
  a dead primary button for a member who is not currently open.
- **Visual facts:** mutual connections, shared city/school history, enrichment
  status, verified state, and profile freshness render only from durable facts.
  The template's demo counts, dates, and activity claims are not copied as
  product data.

## Slice specification

### People directory

- `/people` always shows people and never redirects to Help.
- The blank state is a browsable directory: organization count, one search
  capsule, All/Open to help/In your circle scopes, Industry/Class
  year/Location filters, and the 50 most recently updated eligible members.
- A search returns at most the 50 strongest authorized matches in one stable
  shape. The meta line always states the count/cap and sort.
- A result row contains only directory-safe identity, verified organization
  context, current role/location, up to three helping topics, a relationship
  state, one primary relationship action, and a disclosure chevron.
- Relationship actions are exactly: Message when connected, Connect when no
  request exists, and Pending when either direction has a pending request.
  Incoming requests remain handled in Messages “Waiting on you”; People does
  not create a second decision workflow.
- Clicking the row/chevron intentionally toggles the preview. Searching,
  filtering, or changing page never expands a preview automatically.
- Clicking a name opens the canonical full profile overlay. Closing it restores
  the exact selected row, query, scope, filter, page/load count, and scroll
  position.
- Blocked, inactive, rejected, revoked, deleted, self, and out-of-organization
  members never appear and do not affect visible result counts.

### Search behavior

- One input owns both ordinary keyword queries and natural-language queries.
  There is no user-visible mode switch and no route change.
- Explicit filter controls always win over provider-extracted filters.
- Blank and short keyword/structured searches use indexed Postgres full-text
  and scalar filters only.
- Natural-language-shaped queries start optional filter extraction and Voyage
  query embedding in parallel, then call the same viewer-shaped database
  search with whichever enhancements succeeded.
- Provider extraction is bounded to the approved facets: open-to-help,
  industry, class-year range, location, employer, education, and topic. It may
  not add a person ID, organization, visibility tier, or authorization input.
- Embedding or extraction timeout/failure is a soft fallback to the lexical
  query plus explicit filters. The member sees useful results or an honest
  empty state, not provider diagnostics.
- Semantic retrieval uses only profile chunks the viewer can see. A
  connections-only career/bio/skills chunk cannot rank or explain a stranger's
  result.
- At pilot scale, vector retrieval remains an exact scan. HNSW/IVFFlat is added
  only after the representative EXPLAIN harness proves the exact plan misses
  the latency target.
- Ranking is deterministic after inputs are fixed: text/vector relevance,
  explicit-filter fit, verified warm context, current Help availability, and a
  membership-ID tie-break. No opaque percentage is shown to members.
- Display evidence is a small typed list such as current role, career history,
  education, helping topic, shared city, or shared circle. The UI converts
  those facts into calm prose and includes the true provenance line.

### Preview and member profile

- Desktop People uses the handoff's docked preview rail only after selection.
  Tablet uses a wider sheet so the directory remains usable. Mobile skips the
  below-list rail and opens a full-height sheet.
- The preview contains identity, availability/relationship state, searched
  match evidence when applicable, current career, true shared context, Ask for
  help, Message/Connect, and “View full profile.” It does not eagerly fetch or
  serialize the full history for every row.
- `/profile/[id]` is the canonical deep link. A direct load renders a complete
  People-owned detail page with a deterministic back target to `/people`.
- Client navigation to `/profile/[id]` from People, Messages, Help, School, or
  Home uses a member-layout parallel slot and intercepted route. The same
  profile content appears in an accessible right-side dialog/sheet; `router.back()`
  closes it and browser forward reopens it.
- The full profile follows: header and actions; About; reverse-chronological
  Career; Education directly under Career; Can help with; and a restrained
  links/shared-context rail. It uses text-first timelines, not logo-dependent
  resume cards.
- “Can help with” reads the same `helper_topics` owned by Help·Give. Each topic
  can pre-seed a direct Ask. Profile never adds a second availability editor.
- Contact links are returned item-by-item only when their audience permits:
  organization/public to any active same-organization member, connections to
  connected pairs, and self only to the owner.
- Block and permission failures deliberately converge on the same calm
  unavailable state. The page does not disclose that a hidden profile exists.

### Connect, Message, Ask, and safety

- Connect opens the approved side panel over the current profile. Quick mode
  offers chips built only from true shared context. “Help me write it” accepts
  the member's reason, may shape it through the provider adapter, and always
  leaves an editable disclosed draft.
- A provider failure preserves the member's own text and a manual send path.
  No external call occurs inside the Connection database transaction.
- One client request UUID survives retry until a durable response arrives.
  Duplicate clicks and lost responses converge on one pending request.
- Accepting a Connection remains owned by Messages and atomically creates the
  canonical direct conversation. Message links use that conversation ID.
- Ask for help passes the target **membership ID**, never user ID, to the
  existing `/help/ask/[membershipId]` composer.
- Report submits a profile report through the existing private report pipeline
  with an immutable evidence snapshot and returns only an acknowledgement.
- Block and disconnect require confirmation with the approved consequences.
  Block immediately removes the pair from directory/profile/conversation
  access through `private.is_blocked`; disconnect preserves message history.
- Expected races (`already_connected`, `incoming_pending`, `not_available`,
  `unchanged`) render stable product states, never raw database errors.

### Self profile

- `/profile/me` renders the canonical profile layout with quiet per-section
  edit controls. There is no separate edit-page representation.
- Header/identity, About, current role/location/industry, Career/skills,
  Education, and Links each save through a typed, section-sized command.
- Edits use progressive enhancement with `useActionState`; expected validation
  results are returned, while unexpected failures go to the route error
  boundary/Sentry.
- Link editing supports LinkedIn, portfolio, website/social, email, and custom
  labels. URL-like values require HTTPS; email is validated separately. Every
  link has its own Public/Circle/Private audience and defaults to Private.
- Bio, career, education, and skills preserve the existing section visibility
  model with organization/connections/self database values.
- Successful profile writes update the durable profile-index status and audit
  log transactionally. The worker remains the only caller of Voyage document
  embeddings.
- Avatar bytes use the existing owner-prefixed Storage path and public avatar
  bucket decision. The database stores only the path; server rendering resolves
  the public URL.
- Help availability/topics are a read-only mirror linking to Help·Give.
  Notification/email/pause settings remain in Settings.
- The later enrichment queue is absent when no real proposal exists. Nothing
  is silently imported or published.

## Route contract

| Route | Responsibility |
|---|---|
| `/people` | bounded directory, search/filter state, desktop preview |
| `/profile/[id]` | canonical other-member deep link/full profile |
| `/profile/me` | canonical self profile and inline section editing |
| member `@profile/(.)profile/[id]` slot | contextual profile slide-over |
| `/api/people/profile/[userId]` | bounded preview/full-profile projection |
| `/api/people/connection-draft` | optional, timed, no-store draft shaping |
| `/api/connections/requests` | existing idempotent Connection command |
| `/api/connections/[userId]/disconnect` | existing Connection removal command |
| `/api/members/[userId]/block` | existing shared block command |
| `/api/members/[userId]/report` | profile report command |

Removed application routes have no redirect or compatibility handler:

- `/profile/edit`;
- `/profile/import`;
- `/profile/proposals/[id]`.

The later enrichment slice will add its final reviewed routes against the v2
private proposal contract rather than reviving these legacy modules by default.

## Architecture

### Layer boundaries

```text
People/Profile Server Components, client islands, actions, and API routes
        |  authenticate, parse, compose, map expected result only
        v
src/lib/people + src/lib/profile + src/lib/connections + src/lib/safety
        |  framework-free contracts, ranking, result mapping, validation
        v
src/db/repositories/people.ts / profiles.ts / connections.ts / safety.ts
        |  strict Zod parsing; fixed api RPCs only
        v
api.list_people / api.get_member_profile / api.get_my_profile / commands
        v
private viewer-shaped queries, locks, visibility, block, audit, index state
        v
public memberships/profiles/history/links/helper topics/connections
        + private profile embedding chunks/status

Optional server provider path
query -> bounded extractor + Voyage query embedding -> fixed member RPC
                                           |
                         failure -----------+--> lexical fallback

Profile links inside the member shell
        -> Next intercepted route + @profile parallel slot -> slide-over
Direct URL / refresh
        -> canonical /profile/[id] page
```

Boundary rules enforced statically:

- framework-free domain modules import no Next.js, Supabase client, provider
  SDK, environment variable, or `server-only` module;
- member repositories call fixed `api` functions only;
- member routes/components never import the admin client or query a public or
  private profile/Connection/block/report/embedding relation directly;
- provider adapters are server-only, receive an AbortSignal, cap payloads, and
  return no database authorization decision;
- profile IDs in URLs are user IDs; direct-Ask links use membership IDs;
- no raw hidden field crosses the Server/Client Component boundary;
- private responses use `Cache-Control: private, no-store, max-age=0`;
- no TypeScript suppression, compatibility cast, legacy table name, OFFSET,
  or hidden service-role fallback enters the slice.

### Server/client split

- `/people/page.tsx` loads selected member context and the bounded directory
  result in parallel once inputs are known. It passes only row display fields,
  counts, filters, and selected context to the client surface.
- The People client island owns query/filter URL state, desktop local page,
  mobile revealed-count state, selected preview ID, request cancellation, and
  stale-response sequence protection.
- Profile preview detail is fetched only after selection and cached only in the
  mounted client instance by user ID + query fingerprint. No profile content is
  persisted in local/session storage.
- Canonical profile pages and intercepted profile content share one async
  server component. The client overlay owns only focus trap, close behavior,
  dialogs, and action pending states.
- Self-profile section editors are small client islands around server-rendered
  content. A single monolithic profile client payload is prohibited.
- Independent provider operations use `Promise.allSettled`; the database query
  waits only for inputs it actually needs. Independent profile-side reads are
  composed to start together.
- The existing shell `UserControlProvider` remains the sole private owner-topic
  subscriber. It gains a typed `profile.changed` revision; People/Profile do
  not open another user channel.

### Component plan

Build product components from the handoff instead of copying its inline HTML:

- `PeopleDirectory`, `PeopleSearch`, `PeopleScopes`, `PeopleFilters`,
  `PeopleResults`, `PeopleRow`, and `PeoplePagination`;
- `PeoplePreview`, `MatchEvidence`, `SharedContext`, and
  `PeopleDirectoryState`;
- `ProfileOverlay`, `ProfileHeader`, `ProfileTimeline`, `ProfileLinks`,
  `ProfileHelpTopics`, and `ProfileSharedRail`;
- `ConnectionComposer`, `ConnectionStateAction`, `ProfileSafetyMenu`,
  `ProfileReportDialog`, `BlockDialog`, and `DisconnectDialog`;
- `SelfProfile`, `InlineSectionEditor`, `ProfileIdentityForm`,
  `ProfileAboutForm`, `ProfileCareerForm`, `ProfileEducationForm`, and
  `ProfileLinksForm`;
- route-shaped skeleton, unavailable, permission-safe, empty, filtered-empty,
  provider-fallback, and retry states.

Reuse BridgeCircle tokens and owned shadcn/Radix primitives only where they
match the handoff. Acceptance includes semantic headings/lists/time elements,
visible focus, focus return, Escape/backdrop close, screen-reader names,
aria-live action feedback, reduced motion, 44 px touch targets, keyboard-
reachable disclosures, and no horizontal overflow.

## Database changes

### Profile storage corrections

Keep normalized `profiles`, `organization_profiles`, `profile_experiences`,
`profile_education`, `profile_skills`, `profile_field_visibility`,
`helper_preferences`, and `helper_topics` as the approved source of truth, with
these baseline corrections:

1. Add nullable `industry` to `public.profiles`, bounded to a meaningful display
   length and included in directory/index facts.
2. Remove member-visible `profiles.linkedin_url`. Provider identity remains in
   `private.profile_enrichment_settings`; explicitly shared links move to the
   new contact-link relation.
3. Add `public.profile_contact_links`:
   - UUID primary key;
   - organization ID + membership ID composite FK;
   - kind (`linkedin`, `portfolio`, `website`, `social`, `email`, `other`);
   - optional custom label, nonblank value, audience
     (`organization`, `connections`, `self`), sort order, timestamps;
   - HTTPS validation for URL kinds and conservative email validation for
     email kind;
   - unique membership sort position and normalized value;
   - indexes in membership/audience order for authorized rendering and cleanup.
4. Remove `contact_links` from `profile_field_visibility.field_key`; per-item
   link audience is the only contact-link authority.
5. Tighten profile/detail RLS and grants. Member code receives directory and
   profile detail through fixed APIs. Raw profile tables keep defense-in-depth
   RLS but no broad authenticated SELECT grant that can expose resume paths or
   bypass field visibility.

The table is membership-scoped deliberately: visibility is defined relative to
the selected circle/organization. Global identity/career/education remain
user-scoped and reusable; the selected membership controls bio, class year,
helping, contact disclosure, and organization context.

### Fixed queries

Add these authenticated-only, fixed-shape queries:

1. `api.list_people(...)` — validates the caller-owned selected membership,
   applies organization/activity/block/visibility, performs structured +
   optional exact-vector ranking, hard-caps to 50, and returns directory rows,
   safe match evidence, relationship state, action IDs, total/cap metadata,
   and deterministic sort fields.
2. `api.get_member_profile(membership_id, target_user_id)` — returns one
   viewer-shaped profile or `not_available`, including normalized visible
   history, visible links, Help topics/eligibility, true shared context,
   Connection/pending/conversation state, and durable freshness facts.
3. Extend `api.get_my_profile` with industry and all owner-visible contact links
   while preserving the Foundation onboarding contract.

`list_people` uses a generated/maintained search vector over directory-safe
facts with a GIN index. Exact vector evidence is joined only when a valid query
embedding is supplied. A single query defines both count and row eligibility so
blocked/hidden rows cannot leak through metadata.

### Fixed commands

Keep and extend the existing Foundation section commands where their ownership
and locking behavior is correct. Add only the missing responsibilities:

- `api.save_profile_about` — membership-owned bio update;
- `api.save_profile_visibility` — validated atomic replacement of supported
  section overrides;
- `api.save_profile_links` — validated atomic replacement of ordered links and
  per-item audiences;
- extend the current-profile command for `industry` and private enrichment
  identity without reintroducing a public LinkedIn field.

Each successful command:

- locks and verifies the selected active membership and active account;
- validates cardinality, lengths, dates, kinds, URLs, email, sort uniqueness,
  and audience in SQL as well as Zod;
- writes the section in one short transaction;
- marks all active memberships for that user dirty for profile indexing;
- creates one deduped pending index job/status transition;
- appends a non-sensitive audit event;
- broadcasts an IDs-only `profile.changed` owner event after durable state is
  visible;
- returns a stable result code rather than a constraint message.

Connection, block, disconnect, and report commands remain the already verified
v2 implementations. The profile report repository extends the existing safety
contract instead of creating another moderation path.

### Search/index privacy

- Directory chunks contain only fields that every active organization member
  may see.
- Career, education, bio, and skills chunks inherit their section audience.
- Self-only data creates no searchable chunk.
- Contact links, resume paths, provider identifiers/snapshots, email addresses,
  private notes, and report data are never embedded.
- A connections-only chunk is selectable only when `private.is_connected`
  succeeds for the authenticated viewer and target.
- `private.is_blocked` is evaluated before lexical/vector evidence is returned.
- Synthetic chunks may cite only source facts at the same or broader audience;
  the existing evidence-ID validation remains mandatory.
- Profile writes never call Voyage. They queue/dirty durable work; the verified
  worker owns external document embedding and idempotent replacement.

## Reliability, performance, and observability

- Search query max: 300 characters; explicit filters have strict enums/ranges;
  provider input/output schemas are strict and payloads bounded.
- Provider timeout: 8 seconds maximum with abort propagation; client navigation
  aborts obsolete work.
- Result cap: exactly 50; preview/full-profile endpoints return one member.
- No OFFSET is used. The fixed 50-row result is locally segmented because the
  product cap is itself the bound.
- Query-plan fixtures use a pilot-scale organization and adversarial hidden,
  blocked, inactive, and duplicate-ranking data.
- Any new index must serve a measured filter/order/policy predicate. Equality
  columns precede range/order columns; every new FK has a leading index.
- Search diagnostics record mode, counts, fallbacks, and latency but no query
  body, hidden evidence, link value, or provider response.
- Unexpected route/action/provider failures go to Sentry with operation tags
  and sanitized codes. Members receive plain, blameless copy.
- Owner-topic Realtime is an invalidation hint only. Postgres is refetched as
  truth after `profile.changed`/`connections.changed`; payloads contain IDs,
  never profile content.

Current official implementation references remain the Supabase
[RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security),
[full-text search guide](https://supabase.com/docs/guides/database/full-text-search),
and [semantic search guide](https://supabase.com/docs/guides/ai/semantic-search).

## Destructive application cutover

This is a clean replacement, not a compatibility port. After new routes and
tests are green:

- delete `src/lib/friendship/**`;
- replace legacy `src/lib/search/**` member-search code with the bounded
  `src/lib/people/**` domain and shared provider adapter;
- delete legacy profile getters/savers/privacy JSON code superseded by fixed
  profile APIs while preserving Foundation onboarding contracts and the shared
  avatar/history form pieces still in use;
- delete the old People result-card/search-form implementation;
- replace `/profile/[id]`, make `/profile/me` real, and delete edit/import/
  proposal route modules;
- update notification/account/sidebar/profile links to canonical routes;
- remove legacy `base_profiles`, `friendships`, `friend_requests`, raw private
  embedding RPC, and old route strings from every People/Profile production
  caller;
- update the old profile E2E factory/spec only where this slice owns it;
  remaining School/Admin legacy factory use stays classified to the next port;
- update contract, IA, screen map, Supabase conventions, migration workflow,
  seed/runbook, and handoff drift notes in the same change.

There are no redirects, aliases, old-table fallbacks, dual writes, or dead
mock controls. A static cutover script prevents them from returning.

## Milestones and stop gates

### Milestone 0 — plan and canonical checkpoint

1. Reconcile contract, FLOWS, ADRs, handoff templates, current routes, schema,
   compiler inventory, and responsive decisions.
2. Record the route, privacy, search, contact-link, enrichment, and cutover
   decisions above.
3. Add the test inventory and doc index entries.
4. Commit the plan before implementation.

**Gate:** clean plan checkpoint on `codex/redesign-v2`; no schema/code change
mixed into the plan commit.

### Milestone 1 — live baseline and red contracts

1. Rerun inherited database, focused domain, boundary, lint/unit, type, and
   rebuild gates under Node 22.
2. Record the global and owned compiler inventory.
3. Add `012_people_profile_vertical_slice.test.sql` with absent API/table/grant
   expectations so it fails only for planned work.
4. Add empty focused TypeScript, boundary, cutover, concurrency, and query-plan
   harnesses; prove deliberate bad fixtures are detected.

**Gate:** every red assertion maps to one planned contract; inherited gates
remain green.

### Milestone 2 — schema, privacy, and fixed APIs

1. Implement industry/contact-link storage, constraints, indexes, RLS, and
   least-privilege grants in the active v2 baseline.
2. Implement viewer-shaped directory/profile queries and missing self commands.
3. Harden embedding source/search visibility and owner profile invalidation.
4. Extend seed data with varied profiles, privacy tiers, links, relationships,
   hidden/blocked/inactive members, and at least 50 eligible results.
5. Regenerate local types twice and require byte-identical output.

**Gate:** database reset, pgTAP, lint, empty schema diff, deterministic types,
concurrency, query plans, and prior domain database gates green.

### Milestone 3 — application boundaries and search pipeline

1. Add strict People/Profile repositories and framework-free contracts.
2. Port the optional extractor/embedding provider behind server-only adapters
   and deterministic fallback.
3. Add operations for search shaping, evidence prose, self section saves,
   profile report, and expected result mapping.
4. Extend the shell member-control event with `profile.changed` without opening
   another channel.
5. Make focused compiler and boundary gates green.

**Gate:** unit tests cover strict parsing, fallback, ranking/tie-breaks,
visibility-safe evidence, validation, idempotency inputs, and stale request
suppression; zero owned TypeScript/boundary errors.

### Milestone 4 — People directory and preview

1. Build the initial directory, search, scopes, filters, row states, 50 cap,
   desktop paging, mobile load-more, skeleton/empty/error/fallback states.
2. Build intentional desktop preview and tablet/mobile sheet behavior.
3. Wire Ask/Connect/Pending/Message actions to durable IDs.
4. Preserve URL, selection, scroll, and load count across preview/profile use.

**Gate:** component tests and browser roads pass at 1440, 1280, 768, 390, and
320 px; no eager preview, fabricated data, stale-result overwrite, or overflow.

### Milestone 5 — member profile and relationship/safety actions

1. Build the shared full profile content.
2. Add member-layout parallel/intercepted routing plus canonical deep-link page.
3. Build Connect composer, Message/Ask actions, report/block/disconnect dialogs,
   and expected race states.
4. Verify focus containment/return, back/forward, direct refresh, and section
   ownership.

**Gate:** profile privacy, overlay return-in-place, Connection idempotency,
report evidence, block disappearance, disconnect history preservation, and axe
roads green.

### Milestone 6 — self profile

1. Replace `/profile/me` redirect with canonical self view.
2. Build inline section editors and per-link audience controls.
3. Port avatar handling and index invalidation.
4. Remove separate edit/import/proposal routes and update all owned links.

**Gate:** keyboard and browser roads prove edit/save/error/cancel, privacy from
three viewer personas, link validation, avatar refresh, and Help-setting
single-source behavior.

### Milestone 7 — visual fidelity and responsive QA

1. Capture reference states from all four handoff templates at their useful
   native/acceptance dimensions.
2. Capture matching implementation states in the Codex in-app browser.
3. Compare source and render with the same viewport/state, write a fidelity
   ledger, and fix all P0/P1/P2 drift.
4. Verify above-the-fold copy, icons, typography, spacing, container model,
   colors, interaction states, and mobile behavior.

**Gate:** design QA says `final result: passed`; no unresolved material visual
or responsive mismatch.

### Milestone 8 — destructive cutover and final checkpoint

1. Delete superseded modules/routes and make the cutover ratchet green.
2. Rerun all current-domain database/concurrency/Realtime/query-plan gates,
   focused compilers/boundaries, Biome/ESLint/Vitest, E2E/axe, reset/lint/diff,
   deterministic types, and production build.
3. Classify every remaining global compiler/build failure to a later owner and
   require zero People/Profile-owned errors.
4. Update all active docs and commit the completed local slice.

**Gate:** clean worktree, reviewable commits, no remote push/merge/reset/deploy,
and exact final evidence recorded in the test inventory.

## Completion definition

People/Profile is complete locally only when:

- the approved directory, preview, full profile, self profile, Connection,
  Ask, Message, privacy, and safety paths work from durable v2 data;
- all display/search/embedding surfaces enforce the same visibility and block
  rules in Postgres;
- the exact 50 cap and desktop/mobile behavior match the approved responsive
  canon;
- every owned legacy route/module/table reference is deleted and prevented by
  a static ratchet;
- database, concurrency, query-plan, deterministic type, focused compiler,
  boundary, unit, browser, axe, and visual QA gates pass;
- remaining whole-app failures are explicitly owned by School/Admin/enrichment
  or another later slice, with zero People/Profile-owned failures;
- changes are committed locally on `codex/redesign-v2` with no merge, push,
  remote reset, provider mutation, or deployment.
