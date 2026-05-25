# BridgeCircle Feature Roadmap

**Status:** v1 · 2026-05-24
**Companion docs:** [brand-strategy.md](./brand-strategy.md) (positioning), [voice-guidelines.md](./voice-guidelines.md) (voice)

---

## Purpose

This document describes the phased feature roadmap, pricing tiers, and out-of-scope guardrails for BridgeCircle. It is intentionally separate from positioning (in [brand-strategy.md](./brand-strategy.md)) so feature scope can evolve without re-litigating the brand thesis.

Every feature in every phase must reinforce the same promise:

> Help people feel safe asking for help, proud to offer help, and more connected to the circles that shaped them.

If a proposed feature does not, it does not belong here.

## Differentiating capability

AI matching alone is not differentiation — every competitor claims it. BridgeCircle differentiates only if it owns the whole relationship path:

1. Understand the member's need.
2. Suggest relevant people.
3. Explain why each person fits.
4. Help write the ask.
5. Respect privacy and mentor capacity.
6. Route communication through appropriate channels.
7. Track whether support actually happened.
8. Suggest events, programs, or collaborations when enough people cluster.
9. Bridge online discovery into in-person connection.

The defensible product is not "AI search." It is **relationship activation intelligence for trusted communities.**

## Capability families

### A. Automatic connection suggestions

Members should not start from a blank search box. The product should proactively suggest:

- mentors based on school, career path, location, interests, and availability
- mutual friends or classmates in the same city
- alumni in the same profession or company
- people at similar life stages
- people who recently updated their profile and now match a need
- alumni who are likely to respond because they are open, active, and not overloaded

Suggestions are differentiated when they are: verified, permission-aware, explained in plain language, tied to a clear next action, and respectful of mentor availability.

### B. AI-assisted request writing

One of the most important features in the product. People fail to ask not because they lack access, but because the ask feels awkward.

Request types to support: career exploration · resume review · referral advice · college or graduate school advice · industry overview · local introduction · founder or investor advice · moving to a city · first job search · returning to Korea or moving internationally.

The assistant helps with: a short subject line · a 3-5 sentence request · why this person was chosen · a bounded time ask · tone adjustment · optional background · a respectful close.

The product must never make requests feel mass-generated. It helps members express a real need clearly. See [voice-guidelines.md §10.3](./voice-guidelines.md) for AI-drafted message style rules.

**Mediator extension (Phase 2 — "Let BridgeCircle ask for you"):** at the compose step of the ask wizard, the member chooses between sending directly or letting BridgeCircle reach out on their behalf in the coordinator's voice. The system approaches potential helpers sequentially (one at a time, 48h silent timeout); helpers accept or decline; when a helper accepts, the member is notified and the conversation begins. Helper declines are never surfaced to the asker. The AI remains unnamed and quietly disclosed via a persistent badge. Full design in [specs/ask-mediator.md](../specs/ask-mediator.md).

### C. Easier profile freshness

Fresh profiles are essential. Stale profiles destroy trust. The product supports:

- resume upload and extraction
- LinkedIn screenshot upload and extraction
- pasted LinkedIn URL as a profile link
- future vetted third-party enrichment only with explicit user permission
- periodic "is this still current?" prompts
- event- or campaign-based refresh prompts
- "last confirmed" signals
- user confirmation before any profile change is saved

**Hard constraint:** do not build the product around unrestricted LinkedIn scraping. The safe product promise is: **import, suggest, confirm.** Never silently overwrite member profiles.

### D. Multiple communication channels

The app is the system of record but not the only channel. Support:

- in-app requests and messages
- email notifications
- reply-by-email
- digest emails
- SMS or WhatsApp (later, explicit opt-in)
- admin-sent event invitations
- partner-hosted session invitations approved by admins

Alumni do not want another app to check daily. Meet members where they already are; keep consent and state inside the product.

### E. Admin intelligence

Admins do not just manage records. The product helps them notice what the community wants to become:

- cities with enough alumni density for a meetup
- professions with enough student and alumni interest for a panel
- mentors who are active and could be highlighted
- cohorts with weak activation
- regions where alumni are clustered but disconnected
- members who should refresh profiles
- event themes based on member location, professions, and interests
- potential invite lists for events or bridge programs

Example admin insight (admin voice — see [voice-guidelines.md §11.1](./voice-guidelines.md)):

> 42 alumni in the Bay Area · 18 in technology · 7 open mentors · 11 students interested in product or engineering. Consider a Bay Area product careers night.

### F. Event suggestions based on real clusters

Turn online data into offline connection. Suggested event types: local alumni dinner · young alumni mixer · career panel · founder or investor salon · mentor office hours · student send-off · industry roundtable · company-hosted career session · cross-circle regional gathering · class-year reunion warmup.

The key is **event imagination**, not event management:

> What gathering would make sense for this community right now?

### G. Bridge programs

Admin-led, time-bound collaborations between trusted communities. Not permanent network merges.

They can happen around: a region · a profession · an interest · a company · a life stage · a school partnership · a sponsored opportunity · an event.

Examples:

- Chadwick and Chadwick International Seoul alumni dinner
- Bay Area private school alumni product night
- AI and biotech career panel across three schools
- consulting interview prep office hours across partner institutions
- young alumni mixer in Los Angeles
- Korean international school alumni meetup in New York
- founder and investor salon across trusted circles

**Rules:** admin-led · time-bound · purpose-specific · opt-in by participating institutions · clear member consent · no global cross-school directory by default · company or sponsor participation requires admin approval · follow-up suggestions scoped to participants or opted-in members.

One of the strongest long-term brand differentiators.

### I. Conditional RSVP — "I'll go if…"

Members RSVP with an optional private condition. The system matches conditions in the background; when a match exists, both members are notified and offered a chance to lock in their RSVP.

Three match types, sequenced:

- **Peer / symmetric** — "I'll go if my classmates are there" matches another classmate writing the same kind of condition (class year, school, city, friend graph).
- **Profile-filter** — "I'll go if there are people in software engineering" matches when a member whose profile satisfies the filter RSVPs.
- **Help-need** — "I'll go if there are people who want to learn software engineering" matches a helper to a learner whose open ask is on the same topic. Bridges into the asks system.

The brand-fit value: this directly addresses the embarrassed asker ([voice-guidelines.md §3](./voice-guidelines.md)), whose silent reason for skipping events is "I won't know anyone." Privacy stays default-private with a per-RSVP public toggle; matches are notify-and-ask, never auto-flip. Full design in [specs/events-conditional-rsvp.md](../specs/events-conditional-rsvp.md).

### H. Partner-hosted opportunities

Companies can later host useful sessions for specific alumni pools or regions. This should not feel like advertising. It should feel like opportunity.

Good examples: product careers session hosted by an alumni-led company · biotech dinner for alumni and students in Boston · consulting prep night sponsored by a firm · founder panel hosted by a venture fund · Seoul tech careers night with relevant alumni mentors.

**Trust rule:** members should feel invited to something useful, not targeted by an advertiser. See [voice-guidelines.md §11.2](./voice-guidelines.md) for required labeling and tone.

---

## Phase 1 — Prove the core circle

**Goal:** make one trusted circle useful.

- verified invite onboarding
- easy profile completion
- resume import
- natural-language search
- explainable match reasons
- structured mentorship request
- AI-assisted request writing
- mentor availability and capacity
- email notifications
- admin invite and activation dashboard

**Do not** overbuild cross-circle yet.

## Phase 2 — Make the circle feel alive

**Goal:** members should see relevant people and reasons to return without always searching.

- automatic mentor suggestions
- mutual friend and classmate suggestions
- nearby alumni suggestions
- profile freshness prompts
- suggested people on home
- request templates
- mentor response nudges
- in-app and email notification improvements
- admin insights for weak cohorts or inactive regions
- conditional event RSVP — "I'll go if…" with peer matching ([spec](../specs/events-conditional-rsvp.md)); profile-filter and help-need variants follow in v1.1 / v1.2
- ask mediator — "Let BridgeCircle ask for you" send option in the ask wizard ([spec](../specs/ask-mediator.md)); sequential helper outreach with silent declines, AI stays unnamed and disclosed via badge

## Phase 3 — Turn data into gatherings

**Goal:** use online intelligence to create in-person connection.

- region/profession/interest clustering
- event suggestions for admins
- suggested invite lists
- post-event follow-up suggestions
- local circle pages
- event health metrics
- "who should meet at this event" suggestions

## Phase 4 — Bridge programs

**Goal:** let trusted circles collaborate without losing trust.

- admin-approved cross-circle event setup
- temporary shared event pages
- participant opt-in
- cross-circle invite lists
- scoped participant directory
- post-event connection suggestions
- shared event analytics for participating admins

## Phase 5 — Partner opportunities

**Goal:** let companies and organizations create useful, approved opportunities for relevant circles.

- sponsor/partner proposal workflow
- admin approval
- transparent labeling (per [voice-guidelines.md §11.2](./voice-guidelines.md))
- member opt-in
- suggested audience fit
- event/session performance reporting
- sponsorship package tracking

---

## Pricing logic

Higher pricing is justified only if BridgeCircle sells **outcomes**, not AI.

**Weak pricing basis:** "AI search" · "AI matching" · "smart platform" · "agent system."

**Strong pricing basis:** more useful alumni connections · higher mentor response rates · fresher profile data · better student and recent-grad support · regional event opportunities · board-ready community health reporting · cross-circle programming · sponsor-ready, admin-approved opportunities.

### Tier: Starter Circle

For one organization proving basic alumni activation.

- verified membership · profiles · search · mentorship requests · events · basic admin tools · basic analytics

### Tier: Active Circle

For organizations that want the network to suggest and nudge valuable connections.

- automatic mentor suggestions · AI-assisted request writing · profile freshness tools · richer admin insights · email/digest workflows · response-rate analytics

### Tier: Network Intelligence

For organizations that want BridgeCircle to recommend programming and help admins activate regions, professions, and cohorts.

- region/profession/interest clustering · event suggestions · suggested invite lists · advanced community health dashboard · profile freshness campaigns · deeper recommendation logic

### Tier: Bridge Programs

For trusted cross-circle collaborations. Could be priced as: premium tier · per-program fee · per-event fee · participating institution fee.

### Tier: Partner Opportunities

Later revenue layer. Could be priced as: sponsorship package · campaign fee · event hosting fee · revenue share. This comes later, after trust and density exist.

---

## What not to build yet

Avoid until the core loop is proven:

- broad social feed
- generic forums
- global cross-school directory
- ad marketplace
- paid mentoring marketplace
- full fundraising suite
- CRM replacement
- fully autonomous event planning
- unrestricted LinkedIn scraping
- native mobile before repeat engagement is proven

These may seem attractive but dilute trust and warmth.

---

## Success metrics

Measure relationship outcomes, not software usage.

**Core metrics:** invited-to-joined conversion · profile completion rate · profile freshness rate · suggested-person click rate · search-to-request conversion · AI draft accepted-or-edited rate · mentorship request response rate · time to first response · accepted request rate · repeat request or repeat response rate · mentor overload rate · event suggestion to event creation rate · event RSVP and attendance · post-event follow-up connections · admin weekly active usage.

**North-star metric:**

> Useful connections created per active member.

A useful connection means: mentorship request accepted · two-way message exchange · event attendance · post-event follow-up · friend request accepted · member-marked helpful conversation.

---

## Maintainability principles

The intelligence layer must be controlled, not magical.

**Avoid:** open-ended agents querying everything freely · unrestricted scraping as core infrastructure · LLMs as the source of truth · hidden profile updates · automatic sponsor targeting · complicated one-off workflows · recommendations with no evaluation loop.

**Prefer:** structured profile data · explicit permission checks · bounded recommendation types · cached recommendation jobs · clear ranking signals · human-readable explanations · admin approval for events and sponsor activity · user confirmation before profile changes · measurable feedback on whether suggestions were useful.

**Recommended intelligence pipeline:**

1. Understand intent.
2. Convert intent into structured filters and themes.
3. Query only permission-safe data.
4. Retrieve candidates from SQL and, later, embeddings.
5. Rank by relevance, availability, freshness, relationship path, and response likelihood.
6. Explain the suggestion in plain language ([voice-guidelines.md §10](./voice-guidelines.md)).
7. Suggest the next action.
8. Help draft the message or invite.
9. Track the outcome.

---

## Core product loops

### Member help loop

1. Member states a need or opens suggested people.
2. BridgeCircle recommends relevant people.
3. Member understands why each person fits.
4. BridgeCircle helps draft a respectful ask.
5. Request is sent through in-app and email.
6. Mentor responds.
7. Conversation or meeting happens.
8. Product learns whether it was useful.

### Mentor giving loop

1. Mentor sets what they can help with.
2. BridgeCircle sends only relevant, bounded requests.
3. Mentor accepts, declines, or suggests a lighter next step.
4. Mentor feels useful without being overwhelmed.
5. Mentor remains open because the burden is controlled.

### Admin activation loop

1. Admin invites a cohort.
2. Members join and refresh profiles.
3. BridgeCircle identifies clusters and gaps.
4. Admin sees suggested actions.
5. Admin launches a nudge, event, or mentor push.
6. Community health improves.
7. Admin reports outcomes to leadership or board.

### Bridge program loop

1. Admins identify a shared opportunity.
2. BridgeCircle suggests relevant participant pools.
3. Admins approve the collaboration.
4. Members opt in or are clearly invited.
5. Event or session happens.
6. Participants receive thoughtful follow-up suggestions.
7. Circles stay separate, but the bridge creates new relationships.

---

## Changelog

- **2026-05-24 — v1.** Extracted phases, pricing, success metrics, intelligence pipeline, and out-of-scope guardrails from the original combined `brand-strategy.md`. Capability families A–H added as a single-place reference for what each phase draws on.
