# BridgeCircle Experience

This is the home for current BridgeCircle UX, UI, screen-level decisions, and design-system references.

## Trust hierarchy

Use this order when docs or artifacts disagree:

1. Product behavior: [`../specs/`](../specs/) and [`../architecture/`](../architecture/)
2. Active UX interpretation: [`ux/`](ux/)
3. Active UI system: [`ui/design-system/`](ui/design-system/)
4. Screen-level bridge: [`screens/`](screens/)
5. Experimental workbench: [`explorations/`](explorations/) only when explicitly requested or promoted
6. Live implementation: [`../../app/src/app/globals.css`](../../app/src/app/globals.css) and [`../../app/src/components/ui/`](../../app/src/components/ui/)

## Working rule

Only current, decision-bearing guidance belongs in `ux/`, `ui/design-system/`, and `screens/`. Use `explorations/` for experiments, but do not treat those files as current guidance unless the user explicitly names one or it has been promoted. Historical audits, old screenshots, and stale current-state captures live under `docs/experience/_archive/`.

When design docs and app code disagree, app code reflects current production behavior, but the relevant experience doc should be updated.
