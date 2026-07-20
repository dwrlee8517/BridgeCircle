# Phase 1 screen map

This map records the canonical v2 screen families. The detailed route contract
lives in [information architecture](../../architecture/information-architecture.md),
and the approved redesign specimens live under
[`../ui/design-system/handoff/bridgecircle/`](../ui/design-system/handoff/bridgecircle/).

## Member shell

The shared responsive shell has five roots: Home, Help, People, Messages, and
School. Desktop uses the full sidebar, tablet uses a compact rail, and mobile
uses the bottom navigation. `MEMBER_NAV_LINKS` is the single implementation
source.

## Primary screens

| Screen | Canonical route | Current v2 status |
|---|---|---|
| Home | `/` | Later domain port |
| Help home | `/help` | Implemented |
| Direct Ask | `/help/ask/[membershipId]` | Implemented |
| Ask the circle | `/help/ask-circle` | Implemented |
| Help history | `/help/asks` | Implemented |
| Ask detail/response | `/help/asks/[askId]` | Implemented |
| Circle offer | `/help/asks/[askId]/offer` | Implemented |
| Help settings | `/help/settings` | Implemented |
| People | `/people` | Later People/Profile port; canonical direct-Help link is implemented |
| Profile | `/profile/[id]` | Later People/Profile port; canonical direct-Help link is implemented |
| Messages list | `/messages` | Implemented |
| Conversation | `/messages/[id]` | Implemented for Ask and Connection origins |
| School | `/school` | Later School/Admin port |
| Events | `/events`, `/events/[id]` | Later School/Admin port |
| Announcements | `/announcements`, `/announcements/[id]` | Later School/Admin port |
| Admin | `/admin/*` | Later School/Admin port |

## Help states that must be designed and tested

- private question search: blank, loading, results, no results, provider
  fallback, and no side effects;
- direct composer: initial draft, AI refinement, validation, unavailable
  recipient, capacity reached, created, and idempotent retry;
- circle composer: matched/organization reach, anonymous disclosure,
  refinement, active limit, and created;
- Ask detail: owner, direct recipient, eligible helper, offer helper, accepted
  participant, blocked/removed, expired, declined, retracted, and resolved;
- offer composer: private note, refinement, duplicate retry, and no longer
  eligible;
- Help history: open/waiting/accepted/terminal rows, cursor paging, empty and
  transport-error states;
- settings: default-open, manual pause, admin pause, normalized topics, save
  success, validation, and transport failure;
- accepted conversation: origin line, opening message, send, reconnect,
  resolution line, and continued messaging after resolution.

## Responsive acceptance sizes

The Help implementation is checked at:

- desktop: 1440 px class, plus the exact source capture width when different;
- tablet: 768 px;
- mobile: 390 px;
- narrow guard: 320 px.

No screen may depend on a fixed specimen canvas. Content can remain centered
inside a readable max width while the shell background and layout fill the
viewport. Horizontal overflow at the acceptance widths is a failure.

## Messages states that must be designed and tested

- Waiting: direct Ask, incoming Connection, folded/unfolded, accept/decline,
  zero-hidden, stale decision, and transport recovery;
- list: All/Unread/My circle/Open asks, bounded search, selected/unread,
  tied-cursor pagination, deleted-member fallback, and truthful empty/error;
- thread: Ask/Connection origin, history paging, idempotent send retry, typing,
  visible-end read, latest receipt, reconnect, and continued send after resolve;
- context and safety: desktop rail, mobile sheet with focus return, Ask resolve,
  post-Ask Connection nudge, report acknowledgement, disconnect, and block;
- responsive composition: three columns at 1200 px and above, two panes at
  tablet width, and separate list/thread routes below 768 px, with no overflow
  at 1440, 768, 390, or 320 px.

## Pre-launch cutover

No compatibility screen or redirect is kept for retired Ask/Inbox route
families. New links and notification targets must point directly to the
canonical Help or Messages route. The old mock/seed world may be recreated
domain by domain against the v2 contracts; it is not a reason to preserve a
legacy UI.
