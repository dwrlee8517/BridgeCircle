# Database v2 School vertical-slice implementation plan

> **Status (2026-07-15): implemented and verified locally on `codex/redesign-v2`.**
> This is a local-only destructive cutover. Do not deploy or reset a remote
> Supabase project from this plan. The pre-School People/Profile + Messages
> checkpoint is commit `8442dfb`.

## Goal

Build the complete member-facing School pulse from the accepted BridgeCircle
handoff: a calm `/school` hub, event detail and RSVP/waitlist lifecycle,
announcement index and reading pages, and newsletter archive and issue pages.
The slice must use fixed database APIs, preserve tenant and member privacy,
remain useful at every responsive width, and delete obsolete top-level member
routes instead of maintaining compatibility aliases.

School supports the relationship network; it does not become the product's
center of gravity. Events, announcements, and newsletters should give members
a timely reason to return while Help, People, and Messages remain the primary
member work.

## Canonical sources and precedence

When details disagree, use this order:

1. runtime security and the v2 database invariants;
2. [`FLOWS.md`](../experience/ui/design-system/handoff/bridgecircle/project/uploads/FLOWS.md),
   especially section 6 and the standing detail-navigation rules;
3. the six accepted School handoffs under
   `docs/experience/ui/design-system/handoff/bridgecircle/project/templates/school/`;
4. the BridgeCircle handoff tokens and components;
5. this plan and the v2 architecture contract;
6. older production code and launch-cut documents.

Code is canonical after the cutover. Any older document that still names
`/events` or `/announcements` must be corrected in the same change.

## Decisions fixed before implementation

- School owns every member route in the slice:
  `/school`, `/school/events/[id]`, `/school/announcements`,
  `/school/announcements/[id]`, `/school/newsletter`, and
  `/school/newsletter/[issue]`.
- Old member routes `/events`, `/events/[id]`, and `/announcements` are deleted
  with no redirects. Notification, email, Home, admin, and test callers move to
  the School routes.
- Event times store an IANA time zone and explicit campus. The UI renders the
  member's local time first and campus time second when they differ.
- A full event waitlists the member. When capacity opens, the oldest waitlisted
  member receives a one-day held offer. They must accept before becoming
  `going`; declining or expiry quietly passes the offer to the next member.
- An offered spot counts against capacity. This prevents overbooking while the
  member decides.
- A cancelled published event remains readable by members. A draft never does.
- Online join URLs are omitted from every list and calendar payload. Event
  detail returns the URL only to a confirmed attendee and only inside the
  configured near-start window.
- Raw School tables are not member read APIs. Authenticated members receive
  fixed, privacy-safe projections; administrative writes use fixed commands.
- Attendee identity is block-aware and profile-visibility-aware. Hidden
  attendance may contribute to an aggregate count but never produces an
  identity row.
- Announcement arrival marks the item read through an idempotent command.
- Newsletters are structured issues and ordered sections. Member reading is in
  scope; an admin newsletter editor is not, because no accepted admin flow
  exists yet.
- Detailed event recommendations/ranking are not introduced. The hub uses a
  deterministic next-relevant rule: active attendance first, then the next
  published event.
- Realtime is not required for School. Mutations revalidate the affected fixed
  reads, while notifications and normal reloads converge cross-device state.

## Slice specification

### `/school` pulse hub

- A bounded attending strip lists the viewer's upcoming `going` or `offered`
  events and selects the cover event.
- The cover shows category, date, summary, host, time, location, format, RSVP
  state, calendar download, detail link, warm aggregate attendance, and quiet
  capacity only when it matters.
- The cover selection is route state (`?event=<id>`), not a second event route.
- Upcoming rows use the selected tint and left accent. There is no “Viewing”
  chip and no full calendar mode.
- Pinned announcements appear first, followed by recent announcements, with an
  unread dot derived from durable read state.
- The latest newsletter is a light card and links directly to its issue.
- Empty states keep the same page structure and offer one calm next action.

### Event detail

- The event cover travels to the detail page as the hero.
- Filled-only content blocks are About + host, itinerary, and Good to know.
- RSVP states are `none`, `going`, `waitlisted`, `offered`, and `not_going`.
- `offered` opens the “A spot opened — still want in?” decision. Accepting
  becomes `going`; passing becomes `not_going`; deciding later preserves the
  held offer until its expiry.
- Changed, cancelled, and past events use a quiet status line. Cancelled and
  past events have no live RSVP controls.
- Event capacity is serialized by locking the event row. Repeated commands with
  the same intent are idempotent.
- The calendar route emits a valid `.ics` file with event detail URL and public
  location only. It never includes attendee data or the online join URL.
- Attendees are ordered: the viewer's circle first, then response time. Each
  visible row links to the current Profile route.
- The page has no comments, views, social share, or engagement counters.

### Announcements

- The index supports All, Mentorship, Hiring, Reunion, and General filters.
- Pinned items remain above ordinary reverse-chronological items within the
  selected tag scope.
- The reading page uses the handoff's narrow reading column, marks read on
  arrival, and ends with the article. It has no related-content rail or CTA.
- The stored body is plain text for this slice. Safe automatic paragraph and
  line-break rendering prevents raw HTML injection.

### Newsletter

- The archive is reverse chronological and intentionally has no search, tags,
  or personalization.
- The issue page renders ordered text sections and optional inline links.
- Links use validated `https` URLs. There are no issue-level actions.

### Shared route states

- Every route gets a shaped `loading.tsx` skeleton.
- Missing and unauthorized resources converge to the same calm not-found
  experience; member routes do not reveal whether an inaccessible row exists.
- Unexpected failures get a local retry boundary.
- Command failures remain in context with explicit, human copy and do not erase
  the user's current selection.

## Route contract

| Route | Responsibility | Data boundary |
|---|---|---|
| `/school` | School pulse, selected cover, attending strip, latest content | `get_school_home` |
| `/school/events/[id]` | Event lifecycle, details, attendees | `get_school_event`, `list_school_event_attendees` |
| `/school/events/[id]/calendar` | Authorized public event calendar payload | `get_school_event_calendar` |
| `/school/announcements` | Filtered bounded archive | `list_school_announcements` |
| `/school/announcements/[id]` | Reading destination + idempotent read | `get_school_announcement`, `mark_school_announcement_read` |
| `/school/newsletter` | Reverse-chronological issue archive | `list_newsletter_issues` |
| `/school/newsletter/[issue]` | Reading destination | `get_newsletter_issue` |

All dynamic route params are awaited and runtime-validated, as required by the
installed Next.js 16 App Router contract.

## Architecture

### Layer boundaries

1. `src/lib/school/`
   - framework-free contracts, result-code handling, time-zone formatting,
     filter parsing, calendar serialization, and RSVP view-state rules;
   - no Supabase client, Next.js import, environment read, or service client.
2. `src/db/repositories/school.ts`
   - the only member transport; calls the fixed `api.*` functions;
   - validates every returned row with strict Zod schemas;
   - translates transport failure separately from contract failure.
3. `src/app/(member)/school/`
   - Server Components load fixed projections;
   - small Client Components own cover selection, filters, and pending command
     affordances;
   - Server Actions validate inputs, call repository commands, and revalidate
     only canonical School routes.
4. `src/app/(member)/admin/`
   - existing event and announcement admin forms move to fixed admin commands;
   - no member or admin route reads or writes School tables directly.

### Server/client split

- Server Components own authorization, fixed reads, not-found decisions, and
  the initial responsive document.
- Client state owns transient cover choice, dialog state, optimistic button
  pending state, and tag interaction.
- Database state is never duplicated into a global client store.
- URL state is shareable for selected cover and announcement filters.

### Component plan

- `SchoolHub`, `AttendingStrip`, `EventCover`, `UpcomingEvents`
- `SchoolEventHero`, `RsvpControls`, `SpotOfferDialog`, `AttendeeList`
- `AnnouncementList`, `AnnouncementReader`
- `NewsletterArchive`, `NewsletterReader`
- shared `SchoolBackHeader`, `SchoolEmptyState`, `SchoolRouteSkeleton`, and
  `SchoolRouteError`

Components consume domain contracts, not database rows.

## Database design

### Events

`public.events` keeps organization ownership and gains:

- `slug` (organization-unique, stable URL support even though routes use IDs);
- `category`, `summary`, `format`, `time_zone`, and `campus`;
- `location_name`, `location_address`, `maps_url`, and private `join_url`;
- `host_membership_id` or `host_name`;
- `allow_waitlist`, `join_window_minutes`, `changed_at`, `change_note`, and
  `cancellation_note`.

CHECK constraints bind lifecycle timestamps, format/location requirements,
IANA-zone-shaped input, safe URL schemes, and text limits. Normalized
`event_schedule_items` and `event_facts` preserve order and avoid opaque JSON.

### RSVP and held offers

`event_rsvps.status` becomes `going | waitlisted | offered | not_going` and
adds `offered_at`, `offer_expires_at`, and `updated_at`.

Invariants:

- only `offered` rows carry offer timestamps;
- every offer expires after it starts;
- `going + offered <= capacity` under the event-row lock;
- only one row exists per event/member;
- membership and event organization IDs match by composite foreign keys;
- inactive memberships cannot issue commands;
- past, draft, and cancelled events reject mutations.

`private.respond_school_event` performs the state machine transaction. A helper
offers the next eligible waiter with `FOR UPDATE SKIP LOCKED`, emits one
deduplicated outbox job, and is used when a spot opens, an offer is passed, or
an expired offer is swept. It never sets `going` for another member.

### Announcements and reads

Announcements gain a constrained tag and optional summary. The new
`announcement_reads(announcement_id, organization_membership_id, read_at)`
table uses same-organization composite keys. Reads are idempotent upserts and
cannot be authored for another member.

### Newsletter

- `newsletter_issues`: organization, stable issue slug/number, lifecycle,
  title, summary, published timestamp, timestamps;
- `newsletter_sections`: issue, position, heading, body, optional link label
  and validated URL;
- one published issue slug per organization and one position per issue.

### Fixed member reads

- `api.get_school_home(membership_id)` returns a single JSON contract with
  bounded event, announcement, and latest-newsletter sections.
- `api.get_school_event(membership_id, event_id)` returns `ok` or
  `not_available`, never an authorization distinction.
- `api.list_school_event_attendees(...)` returns privacy-safe identities and
  aggregate hidden/total counts. It excludes the viewer, inactive/deleted
  members, blocked pairs, and identities unavailable through Profile rules.
- Announcement and newsletter functions return published content only in the
  viewer's active organization.
- Calendar projection returns only public event fields.

### Fixed commands

- `api.respond_school_event(membership_id, event_id, intent)`
- `api.mark_school_announcement_read(membership_id, announcement_id)`
- `api.run_school_maintenance(now, limit)` for expired offers and reminders
- admin create/edit/cancel/publish functions for existing admin surfaces

The member role receives EXECUTE only on `api.*` wrappers. No private School
function is executable by `authenticated`, and no raw School table SELECT,
INSERT, UPDATE, or DELETE is granted to members.

## Notifications and background work

Notification types add `event_changed`, `event_reminder`, and
`event_waitlist_spot_opened` while retaining `event_cancelled` and
`announcement_published`.

- Changed/cancelled events fan out once per affected confirmed/waitlisted
  member using deterministic dedupe keys.
- Opening a spot emits a notification only for the offered member.
- Reminder materialization is durable and idempotent, but delivery timing is a
  worker concern; the member UI does not depend on the worker being online.
- Payloads carry target IDs and presentation snapshots, never join URLs or
  attendee lists.
- Every School notification resolves to `/school/...`.

## Privacy and security matrix

The test matrix must prove:

- wrong-organization, inactive, pending, deleted, and anonymous viewers cannot
  read or mutate School content;
- draft content is admin-only; cancelled published events remain member
  readable;
- blocked pairs do not see each other in attendee identity rows;
- attendee aggregates cannot be used to infer a single hidden member;
- join URLs are absent for non-attendees and outside the join window;
- a member cannot RSVP with another membership or mark another member's
  announcement read;
- admin commands require an accepted School admin role;
- raw table privileges and private-function EXECUTE remain revoked.

## Reliability, performance, and observability

- Serialize capacity changes with the event row; verify simultaneous final-seat
  requests, cancellation/promotion, offer accept/pass, and expiry races.
- Use bounded reads with deterministic `(timestamp, id)` order and keyset
  cursors for archives that can grow.
- Add indexes for hub events, member attendance, waitlist/offers, announcement
  feed/read lookup, and newsletter archive/sections.
- Query-plan harnesses must avoid sequential scans on seeded scale fixtures for
  those hot paths.
- Result codes are stable (`going`, `waitlisted`, `offered`, `not_going`,
  `not_available`, `not_open`, `offer_expired`) so UI copy never parses SQL
  errors.
- Server errors include operation names but no private content. Sentry receives
  unexpected failures through the existing application boundary.

## Destructive cutover

Delete, do not wrap:

- member `/events*` and `/announcements*` routes;
- legacy `src/lib/events` and `src/lib/announcements` member data modules;
- direct School-table member reads and service-role RSVP workarounds;
- legacy E2E expectations for automatic waitlist promotion;
- navigation matchers and notification links to retired member URLs.

The cutover check fails if retired URLs, raw School member access, private
School grants, or automatic promotion semantics return.

## Milestones and stop gates

### Milestone 0 — plan and checkpoint

- record the green commit and canonical sources;
- write this plan and the test inventory;
- classify older doc drift.

**Verify:** no uncommitted pre-School work and every planned route has one
accepted template.

### Milestone 1 — red contracts

- add School-focused TypeScript, boundary, and cutover checks;
- add failing pgTAP contracts for schema, APIs, privacy, and held offers;
- replace legacy event E2E with canonical School roads.

**Verify:** failures are expected and exclusively School-owned.

### Milestone 2 — schema and fixed APIs

- add event details, held offers, announcement reads, newsletters, indexes,
  fixed reads/commands, grants, notification types, and seed data;
- regenerate deterministic database types.

**Verify:** clean reset, pgTAP, generated-type determinism, concurrency, and
query-plan harnesses.

### Milestone 3 — application boundaries

- implement framework-free contracts, strict repository, time/calendar
  helpers, and thin route actions;
- port admin event/announcement operations to fixed commands.

**Verify:** School TypeScript, unit tests, boundaries, and no service-role
member path.

### Milestone 4 — hub and event detail

- implement the responsive hub, selection, all RSVP states, held-offer dialog,
  attendee projection, and calendar download;
- add shaped loading/error/not-found states.

**Verify:** desktop/tablet/mobile interactions, keyboard focus, overflow, time
zone presentation, and accepted template fidelity.

### Milestone 5 — announcements and newsletters

- implement archive/filter/read flow, durable read state, newsletter archive,
  and issue reader.

**Verify:** direct deep links, read persistence, no CTA modules, safe links,
empty states, and responsive reading widths.

### Milestone 6 — destructive cutover

- delete old routes/modules/tests and update every caller and active doc;
- update notification links, nav ownership, admin copy, and rollout status.

**Verify:** School cutover ratchet and repository-wide retired-route scan.

### Milestone 7 — acceptance checkpoint

- run reset, all pgTAP, race/query-plan/maintenance tests, deterministic type
  generation, all focused typechecks, unit tests, lint/format, and global diff
  checks;
- run durable Playwright roads with axe at desktop and mobile widths;
- capture accepted template and implementation screenshots and inspect both.

**Verify:** all gates green, worktree contains only School-owned changes, and
the test inventory records exact evidence.

## Out of scope

- detailed School recommendation algorithms;
- comments, reactions, views, social sharing, ticket payments, or event chat;
- automatic external calendar integrations;
- newsletter authoring/admin UX;
- CRM, fundraising, donor, or advancement workflows;
- remote database reset, deployment, push, merge, or production migration.

## Completion definition

School is complete locally when the six canonical routes match the accepted
flows, the held-offer lifecycle is race-safe, raw School data is not exposed to
members, every retired route is gone, responsive/accessibility roads pass, all
prior vertical slices remain green, the evidence inventory is current, and the
result is committed without pushing or merging.
