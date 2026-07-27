# Archive

Historical docs kept for reference, not for active reading. If a file here disagrees with the current docs under `docs/`, the current docs win.

## Contents

- `database-v2-2026-07/` — the database-v2 migration's planning material, archived 2026-07-25 after the migration completed (dev 2026-07-17, production 2026-07-24). These are accurate **implementation records**, not current architecture — archived so a search for current schema behavior doesn't surface 18 completed plans:
  - 8 per-domain `*-plan.md` (foundation, conversation, help, messages, people-profile, school, home, entry-operations) and their 8 matching `*-test-inventory.md`
  - `database-v2-dev-cutover-plan.md` — the development cutover
  - `production-v2-cutover-runbook.md` — the operator runbook, **executed 2026-07-24; its one-time destructive reset is spent and must not be re-run**
  - Still live in [`../architecture/`](../architecture/): `database-v2-contract.md` (the current schema contract) and `database-v2-production-cutover-plan.md` (production's provenance — SHA, dates, verification record, cited from the migration runbook)
- `design-2026-07/` — the Civic Editorial and Field Pro design systems, archived 2026-07-25 when Civic was removed from the codebase (ADR 0013 is the current direction; production theming runs the Toss-baseline brand fork):
  - `bridgecircle-design-system-civic/` — the Civic Editorial handoff bundle. Renamed on archive because its old folder name was confusingly close to the live `bridgecircle/` fork bundle
  - `fieldpro-design-system/` — the "Field Pro" bundle from [ADR 0012](../decisions/0012-tds-design-system.md); its reconciled values seeded the fork's overrides ledger
  - `fidelity-ledger.md` — per-surface production contract that sourced from the Civic bundle. Superseded by the fork's `OVERRIDES.md`; its surfaces (`Home/Ask`, `Ask Person`, `Inbox`) are retired routes
  - `current-comparison-2026-06-02.md` — June 2026 comparison against the then-current Civic production app
  - `reference-src/` — obsolete Atrium/Civic token exports and prototype JSX
  - `explorations-civic/` — Civic-era visual explorations
  - `DESIGN-civic.md` — the former root `DESIGN.md`, the Civic token spec. The design-sync tooling uses each bundle's own `uploads/DESIGN.md`, never this one
- `experience-2026-07/` — pre-v2 experience docs, archived 2026-07-25:
  - `ask-flow.html` — the retired question-led Ask flow over `/ask`, `/ask/new`, and `/search`. Those routes no longer exist; the current flow is `/help/*` per [`../architecture/information-architecture.md`](../architecture/information-architecture.md)
- `architecture-2026-07/` — pre-v2 schema docs, archived 2026-07-25 after the production v2 cutover:
  - `data-model.md` — the Phase 1 launch schema and its rationale. Describes no live database; its tables (including `friendships`, `mentorship_requests`) exist in neither remote. Current schema: [`../architecture/database-v2-contract.md`](../architecture/database-v2-contract.md); current rationale: [`../architecture/schema-rationale.md`](../architecture/schema-rationale.md)
  - `data-model.html` — interactive diagram of the same pre-v2 schema. Superseded by the [domain map ERD](../architecture/database-v2-contract.md#domain-map) in the v2 contract
- `product-2026-05/` — superseded product docs:
  - `brand-strategy-2026-05-24.md` — original monolithic brand strategy; split into [`../product/brand-strategy.md`](../product/brand-strategy.md), [`../product/voice-guidelines.md`](../product/voice-guidelines.md), and [`../product/feature-roadmap.md`](../product/feature-roadmap.md)
  - `build-plan.md` — pre-launch web-vs-mobile rationale; decision now locked in [`../decisions/0002-web-first-defer-native.md`](../decisions/0002-web-first-defer-native.md)
  - `composer-ux-research.md` — informed the AI composer direction; superseded once the composer spec lands
  - `next-priorities.md` — May 2026 prioritization snapshot; refreshed in [`../product/feature-roadmap.md`](../product/feature-roadmap.md)
