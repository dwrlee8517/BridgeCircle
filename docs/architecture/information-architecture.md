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

- question-driven help is the center of the product — members should start with what they are trying to figure out
- people-finding supports asking and helping; the directory is exploration, not the only product center
- request state after creation belongs in Inbox
- onboarding is short and clearly tied to value
- profile visibility and relationship state are understandable
- friendship and asks (advice + mentorship) feel related but the gates remain distinct: DMs require mutual friendship; asks require helper acceptance
- admin tools live under their own slot (`/admin`) rather than mixing into member nav
- the first release optimizes for responsive web, not native-mobile parity

## Product Areas

Phase 1 breaks into five major areas:

1. authentication and organization onboarding
2. member ask and help workflows
3. member people exploration
4. school pulse: events and announcements
5. admin operations and analytics

## Top-Level Navigation

### Member Navigation (current)

Member top nav has **five** items, in this order, defined by `MEMBER_NAV_LINKS` in `app/src/app/(member)/nav-links.ts`:

1. **Ask** — natural-language question → hybrid retrieved and explained people matches → guided ask composer
2. **Help** — supply-side surface for requests needing reply and people the viewer could help
3. **People** — alumni exploration; NL search + structured filters + "People I know" toggle; result cards are match briefs
4. **School** — events and announcements in one member-facing pulse hub
5. **Inbox** — unified request lifecycle: needs reply, helping, getting help, connections, direct messages

Admins see an additional slot ("Admin") that links to `/admin/invite`.

The mobile dropdown in `member-header.tsx` reads from the same `MEMBER_NAV_LINKS` array, so desktop and mobile cannot drift.

Global utilities (header right-rail):

- inline search field (submits to `/people?q=`)
- notifications bell (toast + popover, deep-links into the relevant detail surface)
- helper settings (gear icon → `/mentorship/settings`)
- account menu (sign out, organization switcher when multi-org)

### How we got here (post-launch IA reorg)

The original Phase 1 plan was a 7–8-item nav (Search, Inbox, Messages, Friends, Events, Announcements, plus Profile). The current IA keeps member nav focused on the two-sided help loop:

| Was | Where it went | Why |
|---|---|---|
| Search / Discover | **People** | Exploration remains one click away, but Ask is the primary intent surface |
| Mentorship requests | **Ask** + workflow routes (`/ask/new`, `/ask/[id]`, `/ask/thread/[id]`) | Lower the barrier to asking from a natural-language question |
| Helper supply | **Help** | Older alumni need a natural place to give help without browsing everything |
| Friends | Folded into People (`peopleIKnow` filter + Friend badge); incoming requests moved to Inbox | Friendship is one dimension of people search, not its own page |
| Messages (list) | Folded into Inbox; conversation page `/messages/[id]` kept | DMs are inbox-style — no second list surface needed |
| Events + Announcements | **School** | School connection needs one calm place instead of separate member nav items |

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

### 7. Home (`/`) — merged home/ask surface

Home IS the ask entry moment (merged 2026-06-11; `ask-home.tsx`). The
pre-merge split — a home hero with its own ask bar plus a separate /ask
starter — duplicated the front door and kept the trust scaffolding (social
proof, the two-sided "how asking works") off the page members actually land
on. One component now renders at `/`, at `/ask` without a query, and behind
the composer sheet via `ask/default.tsx`. The Ask nav tab points at `/` and
highlights on both routes.

Purpose:

- make the help-network promise obvious immediately: ask your school circle, help where your experience matters

Main elements:

- announcement strip (latest announcement or next event)
- warm-Ink editorial band with personal kicker (class year · org) and greeting headline
- large natural-language ask bar (multi-line, overlapping the band)
- the member's open standing ask (expiry, match count, close)
- "Your asks" rail — recent outgoing asks with lifecycle states
- example asks ("Not sure how to put it?")
- "People who can help you" carousel — one suggested helper at a time
  (arrows + dots, no auto-advance, capped at 5, count line hides below
  5 open helpers)
- "How asking works" 3-step strip (permanent — states the decline buffer)

Primary actions:

- ask a question → `/ask?nl=...` (results)
- ask a suggested helper → composer sheet
- review help requests → `/help` or `/inbox`

### 8. People (`/people`)

Purpose:

- broad alumni exploration. Ask is the primary question-driven matching surface; People remains the directory/search workspace.

Main elements:

- editorial hero ("Explore the school circle")
- natural-language search bar (one input, submits as `?nl=`)
- collapsible Filters panel: city, employer, university, major, mentor topic, grad-year range, "Open to mentorship", **"Only people I know"**
- match-brief result cards: name + role + class year, helper availability, why match, profile and ask CTAs, optional rationale panel for NL hits

Ranking emphasis:

- People keeps directory-oriented ranking: structured filters, lexical/name
  search, helper availability, shared school/major/city, grad-year proximity,
  and profile match evidence.
- Ask owns question-led matching. Its target architecture is separate: hard
  gates, structured + lexical + vector candidate retrieval, warm-network
  scoring, and LLM rerank over privacy-allowed evidence.

Behavior notes:

- The default path still uses entity extraction + structured search + Haiku
  rerank unless `ASK_MATCHING_PIPELINE=voyage_hybrid` and `VOYAGE_API_KEY` are
  configured. ADR 0009's Voyage hybrid implementation exists behind that flag;
  do not present either path without naming which runtime mode is active.
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

### 12. Ask Surface And Workflow Routes (`/ask/*`)

Ask is now the primary top-level member surface. The user starts with a
natural-language question, sees explained people matches, and then enters the
guided composer for a specific helper. The accepted target matching architecture
is hybrid retrieval + warm-network scoring + LLM rerank ([ADR 0009](../decisions/0009-hybrid-ask-matching.md)).
Inbox owns request state after creation. The underlying ask model remains
polymorphic (`ask_type` enum: `advice` | `mentorship`).

**Starter state** (`/ask` with no query): renders the merged home/ask
surface (see § 7 Home) — same component, same front door. `?edit=1&nl=…`
re-opens it with the bar prefilled and focused.

**Results state** (`/ask?nl=…`): two-column brief. Left rail = the ask as an
object (quoted member text, Edit ask, "How we read it" tags surfaced from
the extractor's structured reading, match/open counts, opt-in privacy line).
Main column = one featured "Strongest fit" card with full rationale, then
compact "Also worth asking" rows. Card actions stay Electric Sky per the
amber-scarcity rule.

**Composer panel**: soft navigations to `/ask/new` are intercepted into a
right-side sheet over the current page (Next parallel + intercepting routes
under `ask/@sheet`), so composing never loses the result list. Hard loads
and shared links still render the full `/ask/new` page. Amber appears once,
on the send action inside the composer.

**Standing asks** (bounded slice of "passive matching", approved
2026-06-11): when results come up empty, the member can keep the ask open
(`open_asks`, one per member per org, 14-day TTL, auto-expires). A nightly
service sweep (`scripts/sweep-open-asks.ts` → `lib/asks/openAskSweep.ts`)
re-matches through the same pipeline and notifies the asker with a count on
new strong fits; the asker meets the helper by re-running the ask — helper
identities never travel through notifications or client-readable rows
(`open_ask_matches` is service-role only). The starter shows the open ask
with expiry + honest match count and a Close action. Helper-side /help
surfacing is deliberately deferred until creation/match data justifies it.

Sub-pages:

- `/ask` — question-driven matching surface (starter + results states)
- `/ask/new` — composer (per-type fields; also rendered as the intercepted side sheet)
- `/ask/[id]` — request detail (asker view + helper review view)
- `/ask/thread/[id]` — post-accept conversation
- Legacy `/mentorship/request/*` and `/mentorship/thread/*` 308 here.

### 12a. Help Surface (`/help`)

Supply-side surface for alumni who want to help without treating every interaction as formal mentorship.

Main elements:

- requests needing the viewer's reply
- people the viewer could plausibly help
- helper availability settings CTA
- profile freshness CTA because accurate profiles improve routing

#### 12b. Ask Composer (`/ask/new`)

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

#### 12c. Ask Review (`/ask/[id]`)

Helper-facing when `helper_id == viewer`. Shows requester summary + the rendered fields for the ask type, with Accept / Decline / leave-pending controls. Mentorship caps + paused state surface here.

Asker-facing (the post-send loop, added 2026-06-11): a "What happens next"
timeline (sent → they see it → reply-or-pass → auto-expiry at 14 days,
enforced by the nightly sweep in `scripts/sweep-open-asks.ts`); one gentle
reminder per ask, unlocked after 7 quiet days (`asks.reminder_sent_at`,
service-role write — column-level grant keeps it out of client reach), which
resurfaces the ask neutrally on the helper's side; and on decline/expiry,
dignity copy ("declined" never faces the asker) plus a streamed next-best
alternative from the live matcher (strong matches only, prior helpers
excluded, the note carries over via composer prefill).

#### 12d. Ask Thread (`/ask/thread/[id]`)

Post-accept conversation, gated by acceptance state. Shared shape across types — the only difference is the role label ("Mentor / Mentee" for mentorship asks; "Helper / Asker" for advice asks).

Constraints:

- no built-in scheduler in Phase 1
- no Zoom integration in Phase 1

### 13. Inbox (`/inbox`)

Central unified surface for everything the member should pay attention to. The durable buckets are:

1. **Needs reply** — incoming asks, incoming friend requests, and unread conversations
2. **I'm helping** — pending and active asks where the viewer is the helper
3. **I'm getting help** — sent and active asks where the viewer is the asker
4. **Connections** — friend requests and direct messages
5. **Archived** — reserved for closed/completed conversations

The inbox subsumes `/friends` (incoming requests) and `/messages` (root list). `/messages/[id]` (the conversation viewer) and `/ask/*` workflow routes are reached from inbox.

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
