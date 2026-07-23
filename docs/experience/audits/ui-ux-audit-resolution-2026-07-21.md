# UI/UX audit resolution addendum — 2026-07-21

This is the repo-local disposition of the 46 findings in the immutable
comprehensive UI/UX audit report. It records the code state after the six
initial follow-up commits (`0e9138b`, `0a917b3`, `ad26503`, `d8b0c7d`,
`edc5df7`, and `562d49e`) and the final Settings/Admin follow-up described
below. It does not replace the report or erase its evidence trail.

## Status legend

- **Resolved** — the cited follow-up commits implement the audit recommendation.
- **Partial** — meaningful follow-up exists, but the intended end state is not
  yet complete.
- **Open** — no implementation claim is made; the item remains planned.

## Disposition

| ID | Status | Evidence / remaining boundary |
|---|---|---|
| C-01 | Resolved | Direct profile Ask loads an authorized recipient and preserves topic/draft context (`0e9138b`). |
| C-02 | Resolved | Account and self-profile Settings paths were corrected (`0e9138b`). |
| C-03 | Resolved | Give Help includes the bounded search arm (`0e9138b`, `ad26503`). |
| C-04 | Resolved | Availability/decline language now follows the Help contract (`0e9138b`). |
| C-05 | Resolved | Home priority copy derives from the actual waiting state (`0e9138b`). |
| C-06 | Resolved | Narrow Home and member navigation containment was corrected (`0e9138b`). |
| C-07 | Resolved | Divider token alias was restored (`0e9138b`). |
| C-08 | Resolved | Stable member-avatar pair selection is centralized (`0e9138b`). |
| C-09 | Resolved | Unsupported theme selection was removed (`0e9138b`). |
| C-10 | Resolved | Held RSVP uses the shared modal lifecycle (`0e9138b`). |
| C-11 | Resolved | School/event cover and glass-tile anatomy were aligned (`0e9138b`). |
| C-12 | Resolved | Profile origin and self-profile navigation state were corrected (`0e9138b`). |
| C-13 | Resolved | `/settings` now uses the measured unified row composition and owns account, communication, helping, safety, export, and deletion; `/help/settings` safely redirects to its helping section. |
| C-14 | Resolved | Shared auth, admin, and onboarding form semantics were completed (`0e9138b`, `edc5df7`, `562d49e`). |
| C-15 | Resolved | Help search follows the debounced interaction contract (`ad26503`). |
| C-16 | Resolved | Help mode preference persists per member (`ad26503`). |
| C-17 | Resolved | Help mode control uses matching navigation semantics (`ad26503`). |
| C-18 | Resolved | No-results recovery preserves the question and links to circle Ask (`ad26503`). |
| C-19 | Resolved | Message detail retains an explicit parent/back path (`0e9138b`). |
| C-20 | Resolved | Help and Messages own their not-found recovery (`0a917b3`). |
| C-21 | Resolved | School selection and event-detail navigation are distinct (`0e9138b`). |
| C-22 | Resolved | Past/cancelled event controls are state-specific (`0a917b3`). |
| C-23 | Resolved | RSVP cancellation is named and confirmed coherently (`0a917b3`). |
| C-24 | Resolved | Member-facing product name is Newsletter (`0e9138b`). |
| C-25 | Resolved | Newsletter reading pages no longer reopen the Help loop (`0a917b3`). |
| C-26 | Resolved | Archive chrome no longer duplicates article-level headings (`0e9138b`). |
| C-27 | Resolved | Unread notification styling is informational (`0e9138b`). |
| C-28 | Resolved | Notification optimistic failures reconcile and report status (`0a917b3`). |
| C-29 | Resolved | Actionable notification toast can be paused/dismissed (`0a917b3`). |
| C-30 | Resolved | Notification filters expose selection semantics (`0a917b3`). |
| C-31 | Resolved | Email-change confirmation and pending state are explicit (`d8b0c7d`). |
| C-32 | Resolved | Settings submits now expose pending/disabled behavior (`d8b0c7d`). |
| C-33 | Resolved | Settings status and error live-region roles are distinct (`d8b0c7d`). |
| C-34 | Resolved | Block/disconnect confirmation remains coherent while committing (`0e9138b`). |
| C-35 | Resolved | Home spotlight controls meet usable hit-target sizing (`0a917b3`). |
| C-36 | Resolved | Disclosure controls identify their controlled regions (`0a917b3`). |
| C-37 | Resolved | Route-state focus lands on context before recovery (`0a917b3`). |
| C-38 | Resolved | Report failure is assertive; success is polite (`0a917b3`). |
| C-39 | Resolved | Member loading has an announced status (`0a917b3`). |
| C-40 | Resolved | Member archive/notification widths were reconciled (`d8b0c7d`). |
| C-41 | Resolved | Sign-in copy includes the intended school-circle audience (`d8b0c7d`). |
| C-42 | Resolved | Event attendee fallbacks use stable rotated avatars (`0e9138b`). |
| C-43 | Resolved | `/admin/reports` provides an organization-scoped moderation queue with status/type filters, explicit transitions, stale-write protection, private notes, and audit records. |
| C-44 | Resolved | Admin event authoring covers the member-detail content model, schedules, facts, explicit IANA time zones, DST-safe validation, and material-change notifications. |
| C-45 | Resolved | Account deletion and membership decisions provide confirmation, pending, success, and error feedback; rejection reason codes and notes are stored privately and are never included in member email. |
| C-46 | Resolved | Canonical route/status docs were reconciled in this addendum and its linked IA, screen map, and quality plan. |

## Remaining product decisions

The current member School, People/Profile, Home, Help, and Messages surfaces
and the audited Settings/Admin follow-ups are implemented local v2 slices.
All C-01 through C-46 implementation discrepancies are resolved in the local
codebase. Future expansion beyond the bounded moderation states, event content
model, or current settings ownership is new product scope and requires a
separate product decision rather than being treated as unfinished audit work.
