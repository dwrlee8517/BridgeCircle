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

**Product-spec Obsidian vault.** [`product-spec-obsidian-vault/`](product-spec-obsidian-vault/) is the home for product specs, authored in Obsidian and split **by implementation status**: `Production/` holds specs whose feature is implemented in mainline (canonical for that feature), `Prototype/` holds specs whose feature is not yet built (proposals + WIP drafts). A third folder, `Vision/`, holds long-horizon material (north stars, future plans, target architecture) and is *not* classified by build status. The Phase 1 specs have migrated here (`Production/phase-1/`), along with the unbuilt Phase 2 specs and the post-launch backlog (`Prototype/`); [`docs/`](docs/) now points at the vault for these, and [`docs/INDEX.md`](docs/INDEX.md) remains the manifest. Other doc types (architecture, decisions, runbooks, experience) still live under `docs/`. When placing or moving a spec, verify implementation against the code, not the spec's self-described status. See [`product-spec-obsidian-vault/CLAUDE.md`](product-spec-obsidian-vault/CLAUDE.md) for the full structure.
