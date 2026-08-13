# engineering-spec-obsidian-vault

An Obsidian vault for BridgeCircle **engineering** material — the implementation
side of the [product-spec vault](../product-spec-obsidian-vault/CLAUDE.md). Open
this folder as a vault in Obsidian (Open folder as vault → point it here);
Obsidian adds its own `.obsidian/` config on first open (gitignored).

The two vaults are meant to be read **in tandem**: the product vault says *what
we are building and why*; this vault says *how it is built, what large change is
in flight, and what is next*. A tech spec here should name the product spec it
implements, and vice versa.

## File structure

- **[`Engineering Change Pipeline.md`](Engineering%20Change%20Pipeline.md)** — Root
  map. How an engineering change moves from product spec → tech spec →
  initiative → tasks → PRs, and how a fresh session picks up the next task. Start
  here.

- **`Production/`** — Tech specs for subsystems that **are implemented in
  mainline**. Canonical description of how the thing actually works: data flow,
  module boundaries, invariants, failure modes, operational notes. Mirror the
  app: if the code does it, the tech spec lives here.

- **`Prototype/`** — Tech specs for work **not yet built** — proposed designs and
  WIP drafts. A feature may have several parallel drafts here; none is
  authoritative until it ships.

- **`Vision/`** — Long-horizon target architecture and engineering direction.
  Not classified by build status, and not a place for shippable tech specs — it
  holds the direction those specs eventually serve. The product vault's `Vision/`
  is the product counterpart.

- **`Initiatives/`** — Large engineering changes, planned up front and broken
  into small tasks that **separate sessions can pick up cold**. One folder per
  initiative: a `plan.md` that holds the whole shape of the change, and
  `tasks/NN-slug.md` files that are each self-contained enough to start without
  reading anything else. This is the handoff mechanism — see below.

- **`Backlog/`** — Oddities, debt, and "someone should look at this" findings.
  One file per entry. Log it and keep going; do **not** derail the task in hand
  to fix it. See [`Backlog/README.md`](Backlog/README.md).

- **`_templates/`** — Templates for the four note types above. Copy, don't
  improvise. Not specs; ignore when surveying the vault.

## What does not belong here

This vault is **engineering-only**. It is deliberately narrower than the other
two:

- The **memory vault** (iCloud, `~/Library/Mobile Documents/com~apple~CloudDocs/BridgeCircle Sync/`)
  is the *executive* vault — roadmap, launch timing, prioritization, and
  product/business decisions. It is the source of truth for **whether and when**
  work happens. See the jurisdiction table in [`AGENTS.md`](../AGENTS.md).
- The **product vault** holds what we're building for members, and why.
- **This vault holds only how it gets built**, once the decision already exists.

So an initiative plan says *"here is how this change is sequenced into tasks"* —
never *"here is why this is a priority this quarter"*. Roadmap position, launch
dates, and business rationale belong in the memory vault; **link the decision
rather than restating it**. A second copy of the roadmap inside the repo is a
copy that goes stale without anyone noticing, and this vault is the wrong place
to discover that.

The `Why now` section of an initiative plan is the one place that brushes against
this. Keep it to the *engineering* forcing reason — what is painful in the code
today, what this unblocks technically — and link out for the product reason.

## Initiatives — the cross-session handoff protocol

The point of an initiative is that a session with **no memory of the previous
one** can open it, find the next task, and do that task correctly without
re-deriving the plan.

**Starting an initiative** (the planning session):

1. Create `Initiatives/<slug>/plan.md` from
   [`_templates/initiative-plan.md`](_templates/initiative-plan.md). Set
   `status: active`.
2. Break the change into tasks that are each **one focused session of work** and
   land as **one PR**. If a task needs more than that, split it.
3. Write every task file up front from
   [`_templates/initiative-task.md`](_templates/initiative-task.md), even the
   later ones. A task written only when its turn comes is a task written by
   someone who already has the context — which defeats the purpose.
4. Fill in the task board in `plan.md` with dependencies and statuses.

**Picking up work** (every later session):

1. Read `plan.md` — Goal, Invariants, and the task board. Nothing else.
2. Take the **lowest-numbered task with `status: ready`** whose `depends_on`
   tasks are all `done`.
3. Set that task's `status: in-progress` and do **only** that task.
4. On finish: set `status: done`, fill in `pr:`, and append to **Handoff notes**
   in the task file — what you learned, what diverged from the plan, what the
   next session should know. Update the board row in `plan.md`.
5. Anything you noticed that is out of scope goes in `Backlog/`, not into this
   task's diff.

**Finding the active initiative:** an initiative is active when its `plan.md`
frontmatter says `status: active`. There is no hand-maintained index to go
stale — grep for it.

```bash
rg -l "^status: active" engineering-spec-obsidian-vault/Initiatives
```

**When the plan turns out to be wrong** — and it will — amend `plan.md` in the
same change, and say so in the Decisions log with the date. A plan that silently
drifts from what is being built is worse than no plan.

## Conventions

- **Tech specs are placed by implementation status**, same rule as the product
  vault: `Production/` when the subsystem ships in mainline, otherwise
  `Prototype/`. Verify against the code (routes under `app/src/app/`, modules
  under `app/src/lib/`), not the spec's self-described status. `Vision/` is
  exempt.
- A tech spec **graduates** from `Prototype/` to `Production/` when the work
  lands — move the file and repoint inbound references in the same change.
- **When a Production tech spec and the code disagree, the code wins.** Fix the
  spec in the same change and flag the drift.
- **This vault does not duplicate `docs/`.** Architecture reference
  ([`docs/architecture/`](../docs/architecture/)), locked decisions
  ([`docs/decisions/`](../docs/decisions/)), and how-to runbooks
  ([`docs/runbooks/`](../docs/runbooks/)) stay where they are — link out to them
  rather than restating them. A tech spec explains how one subsystem is built; an
  ADR records a decision; a runbook tells you how to perform a procedure. If you
  are writing a spec and find yourself re-explaining the migration workflow, link
  it instead.
- **An initiative is not a tech spec.** The initiative is the *change* (finite,
  closes out); the tech spec is the *end state* (durable). A large initiative
  usually updates or creates a `Production/` tech spec in its final task — make
  that an explicit task, not an afterthought.
- Use Obsidian `[[wikilinks]]` to connect notes. Task and plan filenames repeat
  across initiative folders, so path-qualify those links:
  `[[Initiatives/<slug>/plan|<Initiative Name>]]`.
- Cross-vault references are plain relative markdown links (Obsidian wikilinks do
  not resolve across vaults).
- **In `_templates/`, paths outside the vault are written as repo-root code spans
  (`docs/runbooks/migration-workflow.md`), not relative links.** A template gets
  copied to folders at different depths — a `../../` that is right in the
  template is wrong in the copy. Notes at a fixed depth use real links.
