# AGENTS.md

Guidance for AI coding agents (Codex, Cursor, GitHub Copilot, and any tool that follows the [AGENTS.md](https://agents.md) standard) working in this repository.

For Claude Code specifically, see [`CLAUDE.md`](CLAUDE.md) (behavioral guardrails) and [`app/CLAUDE.md`](app/CLAUDE.md) (project context).

## What BridgeCircle is

A verified alumni and community network focused on referrals, mentorship, recruiting, events, and local connection. First pilot: Chadwick School (Palos Verdes) and Chadwick International (Songdo).

The thesis is a **member-first warm-network platform**. Do not reframe as generic "alumni management software."

There is no fixed launch deadline. Optimize for product quality and competitive standing, not for hitting a calendar.

## Where things live

- `app/` — Next.js 16 application. See [`app/CLAUDE.md`](app/CLAUDE.md) for the full stack, conventions, and commands.
- `docs/` — specs, architecture, runbooks, decisions. **Start at [`docs/INDEX.md`](docs/INDEX.md).**
- `docs/experience/` — current UX, UI, and screen-level guidance. The active visual system is [`docs/experience/ui/design-system/`](docs/experience/ui/design-system/).
- `project-summary.md` — top-level product framing and positioning.
- `README.md` — public-facing overview, kept concise.

## Source of truth

| Topic | File |
|---|---|
| Product framing | [`project-summary.md`](project-summary.md) |
| Phase 1 spec (full) | [`docs/specs/phase-1/spec.md`](docs/specs/phase-1/spec.md) |
| Phase 1 launch cut | [`docs/specs/phase-1/launch-cut.md`](docs/specs/phase-1/launch-cut.md) |
| Architecture | [`docs/architecture/`](docs/architecture/) |
| Experience docs | [`docs/experience/`](docs/experience/) |
| Active UI design system | [`docs/experience/ui/design-system/`](docs/experience/ui/design-system/) |
| Operational runbooks | [`docs/runbooks/`](docs/runbooks/) |
| Locked decisions | [`docs/decisions/`](docs/decisions/) |
| Behavioral rules | [`CLAUDE.md`](CLAUDE.md) |
| App stack & conventions | [`app/CLAUDE.md`](app/CLAUDE.md) |

## Working conventions

- Use `BridgeCircle` as the project name unless the user explicitly renames it.
- Single-engineer build, but no calendar deadline. Cut speculative scope and premature abstractions; do not cut polish or correctness.
- Surface assumptions before implementing. If unclear, ask. (See [`CLAUDE.md`](CLAUDE.md).)
- Do not introduce alternative providers, frameworks, or auth libraries without checking with the user. The Phase 1 stack is locked in [`app/CLAUDE.md`](app/CLAUDE.md).
- Do not commit secrets. `SUPABASE_SECRET_KEY` and similar belong only in `.env`.

## When code and docs disagree

Code is canonical. Docs may lag. If you find a conflict, fix the docs and flag it.
