# BridgeCircle Docs

Wiki entry. Each link is one click to the document. Agents can use this as a manifest — read this file first, then drill into the folder you need.

## Start here

- [Brand & product strategy](product/brand-strategy.md) — positioning and north star
- [Voice guidelines](product/voice-guidelines.md) — voice and copy rules
- [Feature roadmap](product/feature-roadmap.md) — phases, pricing, out-of-scope
- [Phase 1 launch cut](../product-spec-obsidian-vault/Production/phase-1/launch-cut.md) — what ships in the launch cut
- [Phase 1 launch checklist](../product-spec-obsidian-vault/Production/phase-1/launch-checklist.md) — readiness criteria
- [Database v2 contract](architecture/database-v2-contract.md) — Foundation and Conversation Primitive verified locally; later domains and remote cutovers pending

## Product

Positioning, voice, market, roadmap.

- [Brand & product strategy](product/brand-strategy.md)
- [Voice guidelines](product/voice-guidelines.md)
- [Feature roadmap](product/feature-roadmap.md)
- [Differentiation](product/differentiation.md)
- [Competitive research](product/competitive-research.md)
- [Market analysis](product/market-analysis.md) — alumni engagement landscape

Superseded product docs live under [`_archive/`](_archive/) — see [`_archive/README.md`](_archive/README.md) for what was superseded by what.

## Specs

What we're building. These now live in the [product-spec Obsidian vault](../product-spec-obsidian-vault/), split by implementation status: `Production/` = shipped in mainline, `Prototype/` = not yet built.

**Phase 1 (active build) — [`Production/phase-1/`](../product-spec-obsidian-vault/Production/phase-1/):**

- [Full spec](../product-spec-obsidian-vault/Production/phase-1/spec.md)
- [Launch cut](../product-spec-obsidian-vault/Production/phase-1/launch-cut.md) — week 1–2 narrowed scope
- [Week 3–4 additive features](../product-spec-obsidian-vault/Production/phase-1/week-3-4.md)
- [User flows](../product-spec-obsidian-vault/Production/phase-1/user-flows.md)
- [Launch checklist](../product-spec-obsidian-vault/Production/phase-1/launch-checklist.md)
- [Post-launch backlog](../product-spec-obsidian-vault/Prototype/phase-1/post-launch-backlog.md)

**Phase 2 drafts:**

- [Events — conditional RSVP ("I'll go if…")](../product-spec-obsidian-vault/Prototype/events-conditional-rsvp.md) — sequenced peer / profile-filter / help-need match types
- [Ask mediator ("Let BridgeCircle ask for you")](../product-spec-obsidian-vault/Prototype/ask-mediator.md) — extends the guided ask composer with a mediated send option
- [No-invite landing](../product-spec-obsidian-vault/Prototype/no-invite-landing.md) — replaces the sign-in rejection (sign-out + red banner) with a stay-signed-in landing page and an admin-reviewed invite-request queue

## Architecture

How the system is shaped. Reference material — facts, not how-to.

- [Data model](architecture/data-model.md) — legacy remote schema, tables, relations, and RLS posture during the v2 transition
- [Database v2 contract](architecture/database-v2-contract.md) — approved target schema, ERD, constraints, RLS matrix, locally verified Foundation/Conversation slices, and cutover gates
- [Database v2 Foundation plan](architecture/database-v2-foundation-plan.md) — completed local implementation record for identity, memberships, self-profile/onboarding, grants, blocking, audit, outbox, and app boundaries
- [Database v2 Foundation test inventory](architecture/database-v2-foundation-test-inventory.md) — exact database, unit, concurrency, browser, and compiler gates
- [Database v2 Conversation Primitive plan](architecture/database-v2-conversation-plan.md) — completed transactional, RLS, pagination, Realtime, and application-boundary implementation record
- [Database v2 Conversation Primitive test inventory](architecture/database-v2-conversation-test-inventory.md) — completed database, concurrency, Realtime, performance, and compiler evidence
- [Database v2 Help vertical-slice plan](architecture/database-v2-help-plan.md) — completed local plan for Help data, matching, worker, Realtime, UI, and destructive cutover
- [Database v2 Help vertical-slice test inventory](architecture/database-v2-help-test-inventory.md) — completed local evidence plus the classified later-domain port inventory
- [Database v2 Messages vertical-slice plan](architecture/database-v2-messages-plan.md) — completed local inbox, Connection seam, owner Realtime, responsive thread, and destructive cutover record
- [Database v2 Messages vertical-slice test inventory](architecture/database-v2-messages-test-inventory.md) — completed database, race, Realtime, performance, application, browser, and accessibility evidence
- [Database v2 People/Profile vertical-slice plan](architecture/database-v2-people-profile-plan.md) — completed local UI/UX, privacy, Connections, safety, self editing, and destructive-cutover record; detailed search/ranking tuning is deferred
- [Database v2 People/Profile vertical-slice test inventory](architecture/database-v2-people-profile-test-inventory.md) — completed UI/UX checkpoint evidence plus the explicitly deferred search/performance verification ledger
- [Database v2 School vertical-slice plan](architecture/database-v2-school-plan.md) — approved clean-slate member School architecture for events, held waitlist offers, announcements, newsletters, privacy, and destructive route cutover
- [Database v2 School vertical-slice test inventory](architecture/database-v2-school-test-inventory.md) — active database, race, application, responsive, accessibility, and cutover evidence ledger
- [Profile enrichment and freshness](architecture/profile-enrichment.md) — LinkdAPI for onboarding/manual update, Bright Data Dataset Filter API for monthly sweep, PDL fallback; provider interface, proposal workflow, cost guardrails
- [Information architecture](architecture/information-architecture.md) — routes, screens, navigation
- [Ask matching model research](architecture/ask-matching-model-research.md) — embedding/reranker model comparison for ADR 0009, with cost, latency, accuracy, and evaluation guidance
- [Environments](architecture/environments.md) — Supabase + Railway env layout
- [Dev stage + CD rollout](architecture/dev-stage-cd-rollout.md) — phased plan for ADR 0014: dev.bridgecircle.org, integ gate, scripted promote
- [Branching strategy](architecture/branching-strategy.html) — Supabase + GitHub branching workflow — *prod side superseded by ADR 0014*
- [Data model (interactive)](architecture/data-model.html)

## Runbooks

How-to guides. Read when touching the relevant area.

- [Day 0 setup](runbooks/day-0-setup.md) — initial scaffold and `/lib` rationale
- [Seed development data](runbooks/seed-dev.md) — disposable local v2 seed and remote-cutover boundary
- [Supabase conventions](runbooks/supabase-conventions.md) — keys, clients, type generation, role grants
- [Migration workflow](runbooks/migration-workflow.md) — branching + db push + prod safety
- [E2E testing](runbooks/e2e-testing.md)
- [Doppler](runbooks/doppler.md) — secrets management
- [Supabase custom domain](runbooks/supabase-custom-domain.md) — `auth.bridgecircle.org` for the Google consent screen (planned)

## Decisions

Locked architectural decisions in MADR format.

- [How we use ADRs](decisions/README.md)
- [0001 — Supabase end-to-end](decisions/0001-supabase-not-prisma.md)
- [0002 — Web-first](decisions/0002-web-first-defer-native.md)
- [0003 — Friendship and mentorship as separate tracks](decisions/0003-friendship-mentorship-split.md)
- [0004 — Controlled vocab over ethnicity labels](decisions/0004-controlled-vocab-not-ethnicity-labels.md)
- [0005 — Hybrid Supabase branching](decisions/0005-hybrid-supabase-branching.md)
- [0006 — NL search via entity extraction](decisions/0006-nl-search-entity-extraction.md) — superseded by 0009 for Ask matching
- [0007 — `/lib` discipline](decisions/0007-lib-discipline.md)
- [0008 — Deploy ordering + expand/contract](decisions/0008-deploy-ordering-expand-contract.md)
- [0009 — Hybrid Ask matching](decisions/0009-hybrid-ask-matching.md)
- [0010 — Horizontal help and the warm-data flywheel](decisions/0010-horizontal-help-warm-data-flywheel.md) — *proposed*; amends 0003
- [0011 — Two verbs, one inbox](decisions/0011-two-verbs-one-inbox.md) — *proposed*; supersedes 0010 D1 mechanics
- [0012 — TDS design system ("Field Pro")](decisions/0012-tds-design-system.md) — *superseded by 0013*
- [0013 — Faithful Toss baseline + brand overlay](decisions/0013-toss-baseline-then-brand-overlay.md) — *proposed*; supersedes 0012; two-layer `toss-base` + `bridgecircle` fork
- [0014 — Scripted CD pipeline](decisions/0014-scripted-cd-pipeline.md) — dev stage → integ gate → prod promote; supersedes the prod side of 0005 + 0008
- [0015 — Pre-launch v2 database reset](decisions/0015-prelaunch-v2-database-reset.md) — accepted one-time application-schema rebuild and fresh migration baseline

## UI

UX, UI, screen-level decisions, and active visual references.

- [Experience index](experience/README.md) — trust hierarchy for current UX, UI, and screen guidance
- [UX](experience/ux/) — active UX interpretation and links to canonical behavior docs
- [Design system](experience/ui/design-system/) — **main system: [`bridgecircle`](experience/ui/design-system/handoff/bridgecircle/)** (brand fork of the faithful [`toss-base`](experience/ui/design-system/handoff/toss-base/) TDS baseline; divergences logged in its `OVERRIDES.md` — ADR [0013](decisions/0013-toss-baseline-then-brand-overlay.md)). The full redesign is designed in the `bridgecircle` Claude Design project first, then translated to production. Civic Editorial describes live production only and is archived when the redesign lands.
- [Current member UI quality plan](experience/audits/current-member-ui-quality-plan.md) — active UI alignment checklist for Home, Ask, Help, People, School, and Inbox
- [Screen map](experience/screens/phase-1-screen-map.md) — screen-level bridge between behavior and UI
- [Explorations](experience/explorations/) — experimental workspace, not canonical unless promoted

## Presentations

- [Investor MVP pitch](presentations/investor-mvp-pitch.html)
- [/lib pattern slides](presentations/lib-pattern-slides.html)
- [Composer flows](presentations/composer-flows.html) — three AI-composer options explored during the composer direction decision
