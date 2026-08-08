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

**Engineering-spec Obsidian vault.** [`engineering-spec-obsidian-vault/`](engineering-spec-obsidian-vault/) is the implementation-side counterpart, with the same `Production/` / `Prototype/` / `Vision/` split — but holding **tech specs** (how a subsystem is actually built) rather than product specs. It adds two folders the product vault doesn't have:

- **`Initiatives/`** — large engineering changes, planned up front and broken into small tasks that a *fresh session with no history* can pick up. Before starting a large change, open an initiative: write `plan.md` **and every task file** in the planning session, while the whole picture is loaded. To continue one, read only the plan's Goal / Invariants / Task board, take the lowest-numbered `ready` task whose `depends_on` are `done`, do that task alone, then record the PR and write Handoff notes. Find active work with `rg -l "^status: active" engineering-spec-obsidian-vault/Initiatives`.
- **`Backlog/`** — oddities, debt, and "someone should look at this" findings noticed *while doing something else*. Log it there with file:line and keep going; do not let it grow the diff in hand. The only exception is a finding that makes the current change wrong or unsafe.

Nothing migrated into this vault — architecture reference, ADRs, and runbooks stay under [`docs/`](docs/) and the vault links out to them. Templates for all four note types are in [`_templates/`](engineering-spec-obsidian-vault/_templates/); the full protocol is in [`engineering-spec-obsidian-vault/CLAUDE.md`](engineering-spec-obsidian-vault/CLAUDE.md).

**Use the two vaults in tandem.** They answer different halves of the same question and are meant to be read together: the product vault says *what we're building and why*, the engineering vault says *how it's built, what large change is in flight, and what's next*. Before implementing, read the product spec for intent **and** the tech spec for the current shape of the code; when planning a large change, link both from the initiative plan. A tech spec names the product spec it implements (`product_spec:` in frontmatter). If a `Production/` product spec has no tech-spec counterpart, that subsystem is documented only in the code — worth fixing as the closing task of whatever initiative next touches it. Same precedence rule in both: intent comes from the product spec, but **code is the fact** — fix whichever doc is wrong in the same change and flag the drift.

**Design-sync pins are per-user.** The `docs/experience/ui/design-system/handoff/*` bundles are synced to Claude Design (`/design-sync`), and each maintainer pushes the same repo bundle into their **own** account's project (projects aren't shared across accounts). So before syncing, prefer a **gitignored `.design-sync/config.local.json`** over the committed `.design-sync/config.json`: if `config.local.json` exists, its `projectId` is the target for *this* account; otherwise fall back to `config.json`. Never overwrite the committed `config.json` with your personal project id — that repoints the other maintainer's sync to a project they can't write to. The tooling doesn't enforce this lookup, so honor it by hand. Details and current pins are in each bundle's [`.design-sync/NOTES.md`](docs/experience/ui/design-system/handoff/bridgecircle/.design-sync/NOTES.md).
