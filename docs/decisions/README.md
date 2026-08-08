# Architecture Decision Records (ADRs)

This directory holds locked decisions for BridgeCircle in [MADR](https://adr.github.io/madr/) format.

## Why

We've made decisions (Supabase over Prisma, web-first over native, Connect/Ask over a single Messages surface, controlled vocab over ethnicity labels) but the *why* lives scattered across CLAUDE.md, specs, and chat. ADRs make the reasoning persist and be searchable, so the agent (and future you) can rebuild context cold.

## File naming

`NNNN-short-kebab-name.md` — e.g., `0001-supabase-not-prisma.md`. Numbers are unique and monotonic.

## Template

```markdown
# NNNN — <decision title>

- **Status:** proposed | accepted | superseded by NNNN
- **Date:** YYYY-MM-DD
- **Decider:** <name>

## Context

What problem are we solving? What constraints apply?

## Decision

What we're doing.

## Consequences

What follows from this — both good and bad. What becomes harder.

## Alternatives considered

What else we looked at and why we rejected it.
```

## ADRs here vs. decisions in the memory vault

Two decision logs exist. They are **not** interchangeable, and keeping the split clean is what stops them drifting apart:

| | Here (`docs/decisions/`) | Memory vault (`memory/decisions/`) |
|---|---|---|
| **Scope** | Engineering contracts — how the system is built | Product, business, launch, and GTM decisions |
| **Examples** | Supabase over Prisma, `/lib` discipline, expand/contract migrations, hybrid Ask matching | Who may give help, launch window, alumni-first sequencing, fail-fast error policy |
| **Audience** | Anyone writing code | Both maintainers, product and go-to-market |
| **Lives** | In the repo, versioned with the code | `~/Library/Mobile Documents/com~apple~CloudDocs/BridgeCircle Sync/` |

**Rule of thumb:** if a future engineer needs it to avoid rebuilding the wrong thing, it's an ADR. If a future *founder* needs it to remember what we agreed and why, it's a vault decision.

**When one implies the other, write both and cross-link.** A product decision that changes an engineering contract needs an ADR too — e.g. "only alumni may give help" is a vault decision, but the permission model it requires is an ADR. Reference the vault note by filename in the ADR's Context section.

The vault is the source of truth for project status and timing. If an ADR's framing contradicts a vault decision, the vault is newer.

## Discipline

- One decision per file. Keep them short (~1 page).
- Do not edit accepted ADRs. To change a decision, write a new ADR that supersedes the old one and update the old ADR's `Status` to `superseded by NNNN`.
- **The one sanctioned edit to an accepted ADR is a status or supersession annotation** — updating `Status`, or adding a short dated block at the top saying what survives and what a later ADR replaced. The reasoning body stays untouched. Without this, a reader has to open every later ADR to learn that an old one no longer describes the product.
- **An ADR bundling several sub-decisions may carry per-decision status** (see 0010). Prefer one decision per file; when a file already bundles them, annotate per decision rather than forcing one misleading label.
- Reference ADRs from `CLAUDE.md` / specs by number when the decision shapes the code.

## Index

- [0001 — Use Supabase end-to-end; no ORM](0001-supabase-not-prisma.md)
- [0002 — Web-first; defer native mobile](0002-web-first-defer-native.md) — *accepted*; **partially superseded by 0016** — the "no React Native, no Expo" clause is reversed, the repeat-engagement gate on native features still stands
- [0003 — Friendship and mentorship as separate tracks](0003-friendship-mentorship-split.md) — *principle accepted; vocabulary + relationship model superseded by 0011*
- [0004 — Controlled vocabulary, not ethnicity labels, for mentor preference](0004-controlled-vocab-not-ethnicity-labels.md) — *accepted*; title predates ADR 0011 vocabulary — read "mentor preference" as helper-matching preference
- [0005 — Hybrid Supabase setup (separate dev project + branching integration on prod)](0005-hybrid-supabase-branching.md)
- [0006 — NL search via entity extraction, not vector search](0006-nl-search-entity-extraction.md) — superseded by 0009 for Ask matching
- [0007 — `/lib` discipline: business logic out of route handlers](0007-lib-discipline.md)
- [0008 — Deploy ordering and the expand/contract migration discipline](0008-deploy-ordering-expand-contract.md)
- [0009 — Hybrid Ask matching](0009-hybrid-ask-matching.md)
- [0010 — Horizontal help and the warm-data flywheel](0010-horizontal-help-warm-data-flywheel.md) — *status is per sub-decision*: D1 superseded by 0011, D2 accepted and built, D3 accepted and partly built, D4 directional
- [0011 — Two verbs, one inbox: Connect / Ask over a single Messages surface](0011-two-verbs-one-inbox.md) — *accepted*; live on both remotes; supersedes 0010 D1 mechanics and 0003's vocabulary/model, preserves distinct-gates principle
- [0012 — Adopt a TDS-based design system ("Field Pro"), retire Civic Editorial](0012-tds-design-system.md) — *superseded by 0013*; canonical source = Claude Design design-system project synced via DesignSync
- [0013 — Build a complete Toss (TDS) baseline first, then a thin BridgeCircle brand overlay](0013-toss-baseline-then-brand-overlay.md) — *accepted*; supersedes 0012; two-layer tokens (`toss-base` + `bridgecircle-brand`) from official `@toss/tds` docs; Phases A–D live in production theming, Phase E ongoing
- [0014 — Scripted CD pipeline: dev stage → integ gate → prod promote](0014-scripted-cd-pipeline.md) — *accepted*; commit-precise dev/integ/manual-prod promotion
- [0015 — Replace the pre-launch application schema with a v2 baseline](0015-prelaunch-v2-database-reset.md) — *accepted*; one-time clean rebuild while no real member data exists
- [0016 — Native mobile via Expo, starting as a boots-only shell](0016-native-mobile-via-expo.md) — *accepted*; partially supersedes 0002; scaffold + CI pipeline only, native feature work still gated
- [0017 — GraphQL as the data plane (code-first, RLS-preserving)](0017-graphql-data-plane.md) — *accepted (phased — ROI gate after Phase 1)*; Pothos + Yoga at `/api/graphql`, resolvers delegate to `/lib` under the user-scoped client
