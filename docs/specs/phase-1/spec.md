# BridgeCircle Phase 1 Spec

## Purpose

This document defines the Phase 1 product spec for BridgeCircle's first pilot.

The goal of Phase 1 is to turn the high-level concept in `project-summary.md` into a concrete MVP definition for a first launch with a school alumni network.

## Phase 1 Summary

BridgeCircle Phase 1 is a web-first alumni network product for a private school alumni community.

The first version is designed to solve a specific problem:

- alumni information gets stale
- alumni discovery is weak
- mentorship is hard to initiate
- schools have poor visibility into engagement
- events and local community continuity are hard to coordinate

The MVP should make the alumni network feel alive, current, and useful.

## Launch Context

### First Launch Segment

- private school alumni network

### Buyer

- the school

### Internal Champion

- alumni ambassador / board member

### Initial Cohort Size

- approximately 500 to 1000 invited alumni

### Primary First User

- students and recent graduates

## Product Thesis For Phase 1

The first version should not try to be full alumni management software.

The first version should prove that:

- alumni profiles can stay meaningfully current
- members can discover relevant people easily
- mentorship requests can happen with low friction
- admins can see fresher data and real engagement

The main wedge is not messaging by itself. It is a living, useful alumni directory that leads to real mentorship and reconnection outcomes.

## Core User Jobs

### Students / Recent Graduates

- find alumni with relevant background
- browse updated profiles
- identify mentors who are open to helping
- send mentorship requests
- reconnect with friends and peers
- find local meetups or events

### Established Alumni

- keep their profile current with low effort
- signal whether they are open to mentoring
- review and accept or decline mentorship requests
- reconnect with classmates and friends
- stay aware of community events and alumni activity

### School Admins

- invite and approve legitimate alumni
- keep alumni data fresh
- monitor profile completion and engagement
- plan and promote events
- support mentorship and local community activity without over-managing every interaction

## Core MVP Loop

The Phase 1 product should optimize for this loop:

1. an invited alumni member joins the organization
2. they complete the required profile fields
3. they browse updated alumni profiles or run a search
4. they find a relevant person
5. they send a mentorship request or reconnect with a friend
6. the other person responds
7. both users have a reason to return later

If this loop is weak, the MVP has not succeeded.

## Product Decisions Locked For Phase 1

- launch with a web-first product
- support multi-organization membership in the data model
- use one global base profile plus organization-specific overlays
- require mutual acceptance for friendship
- keep friend messaging separate from mentorship request flows
- use search as the primary discovery surface
- use recommendations to support search, not replace it
- support field-level privacy toggles
- default profile visibility should encourage openness inside the organization
- support admin-created events and member-submitted meetup proposals
- mentorship should use request and acceptance before any mentoring conversation starts

## In Scope

### Member Experience

- account creation and login
- organization join through invite and admin approval
- required profile setup for each organization
- optional base profile enrichment
- mentorship availability settings
- profile browsing
- natural-language search
- filter and sort controls
- recommendations
- friendship requests
- direct messaging between friends
- mentorship requests
- mentor review flow
- mentorship chat after acceptance
- admin-created events
- member-submitted meetup proposals
- RSVP

### Admin Experience

- organization setup
- alumni invite flow
- CSV-based alumni invite / approval support
- member approval queue
- profile visibility defaults
- role assignment
- event creation
- meetup review workflow
- announcement / speaker outreach support
- analytics for profile completion, discovery activity, and mentorship engagement

## Explicitly Out Of Scope

- native mobile app parity
- full fundraising suite
- broad recruiting marketplace
- full CRM replacement
- social feed
- complex subgroup hierarchy
- calendar scheduling for mentoring
- Zoom integration in the first release
- first-party LinkedIn scraping or browser automation as a core dependency

## Required Profile Model

For each organization, these fields should be required before a user is considered profile-complete:

- full name
- graduation year
- current city or region
- current employer or current school
- current title or role
- university
- major
- open to mentor status

Optional fields may include:

- bio
- interests
- industries
- social links
- contact links
- mentoring topics
- availability notes
- class / cohort labels
- local meetup interest

## Profile Structure

### Global Base Profile

The base profile should hold reusable identity and professional information that can be shared across multiple organizations.

Examples:

- name
- headline
- current role
- employer
- city
- university
- major
- professional links

### Organization Profile Overlay

The organization-specific layer should control:

- visibility inside that organization
- required profile completion for that organization
- alumni-specific fields such as graduation year
- mentorship availability in that organization
- friendship and community context
- event and local meetup participation

This structure allows one person to belong to multiple organizations without rebuilding everything from scratch.

## Privacy And Visibility Model

Each major profile field should support at least:

- visible to organization members
- visible to friends only
- hidden

Default Phase 1 visibility inside the organization should be:

- full name: organization visible
- graduation year: organization visible
- city: organization visible
- employer: organization visible
- title: organization visible
- university: organization visible
- major: organization visible
- mentorship availability: organization visible
- social/contact links: friends only by default

Users should be able to toggle fields off if they want to.

## Discovery Model

### Primary Discovery Surface

- natural-language search plus structured filters

### Supporting Discovery Surface

- algorithmic recommendations

Search and recommendations should prioritize:

- mentorship availability, with open-to-mentor status treated as a major ranking signal
- direct relevance to the user's query or saved mentor intent
- same university
- same major
- same city / region
- similar interests
- class proximity or alumni relationship
- industry / role relevance

The user should be able to search directly and also receive passive suggestions over time.

## Recommendation Model

Recommendations should support, not replace, user-driven search.

Phase 1 recommendation types may include:

- mentors open to mentor in relevant fields
- alumni with similar academic or geographic background
- alumni who recently updated their profile and newly match saved interests
- local alumni or nearby events

Phase 1 may also support a saved mentorship interest flow where a user can express what kind of mentor they want, and the system can notify them later when relevant profiles appear or change.

This should be framed as recommendation support, not as a fully autonomous matching product.

## Profile Freshness Strategy

The Phase 1 refresh strategy should use:

- manual profile editing
- LinkdAPI-backed LinkedIn URL import during onboarding, with PDL fallback for hard-to-resolve profiles
- **Update from LinkedIn** on the profile edit page (LinkdAPI live, PDL fallback)
- periodic confirm / update prompts backed by profile-change proposals
- Bright Data's Marketplace Dataset Filter API as the primary scheduled refresh provider for opted-in members
- LinkdAPI as escalation for Bright Data dataset misses after repeated cycles; PDL as last resort
- optional resume, CV, or screenshot-based extraction as fallback input

Recommended prompt cadence:

- monthly for the first pilot if diff quality and email volume stay sane
- quarterly if users find monthly prompts too frequent
- every 6 to 12 months for manual "still correct?" confirmations when no external change is detected
- optionally before major alumni events or campaigns

Important rule:

- external profile import should support user confirmation
- onboarding import uses LinkdAPI because it is structured and cheap enough for first-run profile quality; PDL covers profiles LinkdAPI cannot resolve
- recurring freshness checks use Bright Data's pre-cleaned dataset because it is cheaper per record at sweep volume and survives any single-provider shutdown
- LinkdAPI and PDL caps apply so a bad vendor batch cannot create surprise cost
- the product should not depend on unrestricted or first-party LinkedIn scraping to function
- users choose one of: `review_before_update`, `auto_apply_and_notify`, or `manual_only`

## Friendship Model

Friendship should be a separate concept from mentorship.

Rules:

- friendship requires mutual acceptance
- once one user sends a friend request and the other accepts, both users are friends with each other
- users can send friend requests with a short introduction
- once two users are friends, they can directly message each other in-app
- friendship should not automatically grant mentorship status

This keeps social reconnection possible without forcing every conversation through the mentorship flow.

## Mentorship Model

### Mentorship Availability

Each user should be able to set:

- open or closed to mentorship requests
- mentoring topics
- preferred types of mentees
- max active mentees
- max pending mentorship requests in inbox
- optional screening questions

### Mentorship Request Flow

Default Phase 1 flow:

1. user searches or receives a recommendation
2. user selects a mentor
3. user sends a mentorship request
4. if the mentor has screening enabled, the user answers the required questions
5. mentor reviews and accepts or declines
6. if accepted, a mentorship thread opens
7. scheduling happens manually inside the chat for Phase 1

Important rules:

- if two users are already friends, they can message directly
- friendship and mentorship are separate tracks
- mentoring chat should only open after mentor acceptance

## Event And Meetup Model

### Admin Events

Admins should be able to:

- create events
- publish event details
- manage RSVP
- send reminders

### Member Meetup Proposals

Members should be able to propose local meetups or community gatherings.

The Phase 1 approval process should support:

- proposal submitted by member
- proposal discussed with relevant representatives or ambassadors
- admin review and approval decision
- approved plan published to the wider organization if appropriate

Different organizations may later require different approval workflows, but Phase 1 should support a simple review-and-approve structure.

## Roles And Permissions

### Roles

- super admin
- admin
- event moderator
- ambassador / representative
- member

### Role Intent

#### Super Admin

- full organization control
- manage billing, organization settings, and top-level permissions

#### Admin

- approve members
- manage member records
- create events
- review meetup proposals
- send announcements
- view analytics

#### Event Moderator

- manage event details, RSVP, reminders, and event-related moderation

#### Ambassador / Representative

- help review meetup plans
- help represent a class, region, or subgroup informally
- support community coordination

#### Member

- browse profiles based on privacy settings
- search
- connect
- request mentorship
- propose meetups
- RSVP

## Data Model Draft

The following entities should exist in the initial data model.

### Core Entities

- user
- organization
- organization_membership
- base_profile
- organization_profile
- profile_visibility_setting
- friendship
- friend_request
- mentorship_preference
- mentorship_request
- mentorship_response
- mentorship_thread
- direct_message_thread
- message
- event
- event_rsvp
- meetup_proposal
- invite
- admin_role_assignment
- announcement
- profile_refresh_prompt
- saved_search_or_saved_mentor_interest
- notification
- audit_log

### Important Relationships

- one user can belong to multiple organizations
- one user has one base profile
- one user can have many organization profiles
- visibility settings should be configurable per organization profile
- friendship is between users
- mentorship requests are scoped to an organization context
- events and meetup proposals belong to an organization
- admin roles are scoped to an organization

## Permissions Model Draft

### Profile Access

- profile field visibility should be evaluated per field, per organization context
- some fields may be visible to all org members
- some fields may be visible only to friends
- hidden fields should not appear in search result details

### Messaging Access

- direct messaging is allowed only between friends
- mentorship messaging is allowed only after a mentorship request is accepted

### Event Access

- organization members can view published events according to event visibility rules
- admins and event moderators can create and manage events
- members can submit meetup proposals but cannot auto-publish them

### Admin Access

- admins can review member approvals
- admins and super admins can manage roles
- ambassadors may participate in review workflows where configured

## Analytics And Pilot Metrics

### Primary Metrics

- invited to completed-profile rate
- discovery engagement rate
- mentorship request rate and mentorship response rate

### Secondary Metrics

- profile freshness rate
- admin monthly active usage
- event RSVP participation

### Suggested Definitions

#### Invited To Completed-Profile Rate

- percent of invited users who create an account, are approved, and complete required organization profile fields

#### Discovery Engagement Rate

- percent of active users who do at least one meaningful discovery action in 30 days

Meaningful discovery actions may include:

- running a search
- viewing multiple profiles
- saving or revisiting a profile
- opening a recommendation

#### Mentorship Request Rate

- percent of active users who send at least one mentorship request in 30 days

#### Mentorship Response Rate

- percent of mentorship requests that receive a response within a target time window such as 7 days

#### Profile Freshness Rate

- percent of profiles confirmed or updated within the last 6 to 12 months

## UX Principles For Phase 1

- optimize for low friction, not daily engagement mechanics
- avoid making the product feel like a noisy social network
- make privacy understandable and field-specific
- keep onboarding short but valuable
- make the directory feel alive through freshness and visible usefulness
- separate friend connection from mentorship so users understand the difference

## Risks And Open Questions

### Risk: Privacy Complexity

Field-level toggles are useful, but too much setup can overwhelm users.

Mitigation:

- provide strong defaults
- keep the privacy UI simple
- avoid making every user configure everything manually before they can use the app

### Risk: Stale Data Still Persists

If refresh prompts and imports are weak, the directory will still decay.

Mitigation:

- measure freshness explicitly
- make updates easy
- use event- or campaign-driven prompts

### Risk: Messaging Scope Creep

Friend chat plus mentorship chat can grow into a full messaging platform.

Mitigation:

- keep messaging tightly tied to existing relationships and mentorship flows
- avoid broad social features in Phase 1

### Risk: Recommendation Noise

If recommendations are low quality, users will stop trusting them.

Mitigation:

- keep user search primary
- treat recommendations as support
- start with transparent, simple recommendation logic

### Open Question: Anxiety And Social Pressure

The product should avoid creating anxiety, but the exact sources of anxiety are not fully defined yet.

Examples to evaluate later:

- whether request declines are explicit or softened
- whether seen-status should exist
- whether users can tell who viewed their profile
- how visible friend graphs should be

## Deferred Decisions

These are intentionally deferred beyond Phase 1:

- native mobile scope
- mentoring scheduler
- Zoom integration
- advanced recommendation automation
- external change detection beyond user-confirmed import workflows
- more complex event governance across different org types

## Immediate Next Phase 1 Outputs To Produce

The next documents to derive from this spec should be:

1. detailed member and admin user flows
2. information architecture and screen list
3. wireframe set for the core MVP
4. backend schema draft
5. permissions matrix
6. analytics event plan

## Working MVP Statement

BridgeCircle Phase 1 is a web-first alumni network for schools that helps alumni keep profiles current, discover relevant people, request mentorship, reconnect with friends, and coordinate community activity while giving admins fresher data and clearer engagement visibility.
