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

**Product specs live in the Obsidian vault.** [`product-spec-obsidian-vault/`](product-spec-obsidian-vault/) holds product specs, split into `Production/` (finalized specs describing full features/flows, with links to the design — treat as source of truth) and `Prototype/` (personal work-in-progress drafts; expect parallel versions, none authoritative). See [`product-spec-obsidian-vault/CLAUDE.md`](product-spec-obsidian-vault/CLAUDE.md) for the full structure.
