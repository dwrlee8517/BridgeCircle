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
- We never *upload* `_ds_bundle.js` / `_ds_manifest.json` / `_ds_sync.json` — no
  converter output, no sync anchor; the next sync compares against a fresh
  `list_files`. **But the Claude Design app generates its own `_ds_bundle.js`,
  `_ds_manifest.json`, and `_adherence.oxlintrc.json` in the project** on its
  self-check — app-managed and regenerated; leave them (see "Remote-only files"
  below).
- After adding/renaming `@dsCard` specimens, write a `_ds_needs_recompile`
  sentinel as the final step of the push so the app rebuilds its card index.

## Sync root / localDir

- Sync root: `docs/experience/ui/design-system/handoff/toss-base/`
- `localDir` for uploads: `project/` (relative to the sync root).
- Files push at their `project/`-relative paths (`colors_and_type.css`,
  `SKILL.md`, `uploads/DESIGN.md`, `preview/*.html`, `ui_kits/app/index.html`).
- The handoff-root `README.md` is repo-facing and is **not** pushed.

## Project pin

Created and pinned (2026-07-04). Project `toss-base`
(`f58b5256-e8d6-4e4f-b164-7f1bdd33760d`, verified `PROJECT_TYPE_DESIGN_SYSTEM`)
is recorded in `config.json` (repo↔project pin), same shape as the
`fieldpro-design-system` bundle's `.design-sync/config.json`. All `project/**`
files are pushed at their project-relative paths. A re-sync is a direct
`write_files` of the changed `project/**` files against this pin — no converter,
no `register_assets` (cards come from `@dsCard` markers), no anchor (compare
against a fresh `list_files`).

**Re-sync log — 2026-07-04.** Bundle grew from the 8-file seed to **13 files**:
added 5 preview specimens (`feedback`, `forms`, `lists`, `navigation`,
`overlays`) and updated `SKILL.md` + `uploads/DESIGN.md` to the Wave-1
(~25-of-~47) component set. Pushed the 7 changed/new files; 6 unchanged files
skipped; no deletes. Then grew again to **16 files**: added 3 Wave-2 specimens
(`content`, `inputs-extended`, `results`) with the matching `SKILL.md` +
`DESIGN.md` updates (5 files pushed, 11 skipped, no deletes). Bundle now carries
12 preview specimens.

## Remote-only files — leave on re-sync (do NOT delete)

The project accumulates files that are **not** part of `project/**`. A re-sync
reconciles only bundle files; never delete these:

- `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` —
  **app-generated** by the Claude Design self-check (card index + token
  adherence lint config), regenerated on open.
- `Help Hub.html` — a **design built with** toss-base (a BridgeCircle Ask/Give
  mock + friction log), not bundle source. User content; never overwrite.
- Any other design docs a user creates in the project.

Reconciliation deletes apply only to orphaned `project/**` bundle files (a
specimen removed locally). Everything above is out of scope for deletion.

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
- **Wave-1 component set (~25 of ~47).** Fintech primitives (Keypad, Asset,
  Amount Top, Agreement, Chart) are deliberately omitted; the Wave-2 list in
  DESIGN.md §5 is added when a surface needs it. Component details the public
  TDS docs don't pin down are inferred from the token idiom and marked ⓘ —
  reconcile against the real component docs when available.
