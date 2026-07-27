# UI

This folder contains the visual design systems.

Start with:

- [Design system](design-system/)
- [Production tokens](design-system/tokens.md)

The main system is the [`bridgecircle`](design-system/handoff/bridgecircle/)
handoff bundle — the Toss-baseline brand fork where the redesign is designed
(ADR [0013](../../decisions/0013-toss-baseline-then-brand-overlay.md), accepted).
[`tokens.md`](design-system/tokens.md) and
[`components.md`](design-system/components.md) are the **brand-fork production
contracts** — production theming already runs the Toss baseline plus the fork.
Civic Editorial is retired.

Screenshot captures of the live app are Playwright output under
`output/playwright/` (gitignored; latest clean capture:
`fresh-screenshots-2026-05-24-clean/`). Older option explorations and
screenshots are archived under [`../_archive/`](../_archive/) and should not
be used for current design or build iteration.
