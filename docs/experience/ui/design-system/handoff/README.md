# BridgeCircle UI/UX Handoff

This folder holds the versioned Claude Design handoff bundle that defines the
intended BridgeCircle member-app UI/UX direction.

## Source Of Truth

Use this order for UI/UX decisions:

1. [`bridgecircle-design-system/project/ui_kits/app/index.html`](bridgecircle-design-system/project/ui_kits/app/index.html) — primary clickable member-app prototype. The export README identifies this as the file that was open during handoff.
2. [`bridgecircle-design-system/project/ui_kits/app/`](bridgecircle-design-system/project/ui_kits/app/) — prototype component files that support `index.html`.
3. [`bridgecircle-design-system/project/uploads/DESIGN.md`](bridgecircle-design-system/project/uploads/DESIGN.md) — Civic Editorial token and usage spec.
4. [`bridgecircle-design-system/project/colors_and_type.css`](bridgecircle-design-system/project/colors_and_type.css) — standalone CSS token export.
5. [`bridgecircle-design-system/project/preview/`](bridgecircle-design-system/project/preview/) — token and component specimens.
6. [`bridgecircle-design-system/project/explorations/`](bridgecircle-design-system/project/explorations/) — exploratory variants; use only when explicitly promoted.

## Implementation Rule

The handoff defines the intended visual hierarchy, interaction model, screen
composition, and component behavior. The production app still defines current
runtime behavior, data contracts, auth, routing, and real Supabase-backed state.

Use the prototype for screen composition and interaction details. Use
`uploads/DESIGN.md` and `colors_and_type.css` for token values when inline
prototype styles or exploration files disagree with the token spec.

When implementing from the handoff:

- translate the prototype output into existing production primitives and
  tokens instead of copying inline styles mechanically
- preserve production-only improvements when they are compatible with the
  handoff, such as `Button variant="offer"` for give-help actions
- update local production docs when the handoff changes the intended UI/UX
- treat screenshots and `scraps/` as supporting evidence, not primary source

Known export mismatch: `ui_kits/app/README.md` mentions `PersonCard.jsx`, but
the actual file is `MemberCard.jsx`, which exports `BCPersonCard`.

For the initial comparison against the current production app, see
[`current-comparison-2026-06-02.md`](current-comparison-2026-06-02.md).
