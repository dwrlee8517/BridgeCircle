# Civic Editorial Design System

> **Updated 2026-05-25.** The Warm theme + density modes (default / cozy / pro)
> were adopted into the production Civic system. Tokens, type scale, radius,
> and the new `--cta` amber color are live in `app/src/app/globals.css`. See
> [`../../explorations/_archive/warm-2026-05-adopted/`](../../explorations/_archive/warm-2026-05-adopted/)
> for the experiment that became this system.

Start here for production work. This directory has one active design-system
contract; older HTML visual references are in [`_archive/`](_archive/).

## Canonical Order

1. [`tokens.md`](tokens.md) — production token contract (color, type, radius, shadow, density modes).
2. [`states-and-motion.md`](states-and-motion.md) — production state and motion contract.
3. [`components.md`](components.md) — production component and pattern usage.
4. [`../../screens/`](../../screens/) — screen-level product jobs and hierarchy.
5. [`../../../../app/src/app/globals.css`](../../../../app/src/app/globals.css) — live CSS token implementation.
6. [`../../../../app/src/components/ui/`](../../../../app/src/components/ui/) — live shared primitives.
7. [`screenshots/`](../screenshots/) — current rendered reference captures.
8. [`_archive/`](_archive/) — pre-Warm HTML references (visual history only; do not use for production token values).

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

When docs and app code disagree, app code reflects current production behavior, but the relevant design-system doc should be updated so downstream design and implementation work has a single trusted reference.
