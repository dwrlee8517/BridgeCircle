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
| `/onboarding` | Confirm the required identity floor (name and graduation year), then optionally enrich the profile |
| `/pending` | Explain pending membership approval |
| `/select-circle` | Select an active organization membership |
| `/cancel-delete` | Confirm or cancel an account-deletion request |
| `/reset-password`, `/reset-password/update` | Request and complete password recovery |

The identity floor is the only required onboarding step. Fast Fill, education,
current and past experience, Help preferences, and the cold-start prompt are
skippable; they improve the profile but do not block entry to the member shell.

### Home

| Route | Responsibility |
|---|---|
| `/` | Default member destination and cross-domain summary |

Home is implemented as a v2 composition dashboard. It may summarize other
domains, but it must not own Ask creation, message persistence, or duplicate
domain queries.

### Help

| Route | Responsibility |
|---|---|
| `/help` | Get-help/Give-help home, private question search, recent Asks |
| `/help/ask/[membershipId]` | Direct-Ask composer for one organization membership |
| `/help/ask-circle` | Circle-Ask composer with immutable reach at publish time |
| `/help/asks` | The member's Help history |
| `/help/asks/[askId]` | Role-shaped Ask detail, response, offers, and lifecycle actions |
| `/help/asks/[askId]/offer` | Private offer composer for an eligible helper |
| `/help/settings` | Compatibility redirect to the Helping section of Settings |

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
| `/people/circle` | Managed Connection view with Message and confirmed Disconnect actions |
| `/profile/[id]` | Member profile, Connection state, and direct-Help entry |
| `/profile/me` | Canonical self profile with inline section and audience editing |

People sends `membershipId`, not `userId`, when entering a direct Ask. The
managed circle view is a People-owned detail route reached from the directory,
Messages' My-circle lens, and the account menu. Profile
URLs use `userId`, while the self route derives its selected membership on the
server. The removed edit/import/proposal routes have no compatibility aliases;
future enrichment review remains a planned dedicated slice; it is not exposed
as a member route today.

### Messages

| Route | Responsibility |
|---|---|
| `/messages` | Canonical conversation list root |
| `/messages/[id]` | Unified conversation thread |
| `/notifications` | Durable notification history and unread filtering |

Messages is implemented locally as one responsive workspace for accepted Asks
and accepted Connections. The root owns the foldable Waiting group, canonical
attention counts, bounded filters/search, and keyset-paginated conversation
list. The selected route owns bounded history, idempotent sends, visible-end
read advancement, typing, context, Ask resolution, post-Ask Connection nudges,
and report/block/disconnect controls. Broadcast carries identifiers only;
every visible state is refetched from fixed v2 projections.

### School

| Route | Responsibility |
|---|---|
| `/school` | Member-facing school pulse |
| `/school/events/[id]` | Event detail, RSVP, held-offer, and calendar download |
| `/school/announcements`, `/school/announcements/[id]` | Announcement archive and reader |
| `/school/newsletter`, `/school/newsletter/[issue]` | Newsletter archive and reader |

The member School surface is implemented. It owns member-facing reading and
RSVP behavior; it does not imply that all administration or authoring work is
complete.

### Administration

| Route | Responsibility |
|---|---|
| `/admin` | Organization operations overview |
| `/admin/approvals` | Pending membership decisions |
| `/admin/invite` | Invitations |
| `/admin/events` | Event administration |
| `/admin/events/[id]/edit` | Edit or cancel an existing event |
| `/admin/announcements` | Announcement administration |

The current Admin surface covers invitations, approvals, basic event management,
and announcements. A report-review queue and the fuller event-authoring model
remain planned work; do not describe either as complete.

### Settings

| Route | Responsibility |
|---|---|
| `/settings` | Account, email, notification, helping, safety, export, and deletion preferences |
| `/help/settings` | Compatibility redirect to `/settings#helping` |

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
behind aliases. `pnpm check:help-cutover` and `pnpm check:messages-cutover`
prevent those callers from returning.

This is safe only because the product is pre-launch and the databases contain
no real member data. Once real users exist, future route removals and schema
changes require an explicit compatibility and data-migration decision.

## Port status

| Domain | Local v2 status |
|---|---|
| Foundation | Complete |
| Conversation primitive | Complete |
| Help | Complete through local domain cutover |
| Messages list and Connection threads | Complete through local domain cutover |
| Home | Complete local v2 composition dashboard |
| People/Profile/Connections | Complete local v2 member slice |
| School member surfaces | Complete local v2 member slice |
| Entry, account lifecycle, and settings | Complete local v2 slice; settings composition follow-up (C-13) remains in progress |
| Admin basics | Implemented for invites, approvals, events, and announcements; moderation queue (C-43) and fuller event authoring (C-44) remain in progress |
| Remote dev/prod reset | Blocked until every application domain and the global build are green |

Do not describe the full application as remotely deployable until the remote
cutover gates are satisfied and the planned Admin boundaries above are closed.
