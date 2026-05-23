# Phase 1 Screen Briefs

This file bridges product behavior and the Civic Editorial design system.
Product behavior remains canonical in specs and architecture docs; visual rules
remain canonical in [`../ui/design-system/`](../ui/design-system/).

## Current Member Surfaces

The current member navigation is defined by
`app/src/app/(member)/nav-links.ts` and contains five visible items:
**Ask, Help, People, School, Inbox**. The BridgeCircle wordmark links to Home
(`/`).

| Surface | Route | Behavior source | UI source |
|---|---|---|---|
| Home | `/` | [`../../architecture/information-architecture.md`](../../architecture/information-architecture.md) | [`../ui/design-system/`](../ui/design-system/) |
| Ask | `/ask` | [`../../architecture/information-architecture.md`](../../architecture/information-architecture.md) | [`../ui/design-system/`](../ui/design-system/) |
| Help | `/help` | [`../../architecture/information-architecture.md`](../../architecture/information-architecture.md) | [`../ui/design-system/`](../ui/design-system/) |
| People | `/people` | [`../../specs/phase-1/user-flows.md`](../../specs/phase-1/user-flows.md) | [`../ui/design-system/`](../ui/design-system/) |
| School | `/school` | [`../../architecture/information-architecture.md`](../../architecture/information-architecture.md) | [`../ui/design-system/`](../ui/design-system/) |
| Inbox | `/inbox` | [`../../specs/phase-1/user-flows.md`](../../specs/phase-1/user-flows.md) | [`../ui/design-system/`](../ui/design-system/) |

Supporting routes such as `/profile/*`, `/events/*`, `/announcements/*`,
`/mentorship/settings`, `/ask/new`, `/ask/[id]`, `/ask/thread/[id]`, auth, and
`/admin/*` remain important, but they are not top-level member navigation.

## Cross-Screen Rules

- Every member screen should make the next useful relationship action visible
  without requiring browsing.
- Do not use cards as the default page-building unit. Use cards only for
  repeated decision objects, modals/popovers, or genuinely bounded interaction
  surfaces.
- Prefer full-width sections, rows, split layouts, lists, tables, and command
  surfaces for page structure.
- Do not stack cards inside cards unless the inner object is a repeated row/list
  item.
- Use Civic Editorial hierarchy: sharp 6px radii, Obsidian/Electric Sky action
  states, readable metadata, and restrained decorative motifs.
- Do not introduce generic SaaS gradients, social-feed mechanics, bubbly
  community styling, or CRM tables as the default member experience.
- If behavior changes, update the linked spec or architecture doc first.

## Home

Route: `/`

Primary job: orient the member and surface the next useful relationship action.

Priority order:

1. the ask/search command
2. people who can help the member
3. people or requests the member could help with
4. school pulse and profile upkeep as supporting context

Home should not become a generic dashboard. It should open with relationship
work and use school/activity/profile modules as secondary context.

## Ask

Route: `/ask`

Primary job: turn a member's question into explained people matches and a
guided ask.

Ask is the primary command surface. It should feel more active and focused than
People. Use structured match evidence, suggested first asks, and one clear next
step rather than making the member browse a directory.

Workflow routes:

- `/ask/new`
- `/ask/[id]`
- `/ask/thread/[id]`

These are supporting routes reached from Ask, People, Home, Help, Inbox, or
notifications.

## Help

Route: `/help`

Primary job: help the member understand where their experience is useful.

Help should distinguish:

- requests that need a reply
- people or situations the member could help with
- helper availability and preference maintenance

Avoid burying help opportunities inside passive profile browsing. The screen
should present clear helper actions and readable state.

## People

Route: `/people`

Primary job: help members find the right person and decide whether to reach out.

People should combine natural-language search, structured filters, match
reasons, helper availability, and one primary action per person. Result objects
may be cards when comparison benefits from containment, but the page should not
feel like a wall of equal-weight cards.

## School

Route: `/school`

Primary job: keep the school pulse close to relationship work.

School combines events and announcements as supporting context. It should make
the next relevant school item clear while keeping Ask/Help/People as the
product center. Use lists, timelines, or grouped sections where possible;
reserve cards for specific repeated event or announcement objects.

Supporting routes:

- `/events`, `/events/[id]`
- `/announcements`, `/announcements/[id]`

## Inbox

Route: `/inbox`

Primary job: manage relationship lifecycle across asks, friend requests, direct
messages, and notifications that require attention.

Inbox should prioritize:

1. needs reply
2. active/helping/getting-help threads
3. sent/done/history

Use clear lifecycle state, not just tabs. Empty states should point members
back to a useful next action, such as asking someone, reviewing helper
preferences, or finding people they know.

## Supporting Surfaces

These routes support the current member nav but should not be treated as
primary member surfaces when evaluating navigation-level UI quality:

| Surface | Routes | Notes |
|---|---|---|
| Profile | `/profile/[id]`, `/profile/me/*` | Detail and editing surfaces reached from People, Home, Inbox, and account actions |
| Helper settings | `/mentorship/settings` | Supply-side preferences reached from Help, Home, and account/header utilities |
| Auth and join | `/sign-in`, `/join` | Entry surfaces, not authenticated member navigation |
| Admin | `/admin/*` | Admin-only operational area |
