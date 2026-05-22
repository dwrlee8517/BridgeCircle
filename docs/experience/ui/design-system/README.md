# Civic Editorial Design System

Start with the production token contract in [`tokens.md`](tokens.md).

The interactive visual reference is [`Civic Design System.html`](Civic%20Design%20System.html). Use it for screen patterns, component intent, and visual context, but do not infer production token values from generated inline styles.

Prototype source files in [`reference-src/`](reference-src/) are reference material only. They help explain the exported prototype, but they are not production code and should not override `tokens.md`, the active design-system document, or the live app implementation.

When docs and app code disagree, app code reflects current production behavior, but the relevant design-system doc should be updated so downstream design and implementation work has a single trusted reference.

Live implementation anchors:

- [`../../../../app/src/app/globals.css`](../../../../app/src/app/globals.css)
- [`../../../../app/src/components/ui/`](../../../../app/src/components/ui/)
