# AGENTS.md

Project orientation for AI coding agents (Codex, Cursor, GitHub Copilot, Claude Code, and any tool following the [AGENTS.md](https://agents.md) standard).

Claude Code also loads [`CLAUDE.md`](CLAUDE.md) (Claude-specific habits) and [`app/CLAUDE.md`](app/CLAUDE.md) (Next.js + Supabase stack and `/lib` discipline).

## What BridgeCircle is

A **verified warm-network platform** for trusted communities. First pilot: Chadwick School (Palos Verdes) and Chadwick International (Songdo).

The thesis is **member-first**: members come to ask for help, offer help, and feel more connected to the circles that shaped them. Do not reframe the product as "alumni management software," a CRM, or a generic social network — that framing has been tried by every incumbent and is the loss condition.

There is no fixed launch deadline. Optimize for product quality and competitive standing, not for hitting a calendar. Do not justify shortcuts with "we need this for launch."

## Where things live

- [`app/`](app/) — Next.js 16 application. See [`app/CLAUDE.md`](app/CLAUDE.md) for stack, conventions, and commands.
- [`docs/`](docs/) — specs, architecture, runbooks, decisions, experience. **Start at [`docs/INDEX.md`](docs/INDEX.md)** — it indexes every active doc and points to [`docs/_archive/`](docs/_archive/) for superseded ones.
- [`docs/experience/ui/design-system/`](docs/experience/ui/design-system/) — visual systems. The main system is the [`bridgecircle`](docs/experience/ui/design-system/handoff/bridgecircle/) handoff bundle (Toss-baseline brand fork, ADR 0013), where the redesign is designed; Civic Editorial (`tokens.md`, `components.md`) describes live production only until the redesign lands. Use the relevant system's tokens and components; do not invent new ones or default to raw shadcn primitives unless explicitly told to invent new ones.
- [`project-summary.md`](project-summary.md) — deepest product framing.
- [`FUNCTIONS.md`](FUNCTIONS.md) — one-page router into specs / architecture / experience.
- [`README.md`](README.md) — public-facing overview.

## Locked conventions

- Use `BridgeCircle` as the project name unless the user explicitly renames it.
- The Phase 1 stack is locked (Next.js + Supabase + Resend + Sentry). Do not introduce Prisma, Drizzle, tRPC, alternative auth, or alternative LLM providers without explicit user approval. Full list in [`app/CLAUDE.md`](app/CLAUDE.md).
- Single-engineer build. Cut speculative scope and premature abstractions; do not cut polish or correctness.
- Never commit secrets. `SUPABASE_SECRET_KEY` and similar belong only in `.env`.
- User-facing copy must follow [`docs/product/voice-guidelines.md`](docs/product/voice-guidelines.md) and the brand thesis in [`docs/product/brand-strategy.md`](docs/product/brand-strategy.md). Avoid generic SaaS jargon.

## When code and docs disagree

Code is canonical. Docs may lag. If you find a conflict, fix the docs in the same change and flag it.
