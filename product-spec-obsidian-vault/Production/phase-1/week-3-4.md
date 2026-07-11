# BridgeCircle Weeks 3–4 Plan

## Purpose

This document specifies what ships on top of `launch-cut.md` in the second slice of Phase 1. The "weeks 3–4" framing is scope phasing, not a calendar — there is no fixed launch deadline.

These features are additive. If any are deferred, the launch-cut build still stands on its own as a working product.

## Priority Order

Build in this order so the riskiest and most product-important work happens first:

1. Profile import and enrichment (LinkdAPI LinkedIn URL import + resume upload + freshness consent)
2. Natural-language search
3. Friendship + direct messaging
4. Field-level privacy UI
5. Admin analytics dashboard
6. Announcements
7. In-app notification tray

If time runs out, cut from the bottom.

## 1. Profile Import And Enrichment

### Goals

- let users prefill profile fields with minimal typing
- make future profile-freshness prompts one-tap instead of manual retyping
- collect explicit consent for ongoing profile freshness checks
- deliver on the "living directory" thesis without first-party LinkedIn scraping

Canonical architecture: [Profile enrichment and freshness](../../../docs/architecture/profile-enrichment.md).

### Scope

Three import paths, offered during profile setup:

**A. Paste LinkedIn URL -> LinkdAPI enrichment (PDL fallback)**
- primary onboarding path
- user pastes their own LinkedIn URL during onboarding
- backend calls LinkdAPI `GET /api/v1/profile/full`; falls back to PDL if LinkdAPI fails or returns low-quality data
- mapped fields: work history, education, skills, headline, city, current employer, current title
- user reviews extracted fields on the same confirm screen as resume extraction before saving
- current assumption: 1 credit per profile pull unless LinkdAPI route-cost overrides change
- cache by normalized LinkedIn URL, LinkedIn username, and provider record id where license terms allow
- self-paste only; no third-party enrichment without consent
- consent copy shown above the URL field per the brand-voice rule

**B. Resume upload -> LLM extraction**
- user uploads PDF, DOCX, or PNG resume/CV
- backend worker extracts: current employer, title, past roles, education, skills, location
- extraction uses Claude Haiku with a strict JSON schema response (low cost, fast)
- user reviews extracted fields on a confirm screen before saving
- resume file stored in Supabase Storage private bucket with signed-URL access only

**C. LinkedIn URL link-only**
- free-text field stored as a display link on the profile
- no live fetch, no background freshness checks
- offered for users who choose `manual_only` or decline enrichment consent

Sign in with LinkedIn can remain a future authentication convenience, but it is not the career-history import path. The available scopes do not provide full work history or education history.

### Freshness Consent

During onboarding, ask every member whether BridgeCircle may help keep the profile current.

Options:

- `review_before_update` - recommended default; BridgeCircle emails proposed changes for confirmation.
- `auto_apply_and_notify` - explicit opt-in; high-confidence professional updates apply automatically and an email summary is sent.
- `manual_only` - no scheduled checks; user can still click **Update from LinkedIn** later.

### Scheduled Freshness

Recurring checks are separate from onboarding import.

- The sweep uses Bright Data's Marketplace Dataset Filter API against the LinkedIn People Profile dataset (`dataset_id = gd_l1viktl72bvl7bjuj0`) — submit member URLs, get back matched records from a pre-cleaned, normalized index. Filter call returns a `snapshot_id`; poll the Deliver Snapshot endpoint, then download.
- LinkdAPI is the escalation path for URLs that miss in Bright Data's corpus three sweeps in a row (default ~3 months). PDL is the last resort if both fail.
- The first pilot should cap PDL fallback at 90 successful calls per month so a noisy provider batch does not create surprise cost.
- For a 1,000-member organization, a monthly sweep on Bright Data Filter API is about `$30/year` at list rate. Bright Data miss → LinkdAPI fallback adds ~`$10/year` at 10% miss rate. PDL fits inside its free 100-credit/month envelope.
- Bright Data's dataset refreshes on a rolling per-record schedule averaging monthly; worst-case latency between a LinkedIn change and a sweep-triggered proposal is ~60 days. Users who need fresher data click **Update from LinkedIn** on their profile, which routes through LinkdAPI live.

### Explicitly Not In Scope

- first-party LinkedIn profile scraping or browser automation against linkedin.com
- LinkedIn work-history or education import via OAuth (scopes not granted by LinkedIn)
- batch enrichment of existing members without per-user consent
- enrichment of any LinkedIn URL other than the signed-in user's own
- contact enrichment for outreach

### Files Touched

As shipped (paths reflect the actual landed code; the original plan called these `lib/profile-enrichment/*` but the implementation lives under `lib/enrichment/`):

- existing: `app/src/lib/resume/extract.ts` (Claude Haiku resume extraction — unchanged)
- new: `app/src/lib/enrichment/types.ts` (`EnrichmentProvider` interface + tagged-union results)
- new: `app/src/lib/enrichment/providers/{linkdapi,brightdata,pdl}.ts` (per-provider HTTP clients)
- new: `app/src/lib/enrichment/mappers/{linkdapi,brightdata,pdl}.ts` (provider response → `ExtractedProfile`)
- new: `app/src/lib/enrichment/fingerprint.ts` (Bright Data-shaped projection + sha256 hash)
- new: `app/src/lib/enrichment/quality.ts` (name-similarity, drop-detection, placeholder gates)
- new: `app/src/lib/enrichment/registry.ts` (config-flag routing of primary + fallback chain per job)
- new: `app/src/lib/enrichment/onboardingFetch.ts` (paste-URL → ExtractedProfile)
- new: `app/src/lib/enrichment/manualRefresh.ts` ("Update from LinkedIn" → diff → proposal-or-no-change)
- new: `app/src/lib/enrichment/applyProposal.ts` (accept/decline + fingerprint refresh)
- new: `app/src/lib/enrichment/sweep.ts` (monthly start + 5-min poll, processes records into proposals)
- new: `app/src/lib/enrichment/verifyProposalToken.ts` (email-link token validator)
- new: `app/src/lib/enrichment/persistSettings.ts` (settings upsert + freshness policy)
- modified: `app/src/app/(member)/profile/import/page.tsx` accepts `?source=linkedin`, reuses the same confirm UI
- new: `app/src/app/(member)/profile/import/confirm-step.tsx` (shared dual-seed review surface)
- new: `app/src/app/(member)/profile/proposals/[id]/` (session-authed proposal review)
- new: `app/src/app/proposals/[id]/` (root-level, token-authed; reached via email links)
- new: `app/src/app/api/cron/enrichment-sweep-{start,poll}/route.ts` (pg_cron entry points, shared-secret auth)
- new: `app/src/notify/emails/proposal-{review,applied}-email.tsx` + Resend wrappers
- onboarding wire: inline import prompt across steps 2/3/4 linking to `/onboarding/import` for LinkedIn URL or PDF/DOCX/PNG resume-CV upload + freshness consent radio on step 5
- profile edit: **Update from LinkedIn** form button (live LinkdAPI fetch + diff)
- migrations: `profile_enrichment_settings`, `profile_enrichment_runs`, `profile_change_proposals`, `enrichment_sweep_jobs`

## 2. Natural-Language Search

### Approach

Historical Phase 1 baseline: entity extraction + structured match, not
semantic vector search.

This shipped baseline is superseded for the default Ask matching target by
[ADR 0009](../../../docs/decisions/0009-hybrid-ask-matching.md): hybrid retrieval
(structured + lexical + vector), warm-network scoring, and LLM rerank. People
directory search can still use the bounded Phase 1 path where directory-style
filtering is the intended behavior.

### Pipeline

1. user types one query in the search bar
2. backend calls Claude Haiku with a prompt that extracts: city, role, industry, university, major, mentor_topic, grad_year_range, open_to_mentor
3. backend runs the same structured match used by filter-based search in weeks 1–2
4. results screen shows extracted filters as removable chips so users can correct the LLM
5. user can click a chip to remove it and see results update

### Explicitly Not In Scope

- unbounded agentic matching as the default search path
- vector-only matching without hard gates, lexical search, warm-network scoring,
  privacy filtering, and fallback behavior
- multi-turn refinement or query rewriting for the Phase 1 search box

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

- profile import and enrichment (LinkdAPI onboarding import plus resume fallback are the freshness thesis)
- NL search (it's the visible differentiator vs. competitors)
- Friendship + DM (the reconnection half of the product wedge)

## Timeline

| Week | Focus | End-of-Week Gate |
|---|---|---|
| 1 | Auth, profile, admin CSV, approval queue | 5+ seeded profiles, invite → signup works |
| 2 | Search, mentorship flow, events, inbox | core loop works end-to-end for real users |
| 3 | Profile import/enrichment, NL search, friendship + DM | LinkdAPI LinkedIn URL import and resume extraction both produce reviewable profiles |
| 4 | Privacy UI, analytics, announcements, polish | full regression test the day before the demo |

## Post-Launch Backlog

Items from earlier docs that stay deferred:

- meetup proposals + ambassador role
- multi-org overlay UX (unlocks when Chadwick International joins as org #2)
- saved mentor interest + passive recommendation surface
- advanced profile-refresh cadence tuning beyond the first monthly/quarterly policy
- post-session mentor/mentee feedback loop
- Discover home as a screen separate from Search
