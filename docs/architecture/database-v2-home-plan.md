# Database v2 Home vertical-slice implementation plan

> **Status (2026-07-16): implemented and locally verified.** This work remains
> local on `codex/redesign-v2`; it does not authorize a remote database reset,
> deployment, push, or merge. The starting checkpoint was
> `7a01900 feat: build School vertical slice`.

## Goal

Build `/` as the complete member Home dashboard from the accepted BridgeCircle
handoff. Home must orient the member, surface the next useful relationship
action, and compose the already-built Help, Messages, People/Profile, and
School slices without becoming a feed, a second inbox, an analytics page, or a
second implementation of any domain.

The finished slice must support normal, first-session, all-clear, paused,
loading, and recoverable partial-failure states; preserve every existing
privacy boundary; remain useful from 320 px through wide desktop; and add the
one missing persistence contract assigned to Home by the Messages plan:
bilateral consent for an “It worked” outcome story.

## Success criteria

Home is complete when:

- the accepted visual hierarchy is faithfully reproduced inside the existing
  responsive member shell;
- every displayed fact comes from a fixed, typed, permission-safe projection;
- Help, Messages, Connections, and School mutations still use their owning
  domain commands;
- the dashboard remains useful when one non-critical domain read fails;
- no blocked, inactive, deleted, wrong-organization, anonymous, or
  consent-withheld identity leaks through a spotlight, waiting row, outcome
  story, event row, or recognition item;
- the deck is bounded, calm, keyboard-operable, and motion-safe;
- Home’s ask field carries one question into the canonical Help search without
  storing sensitive text in a URL longer than necessary or duplicating the
  composer;
- Connection requests can be accepted or quietly declined on Home, while
  direct Asks continue to the canonical Help decision surface;
- outcome stories appear only after both Ask participants explicitly opt in,
  and names appear only after both separately opt into identity disclosure;
- database, domain, component, accessibility, responsive, and regression
  gates in the companion test inventory are green.

## Canonical sources and precedence

When sources disagree, use this order:

1. runtime security and the implemented v2 database invariants;
2. [ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md) and the
   [database v2 contract](database-v2-contract.md);
3. [`FLOWS.md` section 2](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md),
   plus sections 5.1, 5.4, 6, 7b, 7c, 7d, and 8;
4. the accepted
   [`Home.dc.html`](../experience/ui/design-system/handoff/bridgecircle/project/templates/home/Home.dc.html)
   handoff and its Home-native data notes;
5. [ADR 0011](../decisions/0011-two-verbs-one-inbox.md) and
   [ADR 0013](../decisions/0013-toss-baseline-then-brand-overlay.md);
6. this plan;
7. older launch-cut or legacy production code.

The handoff is the accepted visual concept. No new Image Gen concept is
needed. Before implementation, capture the accepted normal, paused,
all-clear, first-session, and loading states at a stable native desktop
viewport so visual regression compares the app against rendered references,
not memory.

## Decisions fixed before implementation

### Home is an application composition layer

- Home does not own Ask, Waiting, Connection, event, announcement, profile,
  or message lifecycle rules.
- Existing fixed projections load in parallel:
  `get_help_home`, `list_my_asks`, `list_messages_waiting`,
  `get_messages_counts`, and `get_school_home`.
- One small `get_home_native` projection owns only facts that no finished
  slice owns: weekly pulse counts, one recognition candidate, one eligible
  outcome story, and Home state metadata.
- Do not build one large SQL function that copies all Help, Messages, and
  School selection logic. That would reduce a few parallel calls at the cost
  of coupling every domain contract to Home and creating drift on the next
  slice change.
- The server starts every bounded read together. The slowest read determines
  initial latency; calls are not serialized into a waterfall.
- A failed non-critical section becomes a local retry state. It does not erase
  the greeting, ask entry, or successfully loaded sections.

### Home has one bounded spotlight, not a feed

- The deck contains at most six discriminated items in deterministic priority:
  You could help, People are asking, Event, Recognition, School news, and It
  worked.
- Each item is one doorway to its owning route. There is no infinite scroll,
  popularity ordering, impressions counter, helper leaderboard, or “members
  you may know” rail.
- The deck advances about every six seconds only when reduced motion is not
  requested and the deck is not hovered, focused, or covered by a dialog.
- Previous/next buttons and labeled position controls always work. Changing
  slides must not move keyboard focus or announce every automatic advance as
  an alert.
- A paused helper sees no You-could-help item and receives the approved quiet
  line linking to `/help?mode=give`.
- If no eligible item exists, Home renders one honest all-quiet state rather
  than fabricated activity.

### Waiting is one contract with two presentations

- Home and Messages use the exact same `MessagesWaitingItem[]` projection.
- The fold preference is user-scoped and shared so “Waiting on you” is
  conceptually one group, not two divergent inboxes.
- Direct Ask rows link to `/help/asks/[askId]`; Home never copies the Ask
  accept/decline dialog or decline-note logic.
- Connection rows reuse the existing Connection response operation and API.
  Accept removes the row, confirms the new connection in place, and offers a
  route to Messages without forcing navigation. Decline removes the row
  quietly. Retry, stale, and already-decided results converge safely.
- Empty Waiting disappears entirely, including its count.

### The ask entry is a handoff, not a composer

- Home owns only a single-line question input and “Find people” action.
- Submission trims and length-validates the question, writes it to the
  membership-scoped Help draft store, and navigates to `/help` with the
  canonical Help form focused and matching underway.
- A short-lived `?q=` handoff may be used for progressive enhancement, but the
  Help route must consume it into the session draft and replace the URL so a
  private question is not left in history, analytics, or copied links.
- Empty submission is inert; Enter and the button use one path.
- Nothing is sent to another member from Home.

### Outcome sharing is explicit, bilateral, and revocable

The existing Ask `outcome_note` remains private by default. Add a narrow
private consent table rather than broadening the Ask row:

`private.ask_outcome_shares`

- `ask_id` and `participant_user_id` form the primary key;
- `share_story` defaults false;
- `share_identity` defaults false and implies `share_story`;
- timestamps record first consent, latest change, and revocation;
- only the two accepted Ask participants may save their own choice;
- consent can be changed later, and a revoked side immediately removes the
  story from Home;
- account deletion removes that member’s share row so retained conversation
  history never preserves public-story consent;
- raw table access remains unavailable to authenticated clients.

The fixed command
`api.save_ask_outcome_share(ask_id, share_story, share_identity)` returns one
stable result code. The Messages conversation projection gains only the
viewer’s current choice plus aggregate eligibility booleans; it never exposes
the other participant’s private choice before both sides make the story
eligible.

The resolved Ask context adds two calm controls:

1. “Share this win with the circle” — names remain hidden;
2. “Include my name if they do too” — available only when sharing is on.

An outcome is eligible for Home only when the Ask is resolved, has a non-empty
outcome note, and both current participants have `share_story = true`. Names
appear only when both also have `share_identity = true`. The viewer sees no
story if they block, or are blocked by, either participant.

### Recognition is derived narrowly, not stored as social activity

- Do not add a generic activity or feed table.
- A recognition candidate is an active same-organization member with an
  unambiguous recent current-role start month, permitted employer/title
  visibility, and no block relationship with the viewer.
- A connections-only field is eligible only for a connected viewer.
- The candidate must not be the viewer, deleted, inactive, hidden, or based
  merely on a profile `updated_at` timestamp.
- If those conditions do not produce a trustworthy milestone, omit
  Recognition. Never infer “just started” from an old role newly typed during
  onboarding.
- Selection is deterministic and bounded by date and ID, never engagement.

### The coordinator line is derived, warm, and non-analytic

- The database returns weekly counts, not presentation prose.
- Counts cover active members who joined during the current week and existing
  members whose visible profile changed during the week.
- A new join is not counted again as a refresh in the same sentence.
- `src/lib/home/` selects one approved, grammatical sentence for zero, one,
  or plural counts. No chart, percentage, streak, comparison, or leaderboard
  appears.

### Profile freshness stays safely absent until its owner is ported

The v2 baseline deliberately moved profile proposals into `private` and stores
only a review-token hash. The current enrichment application code still names
the retired profile schema and is the known production-build blocker. Home
must not create a dead “Review updates” link, use a service-role shortcut, or
reintroduce compatibility tables.

Therefore this slice includes the visual component and conditional contract
boundary but keeps the module absent in production until the later v2 profile
enrichment/review slice supplies a signed-in owner queue and fixed commands.
That later slice may turn the module on without changing Home layout. This is
the only parked Home module; the reason and reactivation contract stay in the
test inventory.

## Slice specification

### Normal dashboard

- Greeting uses the selected membership’s preferred name, falling back to
  display name.
- The coordinator line sits directly beneath the greeting.
- The full-width weekly spotlight is first.
- Ask entry follows the deck.
- Desktop then becomes two columns: action column for Waiting and open Asks;
  context rail for School and, later, profile freshness.
- Open Asks show at most four rows, a truthful `N of 5 open` label, current
  status, offer count, three-day close warning only when applicable, and a
  canonical `/help/asks/[id]` link.
- Zero open Asks keeps the header and shows one quiet entry action; it does not
  fabricate history.
- From the school shows at most two upcoming relevant events and the newest
  pinned announcement. It uses School’s canonical time, RSVP, unread, and
  route projections and never includes newsletter content.

### First session

- A true cold start means no active Ask, no Waiting item, and no durable
  conversation. School content alone does not make a relationship dashboard
  warm.
- The handoff presents exactly three optional doors: ask for help, see asks
  you could help with, and say hello through People.
- It does not show a progress meter, onboarding checklist, completion score,
  or requirement language.
- As soon as one durable relationship action exists, the normal dashboard
  replaces this state.

### All clear and paused

- Waiting hides when empty.
- The open-Ask module accurately shows zero or the remaining active rows.
- The pulse and deck state remain warm without manufacturing urgency.
- A paused helper keeps School, People are asking, Recognition, and consented
  outcome items but receives no matched helper item.

### Loading and partial failure

- The route-level skeleton follows the actual greeting, deck, ask field,
  action column, and context-rail geometry.
- A failed Help read does not suppress School; a failed School read does not
  suppress Waiting; a failed Home-native read falls back to a neutral greeting
  and omits native cards.
- Local retry actions refresh the server data without clearing an entered
  question.
- Authorization or membership loss still converges through the existing
  member-layout redirect rather than a partial dashboard.

## Route and data contract

| Surface | Responsibility | Owner |
|---|---|---|
| `/` | dashboard composition and transient deck/input state | Home |
| `/help` | receive the question handoff and run matching | Help |
| `/help/asks/[id]` | direct Ask decision and owned Ask status | Help |
| `/messages/[id]` | resulting conversation and outcome-share controls | Messages |
| `/school/...` | event and announcement destinations | School |
| `/profile/[id]` overlay | recognition identity destination | People/Profile |
| `api.get_home_native` | pulse facts, recognition, eligible outcome | Home |
| `api.save_ask_outcome_share` | viewer’s revocable outcome consent | Help/Conversation seam |

## Application architecture

### Layer boundaries

```text
Home Server Component
        |
        +--> HelpRepository.getHome + listMyAsks
        +--> MessagesRepository.listWaiting + getCounts
        +--> SchoolRepository.getHome
        +--> HomeRepository.getNative
                    |
             Promise.allSettled
                    |
             src/lib/home/compose
                    |
       typed HomeSectionResult contracts
                    |
        Server layout + small client islands
```

1. `src/lib/home/`
   - framework-free composition, cold-start decision, deck selection, pulse
     grammar, status presentation, and strict discriminated contracts;
   - imports owner-domain types only, never repositories, Supabase, Next.js,
     provider SDKs, environment values, or raw database types.
2. `src/db/repositories/home.ts`
   - calls only `api.get_home_native` and validates its fixed JSON result with
     strict Zod schemas;
   - does not query Help, Messages, School, profiles, connections, or Ask rows
     directly.
3. `src/app/(member)/`
   - the Home Server Component loads selected membership and starts all reads;
   - small client components own only deck motion, question draft, Waiting fold
     state, optimistic Connection decisions, toasts, and refresh-on-owner-event;
   - no global Home store or client-side database fetch fan-out is introduced.
4. Existing owner layers
   - Help, Messages, Connections, and School repositories and operations remain
     canonical;
   - shared presentational behavior may be extracted, but ownership does not
     move into Home.

### Component inventory

- `HomeDashboard`
- `HomeGreeting`
- `WeeklySpotlight`
- `HomeAskEntry`
- `HomeWaitingGroup`
- `HomeOpenAsks`
- `HomeSchoolRail`
- `HomeColdStart`
- `HomeSectionError`
- `HomeSkeleton`
- dormant `HomeProfileFreshness` presentation boundary
- shared `useConnectionRequestDecision` controller extracted from Messages

Components receive domain contracts, not SQL rows. Icons use the existing
Lucide family where it matches the handoff; the deck arrows use real icon
buttons rather than text glyphs.

### Server/client and refresh behavior

- Server Components own membership, initial reads, privacy outcomes, and
  section availability.
- Client state owns only temporary interaction state. A question draft is
  membership-scoped; Waiting fold state is user-scoped and contains no content.
- The existing single owner Broadcast channel remains the only member control
  subscription. Home listens to the generic revision and performs one
  debounced `router.refresh()`; it does not open a second Realtime channel.
- Help or Connection commands emit their existing owner events. Saving outcome
  consent emits a bounded `help.changed` event to both participants so Home
  and Messages refetch authoritative state.
- School remains mutation-revalidated rather than Realtime-driven.

## Database design

### `private.ask_outcome_shares`

Required invariants:

- primary key `(ask_id, participant_user_id)`;
- `share_identity implies share_story`;
- only resolved Asks with a non-null outcome note are eligible;
- participant validation uses the canonical accepted counterpart for direct
  and circle Asks;
- the authenticated caller can alter only their own row;
- revocation is idempotent;
- blocked or deleted relationships never project publicly;
- an index supports finding the newest fully eligible stories without a full
  Ask scan;
- the account-cleanup routine removes rows for the deleted user.

### `private.get_home_native`

The security-definer implementation uses an empty search path, fully qualified
relations, selected active-membership validation, central block checks, and
bounded subqueries. `api.get_home_native` is the only authenticated wrapper.

The JSON contract contains facts, not UI copy or URLs:

- selected organization ID;
- current-week new-member and refreshed-profile counts;
- nullable recognition candidate with permitted identity and role facts;
- nullable outcome story with question, outcome note, resolution time, and
  identity mode;
- generated timestamp for deterministic tests.

The member role receives EXECUTE on the wrapper only. It receives no raw
private-table access and no private-function EXECUTE.

### Query and index rules

- Every read is bounded and deterministically ordered by a timestamp plus ID.
- Add a partial organization/join-time membership index only if the plan
  harness proves the existing active-membership index insufficient.
- Add a recent-current-experience index only if recognition cannot use a
  selective plan at representative pilot scale.
- Consent eligibility uses an index anchored on `ask_id` and active sharing.
- Run `EXPLAIN (ANALYZE, BUFFERS)` on the native projection at seeded pilot
  scale. Do not add speculative indexes without plan evidence.

Supabase’s current guidance still supports this posture: exposed relations use
RLS, privileged helpers stay outside exposed schemas, security-definer
functions use controlled search paths, and policy/helper columns are indexed.
No July 2026 changelog item requires a different design.

## Responsive and visual contract

- Reuse the current full-width member shell. Home’s content canvas is centered
  within the available application area, not within a second fixed-width app
  frame.
- Wide desktop: greeting and deck full width; main/context split approximately
  1.55:1 with a 1040 px content maximum and stable page gutters.
- Tablet: one readable column; action modules precede School context.
- Mobile: deck actions wrap, ask input/button stack when needed, Waiting
  actions remain at least 44 px, rows never depend on hover, and the tab bar
  remains reachable.
- Acceptance widths: the captured template width, 1440, 1024, 768, 390, and
  320 px. Horizontal overflow, clipped controls, accidental nested scrolling,
  and desktop-only interaction are failures.
- Color, type, spacing, radii, border, shadows, and icon treatment come from
  the existing BridgeCircle tokens and owned primitives. No raw shadcn default
  styling or new unlogged override is introduced.

## Accessibility contract

- One page `h1`; spotlight title remains the current slide heading without
  turning auto-advance into a noisy live region.
- Deck controls have unique labels and visible focus; pause behavior includes
  hover and focus-within.
- Reduced motion disables automatic advancement entirely.
- Waiting uses a real disclosure button with `aria-expanded` and a stable
  controlled region.
- Connection decision busy and error states are announced without disabling
  unrelated rows.
- Toasts use an appropriate polite status region; quiet decline does not
  announce private details.
- Links, buttons, and focus order remain logical after responsive reflow.
- Automated axe checks are supplemented with keyboard-only and reduced-motion
  browser roads.

## Milestones and stop gates

### Milestone 0 — approval and immutable starting checkpoint

- Approve this plan and the companion test inventory.
- Confirm `codex/redesign-v2` is clean at `7a01900`.
- Capture accepted Home reference states before code changes.

**Stop gate:** no implementation begins before approval.

### Milestone 1 — red contract checkpoint

- Add failing pgTAP tests for outcome consent, native projection privacy,
  grants, deletion cleanup, and fixed result shapes.
- Add failing Vitest contracts for Home composition, pulse grammar, deck cap,
  cold start, partial failure, and status mapping.
- Add the initial Home browser roads against the current placeholder route so
  the missing surface is explicit rather than mistaken for regression.

**Stop gate:** every failure is classified as an approved missing Home
contract; prior slices remain green.

### Milestone 2 — database and repository contract

- Add the consent table, participant helper, fixed command, native projection,
  grants, cleanup integration, and evidence-driven indexes.
- Extend the conversation projection with outcome-share state.
- Regenerate local database types twice and prove byte identity.
- Add strict Home repository parsers and repository tests.

**Stop gate:** Home pgTAP, privilege checks, schema lint, shadow replay,
deterministic types, and query plans are green.

### Milestone 3 — framework-free composition

- Implement `src/lib/home/` contracts and pure composition.
- Keep copy/status logic out of SQL and route components.
- Prove partial-domain failures, zero states, block filtering assumptions,
  deterministic deck priority, and plural grammar.

**Stop gate:** Home’s focused compiler, boundary checks, and Vitest are green.

### Milestone 4 — owner-flow seams

- Add the private-question handoff into Help and remove the consumed query
  parameter.
- Extract the Connection decision controller for Home and Messages without
  changing the Messages presentation.
- Add outcome-share controls to resolved Ask conversations and the fixed API
  route/operation.
- Connect Home refresh to the existing owner-control revision.

**Stop gate:** Help and Messages focused tests remain green; connect accept,
quiet decline, stale retry, question handoff, consent, and revocation are
proven end to end.

### Milestone 5 — Home UI and state completeness

- Replace the placeholder route with the accepted normal dashboard.
- Build first-session, all-clear, paused, loading, empty, and local-error
  states.
- Implement deck motion controls and all canonical route exits.
- Keep the profile-freshness module absent until its owner contract exists.

**Stop gate:** desktop, tablet, mobile, keyboard, reduced-motion, and axe roads
are green with no dead action.

### Milestone 6 — seed, regression, and fidelity closeout

- Add deterministic local fixtures for each Home state, including a fully
  consented anonymous outcome and a separate identity-consented case.
- Capture the latest implementation at the accepted concept dimensions and
  every responsive acceptance width.
- Compare accepted references and implementation with `view_image`, write the
  fidelity ledger, and fix every material drift.
- Run the complete local verification stack and restore the database to the
  canonical seed.
- Update architecture/docs status and commit the completed slice without
  pushing or merging.

**Stop gate:** no material visual mismatch, privacy gap, dead path, failing
prior-slice regression, or unclassified compiler/build failure remains.

## Destructive cutover and non-goals

The existing `/` placeholder is replaced, not preserved. No compatibility Home
route, old dashboard component, fabricated mock-data runtime, or legacy schema
adapter remains.

This slice does not build:

- an activity/social feed;
- recommendation or popularity ranking;
- detailed People search/ranking tuning;
- a generic analytics dashboard;
- admin Home curation;
- profile-enrichment ingestion or the signed-in proposal review queue;
- weekly digest email;
- a new notification list;
- a second Realtime subscription;
- remote reset, deployment, or production provider work.

The known production-build failure in the unported profile-embedding check
remains separately classified. Home may not hide it with compatibility types
or casts.

## Completion handoff

The final handoff must report:

- exact commit and dirty/clean status;
- database migration, fixed APIs, and grants added;
- outcome-consent and revocation behavior;
- the six domain/native reads and their parallel/partial-failure behavior;
- database, concurrency, query-plan, type, unit, lint, browser, responsive,
  accessibility, and fidelity evidence;
- accepted-reference and latest-render screenshot paths;
- material mismatches fixed and any remaining intentional deviation;
- the parked profile-freshness owner contract;
- confirmation that no push, merge, remote reset, or deployment occurred.
