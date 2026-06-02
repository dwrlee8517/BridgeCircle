# BridgeCircle Experience

This is the home for current BridgeCircle UX, UI, screen-level decisions, and design-system references.

## Trust hierarchy

Use this order when docs or artifacts disagree:

1. Live implementation for current rendered behavior:
   [`../../app/src/`](../../app/src/)
2. Intended UI/UX direction:
   [`ui/design-system/handoff/`](ui/design-system/handoff/)
3. Product behavior: [`../specs/`](../specs/) and
   [`../architecture/`](../architecture/)
4. Active UX interpretation: [`ux/`](ux/)
5. Active UI system implementation notes: [`ui/design-system/`](ui/design-system/)
6. Screen-level bridge: [`screens/`](screens/)
7. Experimental workbench: [`explorations/`](explorations/) only when
   explicitly requested or promoted

## Working rule

The handoff bundle is the source of truth for intended UI/UX. App code remains
the source of truth for current runtime behavior, data contracts, auth, routing,
and real persisted state. When the handoff and app disagree, align the app
toward the handoff unless a production data or behavior constraint makes that
impossible, and update the relevant experience doc in the same change.

Only current, decision-bearing guidance belongs in `ux/`, `ui/design-system/`,
and `screens/`. Use `explorations/` for experiments, but do not treat those
files as current guidance unless the user explicitly names one or it has been
promoted. Historical audits, old screenshots, and stale current-state captures
live under `docs/experience/_archive/`.
