# BridgeCircle Phase 1 Information Architecture

## Purpose

This document is the as-built record of how the product is organized — the route map, navigation model, screen inventory, screen responsibilities, and the cross-screen state model.

It is the source of truth for:

- where a new screen belongs
- what's already on a given route and what it does
- which legacy URLs redirect where
- which Open IA Questions have been resolved (and how)

The Phase 1 spec at [`../specs/phase-1/spec.md`](../specs/phase-1/spec.md) is upstream of this — the spec covers product *what* and *why*, this doc covers product *where* and *how it's wired*.

## IA Principles

- people-finding is the center of the product — the directory is one click away, not buried under a separate "search" surface
- asking starts from a person/profile context; request state after creation belongs in Inbox
- onboarding is short and clearly tied to value
- profile visibility and relationship state are understandable
- friendship and asks (advice + mentorship) feel related but the gates remain distinct: DMs require mutual friendship; asks require helper acceptance
- admin tools live under their own slot (`/admin`) rather than mixing into member nav
- the first release optimizes for responsive web, not native-mobile parity

## Product Areas

Phase 1 breaks into four major areas:

1. authentication and organization onboarding
2. member people search and relationship workflows
3. events
4. admin operations and analytics

## Top-Level Navigation

### Member Navigation (current)

Member top nav has **three** items, in this order, defined by `MEMBER_NAV_LINKS` in `app/src/app/(member)/member-nav.tsx`:

1. **People** — alumni directory; NL search + structured filters + "People I know" toggle; result cards show friend badges and ask CTAs
2. **Inbox** — unified request lifecycle: friend requests, incoming asks, active ask threads, direct messages, sent requests
3. **Events** — upcoming events with RSVP

Admins see a fifth slot ("Admin") that links to `/admin/invite`.

The mobile dropdown in `member-header.tsx` reads from the same `MEMBER_NAV_LINKS` array, so desktop and mobile cannot drift.

Global utilities (header right-rail):

- inline search field (submits to `/people?q=`)
- notifications bell (toast + popover, deep-links into the relevant detail surface)
- helper settings (gear icon → `/mentorship/settings`)
- account menu (sign out, organization switcher when multi-org)

### How we got here (post-launch IA reorg)

The original Phase 1 plan was a 7–8-item nav (Search, Inbox, Messages, Friends, Events, Announcements, plus Profile). Over six PRs (#48–#55) we collapsed it to four. The folds:

| Was | Where it went | Why |
|---|---|---|
| Search / Discover | Renamed to **People** | The surface is about finding the right person, not maintaining a separate search/discovery metaphor |
| Mentorship requests | Generalized to ask workflow routes (`/ask/new`, `/ask/[id]`, `/ask/thread/[id]`) | Lower the barrier to asking while keeping the top nav focused on People and Inbox |
| Friends | Folded into People (`peopleIKnow` filter + Friend badge); incoming requests moved to Inbox | Friendship is one dimension of people search, not its own page |
| Messages (list) | Folded into Inbox; conversation page `/messages/[id]` kept | DMs are inbox-style — no second list surface needed |
| Announcements | Off top nav; surfaced as banner on Home | Low-frequency admin posts don't earn permanent real estate |

All of the deprecated URLs return `308` redirects via `app/next.config.ts`.

### Admin Navigation

Admins have access to a separate management area rather than mixing everything into member nav:

1. Overview
2. Members + Approval queue
3. Invites
4. Events
5. Announcements
6. Analytics

Reached via the "Admin" top-nav slot (admin-only) and the sidebar in `app/src/app/(member)/admin/layout.tsx`.

## Organization Context Model

Because one user can belong to multiple organizations, organization context should always be explicit.

Requirements:

- current organization should be shown in the header
- switching organizations should update people search, events, inbox context, and admin context
- base profile should persist across orgs
- org-specific profile overlays should remain scoped to the selected organization

## Route / Screen Map

## Public And Auth Entry

### 1. Organization Join Landing

Purpose:

- explain the organization
- explain invite context
- drive sign up / login

Main elements:

- organization branding
- short value proposition
- invite context
- join CTA
- login CTA

### 2. Sign Up / Login

Purpose:

- create account or authenticate existing user

Main elements:

- email/password or auth method
- existing account flow
- invite context reminder

### 3. Pending Approval Screen

Purpose:

- confirm profile submission
- explain that admin approval is pending

Main elements:

- pending status
- what happens next
- expected wait time if available

## Onboarding And Profile Setup

### 4. Organization Profile Setup

Purpose:

- collect required org-specific profile fields
- optionally prefill from base profile

Main elements:

- required fields
- optional enrichment fields
- mentorship availability toggle
- progress state

### 5. Privacy Setup

Purpose:

- explain defaults
- let users edit visibility without forcing too much complexity

Main elements:

- field-by-field visibility controls
- short explanation of default visibility
- "keep defaults" option

### 6. Profile Import / Enrichment

Purpose:

- support LinkedIn URL import and confirm during onboarding (provider routing per [profile-enrichment.md](../architecture/profile-enrichment.md): LinkdAPI primary, PDL fallback)
- allow manual enrichment
- ask for freshness consent: review-before-update, auto-apply-and-notify, or manual-only
- optionally support resume / screenshot upload later

Main elements:

- import source options
- preview of extracted fields
- accept / reject changes
- edit proposed career and education entries before saving

This may be part of onboarding or a secondary flow from Profile.

## Member Experience

### 7. Home (`/`)

Purpose:

- greet the member and make the network feel alive immediately

Main elements:

- midnight hero with greeting + cohort year + 4-stat strip (joined-this-week, open mentors, upcoming events, your cohort)
- announcement banner (latest only; whole card links to `/announcements`)
- mentees waiting on you (pending mentorship requests directed at the viewer)
- new alumni in your area (3-up tile grid)
- featured event card
- recent activity feed (last 4 notifications)

Primary actions:

- review mentor requests → `/inbox`
- upcoming events → `/events`
- open a profile / open the directory

### 8. People (`/people`)

Purpose:

- the alumni directory and canonical surface for finding someone in the network. Replaces the original Search + Discover split and the search-first Ask landing page.

Main elements:

- soft white-to-slate hero ("People · N members" eyebrow + "Find the right people" Fraunces title)
- natural-language search bar (one input, submits as `?nl=`)
- collapsible Filters panel: city, employer, university, major, mentor topic, grad-year range, "Only show mentors", **"Only people I know"**
- result cards: name + role + class year, headline pull-quote, friend badge when accepted-friend, helper availability badge, profile and ask CTAs, optional rationale panel for NL hits

Ranking emphasis:

- structured pass: open-to-mentor boost > same university > same major > same city > grad-year proximity > keyword match
- NL pass: structured pre-filter narrows to ≤30 candidates, Claude Haiku reranks against the original query reading career history / education / skills / bio (privacy-redacted)

Behavior notes:

- NL extraction is entity-based, not vector — `extractFilters` pulls structured fields out of the prose, then merges with form-supplied filters (form wins)
- `/search?...`, `/discover?...`, and `/friends` legacy URLs 308 here

### 9. Profile Detail (`/profile/[id]`)

Purpose:

- show the full actionable view of a person inside org privacy rules

Main elements:

- visible identity + background fields (privacy-redacted by viewer relationship: friend / org-member / self)
- helper opt-ins surface as 1–2 CTA buttons ("Ask for advice" / "Request mentorship") gated on the person's `helper_preferences`
- friendship action (Add friend / Pending / Friends ✓ / Accept their request → /inbox)
- friendship-gated DM action (only visible when friends, links to `/messages/[threadId]` via `startThreadAction`)
- mentor topics + capacity state shown inline when relevant

Possible friendship states (resolved by `getFriendshipState`):

- self / friends / pending_outgoing / pending_incoming / none

Possible helper states (per type):

- closed / open / paused / cap reached / pending request / accepted (active)

### 10. Saved Mentor Interest

**Deferred** post-launch — see `docs/specs/phase-1/post-launch-backlog.md`. No surface in the current build.

## Relationship And Messaging Experience

### 11. Friend Request Composer

Sent inline from the profile page via the `Add friend` button. There is no standalone composer page — the v1 UI sends with no message body; the underlying server action accepts an optional `message` field for future use.

### 12. Ask Workflow Routes (`/ask/*`)

Ask is no longer a top-level member navigation surface. People/Profile start requests, and Inbox owns request state after creation. The underlying ask model remains polymorphic (`ask_type` enum: `advice` | `mentorship`).

Sub-pages:

- `/ask` — legacy top-level URL; redirects to `/inbox`
- `/ask/new` — composer (per-type fields)
- `/ask/[id]` — request detail (asker view + helper review view)
- `/ask/thread/[id]` — post-accept conversation
- Legacy `/mentorship/request/*` and `/mentorship/thread/*` 308 here.

#### 12a. Ask Composer (`/ask/new`)

Type-aware. Helper preferences gate which type can be sent (and to whom).

**Advice form** (collapsed, low-friction):

- one required textarea: "What do you want to ask?"
- AI draft button (Claude Haiku, no invented facts) — populates the textarea given asker + helper profile context
- per-type placeholder seeded from the helper's mentoring topics or current role

**Mentorship form** (sharper, higher-commitment):

- short reason
- help-needed details
- optional background
- mentor's screening responses if enabled

Both forms enforce the helper's `helper_preferences` opt-in (per-type) and mentorship caps server-side.

#### 12b. Ask Review (`/ask/[id]`)

Helper-facing when `helper_id == viewer`. Shows requester summary + the rendered fields for the ask type, with Accept / Decline / leave-pending controls. Mentorship caps + paused state surface here.

#### 12c. Ask Thread (`/ask/thread/[id]`)

Post-accept conversation, gated by acceptance state. Shared shape across types — the only difference is the role label ("Mentor / Mentee" for mentorship asks; "Helper / Asker" for advice asks).

Constraints:

- no built-in scheduler in Phase 1
- no Zoom integration in Phase 1

### 13. Inbox (`/inbox`)

Central unified surface for everything the member should pay attention to. Sections, in render order:

1. **Friend requests** (incoming) — only renders if there are pending requests; accept / decline inline
2. **Incoming asks** — pending advice / mentorship requests directed at the viewer; clicking opens `/ask/[id]`
3. **Active threads** — accepted ask threads (both directions); clicking opens `/ask/thread/[id]`
4. **Direct messages** — DM threads with friends; avatar + last-message preview + unread count + time-ago; clicking opens `/messages/[id]`
5. **Sent requests** — last 20 advice / mentorship requests you've sent with status badges
6. **Sent friend requests** (outgoing pending) — only renders if any are awaiting reply

The inbox subsumes `/friends` (incoming requests), `/messages` (root list), and top-level `/ask` — those URLs now 308 here. `/messages/[id]` (the conversation viewer) and `/ask/*` workflow routes are reached from inbox.

### 14. Direct Message Thread (`/messages/[id]`)

Direct messaging between mutual friends, deep-linked from the Inbox `Direct messages` section.

Main elements:

- "Back to inbox" link
- relationship header (avatar + name + headline; "Read-only" pill if no longer friends)
- realtime thread (Supabase Realtime channel)
- composer (disabled if friendship was revoked)

Read receipts are server-set via `markDmThreadRead` on every load.

## Events And Meetup Experience

### 15. Events List

Purpose:

- show upcoming official events and approved community activity

Main elements:

- upcoming events
- filters
- RSVP status badges

### 16. Event Detail

Purpose:

- show event information and enable RSVP

Main elements:

- date/time
- location/format
- description
- RSVP controls
- reminder status

### 17. Meetup Proposals

**Deferred** post-launch (see `docs/specs/phase-1/post-launch-backlog.md`). The original 20–21 screens are kept here as a placeholder for future phase planning; nothing is built.

## Profile And Settings Experience

### 18. My Profile

Purpose:

- let users view and update their visible identity

Main elements:

- base profile fields (name, headline, city, current title/employer, university/major, career history, education, skills, avatar)
- org-specific profile fields (graduation year, mentoring topics, bio)
- **Update from LinkedIn** action (live import + diff flow; see [profile-enrichment.md](../architecture/profile-enrichment.md) for provider routing)
- AI-assisted resume extraction (Claude Haiku) on the resume upload path
- freshness prompts when the data hasn't been confirmed in N days
- edit actions

### 19. Helper Settings (`/mentorship/settings`)

Purpose:

- let members manage their willingness to help — separately for advice and mentorship.

Main elements:

- two checkboxes: "I'm open to advice asks" / "I'm open to mentorship asks" (both default ON)
- amber caveat copy when either is unchecked, with friction-on-leave to prevent silent disablement
- mentoring topics (chips)
- mentorship-only fieldset: max active mentees, max pending requests, screening questions; dimmed when `open_to_mentorship` is off
- inactivity auto-pause status (paused-while-away)

URL note: the URL is still `/mentorship/settings` for now even though the surface covers both ask types — renaming it (e.g. to `/me/helping`) is deferred until we revisit settings UX.

### 20. Privacy Settings

Purpose:

- manage field-level visibility in the current org

Main elements:

- visibility controls per field
- explanation of friend-only vs org-visible

### 21. Account / Organization Settings

Purpose:

- manage account-level preferences and multi-org membership context

Main elements:

- organization switcher
- notification preferences
- connected import sources

## Admin Experience

### 22. Admin Overview

Purpose:

- operational landing page for admins

Main elements:

- pending approvals
- invite status
- upcoming events
- mentorship activity snapshot
- freshness alerts

### 23. Member Management

Purpose:

- browse and manage org members

Main elements:

- member table
- approval state
- role badges
- profile completeness
- freshness state

### 24. Approval Queue

Purpose:

- review pending members quickly

Main elements:

- applicant list
- supporting context
- approve / reject / request clarification

### 25. Invite Import

Purpose:

- upload alumni CSV and send invites

Main elements:

- file upload
- validation errors
- dedupe states
- invite summary

### 26. Role Management

Purpose:

- assign admins, moderators, and ambassadors

Main elements:

- member selector
- role picker
- permission summary

### 27. Admin Events

Purpose:

- create and manage official events

Main elements:

- event form
- publish controls
- RSVP summary

### 28. Announcements

Purpose:

- send basic org communications

Main elements:

- audience targeting
- message editor
- send controls

### 29. Analytics Dashboard

Purpose:

- show whether the pilot is healthy

Main elements:

- invited to completed-profile rate
- people-search engagement rate
- mentorship request rate
- mentorship response rate
- profile freshness rate
- RSVP activity

### 30. Organization Settings

Purpose:

- manage org-level defaults and configuration

Main elements:

- branding
- required fields
- default visibility rules
- join / approval rules

## Cross-Screen State Model

Several system states appear across many screens and should be modeled consistently.

### Membership States

- invited
- signed up
- pending approval
- approved
- inactive or removed

### Friendship States

- no relationship
- outgoing friend request pending
- incoming friend request pending
- friends

### Ask States

Per-type, since helper opt-ins are independent (`open_to_advice`, `open_to_mentorship`):

- helper closed (per-type opt-out)
- helper open
- helper paused (mentorship-only — auto after 14d inactivity, or manual)
- cap reached (mentorship-only — `max_pending_mentorship` exceeded)
- request draft
- request submitted
- request pending (helper hasn't responded)
- request accepted (thread active)
- request declined

### Profile Freshness States

- recently confirmed
- due for confirmation
- stale

### Meetup States

Deferred. Meetup proposals are out of Phase 1 scope.

## Responsive Web Considerations

Because the MVP is web-first but should remain mobile-friendly:

- people NL search + filter panel collapse cleanly on narrow screens
- profile result cards stack from 3-up → 2-up → 1-up at tablet / mobile breakpoints
- inbox sections stack vertically on mobile (no list-detail split needed; each row links to the type-specific detail page)
- DM thread page is full-width on mobile
- admin tables may require simplified mobile views, but desktop remains primary for admin usage

## Resolved IA Questions

These were the original Open IA Questions. Each is now answered.

1. **Should `Discover` and `Search` stay separate?** No — they merged into a single People surface. `/people` is canonical; `/search` and `/discover` redirect there. The NL search bar lives at the top of the directory; structured filters expand below.
2. **Should `Inbox` include notifications, or should notifications live in a separate tray?** Both. The notifications popover (bell icon, header right-rail) is the realtime tray; `/inbox` is the durable, sectioned list of things still requiring action — friend requests, incoming asks, active threads, DMs, outgoing asks.
3. **Should meetup proposal status live in Events / Inbox / both?** N/A — meetups deferred post-launch.
4. **One combined profile editor or separate base / org editors?** Combined, for now. The `base_profile` / `organization_profile` schema split is preserved server-side for the multi-org future (when Chadwick International onboards as org #2).
5. **How much of mentorship settings in onboarding vs later in Profile?** Settings live at `/mentorship/settings` (helper-side, two checkboxes covering advice + mentorship; both default on with friction-on-leave). Onboarding does not gate on these — the defaults make every new member discoverable as a helper unless they opt out.

## Open Questions (next phase)

- Rename `/mentorship/settings` to something type-neutral (`/me/helping`?) once the helper UX gets a deeper revisit.
- Should `/inbox` get a unified "active conversations" section (combining ask threads + DMs into one polymorphic row)?
- Backfill missing `helper_preferences` rows for existing members so default-on takes effect retroactively (currently 5/10 dev personas lack a row → no opt-in, no opt-out, invisible to the gating).

## Recommended Next Artifact

The next practical artifact is a wireframe brief for any *new* screens before they ship — screen goal, key components, primary CTA, secondary CTA, empty states, error states, and analytics events. The screens listed above are all in production; the next ones to design are whatever shows up in `docs/specs/phase-1/post-launch-backlog.md` first.
