---
type: debt
area: design-system
severity: low
found_during: design-system org migration (PR #187) — reviewing the ledger's parked items
date: 2026-08-14
---

# The parked template↔token drift set is still unresolved

## What I saw

`docs/experience/ui/design-system/handoff/bridgecircle/project/uploads/OVERRIDES.md` — pattern
guidance carries a deliberately parked list of literals in the Claude Design templates that never
became tokens:

- **Dialog radii** — 20px literals in `templates/**` and `preview/decision-dialogs.html`. Explicitly
  *not* touched by the 2026-08-13 card-radius change (card tier went 20 → 16; these are dialogs).
- **Scrim value**, **skeleton greys** (the shimmer gradient's `#eef1f5` / `#f6f8fa` stops, excluded
  on purpose from the 2026-07-12 literal→var sweep), and `#f4f6f9`.

## Why it might matter

Low severity and genuinely deliberate — each was parked with a reason, not forgotten. The risk is
only that "parked" and "drift" become indistinguishable over time: a future audit re-discovers these
and either re-litigates them or mistakes them for new drift. The dialog radius is the one with a real
decision behind it, since dialogs now differ from cards (20 vs 16) without a ledger entry saying that
is intended.

## Not doing it now because

Nothing depends on it, and the redesign may settle the dialog treatment on its own.

## Possible fix

Either mint the missing roles (a `--radius-dialog`, a skeleton pair) or add one ledger line per item
stating the literal is intentional and why — so the next audit reads them as decisions rather than
findings. The second option is cheaper and probably sufficient.
