# BridgeCircle Phase 1 Launch Spec

## Purpose

This document defines the first-half build target: the minimum set of features that must be live by the end of week 2 (~2026-05-08) so the rest of Phase 1 can be built on top in weeks 3–4.

It is a strict narrowing of `phase-1-spec.md`. The full Phase 1 vision is unchanged — this doc only specifies what ships first.

## Launch Context

- pilot organizations: Chadwick School (Palos Verdes) and Chadwick International (Songdo)
- hard deadline for full Phase 1 demo: 2026-05-25 alumni board meeting
- week 2 target: core mentorship loop live, seeded mentor supply, ambassadors can onboard their classes
- single-engineer build (founder)

## In Scope For Weeks 1–2

### Auth And Organization Join

- Supabase Auth with Google OAuth and email/password fallback
- invite-token-based signup (token embedded in Resend email link)
- signup validates invite token server-side against the invite table
- after account creation, user lands in organization profile setup
- admin approval toggle per org; default is auto-approve when the invite token is valid (moves the trust check to invite issuance)

### Profile

- single profile per user at launch (base/overlay separation exists in schema but is not exposed in UI)
- required fields: profile picture (recommands professional picture), full name, graduation year, current city, current employer, current title, university, major, open-to-mentor toggle
- optional fields: bio, mentoring topics, LinkedIn URL (stored as a link, no import yet)
- edit and view screens
- no field-level visibility UI at launch — ship with hardcoded defaults from `phase-1-spec.md` (name/year/city/employer/title/university/major org-visible; contact links friends-only)

### Discovery And Search

- single Search screen; home page redirects to search until the Discover home ships in week 3+
- structured filters only: grad year range, city, employer, industry, role, university, major, mentor topic, open-to-mentor
- no natural-language bar at launch
- ranking: open-to-mentor boost → same university → same major → same city → grad-year proximity → string match on role/industry
- result cards show a one-line relevance reason

### Profile Detail

- visible fields per default visibility
- relationship states shown: not-connected, mentorship-request-pending, mentorship-active
- primary actions: send mentorship request (if mentor open); save for later

### Mentorship

- mentor settings: open/closed toggle; optional mentoring topics (controlled list + free-text add); optional one-sentence screening prompt; max active mentees (default 5, editable); max pending requests (default 10, editable)
- mentorship request composer: request reason, what help is needed, optional background, screening answer if applicable
- mentor review: accept, decline, leave pending
- mentorship thread: two-party chat, plain text only (no attachments, no scheduler, no Zoom)
- mentor inactivity auto-pause: mentors who do not respond to any pending request within 14 days are auto-paused with "paused while away" label; unpausing on next login

### Inbox

- mentorship requests (incoming for mentors, outgoing for mentees)
- mentorship threads
- no friendship sections at launch; no notification tray (email only)

### Events (Minimal)

- admin creates events (title, datetime, location, description)
- members see upcoming events list and RSVP (going / not going)
- no reminders beyond a single confirmation email on RSVP
- no meetup proposals; no standalone event detail page (modal is enough)

### Admin

- single-org admin at launch
- CSV upload (name, email, graduation year)
- invite send via Resend, batched
- approval queue (list + approve button)
- member list (name, grad year, status, profile completion)
- event creation

No admin analytics dashboard at launch. Use raw SQL against Supabase for the first two weeks of metrics.

## Explicitly Deferred To Weeks 3–4

See `week-3-4-plan.md`. At a glance:

- friendship requests and direct messaging
- LinkedIn OAuth and resume-upload import
- natural-language search
- field-level privacy UI (defaults still apply at launch)
- admin analytics dashboard
- admin announcements
- in-app notification tray

## Explicitly Deferred Beyond Phase 1

Unchanged from `phase-1-spec.md` and `build-plan.md`:

- meetup proposals
- ambassador role
- multi-org overlay UX (unlock when Chadwick International joins as org #2)
- scheduled mentorship meetings or Zoom integration
- social feed
- saved mentor interest / passive-match notifications
- separate Discover home (Search covers it at launch)

## Data Model At Launch

Present and exposed in UI:

- user
- organization
- organization_membership
- profile
- invite
- mentorship_preference
- mentorship_request
- mentorship_thread
- message
- event
- event_rsvp
- admin_role_assignment
- audit_log

Present in schema but not wired to UI (ready for week 3):

- friendship, friend_request
- direct_message_thread
- announcement
- notification
- profile_refresh_prompt
- saved_search_or_saved_mentor_interest

Keep the `base_profile` / `organization_profile` separation in the schema for multi-org later — but the UI shows one combined profile until Chadwick International onboards as org #2.

## Screen Inventory At Launch

~12 screens:

1. organization join landing (invite token page)
2. sign up / login
3. organization profile setup
4. my profile (view + edit)
5. mentor settings
6. search (filters + results on one page)
7. profile detail
8. mentorship request composer
9. mentorship request review
10. mentorship thread
11. events list
12. admin (overview + CSV upload + approval queue + member list + events, tabbed into one surface)

## Tech Stack

- Frontend: Next.js (App Router) deployed on Railway
- Backend: Next.js API routes + Supabase client
- Database: Supabase Postgres (via Supabase project)
- Auth: Supabase Auth (Google OAuth + email/password)
- Email: Resend with a Chadwick-branded verified sender domain
- Background jobs: Railway worker (invite fan-out, mentor inactivity sweeps, email retries)
- File storage: Supabase Storage (public bucket for avatars, private bucket `resumes` provisioned for week 3)
- Error tracking: Sentry free tier

## Launch Readiness Checklist

Before end of week 2:

- 20–50 real alumni profiles seeded through personal outreach (not auto-populated)
- 10+ mentors marked open-to-mentor
- core loop verified end-to-end: invite → signup → profile → search → mentor request → accept → chat
- Resend production domain verified, SPF/DKIM aligned
- basic Sentry instrumentation on API routes
- at least one real test event on the events list
- admin (you) can approve members from the queue without touching SQL

## Parallel Non-Code Work

These must run alongside the build, not after:

- personal outreach to recruit 20–30 mentors before launch day
- ambassador briefing for the May 25 board meeting: what to say, how to onboard their class in 5 minutes
- invite email copy drafted and tested (subject line drives activation)
- landing copy explaining why BridgeCircle exists specifically for Chadwick — not a generic pitch

