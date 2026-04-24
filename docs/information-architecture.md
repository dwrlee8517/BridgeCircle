# BridgeCircle Phase 1 Information Architecture

## Purpose

This document translates the Phase 1 spec and user flows into:

- top-level product structure
- navigation model
- screen inventory
- screen responsibilities
- major states and transitions
- wireframe priorities

It is intended to guide:

- wireframing
- component planning
- route structure
- backend/API design

## IA Principles

- discovery should be the center of the product
- onboarding should be short and clearly tied to value
- profile visibility and relationship state should be understandable
- mentorship and friendship should feel related but distinct
- admin tools should be separated from member tools
- the first release should optimize for responsive web, not native-mobile parity

## Product Areas

Phase 1 breaks into four major areas:

1. authentication and organization onboarding
2. member discovery and relationship workflows
3. events and meetup participation
4. admin operations and analytics

## Top-Level Navigation

## Member Navigation

Recommended primary member navigation:

1. Discover
2. Search
3. Events
4. Inbox
5. Profile

Recommended global utilities:

- organization switcher
- notifications
- settings

### Why This Structure

- `Discover` supports passive browsing and recommendations
- `Search` supports deliberate lookup and mentor finding
- `Events` groups RSVP and local activity
- `Inbox` holds friend requests, mentorship requests, and message threads
- `Profile` gives users one place to manage visibility, mentorship settings, and org-specific info

## Admin Navigation

Admins should have access to a separate management area rather than mixing everything into the member navigation.

Recommended admin navigation:

1. Overview
2. Members
3. Invites
4. Events
5. Meetups
6. Announcements
7. Analytics
8. Settings

## Organization Context Model

Because one user can belong to multiple organizations, organization context should always be explicit.

Requirements:

- current organization should be shown in the header
- switching organizations should update discovery, search, events, inbox context, and admin context
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

- support optional LinkedIn import and confirm
- allow manual enrichment
- optionally support resume / screenshot upload later

Main elements:

- import source options
- preview of extracted fields
- accept / reject changes

This may be part of onboarding or a secondary flow from Profile.

## Member Experience

### 7. Discover Home

Purpose:

- make the network feel alive immediately

Main elements:

- recently updated alumni
- open-to-mentor highlights
- local alumni
- recommended profiles
- saved mentor interest suggestions
- recent event highlights

Primary actions:

- open profile
- run search
- send friend request
- start mentorship request

### 8. Search

Purpose:

- support deliberate discovery with natural-language search and filters

Main elements:

- natural-language search bar
- structured filters
- sort controls
- saved search / saved mentor interest controls
- result explanation

### 9. Search Results

Purpose:

- show ranked results with clear match reasoning

Main elements:

- result cards
- visible profile summary
- match explanation
- mentorship status
- actions per result

Ranking emphasis:

- relevance to the user query or saved mentor intent
- open-to-mentor status
- then supporting profile similarity signals

### 10. Profile Detail

Purpose:

- show the full actionable view of a person inside org privacy rules

Main elements:

- visible identity and background fields
- mentorship availability
- why this person is relevant
- friend state
- mentorship action
- shared context

Possible states:

- not connected
- pending friend request
- friends
- mentor open
- mentor closed
- mentorship request pending
- mentorship active

### 11. Saved Mentor Interest / Saved Search

Purpose:

- let users express what kind of person they want to find later

Main elements:

- freeform intent
- filters
- notification preferences
- current matching suggestions

This can initially live inside Search rather than as a standalone nav item.

## Relationship And Messaging Experience

### 12. Friend Request Composer

Purpose:

- send a short introduction with a friend request

Main elements:

- intro text
- recipient summary
- send action

### 13. Mentorship Request Composer

Purpose:

- submit structured mentorship request

Main elements:

- mentor summary
- request reason
- help-needed details
- optional background context
- screening questions if enabled

### 14. Inbox

Purpose:

- central place for relationship and messaging activity

Recommended inbox sections:

- notifications
- friend requests
- mentorship requests
- friendship threads
- mentorship threads

Important rule:

- the inbox should clearly separate friend chat from mentorship workflow items

### 15. Friend Chat Thread

Purpose:

- direct messaging between mutual friends

Main elements:

- thread history
- composer
- relationship header

### 16. Mentorship Request Review

Purpose:

- let mentors review requests efficiently

Main elements:

- requester summary
- request content
- screening responses
- accept / decline / leave pending
- mentor capacity state

Important state:

- if pending request capacity is full, the screen and request entry points should reflect it clearly

### 17. Mentorship Chat Thread

Purpose:

- host post-acceptance mentorship conversation

Main elements:

- thread history
- composer
- mentorship context

Constraints:

- no built-in scheduler in Phase 1
- no Zoom integration in Phase 1

## Events And Meetup Experience

### 18. Events List

Purpose:

- show upcoming official events and approved community activity

Main elements:

- upcoming events
- filters
- RSVP status badges

### 19. Event Detail

Purpose:

- show event information and enable RSVP

Main elements:

- date/time
- location/format
- description
- RSVP controls
- reminder status

### 20. Meetup Proposal Form

Purpose:

- let members suggest local or community gatherings

Main elements:

- purpose
- location
- timing
- audience
- privacy / scope
- submit action

### 21. Meetup Proposal Status

Purpose:

- let submitters track whether a proposal is under review, approved, or needs edits

This can begin as a detail state inside Events or Inbox rather than a separate full page.

## Profile And Settings Experience

### 22. My Profile

Purpose:

- let users view and update their visible identity

Main elements:

- base profile fields
- org-specific profile fields
- freshness prompts
- edit actions

### 23. Mentorship Settings

Purpose:

- let users manage mentor availability and intake preferences

Main elements:

- open/closed toggle
- mentoring topics
- preferred mentee types
- max active mentees
- max pending mentorship requests
- screening questions

### 24. Privacy Settings

Purpose:

- manage field-level visibility in the current org

Main elements:

- visibility controls per field
- explanation of friend-only vs org-visible

### 25. Account / Organization Settings

Purpose:

- manage account-level preferences and multi-org membership context

Main elements:

- organization switcher
- notification preferences
- connected import sources

## Admin Experience

### 26. Admin Overview

Purpose:

- operational landing page for admins

Main elements:

- pending approvals
- invite status
- upcoming events
- mentorship activity snapshot
- freshness alerts

### 27. Member Management

Purpose:

- browse and manage org members

Main elements:

- member table
- approval state
- role badges
- profile completeness
- freshness state

### 28. Approval Queue

Purpose:

- review pending members quickly

Main elements:

- applicant list
- supporting context
- approve / reject / request clarification

### 29. Invite Import

Purpose:

- upload alumni CSV and send invites

Main elements:

- file upload
- validation errors
- dedupe states
- invite summary

### 30. Role Management

Purpose:

- assign admins, moderators, and ambassadors

Main elements:

- member selector
- role picker
- permission summary

### 31. Admin Events

Purpose:

- create and manage official events

Main elements:

- event form
- publish controls
- RSVP summary

### 32. Meetup Review Queue

Purpose:

- review member-submitted proposals

Main elements:

- proposal list
- reviewer notes
- discussion / edit request
- approve / decline

### 33. Announcements

Purpose:

- send basic org communications

Main elements:

- audience targeting
- message editor
- send controls

### 34. Analytics Dashboard

Purpose:

- show whether the pilot is healthy

Main elements:

- invited to completed-profile rate
- discovery engagement rate
- mentorship request rate
- mentorship response rate
- profile freshness rate
- RSVP activity

### 35. Organization Settings

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

### Mentorship States

- mentor closed
- mentor open
- request draft
- request submitted
- request pending
- request accepted
- request declined
- mentorship active

### Profile Freshness States

- recently confirmed
- due for confirmation
- stale

### Meetup States

- draft
- submitted
- under review
- approved
- needs edits
- declined
- published

## Recommended Wireframe Priority

These screens should be designed first:

1. organization join landing
2. organization profile setup
3. privacy setup
4. discover home
5. search and search results
6. profile detail
7. mentorship request composer
8. mentorship request review
9. inbox
10. admin approval queue
11. analytics dashboard

These should come next:

1. friend request composer
2. friend chat
3. mentorship chat
4. events list and detail
5. meetup proposal form
6. invite import
7. role management

## Responsive Web Considerations

Because the MVP is web-first but should remain mobile-friendly:

- search and discover should work cleanly on narrow screens
- profile cards should collapse well on mobile web
- inbox should support a stacked list-detail pattern on small screens
- admin tables may require simplified mobile views, but desktop remains primary for admin usage

## Open IA Questions

1. Should `Discover` and `Search` stay separate in the first release, or should they share one combined surface with tabs?
2. Should `Inbox` include notifications directly, or should notifications live in a separate tray?
3. Should meetup proposal status live in `Events`, `Inbox`, or both?
4. Should users have one combined profile editor or separate base-profile and org-profile editors?
5. How much of mentorship settings should appear in onboarding vs later in Profile?

## Recommended Next Artifact

The next practical artifact is a screen-by-screen wireframe brief for the priority screens, including:

- screen goal
- key components
- primary CTA
- secondary CTA
- empty states
- error states
- analytics events

That would make the product ready for actual low-fidelity wireframes or implementation scaffolding.
