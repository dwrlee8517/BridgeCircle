# Architecture Decision Records (ADRs)

This directory holds locked decisions for BridgeCircle in [MADR](https://adr.github.io/madr/) format.

## Why

We've made decisions (Supabase over Prisma, web-first over native, friendship/mentorship split, controlled vocab over ethnicity labels) but the *why* lives scattered across CLAUDE.md, specs, and chat. ADRs make the reasoning persist and be searchable, so the agent (and future you) can rebuild context cold.

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

## Discipline

- One decision per file. Keep them short (~1 page).
- Do not edit accepted ADRs. To change a decision, write a new ADR that supersedes the old one and update the old ADR's `Status` to `superseded by NNNN`.
- Reference ADRs from `CLAUDE.md` / specs by number when the decision shapes the code.

## Index

- [0001 — Use Supabase end-to-end; no ORM](0001-supabase-not-prisma.md)
- [0002 — Web-first; defer native mobile](0002-web-first-defer-native.md)
- [0003 — Friendship and mentorship as separate tracks](0003-friendship-mentorship-split.md)
- [0004 — Controlled vocabulary, not ethnicity labels, for mentor preference](0004-controlled-vocab-not-ethnicity-labels.md)
- [0005 — Hybrid Supabase setup (separate dev project + branching integration on prod)](0005-hybrid-supabase-branching.md)
- [0006 — NL search via entity extraction, not vector search](0006-nl-search-entity-extraction.md) — superseded by 0009 for Ask matching
- [0007 — `/lib` discipline: business logic out of route handlers](0007-lib-discipline.md)
- [0008 — Deploy ordering and the expand/contract migration discipline](0008-deploy-ordering-expand-contract.md)
- [0009 — Hybrid Ask matching](0009-hybrid-ask-matching.md)
- [0010 — Horizontal help and the warm-data flywheel](0010-horizontal-help-warm-data-flywheel.md) — *proposed*; amends 0003; D1 superseded in part by 0011
- [0011 — Two verbs, one inbox: Connect / Ask over a single Messages surface](0011-two-verbs-one-inbox.md) — *proposed*; supersedes 0010 D1 mechanics, preserves 0003 gating
