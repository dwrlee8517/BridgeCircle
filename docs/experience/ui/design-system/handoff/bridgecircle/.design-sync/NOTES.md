# DesignSync notes — bridgecircle (brand fork)

## Shape: hand-authored fork (NOT the converter flow)

Byte-copy of the `toss-base` bundle (2026-07-04, post PR #121) plus the
divergence ledger (`uploads/OVERRIDES.md`) and the baseline-test evidence
(`Help Hub.html`). Direct file push of `project/**`; no converter, no
`register_assets` (`@dsCard` markers index the cards).

## Project pin

**Not yet created.** On the first interactive `/design-sync`: create a new
design-system-type project named `bridgecircle`, verify
`PROJECT_TYPE_DESIGN_SYSTEM` via `get_project`, push `project/**`, then record
the id in `config.json` (same shape as the toss-base pin).

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
