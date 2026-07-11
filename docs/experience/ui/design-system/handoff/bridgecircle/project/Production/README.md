# Production

Designed screens whose feature **is implemented in mainline**. Mirrors the
`product-spec-obsidian-vault/Production/` split: if the code ships it, the
canonical screen design lives here.

- One HTML screen (or screen set) per feature, named after the surface it
  designs (e.g. `Help Hub.html`).
- A screen **graduates here from `Prototype/`** when its feature lands in
  mainline — move the file in the same change that ships the feature's spec
  to the vault's `Production/`.
- When a screen here and production code disagree, the code wins — fix the
  screen (or log an OVERRIDES.md entry if the divergence is intended
  direction) and flag the drift.

Verify placement against the code (`app/src/app/`), not the design's
self-described status.
