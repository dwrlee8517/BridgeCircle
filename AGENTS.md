# AGENTS.md

Project orientation for AI coding agents (Codex, Cursor, GitHub Copilot, Claude Code, and any tool following the [AGENTS.md](https://agents.md) standard).

Claude Code also loads [`CLAUDE.md`](CLAUDE.md) (Claude-specific habits) and [`app/CLAUDE.md`](app/CLAUDE.md) (Next.js + Supabase stack and `/lib` discipline).

## What BridgeCircle is

A **verified warm-network platform** for trusted communities. First pilot: Chadwick School (Palos Verdes) and Chadwick International (Songdo).

The thesis is **member-first**: members come to ask for help, offer help, and feel more connected to the circles that shaped them. Do not reframe the product as "alumni management software," a CRM, or a generic social network — that framing has been tried by every incumbent and is the loss condition.

Optimize for product quality and competitive standing. Do not justify shortcuts with "we need this for launch."

There **is** now a launch window — bounded by the end of 2026, with the exact date chosen strategically against the school calendar. The window does not override the readiness gates. See the memory vault (below) for the current decision; it is the source of truth for launch timing, not this file.

## Project status and decisions live in the memory vault

**The BridgeCircle memory vault is the source of truth for project status, launch planning, and product/business decisions.** It is an Obsidian vault synced over iCloud Drive between maintainers:

```
~/Library/Mobile Documents/com~apple~CloudDocs/BridgeCircle Sync/
```

Read it before planning work, and before assuming anything in `docs/` about scope, timing, or priorities is current. The repo's Phase 1 spec docs predate several decisions recorded there.

- `_log/*.md` — **read this first.** Per-author session logs: what was decided, discovered, or *reversed*, newest entry at the top. The only place that records a change of mind — check it before re-proposing something already rejected. Note filenames start with `YYYY-MM-DD-HHmm-`, so a sorted listing gives you recency for free.
- `memory/decisions/` — product, business, and launch decisions (append-only; newest supersedes)
- `memory/projects/` — current launch plan, backlog, and feature proposals
- `maps/Home.md` — live index of everything (Dataview queries, not a hand-maintained file)
- `CLAUDE.md` in the vault root — **read this before writing anything to the vault**; iCloud never merges concurrent edits, so the write rules there are load-bearing

Start with `memory/projects/` for the consolidated launch backlog, which is categorized (engineering / product / GTM / legal / docs) and links to the detail notes.

If the vault is not present locally, say so rather than guessing at status — it means iCloud Drive isn't set up or the folder isn't shared with this account. Do not fabricate project state from the repo docs alone.

## Where things live

- [`app/`](app/) — Next.js 16 application. See [`app/CLAUDE.md`](app/CLAUDE.md) for stack, conventions, and commands.
- [`mobile/`](mobile/) — Expo (SDK 57) + Expo Router native shell. Currently a **boots-only scaffold**: one screen, no auth, no product code. See [`mobile/README.md`](mobile/README.md) and [ADR 0016](docs/decisions/0016-native-mobile-via-expo.md). It installs independently of `app/` — there is intentionally no root pnpm workspace.
- [`docs/`](docs/) — architecture, runbooks, decisions, product, experience. **Start at [`docs/INDEX.md`](docs/INDEX.md)** — it indexes every active doc and points to [`docs/_archive/`](docs/_archive/) for superseded ones.
- [`product-spec-obsidian-vault/`](product-spec-obsidian-vault/) — product specs (what we're building and why), split `Production/` (shipped) · `Prototype/` (not yet built) · `Vision/` (long-horizon).
- [`engineering-spec-obsidian-vault/`](engineering-spec-obsidian-vault/) — tech specs (how it's built), same split, plus `Initiatives/` (large changes broken into cold-startable tasks) and `Backlog/` (log oddities found in passing instead of chasing them). **Read the two vaults in tandem**: product spec for intent, tech spec for the current shape of the code.
- [`docs/experience/ui/design-system/`](docs/experience/ui/design-system/) — visual system. The main system is the [`bridgecircle`](docs/experience/ui/design-system/handoff/bridgecircle/) handoff bundle (Toss-baseline brand fork, [ADR 0013](docs/decisions/0013-toss-baseline-then-brand-overlay.md), accepted), where the redesign is designed. **Production already runs the Toss baseline plus the brand fork** — see the theme bridge in [`app/src/app/globals.css`](app/src/app/globals.css) — and `tokens.md` / `components.md` / `states-and-motion.md` are the brand-fork production contracts. **Civic Editorial was fully removed on 2026-07-25** (bundles and docs archived under [`docs/_archive/design-2026-07/`](docs/_archive/design-2026-07/); its token aliases migrated to canonical fork roles). Use the system's tokens and components; do not invent new ones or default to raw shadcn primitives unless explicitly told to.
- [`project-summary.md`](project-summary.md) — deepest product framing.
- [`FUNCTIONS.md`](FUNCTIONS.md) — one-page router into specs / architecture / experience.
- [`README.md`](README.md) — public-facing overview.
- `~/Library/Mobile Documents/com~apple~CloudDocs/BridgeCircle Sync/` — **the memory vault**: project status, launch plan, and decisions. Outside the repo, and authoritative for those things. See the section above.

## Locked conventions

- Use `BridgeCircle` as the project name unless the user explicitly renames it.
- The Phase 1 stack is locked (Next.js + Supabase + Resend + Sentry). Do not introduce Prisma, Drizzle, tRPC, alternative auth, or alternative LLM providers without explicit user approval. Full list in [`app/CLAUDE.md`](app/CLAUDE.md).
- Single-engineer build. Cut speculative scope and premature abstractions; do not cut polish or correctness.
- Never commit secrets. `SUPABASE_SECRET_KEY` and similar belong only in `.env`.
- User-facing copy must follow [`docs/product/voice-guidelines.md`](docs/product/voice-guidelines.md) and the brand thesis in [`docs/product/brand-strategy.md`](docs/product/brand-strategy.md). Avoid generic SaaS jargon.

## Which source wins

Three sources, three jurisdictions. Nothing is canonical for everything:

| Question | Canonical source |
|---|---|
| **What is built, and how does it behave?** | The code. Docs may lag. |
| **How is it built, and why — engineering contracts?** | `docs/` — ADRs, architecture, runbooks. |
| **What did we decide? What's the plan? Where are we?** | The **memory vault** (`memory/decisions/`, `memory/projects/`). |

So: code beats docs on behavior, and the vault beats both on intent, status, and timing. A vault decision does not mean the code does it yet — it means that's what we agreed to do.

If you find a conflict, fix the lagging source in the same change and flag it. If a vault decision contradicts a repo doc, the repo doc is stale; update it and note which vault note supersedes it.

The repo's Phase 1 spec docs are a known instance of this — they describe a mentorship-request product, while ADR 0011 shipped two verbs and one inbox. Do not treat `launch-cut.md` or `spec.md` as current scope.
