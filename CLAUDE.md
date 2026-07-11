@AGENTS.md

# CLAUDE.md

Claude-Code-specific habits for this repo. Project framing comes from the `@AGENTS.md` import above; stack and `/lib` discipline live in [`app/CLAUDE.md`](app/CLAUDE.md) — read it before touching anything under [`app/`](app/).

## Habits worth keeping

These supplement the harness defaults (which already enforce surgical edits, no speculative abstractions, and surfacing assumptions). The items below are the project-specific reinforcements that matter most.

**Goal-driven execution.** Convert vague tasks into verifiable goals before coding:

- "Fix the bug" → write a test that reproduces it, then make it pass.
- "Add validation" → write tests for the invalid inputs, then make them pass.
- "Refactor X" → confirm the test suite passes before and after.

For multi-step work, sketch the plan as `step → verification`, then loop until each verification passes.

**Brand voice on every user-facing string.** Before writing product copy, emails, AI drafts, microcopy, or marketing text, read [`docs/product/brand-strategy.md`](docs/product/brand-strategy.md) and [`docs/product/voice-guidelines.md`](docs/product/voice-guidelines.md). No generic SaaS jargon, no hype, no "powerful AI-powered platform."

**Two-sided buffer framing.** Any peer-to-peer feature (asks, declines, RSVPs, mediated sends) must reduce psychological friction on **both** sides — initiator and responder. Symmetric barrier reduction is the brand mechanism, not a nice-to-have.

**When code and docs disagree, code wins** — but fix the docs in the same change and flag the drift.

**Product-spec Obsidian vault (forward-looking workspace).** [`product-spec-obsidian-vault/`](product-spec-obsidian-vault/) is a new home for product specs authored in Obsidian, split into `Production/` (specs finalized within the vault — full features/flows with design links) and `Prototype/` (personal work-in-progress drafts; expect parallel versions, none authoritative). It does **not** yet replace [`docs/`](docs/): active repo specs still live under `docs/` and are indexed by [`docs/INDEX.md`](docs/INDEX.md) — start there for canonical specs. The vault is currently empty; as specs migrate in, `Production/` becomes canonical for those features and the docs should be updated to point here. See [`product-spec-obsidian-vault/CLAUDE.md`](product-spec-obsidian-vault/CLAUDE.md) for the full structure.
