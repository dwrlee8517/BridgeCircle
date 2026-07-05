# toss-base — handoff bundle

The **faithful Toss Design System (TDS)** baseline — Layer 0 of
[ADR 0013](../../../../../decisions/0013-toss-baseline-then-brand-overlay.md).
A complete, unbent transcription of TDS from the official
[`@toss/tds-react-native`](https://tossmini-docs.toss.im/tds-react-native/foundation/colors/)
foundation docs. Brand-neutral: the BridgeCircle brand system forks from this
(the separate `bridgecircle` project), it does **not** live here.

This folder is the local mirror of the `toss-base` Claude Design
design-system project, synced via **DesignSync**.

## Layout

```
toss-base/
  project/                     ← the sync localDir (everything here is pushed)
    colors_and_type.css        ← full TDS token export (8 families, type, spacing, radius)
    SKILL.md                   ← guidance for the design agent
    uploads/DESIGN.md          ← the spec (principles, ramps, roles, contrast, gaps)
    preview/                   ← @dsCard specimens
      ramps.html               ·  8 color families
      type.html                ·  TDS type scale
      spacing-radius.html      ·  8px grid + radius tiers
      components.html          ·  blue-only components
    ui_kits/app/index.html     ← starter mobile screen
  README.md                    ← this file (repo-facing; NOT pushed)
  .design-sync/                ← sync config + notes
```

## First sync (Richard, interactive `claude` session)

DesignSync `create_project`, `/design-login`, and `/design-sync` are
**interactive-only** — Claude cannot run them in a desktop-app session.

1. Create a **new design-system-type project** named `toss-base` in Claude
   Design (project type is immutable at creation — it must be a design-system
   project). Or let `/design-sync` create it.
2. From this repo, run `/design-login` then `/design-sync`, targeting the new
   project with `localDir` = `project/`.
3. Verify with `get_project` that type is `PROJECT_TYPE_DESIGN_SYSTEM` before
   pushing. The push sends `project/**` at their `project/`-relative paths.
4. Pull down to confirm parity. From then on, Claude Design is canonical.

Once pushed, pin the project id in `.design-sync/config.json`.

## Rules

- **Keep this layer faithful.** No brand tokens (no green give action, no
  section bands, no ochre warning, no CircleMark). Those belong in the
  `bridgecircle` fork with an `OVERRIDES.md` ledger entry.
- Preview cards come from the first-line `<!-- @dsCard group="…" -->` markers;
  no `register_assets` needed.
- This is a hand-authored bundle (not the converter flow) — no `package.json`,
  no `_ds_bundle.js`. See `.design-sync/NOTES.md`.
