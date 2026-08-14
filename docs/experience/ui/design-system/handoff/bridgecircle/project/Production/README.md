# Production

Designed screens whose feature **is implemented in mainline**. Mirrors the
`product-spec-obsidian-vault/Production/` split: if the code ships it, the
canonical screen design lives here.

- One HTML screen (or screen set) per feature, named after the surface it
  designs (e.g. `Ask Status.html` for the ask-status page).
- **Audit and reference artifacts do not belong here** — they stay at the bundle
  root. `Help Hub.html` is the clearest example: it is the 2026-07-04
  faithful-baseline friction test, evidence *about* the system rather than the
  canonical design of a shipped feature, and `uploads/OVERRIDES.md` links it as
  `../Help Hub.html`. Leave it where it is.
- A screen **graduates here from `Prototype/`** when its feature lands in
  mainline — move the file in the same change that ships the feature's spec
  to the vault's `Production/`.
- When a screen here and production code disagree, the code wins — fix the
  screen (or log an OVERRIDES.md entry if the divergence is intended
  direction) and flag the drift.

Verify placement against the code (`app/src/app/`), not the design's
self-described status.
