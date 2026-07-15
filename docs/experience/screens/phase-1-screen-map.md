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
| Messages list | `/messages` | Next domain slice |
| Conversation | `/messages/[id]` | Accepted-Ask seam implemented |
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

## Pre-launch cutover

No compatibility screen or redirect is kept for retired Ask/Inbox route
families. New links and notification targets must point directly to the
canonical Help or Messages route. The old mock/seed world may be recreated
domain by domain against the v2 contracts; it is not a reason to preserve a
legacy UI.
