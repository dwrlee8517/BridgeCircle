# BridgeCircle

Working project name chosen for this folder: `BridgeCircle`

## Core Idea

Build a user-first, verified community platform for alumni groups, student organizations, fellowships, and company alumni networks.

The main goal is to make participation effortless for members while keeping setup and maintenance easy for administrators.

Instead of feeling like an admin database, the product should feel like a trusted help network where people can:

- find mentors or mentees
- ask for referrals
- recruit from a verified pool
- stay connected with peers
- find nearby members
- join local or regional events
- sponsor or support younger generations

## Product Thesis

This should not be positioned as "alumni management software."

The stronger framing is:

- a trusted lifecycle network
- a warm-intro and help-exchange platform
- a verified professional and community network for mission-driven groups

The strongest wedge is not the profile directory itself. It is:

- finding the right person quickly
- asking for help with low friction
- getting useful responses
- returning because the network continues to create value

## Main User Groups

### Emerging members

Students, recent graduates, or younger members want:

- referrals
- mentorship
- peer continuity
- jobs and internships
- local community
- a low-friction way to ask for help

### Established members

Older or more experienced members want:

- efficient ways to mentor
- access to verified talent
- recruiting opportunities
- event sponsorship opportunities
- community reputation
- a way to give back without heavy time commitment

### Administrators

Schools, clubs, associations, or organization leads want:

- easy organization setup
- verification and trust controls
- low-maintenance profile freshness
- measurable engagement
- event and messaging tools
- a path to sponsorship, recruiting, and eventually fundraising

## Shared Needs Between Users And Admins

Both sides care about:

- accurate and current information
- easy search and discovery
- trust and verification
- low-friction onboarding
- privacy and visibility control
- meaningful engagement
- strong matching quality
- useful communication
- events that matter
- professional value

## Market Reality As Of April 21, 2026

This is an active market, not an empty one.

Existing platforms include:

- PeopleGrove
- Hivebrite
- Gravyty / Graduway
- Almabase
- ToucanTech
- EnterpriseAlumni
- PeoplePath
- Hoopstr

Key market observations:

- The category is mostly institution-first and admin-led.
- Existing products already cover mentoring, directories, jobs, events, messaging, and analytics.
- AI search, AI matching, and data refresh are already starting to become table stakes.
- Most pricing remains B2B, quote-led, and sold as software infrastructure.
- There are some member-first entrants, but no clearly dominant member-first category winner was identified.

## Main Market Gap

The open opportunity appears to be:

- a product members actually want to use repeatedly
- a faster way to get warm help than LinkedIn
- a more useful experience than a static alumni portal
- a verified community that produces outcomes, not just profiles

## Important Constraint: LinkedIn

LinkedIn can help reduce onboarding friction, but it should not be treated as an unrestricted data backbone.

Important conclusions:

- Pasted LinkedIn URL import is the preferred onboarding path for career and education history (current provider: LinkdAPI with PDL fallback; see `docs/architecture/profile-enrichment.md`).
- Sign In with LinkedIn may be useful for authentication/light identity, but it is not the source for work-history sync.
- Broader profile access is restricted.
- The product should use "import and confirm" rather than promise fully automatic unrestricted profile syncing.
- Ongoing freshness uses Bright Data's pre-cleaned LinkedIn dataset for monthly sweep, LinkdAPI for on-demand "Update from LinkedIn" clicks, and PDL as fallback — but only for users who consent.
- Users should control which updates are public, private, or hidden.

## Recommended MVP

### Member-side MVP

- verified sign-up
- progressive onboarding
- profile enrichment from user-provided sources
- availability and willingness settings
- natural-language search
- structured requests for help
- explainable people matching
- direct messaging or intro requests
- event discovery and RSVP

### Admin-side MVP

- fast org creation and verification
- invite or roster import
- privacy presets
- moderation and approval controls
- basic announcements
- event creation and reminders
- analytics for activation, response rate, activity, and profile freshness

### Do not build first

- full fundraising suite
- generic ad marketplace
- full CRM replacement
- complex social feed
- overbuilt chapter structure
- paid mentoring marketplace as a core launch assumption

## Product Flows

### Member flow

1. Join through verified affiliation.
2. Confirm or enrich profile.
3. State what help they need or can offer.
4. Search using natural language.
5. See ranked, explainable matches.
6. Send a structured request.
7. Re-engage through responses, events, or follow-up needs.

### Admin flow

1. Create and verify organization.
2. Launch with a simple promise such as mentorship, referrals, or local networking.
3. Monitor activation and response metrics.
4. Re-engage members with targeted prompts and events.
5. Add premium tools after engagement is proven.

## Monetization Direction

The recommended path is not ad-first.

Best sequence:

1. low but real organization subscription
2. onboarding or setup fees where needed
3. premium admin tools
4. recruiting and opportunity monetization
5. event monetization and sponsorships
6. optional take-rate on paid expert sessions later

Important caution:

- broad advertising too early can damage trust
- direct monetization of referrals can create legal or ethical complications depending on structure
- transaction fees only make sense if the platform truly facilitates and manages the paid workflow

## Growth Strategy

The likely best early customer segment:

- graduate programs
- selective student organizations
- fellowships
- other trusted communities with 500 to 10,000 members

Why this segment:

- clear identity
- clear user need
- lower sales friction than full-university deals
- strong fit for referrals, mentoring, events, and recruiting

## Success Metrics

Metrics that matter most:

- invited-to-activated conversion
- monthly active members
- search-to-contact conversion
- response rate to requests
- repeat interactions
- percent of refreshed profiles
- event RSVP and attendance
- pilot-to-paid conversion

## Positioning Summary

Best short description:

`BridgeCircle is a verified warm-network platform that turns shared affiliation into mentoring, hiring, events, and long-term community engagement.`

## Files In This Folder

- `docs/presentations/investor-mvp-pitch.html`
- `project-summary.md`
