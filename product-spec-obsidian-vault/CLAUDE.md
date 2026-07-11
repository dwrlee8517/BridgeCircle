# product-spec-obsidian-vault

An Obsidian vault for BridgeCircle product specs. Open this folder as a vault
in Obsidian (Open folder as vault → point it here); Obsidian adds its own
`.obsidian/` config on first open.

## File structure

- **[`Product to App Pipeline.md`](Product%20to%20App%20Pipeline.md)** — Root map of the
  end-to-end workflow this vault sits inside: product decision → spec → design →
  verify → code → CI/CD → environments. Start here to see where `Production/` and
  `Prototype/` fit in the bigger picture.

- **`Production/`** — Specs whose feature **is implemented in mainline**. These
  describe shipped behavior end-to-end and are the canonical spec for that
  feature. Mirror the app: if the code does it, the spec lives here. Currently
  holds [`phase-1/`](Production/phase-1/) — the Phase 1 spec, launch cut, week
  3–4 features, user flows, and launch checklist — and
  [`testing-suite.md`](Production/testing-suite.md) (the shipped hermetic
  E2E infrastructure: local Supabase + seeds, feature suites, CI/CD wiring).
  `docs/` now points here for these.

- **`Prototype/`** — Specs whose feature is **not yet built** — forward-looking
  proposals and work-in-progress drafts (a feature may have several parallel
  drafts here; none is authoritative until it ships). Currently holds
  `ask-mediator.md`, `events-conditional-rsvp.md` (Phase 2, unbuilt),
  `no-invite-landing.md` (sign-in rejection → landing page + invite requests),
  and [`phase-1/post-launch-backlog.md`](Prototype/phase-1/post-launch-backlog.md)
  (deferred).

- **`Vision/`** — Long-horizon, higher-altitude material: product north stars,
  future plans beyond the current phase, and target (long-term) architecture and
  design direction. Unlike `Production/` and `Prototype/`, this is **not** a
  place for shippable feature specs and is **not** classified by implementation
  status — it holds the direction those specs eventually serve. A concrete
  feature that emerges from a Vision note gets its own spec in `Prototype/`
  (then `Production/` once built); the Vision note stays as the enduring "why."
  Currently holds
  [`North Star and Long-Horizon Roadmap.md`](Vision/North%20Star%20and%20Long-Horizon%20Roadmap.md)
  and [`Testing Suite.md`](Vision/Testing%20Suite.md) (target testing
  architecture: local Supabase + seeds, hermetic E2E on every PR).

## Conventions

- **Feature specs are placed by implementation status.** A spec goes in
  `Production/` when its feature ships in mainline; otherwise `Prototype/`.
  Verify against the code (routes under `app/src/app/`, modules under
  `app/src/lib/`), not the spec's self-described status. `Vision/` is exempt —
  it holds direction, not shippable specs.
- A spec **graduates** from `Prototype/` to `Production/` when its feature lands
  in mainline — move the file and repoint any inbound `docs/` references at the
  new path in the same change.
- When a Production spec and the code disagree, the code wins; fix the spec in
  the same change and flag the drift.
- Use Obsidian `[[wikilinks]]` to connect related specs across folders.
