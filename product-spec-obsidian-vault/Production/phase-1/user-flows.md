# BridgeCircle Phase 1 User Flows

## Purpose

This document turns the Phase 1 spec into concrete user flows for the first pilot.

It focuses on:

- how invited alumni join and become active
- how members discover people and act on that discovery
- how mentors review requests
- how admins launch and operate the organization

These flows are intended to drive:

- information architecture
- wireframes
- backend schema
- permissions rules
- analytics instrumentation

## Primary Actors

### Member

A school alumni user browsing, connecting, messaging friends, requesting mentorship, and participating in community activity.

### Mentor

A member who is open to receiving mentorship requests and can review them.

### Admin

A school staff member or authorized alumni leader who approves members, manages events, and monitors engagement.

### Ambassador / Representative

A delegated community helper who may support meetup review or local coordination.

## Design Principles Behind The Flows

- the app should feel useful quickly, not heavy
- discovery should happen before complexity
- mentorship should be structured enough to feel respectful
- privacy should be understandable at the field level
- admin workflows should be efficient, not overbuilt
- friendship and mentorship should stay distinct

## Flow Priority

The build order should follow these flows in roughly this order:

1. invited member join and onboarding
2. profile browse and search
3. mentorship request and mentor response
4. friendship request and direct messaging
5. events and RSVP
6. meetup proposal and admin review
7. admin invite, approval, and analytics workflows

## Member Journey Map

## Flow M1: Invited Member Joins Organization

### Goal

Get an invited alumni member into the organization with a complete enough profile to browse and search.

### Entry Points

- email invite link
- organization landing page with invite token
- existing user adding another organization to their account later

### Preconditions

- organization exists
- invite link or admin approval path exists
- member is not yet active in this organization

### Happy Path

1. user clicks invite link
2. user lands on organization-branded join page
3. user sees what the organization is, why they were invited, and what they can do after joining
4. user creates account or logs in to an existing account
5. system checks invite token, email match, or pending approval status
6. user enters or confirms required organization profile fields
7. user sees default privacy settings with the option to edit them
8. user chooses mentorship availability status
9. user submits profile
10. if approval is required, account enters pending review
11. if auto-approved, user enters the organization immediately
12. user lands on a first-use home screen focused on profile discovery

### Success State

- organization membership created
- required organization profile complete
- user can browse/search profiles or wait for approval

### Key UX Rules

- the join page should clearly communicate why this community is worth joining
- profile setup should feel short and useful
- privacy defaults should be visible but not overwhelming
- the first post-onboarding screen should immediately show living alumni activity or useful discovery

### Edge Cases

- user was invited with a different email than the one used to sign up
- user already has an account and is joining a second organization
- user starts profile setup and abandons before completion
- user is invited but requires admin approval before access

### Analytics

- invite opened
- account created
- profile setup started
- profile setup completed
- organization membership approved
- first browse/search action

## Flow M2: Existing User Adds Another Organization

### Goal

Allow one existing user to join multiple organizations without recreating their whole identity.

### Happy Path

1. existing user receives invite to second organization
2. user logs in to existing BridgeCircle account
3. system reuses base profile data where possible
4. user completes only organization-specific required fields
5. user reviews organization-specific privacy defaults and mentorship settings
6. membership is created for the second organization

### Success State

- user now belongs to multiple organizations
- one base profile remains intact
- org-specific settings stay separate

## Flow M3: Member Browses Updated Alumni Profiles

### Goal

Make the directory feel alive and useful even before the member takes a high-commitment action.

### Preconditions

- user is approved and logged in
- at least some visible profiles exist in the organization

### Happy Path

1. member lands on a home or discover screen
2. member sees a mix of:
   - recently updated profiles
   - people open to mentor
   - local alumni
   - suggested connections
3. member opens a profile card
4. member sees only the fields permitted by visibility settings
5. member can:
   - browse more profiles
   - run a search
   - send friend request
   - start mentorship request
   - save interest for later

### Success State

- member meaningfully explores the directory
- member understands that the alumni network contains current, relevant people

### Key UX Rules

- the discover screen should show freshness signals such as "updated recently" or "open to mentor"
- profile cards should make relevance obvious quickly
- hidden fields should not create a broken or empty feeling

### Analytics

- discover screen viewed
- profile opened
- recommendation opened
- multiple profiles viewed in a session

## Flow M4: Member Searches For Relevant Alumni

### Goal

Help a member find people relevant to their needs using natural language plus structured filtering.

### Route Ownership

- `/ask?nl=...` is the question-led matching route. It keeps the member's
  typed ask, shows ranked matches, and carries that ask into the request
  composer.
- `/people` is the directory route for broader alumni exploration, structured
  filters, and profile browsing.

### Example Queries

- alumni in San Francisco open to mentoring about consulting
- people who studied computer science and work in healthcare
- recent grads at UCLA in product roles

### Happy Path

1. member enters natural-language query or uses filters
2. system retrieves candidates with the appropriate route contract:
   Ask uses the ADR 0009 hybrid matching target; People remains the broader
   directory/filter route
3. results show why each person matches
4. member optionally sorts or filters further
5. member opens one or more profiles
6. member chooses an action:
   - mentorship request
   - friend request
   - save for later

### Result Ranking Inputs

- direct relevance to the user's natural-language query or saved mentor intent
- retrieval evidence from structured, lexical, and vector sources where Ask
  hybrid matching is enabled
- open to mentor status, treated as a major ranking signal
- same university
- same major
- same city or region
- similar interests
- role or industry match
- alumni proximity or class relationship

### Success State

- search result quality feels high enough that users trust the system
- users can take action from results without friction

### Edge Cases

- too few results
- too many results
- user query is vague
- top matches hide too many fields to be actionable

### Analytics

- search started
- search completed
- search filters applied
- search result clicked
- mentorship request initiated from search

## Flow M5: Member Receives Passive Recommendations

### Goal

Support non-daily users by surfacing relevant people over time.

### Happy Path

1. member expresses mentor interest through behavior or a saved preference
2. system stores the interest
3. when a relevant profile is newly created, updated, or changes mentorship availability, the system creates a recommendation
4. member sees the recommendation in-app or via notification
5. member opens the profile and decides whether to act

### Success State

- member gets value even without running a new search every time

### Important Constraint

- recommendations should help discovery, not overwhelm users

## Flow M6: Member Sends Friend Request

### Goal

Allow members to reconnect socially without going through the mentorship workflow.

### Happy Path

1. member opens a profile
2. member clicks friend request
3. member adds a short introduction
4. recipient receives friend request
5. recipient accepts
6. friendship is created for both users
7. both users now have access to a direct message thread

### Success State

- mutual friendship created
- direct messaging unlocked

### Key Rule

- friendship requires mutual accept
- once a request is accepted, the relationship is mutual in both directions

### Analytics

- friend request sent
- friend request accepted
- first direct message sent

## Flow M7: Friends Direct Message

### Goal

Allow low-friction ongoing conversation between mutual connections.

### Happy Path

1. one friend opens direct message thread
2. user sends message
3. recipient replies
4. thread persists in inbox

### Constraints

- direct messaging exists only for mutual friends
- direct messaging is distinct from mentorship thread state

## Flow M8: Member Sends Mentorship Request

### Goal

Allow a member to ask for mentorship in a respectful, structured way.

### Preconditions

- target user is open to mentor
- requester can view enough profile information to assess fit

### Happy Path

1. member finds a mentor through browse, search, or recommendation
2. member clicks mentorship request
3. member sees mentor-specific expectations if any
4. member writes a request explaining:
   - why they are reaching out
   - what they want help with
   - optional context about themselves
5. if the mentor has screening enabled, member answers screening questions
6. member submits request
7. mentor receives a pending request
8. requester sees request status

### Success State

- mentorship request created
- mentor can review it asynchronously

### Key UX Rules

- requesting help should feel respectful and low-friction
- the system should not force scheduling at this stage
- users should understand that messaging access is gated by mentor acceptance

### Analytics

- mentorship request started
- mentorship request submitted
- screening questions completed

## Flow M9: Mentor Reviews Mentorship Request

### Goal

Give mentors enough structure to feel in control without making review tedious.

### Happy Path

1. mentor receives notification of pending request
2. mentor opens request review screen
3. mentor sees:
   - requester profile summary
   - why they reached out
   - screening answers
   - any shared background or relevance signals
4. mentor chooses:
   - accept
   - decline
   - leave pending for later
5. if accepted, mentorship thread opens
6. if declined, system informs requester in a respectful way

### Mentor Controls

- open or closed to requests
- mentoring topics
- preferred mentee types
- max active mentees
- max pending mentorship requests in inbox
- screening questions

### Success State

- mentor feels in control of their availability
- requester gets a clear outcome

### Capacity Handling

- if the mentor has reached their pending request inbox limit, new requests should be paused, waitlisted, or blocked clearly
- inbox limits should reduce review burden rather than creating hidden failure states

### Open UX Question

- how explicit should declines feel to avoid social anxiety?

### Analytics

- mentorship request opened
- mentorship request accepted
- mentorship request declined
- time to first response

## Flow M10: Mentorship Chat After Acceptance

### Goal

Create a lightweight space for mentorship conversation after consent.

### Happy Path

1. mentor accepts request
2. mentorship thread opens for both users
3. participants exchange messages
4. they coordinate next steps manually

### Constraints

- no scheduling system in Phase 1
- no Zoom integration in Phase 1
- the thread should feel distinct from friend messaging

## Flow M11: Member Views Events And RSVP

### Goal

Help members discover school-related events and respond easily.

### Happy Path

1. member opens events screen
2. member browses upcoming events
3. member opens an event detail page
4. member sees:
   - date and time
   - location or format
   - description
   - RSVP status
5. member RSVPs
6. member receives confirmation and reminder later

### Success State

- member can engage with community events without friction

### Analytics

- event viewed
- RSVP submitted
- reminder opened

## Flow M12: Member Proposes Meetup

### Goal

Let members initiate local community activity without publishing directly to everyone.

### Happy Path

1. member clicks propose meetup
2. member enters:
   - purpose
   - location
   - rough timing
   - intended audience
   - whether it is private, limited, or broader community oriented
3. member submits proposal
4. proposal enters review workflow
5. ambassadors or admins discuss the plan
6. admin approves, requests edits, or declines
7. if approved, the meetup is published according to organization rules

### Success State

- community activity can emerge from members without losing admin oversight

### Analytics

- meetup proposal submitted
- meetup proposal approved
- meetup proposal published

## Admin Journey Map

## Flow A1: Admin Creates Organization And Configures Defaults

### Goal

Prepare the organization for a controlled pilot launch.

### Happy Path

1. admin creates organization
2. admin configures:
   - name
   - branding
   - join policy
   - required profile fields
   - default visibility settings
   - initial roles
3. admin reviews launch readiness checklist

### Success State

- organization is ready to invite members

## Flow A2: Admin Imports Alumni And Sends Invites

### Goal

Seed the first cohort from school-controlled data.

### Likely Input

- CSV with name, email, and graduation year

### Happy Path

1. admin uploads CSV
2. system validates records
3. admin reviews import issues
4. system creates invite records
5. admin sends invitations
6. admin can monitor invite status

### Success State

- initial alumni cohort is invited efficiently

### Edge Cases

- missing email
- duplicate alumni records
- alumni already has account
- invite bounces

### Analytics

- import started
- import completed
- invites sent
- invite acceptance rate

## Flow A3: Admin Reviews Pending Members

### Goal

Keep the network verified and trustworthy.

### Happy Path

1. admin opens approval queue
2. admin sees pending members and relevant evidence
3. admin approves, rejects, or requests clarification
4. approved member gains organization access

### Success State

- legitimate alumni get through quickly
- trust remains high

### Analytics

- approval queue opened
- member approved
- member rejected
- time to approval

## Flow A4: Admin Assigns Roles

### Goal

Distribute operational work without giving everyone full control.

### Happy Path

1. admin opens role management
2. admin assigns users to roles such as:
   - admin
   - event moderator
   - ambassador
3. system updates permissions

### Success State

- community operations can scale beyond one admin

## Flow A5: Admin Creates Event

### Goal

Allow the school to coordinate official community activity.

### Happy Path

1. admin creates event
2. admin enters event details
3. admin chooses visibility and RSVP settings
4. admin publishes event
5. members receive notice
6. admin monitors RSVPs

### Success State

- event is live and trackable

## Flow A6: Admin Reviews Meetup Proposal

### Goal

Provide structured oversight for member-created events or meetups.

### Happy Path

1. admin or ambassador opens pending proposal
2. reviewer evaluates fit, safety, and community value
3. reviewer discusses with representatives if needed
4. admin decides:
   - approve
   - request edits
   - decline
5. if approved, proposal is published in the right format

### Success State

- member-led events can happen without bypassing community governance

## Flow A7: Admin Sends Announcement Or Speaker Outreach

### Goal

Support basic school-led communication without turning the product into a full marketing system.

### Happy Path

1. admin selects audience
2. admin composes announcement or outreach message
3. admin sends it
4. recipients receive in-app and optionally email notification

### Success State

- admins can communicate with the network at a practical level

## Flow A8: Admin Reviews Analytics

### Goal

Help admins understand whether the network is alive and useful.

### Happy Path

1. admin opens analytics dashboard
2. admin sees key metrics:
   - invited to completed-profile rate
   - discovery engagement rate
   - mentorship request rate
   - mentorship response rate
   - profile freshness rate
   - RSVP activity
3. admin identifies where intervention is needed

### Success State

- admin can judge whether the pilot is working

## Cross-Flow Notification Model

Phase 1 should support notifications for:

- invite received
- member approved
- friend request received
- friend request accepted
- mentorship request received
- mentorship request accepted or declined
- new message in friendship thread
- new message in mentorship thread
- event published
- RSVP reminder
- meetup proposal decision
- profile refresh prompt
- relevant recommendation or saved mentor interest match

Notifications should exist in-app first, with email support for critical actions.

## Screen Inventory Implied By These Flows

The current flow set implies at least these Phase 1 screens:

1. organization join landing page
2. sign up / login
3. organization profile setup
4. privacy settings
5. member home / discover
6. search results
7. profile detail
8. friend request composer
9. mentorship request composer
10. mentorship request review
11. inbox
12. friendship chat thread
13. mentorship chat thread
14. events list
15. event detail
16. meetup proposal form
17. admin dashboard
18. admin invite import
19. admin approval queue
20. admin role management
21. admin event creation
22. meetup review queue
23. analytics dashboard

## Highest-Risk UX Areas

These are the flows most likely to expose product problems early:

1. onboarding and required profile setup
2. search result quality and explanation
3. mentorship request composer and review
4. privacy defaults and field-level controls
5. recommendation usefulness

These should be wireframed before lower-risk flows.

## Open Questions To Resolve In Design

1. What should the first home screen emphasize most: recent updates, mentors, or local alumni?
2. How explicit should declines be for mentorship requests?
3. Should profile viewers be visible to the profile owner?
4. How should pending or limited-visibility profiles appear in search results?
5. Should members be able to save searches, save people, or both?
6. How should org-specific profile overlays be edited without confusing users who belong to multiple organizations?
7. What is the minimum useful recommendation cadence before notifications feel noisy?

## Recommended Next Artifact

The next document after this one should be a screen-by-screen information architecture and wireframe plan, because the current flows are now concrete enough to map directly to screens and backend states.
