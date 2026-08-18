# BridgeCircle Design System

> **Direction — [ADR 0013](../../../decisions/0013-toss-baseline-then-brand-overlay.md), accepted.**
> The **main design system is [`handoff/bridgecircle/`](handoff/bridgecircle/)** —
> the brand fork of the faithful Toss baseline
> ([`handoff/toss-base/`](handoff/toss-base/), Layer 0), diverging only via its
> [`OVERRIDES.md`](handoff/bridgecircle/project/uploads/OVERRIDES.md) ledger.
> Production theming runs the fork; the full redesign is translated to
> production flow-by-flow (Phase E).
>
> **Civic Editorial is fully removed (2026-07-25), not just retired as
> direction.** Its bundle, the Field Pro bundle, `fidelity-ledger.md`,
> `reference-src/`, and the Civic explorations are archived under
> [`docs/_archive/design-2026-07/`](../../../_archive/design-2026-07/). The app's
> Civic-named token aliases (`action-offer`, `accent-ochre`, `surface-ink`, the
> `font-size-h1`/`display-md` aliases) were migrated to their canonical fork
> roles in the same change, so there are no compatibility aliases left to
> outlive a page's redesign slice.

> **Updated 2026-06-02.** The Claude Design handoff bundle in
> [`handoff/`](handoff/) is now the source of truth for intended BridgeCircle
> UI/UX. Production docs and app primitives should align to that handoff while
> preserving real runtime behavior and data contracts.

Start here for production work. This directory has one active handoff-backed
design-system contract; older HTML visual references are in [`_archive/`](_archive/).

## Canonical Order

1. [`handoff/bridgecircle/project/SKILL.md`](handoff/bridgecircle/project/SKILL.md) — current design-system rules.
2. [`handoff/bridgecircle/project/colors_and_type.css`](handoff/bridgecircle/project/colors_and_type.css) — current token export.
3. [`handoff/bridgecircle/project/templates/`](handoff/bridgecircle/project/templates/) — stabilized surface compositions and interaction behavior.
4. [`handoff/bridgecircle/project/uploads/FLOWS.md`](handoff/bridgecircle/project/uploads/FLOWS.md) — product-flow contract.
5. [`tokens.md`](tokens.md) — production token mapping and compatibility notes.
6. [`components.md`](components.md) — production primitive and pattern usage.
7. [`states-and-motion.md`](states-and-motion.md) — production state and motion notes.
8. [`../../screens/`](../../screens/) — screen-level product jobs and hierarchy.
9. [`../../../../app/src/app/globals.css`](../../../../app/src/app/globals.css) — live CSS token implementation.
10. [`../../../../app/src/components/ui/`](../../../../app/src/components/ui/) — live shared primitives.
11. [`_archive/`](_archive/) — pre-handoff visual history only.

## Compatibility Density Modes

Existing production surfaces have three density modes that compose with theme.
They remain compatibility behavior during route-by-route redesign:

| Class | Intended Use | Actual Adoption (2026-08-13) |
|---|---|---|
| (none — default) | Onboarding, auth, profile detail header (single hero surfaces) | Everything not listed below |
| `.density-cozy` | Home, ask results, inbox, people search (list-of-cards member surfaces) | **Notifications only** (`notifications/page.tsx`) |
| `.density-pro` | Admin tables, analytics, ambassador dashboards (operator surfaces) | Admin shell (`(admin)/admin/layout.tsx`) — as intended |

What flips with density: legacy type aliases, padding, and shadow weight. What
does not flip: the BridgeCircle palette, shape tiers, font family, or focus
styles.

**`.density-cozy` is effectively unadopted.** The intended-use column is the
original design intent; only the notifications page applies the class, so Home,
Help results, Messages, and People currently render at default density. Either
adopt it on those four surfaces or drop the mode — do not cite this table as
evidence that cozy density ships. The block comment in `globals.css` also points
at a `density.md` that does not exist; this table is the surface assignment
matrix.

## Live Implementation Anchors

- [`../../../../app/src/app/globals.css`](../../../../app/src/app/globals.css) — tokens, density classes, motion
- [`../../../../app/src/components/ui/`](../../../../app/src/components/ui/) — shared primitives (Button, Card, StatusBadge, etc.)

When the handoff and app code disagree, the handoff defines intended UI/UX and
the app code defines current rendered/runtime behavior. Move production toward
the handoff unless a real data, routing, accessibility, or behavior constraint
requires a documented adaptation.
