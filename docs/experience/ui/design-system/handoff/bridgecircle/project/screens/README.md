# BridgeCircle screen handoff

This directory is the canonical page-and-flow layer for BridgeCircle's target
redesign. It sits beside the design-system specimens rather than replacing
them:

- `../uploads/FLOWS.md` defines intended product behavior.
- `../uploads/OVERRIDES.md` defines allowed BridgeCircle deviations from Toss.
- `../preview/` defines component and pattern specimens.
- `./` defines complete pages, meaningful states, and transitions engineers
  can implement.

## Review entry point

Open `index.html` through a local HTTP server. The gallery keeps the current
screen visible while reviewers switch between routes and states.

## Screen contract

Each screen must:

1. Start with a DesignSync `@dsCard` marker in the first line.
2. Use `../colors_and_type.css`; page files may compose tokens but must not
   invent unlogged brand values.
3. Name its route, state, behavior source, and review status in the gallery.
4. Include the primary interaction and the states needed to understand it.
5. Cover empty/loading/error/permission states in the relevant flow before the
   flow is marked approved.
6. Keep copy aligned with `docs/product/voice-guidelines.md` and the horizontal
   help model: Ask, Connect, Help, Circle. Do not reintroduce mentor/mentee
   identity.

## Status vocabulary

- `draft` — composition exists; product/design review is still open.
- `reviewed` — direction is accepted; remaining changes are concrete.
- `approved` — visual and interaction contract is ready for engineering.
- `built` — production route has been verified against the approved screen.

`SCREEN-MAP.md` is the coverage ledger. A page is not complete merely because
its default state has an HTML file.

## First slice

People and Profile establish the shared member shell, directory search,
relationship-state actions, direct full-profile routing, the canonical member
profile, Connect intro, self-editing, link visibility, and enrichment review patterns.
Search results are capped at the 50 strongest matches and paginated 20 per
page (20 / 20 / 10); the interface explains the cap and invites members to refine broad
searches rather than silently hiding the remaining directory. Desktop and
tablet use numbered pages; mobile keeps the same 20 / 20 / 10 fetch sizes but
reveals them through Load 20 more, then Load 10 more, without replacing the
current list.
`people-profile-overlay.html` uses BridgeCircle's wash, elevated sheet, avatar
palette, action finish, and privacy treatment while reserving cards for
bounded interactions. Help and Messages follow after this slice is approved.
Career entries demonstrate long LinkedIn-style bullet descriptions in a
collapsed/expanded pattern. On every viewport, selecting the row or member name
opens the full profile, while the row action remains independent. Closing the
profile restores the search query, scope, results page, and member position.
The slice also includes state-aware Connected / Requested / Connect profiles,
Report / Block / Disconnect confirmations, and the empty, loading, failure,
gone, permission-denied, and blocked system states.
