# Field Pro design-system handoff (TDS baseline)

This folder mirrors the **`fieldpro-design-system` Claude Design project** —
the canonical home of BridgeCircle's visual system per
[ADR 0012](../../../../decisions/0012-tds-design-system.md). Sync is via
DesignSync (`/design-login` + `/design-sync`, interactive sessions only);
edits flow both ways, one component at a time, never wholesale.

**Status: SEED v0.1 — pre-sync, provisional until A5.** This bundle was
authored in-repo (ADR 0012 Phase A1) to seed the Claude Design project.
Until the A5 reconciliation audit lands exact values from
"Toss Style – Field Pro v2", treat the structure as stable and the values
as provisional. **Do not translate into production before A5.**

## Source of truth (once synced)

1. `project/ui_kits/app/index.html` — starter member-app prototype
2. `project/uploads/DESIGN.md` — Field Pro token + usage spec
3. `project/colors_and_type.css` — standalone token export (light + dark)
4. `project/preview/` — @dsCard specimens (ramps, identity, type, components)

## Remaining Phase A steps (Richard, interactive)

- **A2** — in Claude Design, create a **new design-system-type project**
  named `fieldpro-design-system` (type is immutable — don't reuse the
  regular "Field Pro v2" project; move/duplicate its file into the new one).
- **A3** — in a terminal `claude` session in this repo: `/design-login`,
  then `/design-sync` targeting the new project with this folder as
  `localDir`, pushing the seed up.
- **A4** — sync down so Field Pro v2 itself lands here.
- **A5** — (Claude) reconcile seed values against Field Pro v2 exact hexes/
  gradients; push the corrected canon back up. Production translation
  (Phase B) starts only after this.

## Implementation rule (unchanged from Civic)

The handoff defines intended tokens, hierarchy, and composition. Production
(`app/src/app/globals.css` + owned primitives) translates — it never copies
inline styles. Drift gets recorded in `fidelity-ledger.md` (created at
Phase C). The retired Civic Editorial handoff lives at
[`../bridgecircle-design-system/`](../bridgecircle-design-system/) until
Phase D archives it.
