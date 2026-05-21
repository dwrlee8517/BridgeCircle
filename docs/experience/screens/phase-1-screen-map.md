# Phase 1 Screen Briefs

This file bridges product behavior and the Civic Editorial design system. Product behavior remains canonical in specs and architecture docs; visual rules remain canonical in [`../ui/design-system/`](../ui/design-system/).

| Surface | Route | Behavior source | UI source |
|---|---|---|---|
| Home | `/` | [`../../specs/phase-1/launch-cut.md`](../../specs/phase-1/launch-cut.md) | [`../ui/design-system/`](../ui/design-system/) |
| People | `/people` | [`../../specs/phase-1/user-flows.md`](../../specs/phase-1/user-flows.md) | [`../ui/design-system/`](../ui/design-system/) |
| Inbox | `/inbox` | [`../../specs/phase-1/user-flows.md`](../../specs/phase-1/user-flows.md) | [`../ui/design-system/`](../ui/design-system/) |
| Events | `/events`, `/events/[id]` | [`../../specs/phase-1/spec.md`](../../specs/phase-1/spec.md) | [`../ui/design-system/`](../ui/design-system/) |
| Profile | `/profile/[id]`, `/profile/me/*` | [`../../specs/phase-1/spec.md`](../../specs/phase-1/spec.md) | [`../ui/design-system/`](../ui/design-system/) |
| Admin | `/admin/*` | [`../../specs/phase-1/spec.md`](../../specs/phase-1/spec.md) | [`../ui/design-system/`](../ui/design-system/) |

## Cross-Screen Rules

- Use Civic Editorial hierarchy: clear top rules, sharp 6px radii, readable card density, Obsidian/Cobalt action states, and restrained metadata.
- Do not introduce generic SaaS gradients, social-feed mechanics, bubbly community styling, or CRM tables as the default member experience.
- Every member screen should make the next useful relationship action visible without requiring browsing.
- Admin screens can be denser, but should still use the same token system and plain operational language.
- If behavior changes, update the linked spec or architecture doc first.

## Home

Route: `/`

Primary job: orient the member and surface the next useful action.

Use the Civic home/dashboard patterns, but preserve this priority order:

1. pending asks or requests that need the viewer's response
2. a default "Find someone to ask" action when nothing is waiting
3. suggested people or new alumni with clear reasons
4. featured event and recent activity as supporting signals

Avoid passive portal composition. Home can show events and announcements, but it should not lead with browsing, fundraising, or a generic activity feed.

## People

Route: `/people`

Primary job: help members find the right person and decide whether to reach out.

The screen should combine natural-language search, structured filters, match reasons, mentor availability, and quick actions. Result cards should read as decision cards, not directory rows.

## Inbox

Route: `/inbox`

Primary job: manage relationship lifecycle across asks, friend requests, threads, and DMs.

Use clear sections and status badges. Prioritize items that require action over archival thread lists. Empty states should point members back to a useful next action, such as finding someone to ask or reviewing helper preferences.

## Events

Routes: `/events`, `/events/[id]`

Primary job: turn online community into in-person connection.

Events should feel like civic programming, not a marketing calendar. Use strong date/time metadata, location clarity, RSVP state, attendee context when available, and understated capacity indicators.

## Profile

Routes: `/profile/[id]`, `/profile/me/*`

Primary job: help the viewer understand who this person is, why they matter, and what action is appropriate.

Profiles should be decision pages. Lead with identity, role, location, cohort, helper status, shared context, and the relevant CTA. Keep career and education history scannable and editorial, with enough detail to support trust.

## Admin

Routes: `/admin/*`

Primary job: help staff operate the community without turning BridgeCircle into admin-first software.

Admin surfaces can use tables and dense controls, but should remain subordinate to the member-first product. Favor search, filters, status grouping, and explicit actions over broad dashboard decoration.
