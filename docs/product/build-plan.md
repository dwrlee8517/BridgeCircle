# BridgeCircle Build Plan

## Recommendation

Build the MVP as a web app first, but design the product and backend so mobile can be added without a rewrite.

That means:

- start with one shared backend, one shared data model, and one shared permission system
- make the member experience mobile-responsive from day one
- treat native mobile as a phase-two client, not a separate first launch

## Why Web First

Based on `project-summary.md`, the MVP is centered on:

- verified sign-up
- progressive onboarding
- profile enrichment
- natural-language search
- structured requests for help
- explainable matching
- messaging or intro requests
- event discovery and RSVP
- admin setup, moderation, imports, and analytics

These are better suited to a web-first launch because:

- admins will mostly operate from desktop or laptop
- onboarding, profile setup, and roster import are easier on the web
- search, matching explanations, and moderation tools are easier to design and iterate in a browser first
- launching both web and native mobile immediately adds significant product, design, QA, auth, and release complexity before the core loop is validated

## What To Consider For Mobile From Day One

Even if the first release is web-first, the system should be built so mobile is easy later. Plan for:

- API-first backend design
- token-based auth that can support web and native apps
- notification infrastructure that can later support push, email, and in-app alerts
- reusable design tokens and a consistent component vocabulary
- a clean separation between client UI, business logic, and backend workflows

Do not build the first version as a web-only dead end.

## Product Strategy

The core wedge from `project-summary.md` is not "directory software." It is:

- finding the right person quickly
- asking for help with low friction
- getting useful responses
- returning because the network continues to create value

That should shape the build order. The first product should optimize for one repeated loop:

1. a member joins a verified network
2. they complete a lightweight profile
3. they ask for help or offer help
4. the product finds relevant people
5. they send a request or intro
6. someone responds
7. both users have a reason to come back

If this loop does not work, the rest of the platform will not matter.

## Recommended MVP Scope

### Member MVP

- sign up and login
- verified affiliation or invite-based join flow
- progressive onboarding
- profile creation and profile privacy settings
- help-needed and help-offered preferences
- search with filters plus natural-language query
- ranked match results with explanation
- structured request flow
- direct messaging or intro-request inbox
- event list and RSVP

### Admin MVP

- create organization
- invite members by link or CSV
- verification and approval controls
- privacy defaults
- event creation
- basic announcements
- analytics dashboard for activation, response rate, and profile freshness

### Explicitly Delay

- full native mobile parity
- fundraising products
- heavy social feed mechanics
- complex chapters or subgroup hierarchies
- advanced CRM workflows
- paid marketplace logic

## Build Sequence

## Phase 0: Product Narrowing

Goal: reduce the initial product to one target customer and one primary use case.

Deliverables:

- primary launch segment
- one-sentence value proposition
- top 3 user jobs
- MVP success metrics
- pilot definition

Recommendation:

- start with one customer type such as graduate programs, fellowships, or selective student organizations
- choose one lead use case such as mentorship, referrals, or local networking

Exit criteria:

- you can explain why a member would come back weekly
- you can explain why an admin would pay for the first version

## Phase 1: Product Spec

Goal: turn the concept into a concrete product spec before writing much code.

Deliverables:

- user personas
- member journey map
- admin journey map
- MVP feature list
- non-goals
- data model draft
- permissions model
- analytics event list

Key objects to define:

- organization
- member
- affiliation / verification status
- profile
- offer of help
- request for help
- match result
- intro request or message thread
- event
- RSVP
- admin action log

## Phase 2: UX / Workflow Design

Goal: design the highest-risk flows before implementation.

Deliverables:

- onboarding wireframes
- search and match result wireframes
- structured request flow
- inbox / messaging flow
- admin invite and approval flow
- analytics dashboard sketch

Prioritize these screens:

1. landing / organization invite page
2. join and verify flow
3. onboarding and profile setup
4. search and match results
5. request / intro composer
6. inbox
7. event list
8. admin member approval
9. admin analytics

## Phase 3: Technical Foundation

Goal: set up the minimum architecture that supports web now and mobile later.

Recommended architecture shape:

- web client for members and admins
- backend API layer
- relational database
- search / ranking service
- background jobs for notifications, imports, and profile refresh workflows
- analytics event pipeline
- file storage for profile assets or imports if needed later

Capabilities the backend should own:

- authentication
- authorization
- organization membership rules
- verification workflows
- search and ranking
- messaging / request state
- event and RSVP state
- notification triggers
- moderation and audit logs

Important principle:

- business logic should live in the backend, not only in the web client

That is what keeps mobile feasible later.

## Phase 4: Build The Member Core Loop

Goal: ship the smallest version of the repeat-use member experience.

Suggested order:

1. auth and organization join
2. onboarding and profile setup
3. help-needed / help-offered preferences
4. member directory search with filters
5. match ranking and explanation
6. structured request flow
7. inbox / responses
8. event discovery and RSVP

Focus areas:

- fast time-to-first-value
- trust and privacy clarity
- low-friction ask flow
- visible response outcomes

## Phase 5: Build The Admin Controls

Goal: give admins enough control to launch and maintain a real network.

Suggested order:

1. organization creation
2. invite flow and CSV import
3. member approval queue
4. privacy presets
5. announcement tools
6. event creation and reminders
7. analytics dashboard

Keep the admin side functional, not overbuilt.

## Phase 6: Pilot Launch

Goal: validate whether the network creates repeated member value.

Pilot checklist:

- one launch partner organization
- seeded initial member base
- onboarding instructions
- support process for approvals and issues
- baseline metrics dashboard
- member interview plan

Metrics to watch:

- invited-to-activated conversion
- onboarding completion
- percent of members who search
- percent of searches that lead to requests
- response rate to requests
- repeat sessions per member
- event RSVP rate
- admin weekly active usage

## Phase 7: Mobile Decision Point

Do not build native mobile just because it seems expected. Build it when usage patterns justify it.

Strong signals that native mobile should move up:

- members frequently return for inbox, notifications, and event actions
- admins are not the main power users; members are
- response speed materially affects value
- users want push notifications for requests, intros, and events
- mobile web feels like friction for repeat usage

If these signals appear, the first mobile release should focus on:

- notifications
- inbox
- accepting or replying to requests
- event RSVP and reminders
- lightweight profile updates

Do not start with full admin parity on mobile.

## Practical Platform Recommendation

If you want a simple rule:

- launch with web first
- design the backend and design system for both web and mobile
- add native mobile after you validate repeat engagement and know which mobile behaviors matter

## Suggested Team Order Of Operations

If you are working small, the order should be:

1. product spec
2. wireframes
3. backend data model and permissions
4. web member MVP
5. web admin MVP
6. pilot launch
7. mobile app

## Immediate Next Steps

Here is the most practical next sequence for this repo:

1. create a product requirements document for the MVP
2. define the core data model and permissions model
3. write the member and admin user flows in detail
4. choose the first launch segment and first wedge use case
5. sketch the initial information architecture and screen list
6. choose the technical stack
7. start implementation with the web app and shared backend

## My Recommendation

You should not try to fully build both web and native mobile at the same time for version one.

You should absolutely consider both while designing the system, but you should build web first unless:

- your earliest retention depends heavily on push notifications
- your target users are overwhelmingly mobile-native
- the first critical workflow is mostly real-time and mobile-driven

For BridgeCircle as currently scoped, web-first is the better starting point.
