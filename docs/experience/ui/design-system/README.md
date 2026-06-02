# Civic Editorial Design System

> **Updated 2026-06-02.** The Claude Design handoff bundle in
> [`handoff/`](handoff/) is now the source of truth for intended BridgeCircle
> UI/UX. Production docs and app primitives should align to that handoff while
> preserving real runtime behavior and data contracts.

Start here for production work. This directory has one active handoff-backed
design-system contract; older HTML visual references are in [`_archive/`](_archive/).

## Canonical Order

1. [`handoff/bridgecircle-design-system/project/ui_kits/app/index.html`](handoff/bridgecircle-design-system/project/ui_kits/app/index.html) — primary UI/UX source of truth for member-app screen composition and interaction direction.
2. [`handoff/bridgecircle-design-system/project/uploads/DESIGN.md`](handoff/bridgecircle-design-system/project/uploads/DESIGN.md) — Civic Editorial token and usage source from the handoff.
3. [`handoff/bridgecircle-design-system/project/colors_and_type.css`](handoff/bridgecircle-design-system/project/colors_and_type.css) — handoff token CSS export.
4. [`tokens.md`](tokens.md) — production token implementation notes.
5. [`states-and-motion.md`](states-and-motion.md) — production state and motion implementation notes.
6. [`components.md`](components.md) — production component and pattern usage.
7. [`../../screens/`](../../screens/) — screen-level product jobs and hierarchy.
8. [`../../../../app/src/app/globals.css`](../../../../app/src/app/globals.css) — live CSS token implementation.
9. [`../../../../app/src/components/ui/`](../../../../app/src/components/ui/) — live shared primitives.
10. [`screenshots/`](../screenshots/) — current rendered reference captures.
11. [`_archive/`](_archive/) — pre-handoff visual history only.

## Density modes (new)

Civic now has three density modes that compose with theme. Surfaces declare a
density via a wrapper class:

| Class | Use |
|---|---|
| (none — default) | Onboarding, auth, profile detail header (single hero surfaces) |
| `.density-cozy` | Home, ask results, inbox, people search (list-of-cards member surfaces) |
| `.density-pro` | Admin tables, analytics, ambassador dashboards (operator surfaces) |

What flips with density: type sizes, padding, shadow weight, avatar size, CTA
over-claim. What does NOT flip: radius, color palette, font family, focus
styles. Full surface-assignment matrix in [`tokens.md`](tokens.md) § Density modes.

## Live Implementation Anchors

- [`../../../../app/src/app/globals.css`](../../../../app/src/app/globals.css) — tokens, density classes, motion
- [`../../../../app/src/components/ui/`](../../../../app/src/components/ui/) — shared primitives (Button, Card, StatusBadge, etc.)

When the handoff and app code disagree, the handoff defines intended UI/UX and
the app code defines current rendered/runtime behavior. Move production toward
the handoff unless a real data, routing, accessibility, or behavior constraint
requires a documented adaptation.
