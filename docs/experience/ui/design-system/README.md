# Civic Editorial Design System

Start here for production work. This directory has one active design-system
contract and a larger prototype archive.

## Canonical Order

1. [`tokens.md`](tokens.md) - production token contract.
2. [`states-and-motion.md`](states-and-motion.md) - production state and
   motion contract.
3. [`components.md`](components.md) - production component and pattern usage.
4. [`../../screens/`](../../screens/) - screen-level product jobs and hierarchy.
5. [`../../../../app/src/app/globals.css`](../../../../app/src/app/globals.css) - live CSS token implementation.
6. [`../../../../app/src/components/ui/`](../../../../app/src/components/ui/) - live shared primitives.
7. [`screenshots/`](../screenshots/) - current rendered reference captures.
8. [`state-motion-gallery.html`](state-motion-gallery.html) - focused visual
   reference for lifecycle states, interaction states, and motion recipes.
9. [`Civic Design System.html`](Civic%20Design%20System.html) and [`reference-src/`](reference-src/) - broader visual reference only.

## Prototype Boundary

The focused state and motion reference is
[`state-motion-gallery.html`](state-motion-gallery.html). Use it to inspect the
formal lifecycle states, interaction states, motion recipes, and screen QA
checks defined in [`states-and-motion.md`](states-and-motion.md).

The broader interactive visual reference is
[`Civic Design System.html`](Civic%20Design%20System.html). Use it for screen
patterns, component intent, and visual context, but do not infer production
token values from generated inline styles.

Prototype source files in [`reference-src/`](reference-src/) are reference material only. Many files in that folder are older Atrium-era explorations and still contain obsolete terracotta/oat token exports. They help explain the exported prototype, but they are not production code and should not override [`tokens.md`](tokens.md), [`states-and-motion.md`](states-and-motion.md), [`components.md`](components.md), or the live app implementation.

Do not copy CSS custom properties, Tailwind config, component code, or raw colors from `reference-src/` into production.

## Live Implementation Anchors

- [`../../../../app/src/app/globals.css`](../../../../app/src/app/globals.css)
- [`../../../../app/src/components/ui/`](../../../../app/src/components/ui/)

When docs and app code disagree, app code reflects current production behavior, but the relevant design-system doc should be updated so downstream design and implementation work has a single trusted reference.
