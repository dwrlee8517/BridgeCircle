# DesignSync notes — toss-base

## Shape: hand-authored (NOT the converter flow)

This handoff is a hand-authored seed bundle in the canonical Claude Design
project layout (`colors_and_type.css` + `uploads/` + `preview/` + `ui_kits/` +
`SKILL.md`), authored in-repo per ADR 0013 Phase A. There is no `package.json`,
`dist/`, Storybook, or React source to build.

Consequences for syncs:
- **Do not run the converter** (`package-build.mjs`) — nothing to convert. This
  is a direct file push of `project/**`.
- Preview cards come from the first-line `<!-- @dsCard group="…" -->` markers in
  `preview/*.html` and `ui_kits/**`; no `register_assets` needed.
- No `_ds_bundle.js` / `_ds_manifest.json` / `_ds_sync.json` — those belong to
  the converter output. No sync anchor; the next sync compares against a fresh
  `list_files`.

## Sync root / localDir

- Sync root: `docs/experience/ui/design-system/handoff/toss-base/`
- `localDir` for uploads: `project/` (relative to the sync root).
- Files push at their `project/`-relative paths (`colors_and_type.css`,
  `SKILL.md`, `uploads/DESIGN.md`, `preview/*.html`, `ui_kits/app/index.html`).
- The handoff-root `README.md` is repo-facing and is **not** pushed.

## Project pin

Not yet created. On the first interactive `/design-sync`, create a **new
design-system-type project** named `toss-base` (or let the skill create it),
verify `PROJECT_TYPE_DESIGN_SYSTEM` via `get_project`, push, then record the
project id in `config.json` (repo↔project pin), same shape as the
`fieldpro-design-system` bundle's `.design-sync/config.json`.

## Relationship to the other bundles

- `toss-base` (this) = faithful TDS, Layer 0, pristine. **Keep it faithful.**
- `bridgecircle` (later, ADR 0013 Phase E) = the brand fork, seeded from the
  existing `fieldpro-design-system` project. Brand divergences live there with
  an `OVERRIDES.md` ledger — never here.
- `fieldpro-design-system` = the earlier single-bundle Field Pro work (ADR
  0012, superseded). Its reconciled values feed the `bridgecircle` fork's
  override backlog; do not delete it.

## Provisional bits to reconcile

- **Dark theme** in `colors_and_type.css` is DERIVED, not real TDS dark (the
  fetched docs lacked dark tokens). Reconcile when the TDS dark theme is
  obtained.
- **Pretendard** substitutes for the proprietary Toss Product Sans.
