# BridgeCircle Docs

Wiki entry. Each link is one click to the document. Agents can use this as a manifest — read this file first, then drill into the folder you need.

## Start here

- [Build plan](product/build-plan.md) — phase sequencing
- [Phase 1 launch cut](specs/phase-1/launch-cut.md) — what ships in the launch cut
- [Phase 1 launch checklist](specs/phase-1/launch-checklist.md) — readiness criteria

## Product

Positioning, market, roadmap.

- [Market analysis](product/market-analysis.md) — alumni engagement landscape
- [Brand & product strategy](product/brand-strategy.md)
- [Competitive research](product/competitive-research.md)
- [Differentiation](product/differentiation.md)
- [Build plan](product/build-plan.md)

## Specs

What we're building. Feature-sliced — one folder per phase.

- [Phase 1 — full spec](specs/phase-1/spec.md)
- [Phase 1 — launch cut](specs/phase-1/launch-cut.md) (week 1–2 narrowed scope)
- [Phase 1 — week 3–4 additive features](specs/phase-1/week-3-4.md)
- [Phase 1 — user flows](specs/phase-1/user-flows.md)
- [Phase 1 — launch checklist](specs/phase-1/launch-checklist.md)
- [Phase 1 — post-launch backlog](specs/phase-1/post-launch-backlog.md)

## Architecture

How the system is shaped. Reference material — facts, not how-to.

- [Data model](architecture/data-model.md) — tables, relations, RLS posture
- [Profile enrichment and freshness](architecture/profile-enrichment.md) — LinkdAPI for onboarding/manual update, Bright Data Dataset Filter API for monthly sweep, PDL fallback; provider interface, proposal workflow, cost guardrails
- [Information architecture](architecture/information-architecture.md) — routes, screens, navigation
- [Environments](architecture/environments.md) — Supabase + Railway env layout
- [Branching strategy](architecture/branching-strategy.html) — Supabase + GitHub branching workflow
- [Data model (interactive)](architecture/data-model.html)

## Runbooks

How-to guides. Read when touching the relevant area.

- [Day 0 setup](runbooks/day-0-setup.md) — initial scaffold and `/lib` rationale
- [Seed dev DB](runbooks/seed-dev.md) — personas + mentorship requests + events
- [Supabase conventions](runbooks/supabase-conventions.md) — keys, clients, type generation, role grants
- [Migration workflow](runbooks/migration-workflow.md) — branching + db push + prod safety
- [E2E testing](runbooks/e2e-testing.md)
- [Doppler](runbooks/doppler.md) — secrets management

## Decisions

Locked architectural decisions in MADR format.

- [How we use ADRs](decisions/README.md)
- [0001 — Supabase end-to-end](decisions/0001-supabase-not-prisma.md)
- [0002 — Web-first](decisions/0002-web-first-defer-native.md)
- [0003 — Friendship and mentorship as separate tracks](decisions/0003-friendship-mentorship-split.md)
- [0004 — Controlled vocab over ethnicity labels](decisions/0004-controlled-vocab-not-ethnicity-labels.md)
- [0005 — Hybrid Supabase branching](decisions/0005-hybrid-supabase-branching.md)
- [0006 — NL search via entity extraction](decisions/0006-nl-search-entity-extraction.md)
- [0007 — `/lib` discipline](decisions/0007-lib-discipline.md)
- [0008 — Deploy ordering + expand/contract](decisions/0008-deploy-ordering-expand-contract.md)

## UI

UX, UI, screen-level decisions, and active visual references.

- [Experience index](experience/README.md) — trust hierarchy for current UX, UI, and screen guidance
- [UX](experience/ux/) — active UX interpretation and links to canonical behavior docs
- [Civic Editorial design system](experience/ui/design-system/) — active visual source of truth
- [Current member UI quality plan](experience/audits/current-member-ui-quality-plan.md) — active UI alignment checklist for Home, Ask, Help, People, School, and Inbox
- [Screen map](experience/screens/phase-1-screen-map.md) — screen-level bridge between behavior and UI
- [Explorations](experience/explorations/) — experimental workspace, not canonical unless promoted

## Presentations

- [/lib pattern slides](presentations/lib-pattern-slides.html)
- [Investor MVP pitch](presentations/investor-mvp-pitch.html)
