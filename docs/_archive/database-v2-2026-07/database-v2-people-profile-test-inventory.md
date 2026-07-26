# Database v2 People/Profile vertical-slice test inventory

- **Status:** code/cutover, corrected interaction road, and multi-persona privacy matrix green; UI/UX-first sequencing active; detailed search/ranking verification deferred
- **Approved:** 2026-07-15
- **Plan:** [People/Profile vertical-slice implementation plan](database-v2-people-profile-plan.md)
- **Starting checkpoint:** completed Messages slice `c9a1b77`
- **Rule:** a milestone cannot proceed while its owned verification is red
- **Scope:** local-only; no remote project, provider mutation, deploy, push, or
  merge

## Milestone 0 inspected baseline

Recorded locally on 2026-07-15 before implementation:

| Checkout/tool | Recorded value |
|---|---|
| branch / commit | `codex/redesign-v2` / `c9a1b77` |
| relationship to local `main` | 0 behind / 26 ahead |
| worktree | clean |
| prescribed Node / pnpm | 22.22.2 / 10.33.2 |
| Supabase CLI / psql | 2.109.1 / 18.3 |
| inherited pgTAP inventory | 11 files / 438 planned assertions |
| global TypeScript | 679 errors |
| People/Profile legacy inventory | 318 errors across 22 classified files |

The 318 count is deliberately broad: it includes current People/Profile routes,
legacy profile/friendship/search modules, profile-index maintenance, and their
direct provider/search dependencies. Milestone 1 will replace this heuristic
with an exact owned-file manifest used by the focused compiler and final
cutover gate.

The inspected application still reads removed v1 objects including
`base_profiles`, `friendships`, and `friend_requests`; uses an admin client for
member profile details/vector search; paginates 10 rather than the approved
20/20/10; and routes self editing through a second `/profile/edit` page. Those
are expected red cutover findings, not accepted compatibility behavior.

## Milestone 1 live baseline

Recorded after the isolated plan checkpoint `00903a6`:

| Gate | Result |
|---|---|
| inherited pgTAP | 11 files / 438 assertions / green |
| focused People/Profile TypeScript | green |
| future People/Profile boundary detector | green, including deliberate bad fixture |
| People/Profile cutover ratchet | expected red: legacy `/profile/edit` still exists |
| People/Profile concurrency preflight | expected red: member-profile, links, and visibility contracts absent |
| People/Profile query-plan preflight | expected red: directory and member-profile projections absent |
| pgTAP with People/Profile contracts | 12 files / 460 assertions / 15 planned failures in the new 22-assertion file |

The 15 new pgTAP failures are exactly: industry storage; removal of public
LinkedIn; contact-link table, audience, index, and section-visibility drift;
the directory/member-profile/about/visibility/link fixed functions; the two
authenticated execute grants; security-definer API posture; and the
`profile.changed` owner invalidation. The seven passing assertions confirm the
already-safe raw profile/detail grant boundary and lack of anonymous grants.

No inherited contract regressed. The red baseline contains no unrelated SQL,
TypeScript, shell, or environment failure.

## Milestone 2 database/API foundation evidence

Implemented and measured locally after red checkpoint `671d5cd`:

| Gate | Result |
|---|---|
| empty local reset + deterministic seed | green |
| complete pgTAP | 12 files / 489 assertions / green |
| People/Profile pgTAP | 51 privacy, search, grant, command, and invalidation assertions / green |
| generated public+api types | two runs byte-identical; SHA-256 `bc0b272ebaa915b514c359a65743baaf784a0f5759ce473e1c5ef9be4189a6d7` |
| Foundation and People/Profile focused TypeScript | green |
| replacement concurrency | whole links/visibility sets only; retry-safe; one pending index job |
| representative plan fixture | 2,500 generated members plus seed; organization and link indexes used; 50 rows with safe total 2,504 |
| keyword plan | actual pilot plan chose a 0.205 ms sequential scan; forced companion proved the GIN path is valid |

The actual keyword plan is intentionally recorded rather than treated as an
index failure: at 2,505 profiles PostgreSQL measured the sequential scan as
cheaper. The maintained GIN index is available, and the harness will expose
when real cardinality/selectivity makes it preferable. No ANN vector index was
added without a measured need.

Live viewer-shaped checks also proved Richard sees exactly the four eligible
seeded members with correct connected/pending states, can read allowed
organization/Connection links, and receives `not_available` for the blocked
profile. Raw profile, link, visibility, resume, embedding, and report data
remain unavailable to `authenticated`.

## Milestones 3–5 application checkpoint

Implemented locally after database checkpoint `230bb93`:

- strict People directory and member-profile contracts plus Zod repository
  parsing over only `api.list_people` and `api.get_member_profile`;
- normalized URL search state, bounded query/filter validation, stable URL
  serialization, authorized evidence copy, and deterministic lexical fallback;
- `/people` blank browse, invisible keyword/NL input, scopes, filters, 50-row
  bounded result, desktop 20/20/10 local paging, mobile 20/40/50 reveal,
  relationship actions, and deliberate-only profile preview fetching;
- `/profile/[id]` canonical viewer-shaped profile with About, Career,
  Education, helping topics, links, shared context, current Connection state,
  direct Ask membership IDs, profile report, block, and disconnect paths;
- private no-store preview and profile-report routes; no raw table, admin
  client, or member-supplied authorization scope enters either route.

| Gate | Result |
|---|---|
| focused People/Profile TypeScript under Node 22.22.2 | green |
| People/Profile boundary detector | green |
| focused People/query/repository/safety Vitest | 4 files / 10 tests / green |
| relevant Biome and `git diff --check` | green |
| destructive cutover | expected red at the first remaining Milestone 6 path: `/profile/edit` |

The in-app browser reached the local server but had no authenticated session in
the controllable tab, so browser/visual acceptance is deliberately not claimed
at this checkpoint. Milestone 6 self-profile cutover and Milestone 7 visual QA
remain required before completion.

## Milestone 6 self-profile checkpoint

Implemented locally after member-profile checkpoint `0db8c97`:

- `/profile/me` now reads the selected membership through `api.get_my_profile`
  and renders the canonical owner view instead of redirecting to the visitor
  profile;
- identity, current role, About, career and skills, education, section
  visibility, links, and avatar changes use fixed repository commands with
  server-derived membership authorization;
- client validation mirrors database bounds for text, dates, array sizes,
  duplicate skills/links, HTTPS/email links, allowed audiences, and custom link
  labels;
- Help topics and open-to-help remain a read-only mirror linked to Help · Give;
  notification controls remain outside the public profile;
- `/profile/edit`, `/profile/import`, `/profile/proposals/*`, the legacy
  friendship domain, unused profile getters/savers/privacy code, and all owned
  links to retired routes were deleted without redirects;
- onboarding-only import/confirm components were relocated under onboarding so
  route deletion did not remove a still-owned onboarding dependency.

| Gate | Result |
|---|---|
| focused People/Profile TypeScript under Node 22.22.2 | green |
| People/Profile boundary detector | green |
| destructive cutover detector | green |
| focused People/profile repositories, query, validation, and avatar Vitest | 5 files / 13 tests / green |
| relevant Biome | green |
| global TypeScript | still red only in classified later-domain/runtime migrations; People/Profile focused compiler remains zero-error |

Authenticated browser roads, three-viewer privacy checks, avatar refresh, and
reference-to-render visual comparison remain Milestone 6/7 acceptance work and
are not claimed by this code checkpoint.

## Milestone 5 intercepted-profile closure

Implemented locally after self-profile checkpoint `4cd93aa`:

- the member layout now owns an `@profileModal` parallel slot, a same-segment
  `/profile/[id]` interceptor, a hard-load default, and an unmatched-route
  catch-all so unrelated soft navigation cannot retain a stale profile;
- canonical and intercepted profile routes render one async server component,
  so session, membership, privacy, avatar, and viewer-shaped profile loading
  cannot drift;
- direct loads remain the complete `/profile/[id]` page with a deterministic
  People back target, while in-shell navigation uses a right-side modal sheet;
- the client modal owns only Radix focus containment, scrim/Escape/close
  dismissal through `router.back()`, sheet scrolling, and presentation;
- the overlay now keeps only contextual identity/actions, About, helping
  topics, true shared context, and an explicit full-profile link; Career,
  Education, links, and the complete timeline remain owned by the canonical
  page;
- a slot catch-all resolves modal state to `null` when an action navigates to
  Help, Messages, People, or another member route.
- the desktop shell’s owner link now targets `/profile/me` directly rather
  than entering the other-member interceptor and relying on a self redirect.

| Gate | Result |
|---|---|
| Next 16.2.4 route type generation | green; canonical and intercepted pages both type as `/profile/[id]` |
| focused People/Profile TypeScript under Node 22 | green |
| People/Profile boundary and destructive-cutover detectors | green |
| focused repository/query/profile Vitest | 6 files / 17 tests / green |
| changed-file ESLint, Biome, and `git diff --check` | green |
| unauthenticated direct-route runtime | `307` to sign-in with the exact `/profile/[id]` return path preserved |

This checkpoint was structural. The post-acceptance correction below records
the later authenticated overlay/history/focus and axe evidence; the broader
safety, self-profile, privacy-persona, and full visual matrix still remains.

## Post-acceptance People interaction correction

Implemented and verified locally on 2026-07-15 after comparing the running
app with the approved People/Profile flow contract:

- selecting a row/chevron now opens a bounded docked preview on desktop and an
  accessible bottom sheet below the desktop breakpoint without changing the
  URL; closing returns focus to the visible row trigger;
- member-name navigation opens the compact intercepted profile overlay,
  preserves Back/Forward behavior, and returns focus to the exact originating
  desktop or mobile link;
- “View full profile” and “Open full profile” use explicit document navigation
  to the complete canonical page instead of being re-intercepted;
- Industry, Class year, and Location are the three approved visible quick
  filters; employer, education, and helping-topic query capabilities remain
  intentionally unexposed until the deferred search-tuning pass; applied state
  remains URL-addressable;
- Connect now has the approved one-tap quick-hello mode and an optional
  AI-shaped reason mode backed by a bounded no-store adapter and editable
  fallback draft;
- desktop/mobile duplicate render targets have unique IDs, preview focus finds
  the visible trigger, and the mobile sheet has an explicit accessible name
  and description;
- all axe-discovered directory, Connect-composer, compact-overlay, and mobile
  preview contrast failures in this road were corrected.

| Gate | Result |
|---|---|
| focused People/Profile TypeScript under Node 22.22.2 | green |
| People/Profile boundary and destructive-cutover detectors | green |
| focused repositories, Connections, query, draft domain/provider Vitest | 9 files / 28 tests / green |
| changed-file ESLint and Biome | green |
| Codex in-app browser at `localhost:3000` | directory, docked preview, quick filter URL, both Connect modes, compact overlay, close focus, Back/Forward, and canonical full page green |
| local acceptance + axe | one Playwright road / green at desktop and 390 × 844; directory, Connect composer, compact overlay, and mobile sheet axe-green; no horizontal overflow; focus return green |

The repository test is
`tests/e2e/people/people.spec.ts`. The normal hermetic command could not start
in this desktop session because the Doppler CLI had no authenticated
`bridgecircle/dev_local` token. The same non-mutating test passed against the
already verified local seeded app on port 3000 through a temporary local-only
config, which was removed immediately afterward. CI and authenticated local
runs continue to use the permanent hermetic config and disposable port 3002
database reset.

Final same-state desktop screenshots:

- `/private/tmp/bridgecircle-people-fix-qa-2026-07-15/07-final-directory.png`;
- `/private/tmp/bridgecircle-people-fix-qa-2026-07-15/08-final-preview.png`;
- `/private/tmp/bridgecircle-people-fix-qa-2026-07-15/09-final-profile-overlay.png`.

This correction closes the interaction drift the review identified. It does
not by itself claim the entire Milestone 7 matrix: three-viewer privacy,
self-profile editing, safety actions, provider-success/failure sending, and
all reference viewports remain separately enumerated below.

## Multi-persona privacy acceptance checkpoint

Implemented and verified locally on 2026-07-15 after the interaction
correction checkpoint:

- added a self-contained pgTAP matrix for owner, same-organization stranger,
  connected member, blocked member, other-organization member, pending member,
  revoked member, inactive account, organization admin, and service role;
- proved directory exclusion happens before count/ranking for self, block,
  other organization, pending/revoked membership, inactive/deleted account,
  and deleted/revoked targets;
- proved organization, Connection, and self section audiences and per-link
  audiences omit hidden values entirely rather than returning redacted raw
  content;
- proved blocked and nonexistent profiles return the identical
  `not_available` shape, and a caller cannot substitute another member's
  membership ID as an authorization capability;
- proved organization administrators receive ordinary member profile
  visibility, while trusted service jobs retain deliberate raw maintenance,
  enrichment, and safety access;
- proved resume paths, provider identifiers, enrichment settings, report
  evidence, raw profile relations, visibility policy, and contact-link rows do
  not enter member responses or authenticated raw access;
- replaced the stale pre-v2 friendship/profile browser spec with the current
  `/people`, `/profile/[id]`, and `/profile/me` contract;
- verified Richard sees his self-only link and Mei's Connection-only link, Sam
  sees Mark's organization link but not Mei's Connection-only link, and the
  blocked Amy route and directory both expose only the calm unavailable state.

| Gate | Result |
|---|---|
| isolated privacy pgTAP | 1 file / 36 assertions / green |
| empty local reset + deterministic seed | green |
| complete pgTAP | 13 files / 525 assertions / green |
| rendered privacy E2E | 2 tests / green after clean reset |
| Codex in-app browser | owner, connected, stranger, blocked, and directory surfaces green; Richard session restored on `/people` |
| focused People/Profile TypeScript | green |
| People/Profile boundary and destructive-cutover detectors | green |
| changed-file ESLint and `git diff --check` | green |

The first complete pgTAP attempt correctly detected that prior local Messages
use had advanced the seeded unread cursor. Resetting only the disposable local
database restored the deterministic fixture; the clean run passed all 525
assertions. No schema migration or production/remote mutation was required for
this privacy checkpoint.

## Sequencing decision — complete UI/UX before search tuning

Recorded at the user's direction on 2026-07-15:

- the current bounded, privacy-safe People search contract stays in place so
  the visible directory, filters, result states, and profile flows have real
  data and stable behavior;
- detailed natural-language extraction, embedding/ranking quality, match-
  evidence tuning, large-fixture search correctness, and query-plan
  optimization are intentionally deferred until the redesigned pages and
  user-visible flows are complete;
- active People/Profile work moves to the remaining self-profile interaction,
  relationship/safety, loading/empty/error, responsive, accessibility, and
  source-to-render visual fidelity roads;
- security, block/privacy behavior, tenant isolation, fixed result bounds, and
  safe provider fallback are not deferred because visible UX depends on those
  contracts remaining trustworthy.

This changes implementation order, not the approved final completion
definition. Sections C and G remain required before production readiness.

## Planned verification matrix

### A. Schema and contract

- active baseline rebuilds from empty local database;
- `industry` and `profile_contact_links` exist with exact checks/FKs/indexes;
- public profile LinkedIn/contact visibility drift is removed;
- every new FK has a leading index;
- every status/kind/audience/value constraint rejects invalid shapes;
- profile detail/raw private relations have no broad member grant;
- fixed APIs have exact authenticated grants and no anon grant;
- `api` wrappers are invoker-safe and private implementations are
  security-definer with empty search paths;
- generated public+api types are byte-identical across two generations;
- schema lint has no warnings and local public/api/private diff is empty.

### B. Directory and profile privacy personas — complete 2026-07-15

Exercise owner, same-organization stranger, connected member, blocked pair,
out-of-organization member, inactive member, admin, and service personas:

- directory excludes self, blocked, inactive, deleted, revoked, and other-org
  members before count/ranking;
- organization-visible career/education/bio/skills appear to org mates;
- connection-visible sections appear only to connected pairs;
- self-only sections appear only to the owner;
- each contact link independently obeys organization/connections/self;
- a hidden link/section is absent, not returned as redacted raw content;
- profile unavailable, blocked, and permission denied share a non-enumerating
  result;
- Help topics/availability obey block and selected-organization rules;
- resume path, provider ID, enrichment snapshot, report data, and self-only
  evidence never appear in member responses;
- raw relation access cannot bypass the fixed projection.

### C. Search correctness — deferred until after UI/UX completion

- blank browse is bounded to 50 and sorted by durable updated time + ID;
- explicit All/Open to help/In your circle scopes are exact;
- industry, class-year range, location, employer, education, and topic filters
  compose with AND semantics;
- keyword search uses indexed full-text facts and deterministic tie-breaks;
- natural-language mode accepts an optional extracted filter set and embedding
  without changing result shape;
- explicit filters override extracted filters;
- semantic evidence respects organization/connection/self visibility;
- blocked/hidden evidence cannot affect rank, explanation, or result count;
- provider-unavailable, extraction-failed, embedding-failed, timeout, and
  malformed response fall back to lexical/structured search;
- display evidence is typed, authorized, deterministic, and truthful;
- query cap/length/filter range/cardinality validation is enforced in app and
  SQL;
- result hard cap is 50 even when more members match.

### D. Profile commands

- owner can save each approved section for the selected active membership;
- another member, other organization, pending/revoked membership, and deleted
  account cannot save;
- links reject non-HTTPS URL kinds, malformed email, unknown kind/audience,
  duplicate order/value, excessive cardinality, blank/oversized values;
- visibility rejects unknown fields/audiences and stores only overrides;
- experience/education date and ordering constraints remain intact;
- two concurrent section replacements serialize without partial child sets;
- successful save creates one audit record, dirty index state, deduped work,
  and owner profile invalidation;
- failed validation/authorization creates none of those side effects;
- retry returns stable results and cannot duplicate links or index jobs.

### E. Connection and safety integration

- Connect retry with one client UUID creates one request;
- opposite-direction pending request returns incoming-pending, not a second row;
- connected, blocked, self, inactive, and other-org targets return stable state;
- accepted request exposes canonical conversation ID for Message;
- report profile captures immutable authorized evidence and returns only ID;
- block removes both parties from directory/profile/search/message access;
- unblock restores only permission, not a deleted Connection;
- disconnect removes circle state, preserves direct history, and makes retained
  direct conversation read-only under the existing Messages contract;
- every expected race maps to calm product state without SQL text.

### F. Realtime and invalidation

- `profile.changed` is owner-topic only, IDs only, and strictly parsed;
- malformed/unknown profile events are ignored and reported;
- reconnect/subscription increments profile revision and triggers one bounded
  refetch path;
- profile save does not open a second user channel;
- Connection/block invalidation refreshes visible People/Profile state;
- Realtime payload never contains name, bio, query, link, evidence, or block
  initiator.

### G. Query plans and performance — deferred until after UI/UX completion

Use representative pilot data including at least 2,500 active members, 50+
matches, blocked/inactive distractors, normalized histories, links, topics,
Connections, and profile chunks:

- selected organization/activity narrowing uses composite membership indexes;
- blank directory avoids per-row subqueries over the full organization;
- keyword query uses the directory GIN vector;
- scope/filter predicates use measured indexes or bounded post-filtering;
- Connection/pending state uses canonical pair indexes;
- profile detail uses target-user/membership and child sort indexes;
- contact-link authorization uses membership/audience index;
- vector query exact-scans only eligible organization chunks and remains under
  the recorded pilot latency budget;
- no N+1, deep OFFSET, external sort spill, or unbounded sequential scan over a
  growing relation;
- `EXPLAIN (ANALYZE, BUFFERS)` fixtures record actual rows, loops, buffers, and
  execution time.

### H. Application boundaries and compiler

- focused `tsconfig.v2-people-profile.json` is zero-error;
- People/Profile routes/domains contain no admin client or raw table access;
- framework-free domains contain no Next/Supabase/provider/env imports;
- API routes/actions are thin parse/auth/invoke/map boundaries;
- no `base_profiles`, `friendships`, `friend_requests`, old profile privacy
  JSON, raw embedding function, OFFSET, or compatibility cast remains;
- no `/profile/edit`, `/profile/import`, or `/profile/proposals` application
  route remains;
- direct Ask links use membership IDs and profile URLs use user IDs;
- private responses are no-store;
- global compiler/build failures after cutover have an exact later-domain owner
  and People/Profile-owned count is zero.

### I. Unit and component behavior

- search parameter normalization and URL serialization;
- invisible keyword/NL routing and provider fallback;
- deterministic ranking/evidence copy/tie-breaks;
- strict repository row parsing and contract violation detection;
- desktop 20/20/10 pagination and mobile 20/40/50 reveal behavior;
- selected preview persists through mobile load more and closes intentionally;
- stale/aborted responses cannot overwrite a newer query;
- one action per relationship state;
- self section validation/result mapping;
- member-control profile revision and deduplication;
- versioned local storage is not used for profile/search/member content.

### J. Browser and accessibility roads

1. blank directory → scope/filter → reset;
2. keyword search → 50 cap → page 2/3 → selected preview preserved;
3. natural-language search with provider success and provider fallback;
4. row preview → full intercepted profile → close/back/forward in place;
5. direct deep link/refresh → canonical profile → People back target;
6. Connect quick note → pending → accept in Messages → Message action;
7. AI-shaped Connect draft → edit → send; provider failure → manual send;
8. Ask for help from header and a specific helping topic;
9. report acknowledgement, block disappearance, unblock restoration;
10. disconnect confirmation and retained read-only Messages history;
11. self profile edit/save/cancel/validation across every section;
12. per-link and per-section visibility checked as owner, org mate, Connection;
13. loading, empty, filtered-empty, unavailable, permission-safe, offline, and
    retry states;
14. keyboard-only and axe checks for directory, preview, overlays, drawers,
    dialogs, and inline forms.

Acceptance viewports: 1440-class desktop, 1280 × 900 handoff class, 768 tablet,
390 × 844 mobile, and 320 px narrow mobile. Horizontal overflow, clipped
actions, below-list mobile preview, lost focus, and background-scroll leakage
are failures.

### K. Visual fidelity

- capture People blank, searched/collapsed, selected preview, Connection panel,
  profile, safety dialogs, self profile, and inline edit states from the handoff;
- compare same-state/same-viewport implementation screenshots in the Codex
  in-app browser;
- inspect copy, layout, type, palette, border/shadow/radius, icon treatment,
  density, rail/sheet size, focus states, and responsive composition;
- keep a fidelity ledger and fix every P0/P1/P2 issue;
- require final design QA `passed` before completion.

## UI/UX completion checkpoint — 2026-07-15

The People/Profile surface is now complete for the visual-and-flow milestone:

- People exposes the settled All / Open to help / In your circle scopes and
  Industry / Class year / Location filters without surfacing deferred search
  controls;
- In your circle now leads to `/people/circle`, the managed view required by
  FLOWS §7d, with per-person Message and confirmed Disconnect;
- member profiles preserve overlay return-in-place behavior, the canonical
  People back target on full pages, entitled links, Can help with, and exact
  Report / Block / Disconnect protections;
- the self profile uses exact Public / Circle / Private audience language,
  inline editing, a Help-owned availability mirror, and durable avatar states;
- loading, unavailable/not-found, failed-load/retry, and offline states use
  calm route-shaped treatment rather than blank pages or raw errors;
- the final same-viewport report at `/design-qa.md` is `passed`, with source,
  implementation, full-view, focused-region, desktop, mobile, console, and
  overflow evidence recorded there.

Search ranking, semantic routing, indexes, representative-data query plans,
and relevance evaluation remain intentionally deferred. This checkpoint does
not claim those invisible-search gates; it makes the visible product ready for
that later pass without exposing speculative controls now.

### Final checkpoint verification

The combined People/Profile UI/UX checkpoint and canonical one-room Messages
correction were re-verified from an empty local database immediately before
commit:

| Gate | Result |
|---|---|
| clean local reset and deterministic seed | green |
| complete database contracts | 13 pgTAP files / 525 assertions / green |
| generated `public` + `api` types | two runs byte-identical; SHA-256 `ff23475acbd46ff1e82b493b4fec3fe25850a90265ca8e88ac5c7c9f186f7b16` |
| focused compilers | Foundation, Conversation, Help, Messages, and People/Profile all zero-error |
| database reliability | all five concurrency families, Conversation/Help/Messages Realtime, Help worker/maintenance, and all query-plan harnesses green |
| application tests | 61 Vitest files / 264 tests / green |
| browser acceptance | People plus four serial Messages roads / 5 tests / green against a freshly reset local seed |
| browser quality | axe, keyboard focus return, mobile widths, Realtime, safety, lifecycle, and one-room-per-person assertions green |
| static and style gates | every boundary/cutover check, Biome, ESLint, `git diff --check`, and design-token ratchet green |
| token discipline | approved handoff micro/display roles promoted to named tokens; numeric font, tracking, and padding literal baselines are all zero |

The active onboarding import comparison read was also moved from the deleted
`base_profiles` table to the fixed v2 self-profile repository, with mapping and
unavailable-profile unit coverage. No remote database, provider, deployment,
push, or merge was touched.

## Commands to add

```bash
pnpm typecheck:v2-people-profile
pnpm check:people-profile-boundaries
pnpm check:people-profile-cutover
pnpm test:db:people-profile-concurrency
pnpm test:db:people-profile-query-plans
pnpm test:e2e -- tests/e2e/people/people.spec.ts
```

These supplement, not replace, reset, pgTAP, lint/diff, deterministic types,
Foundation/Conversation/Help/Messages gates, Biome, ESLint, Vitest, axe, and the
production build/classified global inventory.

## Completion evidence

This file will be updated milestone by milestone with:

- exact commit and clean/dirty state;
- exact commands and exit status;
- assertion/test counts;
- concurrency/race outcomes;
- Realtime payload/subscription evidence;
- representative EXPLAIN nodes/timings/buffers;
- focused/global compiler and build ownership;
- browser viewport/road/axe results;
- reference and implementation screenshot paths plus fidelity ledger result;
- destructive cutover search results;
- final local commit, with explicit confirmation that no remote action occurred.
