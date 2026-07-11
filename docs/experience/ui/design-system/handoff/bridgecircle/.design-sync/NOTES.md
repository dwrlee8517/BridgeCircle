# DesignSync notes — bridgecircle (brand fork)

## Shape: hand-authored fork (NOT the converter flow)

Byte-copy of the `toss-base` bundle (2026-07-04, post PR #121) plus the
divergence ledger (`uploads/OVERRIDES.md`) and the baseline-test evidence
(`Help Hub.html`). Direct file push of `project/**`; no converter, no
`register_assets` (`@dsCard` markers index the cards).

## Per-user project pins (both of us sync from this repo)

The repo bundle is the shared source of truth; each syncer pushes it into
their **own** Claude Design project (projects are per-account — Daniel cannot
see Richard's, and vice versa). Convention:

- `config.json` (committed) stays Richard's pin
  (`b07651c7-8d28-43bd-ad1a-7af68e3f219b`) — do not overwrite it.
- Each other syncer keeps a **gitignored** `config.local.json` next to it with
  their own `projectId`. When present, `config.local.json` wins; otherwise fall
  back to `config.json`. Daniel's pin
  (`1212d2cf-4e45-4dfc-8519-93f06b1bb758`, created 2026-07-10) lives there.

## Project pin

Created and pinned (2026-07-04). Project `bridgecircle`
(`b07651c7-8d28-43bd-ad1a-7af68e3f219b`, created via DesignSync
`create_project` — design-system type) is recorded in `config.json`. First
push **done 2026-07-04**: all 18 `project/**` files (12 preview specimens + app
starter + `colors_and_type.css` + `SKILL.md` + `uploads/DESIGN.md` +
`uploads/OVERRIDES.md` + `Help Hub.html` — a legitimate bundle file in THIS
fork, unlike in toss-base) pushed at their project-relative paths; no deletes.
A re-sync is a direct `write_files` of the changed `project/**` files against
this pin — no converter, no `register_assets` (`@dsCard` markers index the
cards), no anchor (compare against a fresh `list_files`). Write a
`_ds_needs_recompile` sentinel after adding/renaming `@dsCard` specimens.

## Help Hub.html provenance

Originally designed by Richard **in the `toss-base` Claude Design project**
(2026-07-04 faithful-baseline test; pulled down the same day). The local
mirror was moved here because it is brand content (ADR 0013 layer discipline).

- The **remote original in the `toss-base` project** stays there until Richard
  moves it inside Claude Design — toss-base syncs must **never delete or
  overwrite it** (it is listed in that bundle's preserved-files rule).
- Once the `bridgecircle` project exists, this copy pushes there like any
  bundle file, and the fork project becomes its natural home. If Richard keeps
  editing the original in toss-base instead, re-pull from there before
  trusting this copy.

## Divergence discipline

- The fork may differ from `toss-base` ONLY per applied `OVERRIDES.md`
  entries. As scaffolded: **O1 (Pretendard) only** — tokens and specimens are
  otherwise byte-identical to the baseline.
- When applying an entry: change fork tokens/specimens → flip entry to
  applied with date + exact values → re-measure touched contrast pairs →
  sync → translate to production (`@layer base, brand`).
- Desktop work (E3) is an *extension* — new ground, not an override; TDS is
  mobile-only (see toss-base DESIGN.md §7).
