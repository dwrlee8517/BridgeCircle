# BridgeCircle information architecture

## Purpose

This is the current route and navigation contract for the pre-launch v2
rebuild. Code is canonical; update this document in the same change whenever a
route or ownership boundary moves.

The product is member-first: members ask for help, offer help, find people, and
stay connected to their school circle. It is not an alumni CRM.

## Principles

- Help starts with the member's question, not a relationship taxonomy.
- People supports discovery and direct Help entry; it is not the only product
  center.
- A Connection is mutual. An Ask is one-sided until it is accepted.
- Accepted Asks and accepted Connections use the same conversation primitive.
- Identity is user-scoped; organization context and Help are membership-scoped.
- Private search never creates an Ask or reveals that a member was matched.
- Each domain owns one canonical route family and one persistence contract.
- The app is responsive web first.

## Member navigation

`MEMBER_NAV_LINKS` in `app/src/app/(member)/nav-links.ts` is the single source
for the desktop sidebar, tablet rail, and mobile tabs:

1. **Home** — `/`
2. **Help** — `/help`
3. **People** — `/people`
4. **Messages** — `/messages`
5. **School** — `/school`

Admins get a separate role-gated Admin slot. Notifications and account controls
remain global shell utilities.

## Canonical route map

### Public and authentication

| Route | Responsibility |
|---|---|
| `/sign-in` | Authenticate an existing member |
| `/join` | Verify and accept an organization invitation |
| `/onboarding` | Complete the selected membership's required profile |
| `/pending` | Explain pending membership approval |
| `/select-circle` | Select an active organization membership |

### Home

| Route | Responsibility |
|---|---|
| `/` | Default member destination and cross-domain summary |

Home is a later v2 application port. It may summarize other domains, but it
must not own Ask creation, message persistence, or duplicate domain queries.

### Help

| Route | Responsibility |
|---|---|
| `/help` | Get-help/Give-help home, private question search, recent Asks |
| `/help/ask/[membershipId]` | Direct-Ask composer for one organization membership |
| `/help/ask-circle` | Circle-Ask composer with immutable reach at publish time |
| `/help/asks` | The member's Help history |
| `/help/asks/[askId]` | Role-shaped Ask detail, response, offers, and lifecycle actions |
| `/help/asks/[askId]/offer` | Private offer composer for an eligible helper |
| `/help/settings` | Availability and normalized Help topics |

Help owns direct and circle Asks. Direct Asks move from `waiting` to accepted,
declined, retracted, or expired. Circle Asks are `open` until the asker accepts
one private offer or the Ask ends. Accepted interactions create exactly one
conversation and one origin line. Resolving an Ask does not close its
conversation.

The Help UI reads fixed v2 projections and sends commands through the v2
repository. Member routes never query raw Ask, offer, matching, or outbox
tables. Realtime is an IDs-only invalidation signal; the database remains the
source of truth.

### People and Profile

| Route | Responsibility |
|---|---|
| `/people` | Organization directory, search, filters, and direct-Help entry |
| `/profile/[id]` | Member profile, Connection state, and direct-Help entry |
| `/profile/edit` | Edit the member's profile |
| `/profile/import` | Review profile enrichment |

People sends `membershipId`, not `userId`, when entering a direct Ask. Profile
and Connection persistence are the next dedicated v2 port after Messages; do
not add compatibility reads from retired Help columns while that work is
pending.

### Messages

| Route | Responsibility |
|---|---|
| `/messages` | Canonical conversation list root |
| `/messages/[id]` | Unified conversation thread |

The accepted-Ask thread is implemented because it completes the Help loop. The
full conversation list, Connection-origin threads, unread aggregation, and
three-column desktop Messages layout belong to the Messages vertical slice.
Until that slice lands, the root page states this boundary honestly instead of
rendering legacy data or fabricated rows.

### School

| Route | Responsibility |
|---|---|
| `/school` | Member-facing school pulse |
| `/events`, `/events/[id]` | Event list and detail |
| `/announcements`, `/announcements/[id]` | Announcement archive and detail |

School/Admin remains a later v2 application port.

### Administration

| Route | Responsibility |
|---|---|
| `/admin` | Organization operations overview |
| `/admin/members` | Membership and account state |
| `/admin/approvals` | Pending membership decisions |
| `/admin/invite` | Invitations |
| `/admin/events` | Event administration |
| `/admin/announcements` | Announcement administration |
| `/admin/analytics` | Authorized aggregate metrics |

## Organization context

One user can have multiple organization memberships. Every organization-scoped
route must resolve the selected active membership before it loads data.

- user-pair concepts such as Connections, blocks, and conversations survive a
  membership change;
- Ask ownership, recipients, offers, and helper preferences key on membership;
- organization-scoped tables carry `organization_id` and enforce matching
  composite foreign keys;
- switching circles changes Help, People, School, and Admin data together.

## Notifications and deep links

Notification targets use canonical domain routes:

- Ask and offer activity opens the relevant Help detail;
- accepted conversation activity opens the Messages thread;
- Connection requests open the relevant Profile/People surface;
- School notifications open their event or announcement.

Notification payloads carry identifiers, not private content. Authorization is
re-evaluated when the target projection loads.

## Pre-launch cutover rule

The v2 rebuild intentionally has no compatibility route layer. Retired route
families, persistence modules, and redirect rules are deleted rather than kept
behind aliases. `pnpm check:help-cutover` prevents those callers from returning.

This is safe only because the product is pre-launch and the databases contain
no real member data. Once real users exist, future route removals and schema
changes require an explicit compatibility and data-migration decision.

## Port status

| Domain | Local v2 status |
|---|---|
| Foundation | Complete |
| Conversation primitive | Complete |
| Help | Complete through local domain cutover |
| Messages list and Connection threads | Next |
| People/Profile/Connections | Pending |
| School/Admin/account lifecycle | Pending |
| Remote dev/prod reset | Blocked until every application domain and the global build are green |

Do not describe the full application as deployable while a later domain still
references the retired schema.
