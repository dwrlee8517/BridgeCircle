# Database v2 Foundation test inventory

- **Status:** Foundation gates passed locally on 2026-07-14
- **Plan:** [Database v2 Foundation implementation plan](database-v2-foundation-plan.md)
- **Result:** 209 pgTAP assertions across eight database files, 22 Vitest
  assertions across nine files, and four local-only Playwright scenarios pass;
  focused TypeScript has zero errors
- **Migration inventory:** full TypeScript is 1,257 errors across 98 unported
  legacy files, down from the initial 1,356 errors across 108 files

## Test ownership rules

- pgTAP owns schema, grant, RLS, trigger, transaction, concurrency, audit, and
  outbox invariants.
- Vitest owns repository mapping, Zod parsing, stable result mapping, and pure
  redirect/selection decisions.
- Playwright owns only member-visible integration across Next.js, Auth, RLS,
  Storage, and the local database.
- Static checks own configuration boundaries that PostgreSQL cannot observe,
  including the Data API schema list and generated-type schema list.
- A denial path is not covered by a successful-path test. Every role, tenant,
  lifecycle, and block boundary gets an explicit negative assertion.

## Database and configuration inventory

| Invariant | Owner | Status |
|---|---|---|
| Required schemas/tables, RLS enabled, FK/index contract | `001_schema_contract.test.sql` | Existing |
| No security-definer function in exposed schemas | `001_schema_contract.test.sql` | Existing |
| Per-kind Ask/offer/conversation constraints | `002_help_and_conversation_invariants.test.sql` | Existing |
| Participant/message/block/account-deletion behavior | `003_rls_and_account_deletion.test.sql` | Existing |
| Owner can read pending/rejected/revoked membership; orgmate cannot | `004_foundation_security.test.sql` | Passing |
| Authenticated API/private/sequence grants are exact allowlists | `004_foundation_security.test.sql` | Passing |
| Raw profiles/invites/audit/outbox and service functions are denied | `004_foundation_security.test.sql` | Passing |
| `private` omitted from Data API and generated schemas | `scripts/check-supabase-boundaries.sh` | Passing |
| Boundary checker fails closed without `rg` | missing-tool shell invocation | Passing |
| Zero/one/multiple/pending/revoked member context selection | `005_foundation_context_and_invites.test.sql` | Passing |
| Invite verification and atomic/idempotent acceptance | `006_foundation_invites.test.sql` | Passing |
| Concurrent locked invite acceptance | `scripts/test-invite-concurrency.sh` | Passing |
| Same-org admin membership decisions | `006_foundation_invites.test.sql` | Passing |
| Self-profile projection and normalized replacement commands | `007_foundation_profile.test.sql` | Passing |
| Active-only ownership helper stays distinct from pending onboarding commands | `007_foundation_profile.test.sql` | Passing |
| Avatar path, onboarding completion, audit, indexing dedupe | `007_foundation_profile.test.sql` | Passing |
| Concurrent atomic profile-history replacement | `scripts/test-profile-history-concurrency.sh` | Passing |
| Block matrix across Foundation and downstream helpers | `008_foundation_reliability.test.sql` | Passing |
| Outbox ownership, deterministic claim ordering against seeded jobs, stale locks, retry/failure limits | `008_foundation_reliability.test.sql` | Passing |
| Parallel disjoint outbox workers | `scripts/test-outbox-concurrency.sh` | Passing |
| Pseudonymization and Auth-delete regression | `003_rls_and_account_deletion.test.sql` | Passing, including repeat cleanup |

## Application inventory

| Invariant | Owner | Status |
|---|---|---|
| Context JSON and selected-circle mapping | `src/db/repositories/member-context.test.ts` | Passing |
| Invite verification/acceptance result mapping | `src/db/repositories/invites.test.ts`, `src/lib/invite/invite.test.ts` | Passing |
| Profile command payloads and Zod response parsing | `src/db/repositories/profiles.test.ts`, `src/lib/profile/*.test.ts` | Passing |
| Pure circle selection and stale-cookie behavior | `src/lib/membership/selection.test.ts` | Passing |
| Notification and durable command result mapping | `src/db/repositories/{foundation-results,notifications}.test.ts` | Passing |
| Invite → signup → onboarding → circle → shell | `tests/e2e/foundation/foundation-flow.spec.ts` | Passing locally |
| Avatar upload, owner path, and durable shell render | `tests/e2e/foundation/foundation-flow.spec.ts` | Passing locally |
| Notification unread count, label, and persisted mark-all-read | `tests/e2e/foundation/foundation-flow.spec.ts` | Passing locally |
| Pending → approved member access | `tests/e2e/foundation/foundation-flow.spec.ts` | Passing locally |
| Explicit multi-circle selection | `tests/e2e/foundation/foundation-flow.spec.ts` | Passing locally |
| Foreign membership-cookie rejection | `tests/e2e/foundation/foundation-flow.spec.ts` | Passing locally |
| Browser console and uncaught page errors | Foundation Playwright `beforeEach`/`afterEach` capture | Passing locally |

## Required gates

Each schema slice runs its owning pgTAP file, then the entire database suite.
Foundation completes only after local reset, all pgTAP, warning-level lint,
empty schema diff, deterministic type generation, focused TypeScript, focused
Vitest, and focused Playwright are green. The global TypeScript inventory may
remain red only for unported domains, and its error and file counts must
decrease without new out-of-domain errors.

## Verified commands

Run from `app/` against the local Supabase stack:

```bash
supabase db reset --local
supabase test db --local
supabase db lint --local --level warning --fail-on warning
supabase db diff --local --schema public,api,private
pnpm db:types:local
pnpm typecheck:v2-foundation
pnpm exec vitest run src/db/repositories src/lib/invite src/lib/membership src/lib/profile
pnpm exec playwright test tests/e2e/foundation/foundation-flow.spec.ts
```

The three concurrency harnesses run separately because they coordinate two
database sessions deliberately:

```bash
bash scripts/test-invite-concurrency.sh
bash scripts/test-profile-history-concurrency.sh
bash scripts/test-outbox-concurrency.sh
```

Supabase's hosted security and performance advisors are a remote-cutover gate,
not a local Foundation gate. No shared-development or production project was
read or changed. Local warning lint plus explicit grant, RLS, foreign-key/index,
schema-contract, and pgTAP assertions provide the local disposition.
