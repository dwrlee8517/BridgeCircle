# BridgeCircle Weeks 3–4 Plan

## Purpose

This document specifies what ships on top of `launch-cut.md` in the second slice of Phase 1. The "weeks 3–4" framing is scope phasing, not a calendar — there is no fixed launch deadline.

These features are additive. If any are deferred, the launch-cut build still stands on its own as a working product.

## Priority Order

Build in this order so the riskiest and most product-important work happens first:

1. LinkedIn import (OAuth + resume upload + LLM extraction)
2. Natural-language search
3. Friendship + direct messaging
4. Field-level privacy UI
5. Admin analytics dashboard
6. Announcements
7. In-app notification tray

If time runs out, cut from the bottom.

## 1. LinkedIn Import

### Goals

- let users prefill profile fields with minimal typing
- make future profile-freshness prompts one-tap instead of manual retyping
- deliver on the "living directory" thesis without relying on scraping

### Scope

Four import paths, offered during profile setup:

**A. Sign in with LinkedIn (OpenID Connect)**
- scopes: `openid profile email`
- fields received: name, email, headline, profile photo
- UX: "Continue with LinkedIn" button on signup; user confirms imported fields before save

**B. Paste LinkedIn URL (link-only)**
- free-text field stored as a display link on the profile
- no scraping, no live fetch, no background sync
- offered for users who don't want PDL lookup (Path D)

**C. Resume upload → LLM extraction**
- user uploads PDF or DOCX resume
- backend worker extracts: current employer, title, past roles, education, skills, location
- extraction uses Claude Haiku with a strict JSON schema response (low cost, fast)
- user reviews extracted fields on a confirm screen before saving
- resume file stored in Supabase Storage private bucket with signed-URL access only

**D. Paste LinkedIn URL → People Data Labs enrichment**
- user pastes their own LinkedIn URL during onboarding
- backend calls PDL Person Enrichment API; returns structured work history, education, skills, headline, summary
- user reviews extracted fields on the same confirm screen as Path C before saving
- 1 credit per call; cache by LinkedIn URL (90-day TTL) so re-enrichment doesn't double-charge
- self-paste only (own URL); no batch lookups, no third-party enrichment without consent
- consent copy shown above the URL field per the brand-voice rule

Paths C and D deliver freshness; A and B are conveniences. C is the resilient fallback for profiles PDL doesn't match (sparse student LinkedIns, regional coverage gaps).

### Explicitly Not In Scope

- live LinkedIn profile scraping (direct browser automation against linkedin.com) — ban risk and ToS breach
- LinkedIn work-history or education import via OAuth (scopes not granted by LinkedIn)
- batch enrichment of existing members without per-user consent
- enrichment of any LinkedIn URL other than the signed-in user's own

### Files Touched

- new: `app/api/linkedin/oauth/callback`
- new: `app/api/resume/extract` (calls Claude)
- new: `app/api/profile/enrich-linkedin` (calls PDL)
- new: `app/src/lib/enrichment/pdl/` (extractor + normalizer; framework-agnostic per `/lib` discipline)
- new: `app/(onboarding)/import` with four path cards
- new migration: `pdl_enrichments` cache table (linkedin_url PK, payload jsonb, fetched_at)

## 2. Natural-Language Search

### Approach

Entity extraction + structured match. Not semantic vector search.

### Pipeline

1. user types one query in the search bar
2. backend calls Claude Haiku with a prompt that extracts: city, role, industry, university, major, mentor_topic, grad_year_range, open_to_mentor
3. backend runs the same structured match used by filter-based search in weeks 1–2
4. results screen shows extracted filters as removable chips so users can correct the LLM
5. user can click a chip to remove it and see results update

### Explicitly Not In Scope

- profile embeddings / vector search
- semantic similarity ranking
- multi-turn refinement or query rewriting

### Cost Sanity Check

At ~200 searches/week, Haiku extraction is under $2/month. Acceptable for pilot.

## 3. Friendship And Direct Messaging

### Scope

- friend request composer with short intro text
- incoming friend requests in inbox (new section)
- accept / decline actions
- mutual-accept rule: no friendship until both parties agree
- direct message threads between friends only
- inbox visually separates friend threads from mentorship threads

### Rules Locked

- declining a friend request is silent to the sender (no notification, no "declined" state surfaced)
- blocking is not in scope for Phase 1; revisit when a real case appears
- once friends, either party can DM; no "request to DM" step

### Data Model Delta

Activate tables already provisioned: `friendship`, `friend_request`, `direct_message_thread`. Share `message` across mentorship and friendship threads with a `thread_type` column.

## 4. Field-Level Privacy UI

### Scope

- one settings screen, one control per field: org-visible / friends-only / hidden
- three-option radio group per field; no custom rules
- defaults at launch match `spec.md`: name/year/city/employer/title/university/major org-visible; social/contact links friends-only
- hidden fields are excluded from both search result payloads and profile detail

### Explicitly Not In Scope

- per-organization privacy rules (single org until Chadwick International onboards)
- viewer-specific visibility (e.g. "only mentors can see X")
- scheduled visibility changes

## 5. Admin Analytics Dashboard

### Metrics (6 cards)

- invited-to-completed-profile rate (30d)
- active members (logged in 30d)
- mentorship request rate (requests per active member, 30d)
- mentorship response rate (requests with a mentor response within 7d)
- profile freshness rate (profiles confirmed in last 6 months — will be near-100% at launch)
- RSVP activity (upcoming event participation)

### Implementation

- Postgres views for each metric
- one API route that returns all cards
- read-only; no export, no date-range picker yet; simple sparklines only

## 6. Announcements

### Scope

- admin composes plain-text announcement; no rich text, no attachments
- audience: all approved org members
- delivery: in-app banner on next login + email via Resend
- announcement history list for admins
- send-now only (no drafts, no scheduling)

## 7. In-App Notification Tray

### Scope

- header bell icon with unread count
- list of notifications with deep links:
  - mentorship request received / accepted / declined
  - friend request received / accepted
  - new message (friendship or mentorship)
  - announcement
  - event RSVP reminder
- mark-as-read on click
- email fallback for anything unread after 24h (uses infra already in place from weeks 1–2)

## Risks And Cut Lines

If weeks 3–4 run long, cut in this order (reverse of priority):

1. In-app notification tray (keep email-only notifications)
2. Announcements (send the first announcement manually via Resend script)
3. Admin analytics dashboard (share via SQL queries to start)
4. Field-level privacy UI (launch defaults cover ~90% of users)

Do not cut:

- LinkedIn import (specifically the resume path — it's the freshness thesis)
- NL search (it's the visible differentiator vs. competitors)
- Friendship + DM (the reconnection half of the product wedge)

## Timeline

| Week | Focus | End-of-Week Gate |
|---|---|---|
| 1 | Auth, profile, admin CSV, approval queue | 5+ seeded profiles, invite → signup works |
| 2 | Search, mentorship flow, events, inbox | core loop works end-to-end for real users |
| 3 | LinkedIn import, NL search, friendship + DM | resume extraction works on 3 real resumes |
| 4 | Privacy UI, analytics, announcements, polish | full regression test the day before the demo |

## Post-Launch Backlog

Items from earlier docs that stay deferred:

- meetup proposals + ambassador role
- multi-org overlay UX (unlocks when Chadwick International joins as org #2)
- saved mentor interest + passive recommendation surface
- periodic profile-refresh prompts with cadence logic
- post-session mentor/mentee feedback loop
- Discover home as a screen separate from Search
