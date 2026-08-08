# BridgeCircle Docs

Wiki entry. Each link is one click to the document. Agents can use this as a manifest — read this file first, then drill into the folder you need.

## Start here

- [Brand & product strategy](product/brand-strategy.md) — positioning and north star
- [Voice guidelines](product/voice-guidelines.md) — voice and copy rules
- [Feature roadmap](product/feature-roadmap.md) — phases, pricing, out-of-scope
- [Phase 1 launch cut](../product-spec-obsidian-vault/Production/phase-1/launch-cut.md) — what ships in the launch cut
- [Phase 1 launch checklist](../product-spec-obsidian-vault/Production/phase-1/launch-checklist.md) — readiness criteria
- [Database v2 contract](architecture/database-v2-contract.md) — v2 schema live on dev and production; cutover executed 2026-07-24

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

- [Schema rationale](architecture/schema-rationale.md) — why v2 is shaped the way it is: membership vs user scoping, one Ask concept, the five-slot cap as a two-sided mechanism, one room per pair, anonymity as a database property, default-deny grants. Contains no table definitions by design
- [Database v2 contract](architecture/database-v2-contract.md) — approved target schema, ERD, constraints, RLS matrix, locally verified Foundation/Conversation slices, and cutover gates
- **The 16 per-domain v2 plans and test inventories, plus the development cutover plan, are archived** in [`_archive/database-v2-2026-07/`](_archive/database-v2-2026-07/) — the migration they planned completed on 2026-07-24. They are accurate implementation records, not current architecture; read the contract above for the live schema. Archived so a `grep` for current schema behavior does not surface 17 completed plans.
- [Database v2 production cutover plan](architecture/database-v2-production-cutover-plan.md) — executed 2026-07-24 at `8d9036f`: migration-ownership transfer, three-PR release topology, one-time production reset, exact-SHA web/worker promotion, bootstrap, and the 2026-07-25 verification record; production runs the intentional pre-pilot `test-org` until the pilot begins
- [Profile enrichment and freshness](architecture/profile-enrichment.md) — active onboarding Fast Fill plus the approved future manual-update/scheduled-sweep architecture; LinkdAPI primary, Bright Data sweep, PDL fallback, proposal workflow, and cost guardrails
- [Information architecture](architecture/information-architecture.md) — current routes, ownership, navigation, and implementation boundaries
- [Web ↔ mobile surface parity](../parity/README.md) — the manifest and CI ratchet that force every web surface to declare a mobile status (`shipped` / `planned` / `gated` / `wont-do`). Fails on undeclared drift, never on mobile being behind. Distinct from the [GraphQL parity harness](architecture/graphql-parity.md), which is capability parity within web
- [Ask matching model research](architecture/ask-matching-model-research.md) — embedding/reranker model comparison for ADR 0009, with cost, latency, accuracy, and evaluation guidance
- [Environments](architecture/environments.md) — Supabase + Railway env layout
- [Dev stage + CD rollout](architecture/dev-stage-cd-rollout.md) — phased plan for ADR 0014: dev.bridgecircle.org, integ gate, scripted promote
- [Production migration ownership record](architecture/production-migration-ownership-record.md) — release-freeze evidence, completed no-op/additive ownership proofs, integration transfer, and the next exact-SHA boundary
- The **production v2 cutover operator runbook is archived** at [`_archive/database-v2-2026-07/production-v2-cutover-runbook.md`](_archive/database-v2-2026-07/production-v2-cutover-runbook.md) — executed 2026-07-24; its one-time destructive reset is spent and must not be re-run. Evidence lives in the production cutover plan above.
- The **"Supabase branching vs two projects" comparison is archived** at [`_archive/database-v2-2026-07/branching-strategy.html`](_archive/database-v2-2026-07/branching-strategy.html) — the question is settled (two separate projects; the production Supabase GitHub integration is disconnected and `cd.yml` owns prod migrations), so its preview-branch workflow no longer describes this repo. See [environments.md](architecture/environments.md) and [ADR 0014](decisions/0014-scripted-cd-pipeline.md).
- [Database v2 domain map](architecture/database-v2-contract.md#domain-map) — member-domain ERD (the old interactive `data-model.html` is archived; it diagrammed pre-v2 tables)

## Runbooks

How-to guides. Read when touching the relevant area.

- [Day 0 setup](runbooks/day-0-setup.md) — initial scaffold and `/lib` rationale
- [Seed development data](runbooks/seed-dev.md) — disposable local v2 seed and remote-cutover boundary
- [Supabase conventions](runbooks/supabase-conventions.md) — keys, clients, type generation, role grants
- [Migration workflow](runbooks/migration-workflow.md) — forward-only migrations, local validation gates, `cd.yml` as sole prod owner, expand/contract for destructive changes
- [Integration testing](runbooks/integration-testing.md) — API-driven, in-process tests of server actions and route handlers against real RLS, with line coverage
- [E2E testing](runbooks/e2e-testing.md)
- [Doppler](runbooks/doppler.md) — secrets management
- [Supabase custom domain](runbooks/supabase-custom-domain.md) — `auth.bridgecircle.org` for the Google consent screen (planned)

## Decisions

Locked architectural decisions in MADR format.

**[`decisions/README.md`](decisions/README.md) is canonical for ADR status and supersession.** The list below is navigation only — statuses are deliberately not repeated here, because this file used to carry a second copy of them and it drifted (it still listed 0011 and 0013 as *proposed* after both were accepted).

- [How we use ADRs](decisions/README.md) — **status index**
- [0001 — Supabase end-to-end](decisions/0001-supabase-not-prisma.md)
- [0002 — Web-first](decisions/0002-web-first-defer-native.md)
- [0003 — Friendship and mentorship as separate tracks](decisions/0003-friendship-mentorship-split.md) — vocabulary + model superseded by 0011
- [0004 — Controlled vocab over ethnicity labels](decisions/0004-controlled-vocab-not-ethnicity-labels.md)
- [0005 — Hybrid Supabase branching](decisions/0005-hybrid-supabase-branching.md)
- [0006 — NL search via entity extraction](decisions/0006-nl-search-entity-extraction.md) — superseded by 0009 for Ask matching
- [0007 — `/lib` discipline](decisions/0007-lib-discipline.md)
- [0008 — Deploy ordering + expand/contract](decisions/0008-deploy-ordering-expand-contract.md)
- [0009 — Hybrid Ask matching](decisions/0009-hybrid-ask-matching.md)
- [0010 — Horizontal help and the warm-data flywheel](decisions/0010-horizontal-help-warm-data-flywheel.md) — status is per sub-decision
- [0011 — Two verbs, one inbox](decisions/0011-two-verbs-one-inbox.md) — the current Connect/Ask model
- [0012 — TDS design system ("Field Pro")](decisions/0012-tds-design-system.md) — superseded by 0013
- [0013 — Faithful Toss baseline + brand overlay](decisions/0013-toss-baseline-then-brand-overlay.md) — the current design system; two-layer `toss-base` + `bridgecircle` fork
- [0014 — Scripted CD pipeline](decisions/0014-scripted-cd-pipeline.md) — dev stage → integ gate → prod promote; supersedes the prod side of 0005 + 0008
- [0015 — Pre-launch v2 database reset](decisions/0015-prelaunch-v2-database-reset.md) — accepted one-time application-schema rebuild and fresh migration baseline
- [0016 — Native mobile via Expo](decisions/0016-native-mobile-via-expo.md) — boots-only Expo shell at `mobile/`; reverses the "no Expo" clause of 0002, native feature work still gated
- [0017 — GraphQL data plane](decisions/0017-graphql-data-plane.md) — accepted (phased, ROI gate after Phase 1); code-first Pothos + Yoga over `/lib`, RLS preserved per resolver

## UI

UX, UI, screen-level decisions, and active visual references.

- [Experience index](experience/README.md) — trust hierarchy for current UX, UI, and screen guidance
- [UX](experience/ux/) — active UX interpretation and links to canonical behavior docs
- [Design system](experience/ui/design-system/) — **main system: [`bridgecircle`](experience/ui/design-system/handoff/bridgecircle/)** (brand fork of the faithful [`toss-base`](experience/ui/design-system/handoff/toss-base/) TDS baseline; divergences logged in its `OVERRIDES.md` — ADR [0013](decisions/0013-toss-baseline-then-brand-overlay.md), accepted 2026-07-25). The full redesign is designed in the `bridgecircle` Claude Design project first, then translated to production. Production theming already runs the Toss baseline + brand fork (`app/src/app/globals.css`); `tokens.md`, `components.md`, and `states-and-motion.md` are the brand-fork production contracts. **Civic Editorial was fully removed 2026-07-25** — bundles, `fidelity-ledger.md`, `reference-src/`, and the Civic explorations are in [`_archive/design-2026-07/`](_archive/design-2026-07/), and the app's Civic token aliases were migrated to canonical fork roles.
- [Current member UI quality plan](experience/audits/current-member-ui-quality-plan.md) — active UI alignment follow-up for Home, Help, People, Messages, and School
- [UI/UX audit resolution addendum](experience/audits/ui-ux-audit-resolution-2026-07-21.md) — repo-local disposition and implementation evidence for C-01 through C-46
- [Screen map](experience/screens/phase-1-screen-map.md) — current screen families, canonical routes, and implementation boundaries
- [Explorations](experience/explorations/) — experimental workspace, not canonical unless promoted

## Presentations

- [Investor MVP pitch](presentations/investor-mvp-pitch.html)
- [/lib pattern slides](presentations/lib-pattern-slides.html)
- [Composer flows](presentations/composer-flows.html) — three AI-composer options explored during the composer direction decision
