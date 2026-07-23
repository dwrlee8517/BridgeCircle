# Current Member UI Quality Plan

Status: `Active follow-up checklist`.

Authority: the handoff bundle at
[`../ui/design-system/handoff/`](../ui/design-system/handoff/) is the intended
UI/UX source of truth. Use this plan to track production alignment work, not as
a competing visual source.

This plan supersedes the route assumptions in the May 24, 2026 screenshot
pass. The current reconciliation and audit disposition live in
[UI/UX audit resolution addendum](ui-ux-audit-resolution-2026-07-21.md).
Code and the route map remain canonical.

## Scope

This plan covers the current member-facing product surface:

| Surface | Route | Role |
|---|---|---|
| Home | `/` | Orient the member and surface the next useful relationship action |
| Help | `/help` | Get-help and Give-help home; private question search and Ask start live here |
| People | `/people` | Member exploration, person selection, and direct-Help entry |
| School | `/school` | School pulse: events and announcements as supporting context |
| Messages | `/messages` | Unified request, Connection, and message lifecycle |

Supporting routes such as `/profile/*`, `/school/events/*`,
`/school/announcements/*`, `/notifications`, `/settings`, auth, and
`/help/settings` remain important, but they are not the primary member nav.

## Non-Negotiable Layout Rule

Do not use cards as the default page-building unit.

Use cards only for:

- repeated decision objects, such as a person result, request, event, or
  notification
- modals/popovers and genuinely bounded interaction surfaces
- compact status or summary objects where containment helps comparison

Use full-width sections, rows, split layouts, lists, tables, and command
surfaces for page structure. Do not stack cards inside cards unless the inner
object is a repeated row/list item.

## Current Problems

1. Hierarchy is too even. Many sections use similar white surfaces, borders,
   typography, and button treatments, so attention is not directed strongly
   enough.
2. Surface types are under-differentiated. Command areas, decision objects,
   school pulse, and lifecycle states often feel visually similar.
3. The UI is consistent but not yet proprietary. BridgeCircle's trust graph,
   relationship path, cohort, and helper availability ideas should become
   recognizable product patterns.
4. Some pages still ask members to browse when the stronger product action is
   asking, helping, replying, joining, or updating availability.
5. Mobile pages are clean but often too long because desktop sections are
   stacked rather than redesigned as mobile decision rows.

## Surface Plan

### Home

Priority:

1. primary ask/search command
2. people who can help
3. people the member could help
4. school pulse and profile upkeep as supporting context

Actions:

- Make the first viewport read as one command surface, not a generic dashboard.
- Use rows or split sections for helper suggestions; reserve cards for the
  repeated helper objects themselves.
- Keep school/profile modules secondary and visibly below relationship work.

### Help

Priority:

1. what the member is trying to figure out
2. explained matches
3. guided ask composition

Actions:

- Treat Help Get as the question-led product command center. Keep typed
  questions, private matches, and the Ask-the-circle recovery inside `/help`.
  People is a separate member-exploration surface rather than a redirect target
  for Help search.
- Make match explanations structured: reason, trust signal, suggested first
  ask.
- Avoid turning the page into another people directory.

### Help

Priority:

1. requests or people needing the member's help
2. availability state
3. helper preference maintenance

Actions:

- Separate "needs reply" from "you could help" from "update availability."
- Make the next helper action obvious without forcing profile browsing.
- Keep status panels compact and use rows for scannable opportunities.

### People

Priority:

1. search/filter intent
2. person fit
3. one best action per person

Actions:

- Keep People as broad alumni exploration and structured filtering, not the
  default destination for submitted AskBar queries.
- Convert the current grid/card feel into a stronger decision list where
  possible.
- Use one primary action per person based on state: Ask, Connect, Message, or
  view.
- Keep profile context compact; hide or improve weak absence copy.

### School

Priority:

1. next relevant school event or announcement
2. why it matters to relationship work
3. archive/detail access

Actions:

- Distinguish events, announcements, and pulse without making every item a
  generic card.
- Use timeline/list rhythm for school updates.
- Make RSVP/detail actions clear but secondary to Ask/Help product loops.

### Messages

Priority:

1. needs reply
2. active conversations
3. sent/done/history

Actions:

- Give lifecycle states stronger structure: unread, pending, accepted, active,
  declined, completed.
- Explain gated messaging states with the next available action.
- On mobile, prefer list-to-detail clarity over compressing a desktop split
  pane.

## Verification

Use the July 20 comprehensive audit as the current visual/reference baseline.
The external evidence report is intentionally immutable; the repo-local
resolution addendum records the disposition of each finding.

Before marking a visual pass complete, capture at least:

- desktop and mobile for Home, Help, People, Messages, and School
- tablet for Home, People, and Messages
- interaction states for mobile nav, notifications, People filters, and
  Messages lifecycle tabs

## Completed audit follow-up

- C-13: Settings now owns account, communication, helping, safety, export, and
  deletion in one measured row-based composition; Help links back to its
  helping section.
- C-43: Admin includes an organization-scoped report-review queue with bounded
  filters, explicit review/action transitions, and private moderation notes.
- C-44: Admin event authoring now covers member-detail content, schedule,
  facts, explicit time zone handling, and material-change notifications.
- C-45: account deletion and membership decisions use explicit confirmation,
  pending, success, and error states; rejection reasons remain private to
  authorized administrators.
