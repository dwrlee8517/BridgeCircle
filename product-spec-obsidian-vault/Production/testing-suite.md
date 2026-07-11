# Testing Suite

Canonical spec for the testing infrastructure as it ships in mainline (landed July 2026, PRs #139/#140). The enduring direction — north star, guardrails, and the rules this implements — stays in [[Testing Suite|Vision/Testing Suite]]; this note describes what the code actually does. Operational how-to (commands, troubleshooting, writing a new test) lives in the [e2e-testing runbook](../../docs/runbooks/e2e-testing.md). When this note and the code disagree, the code wins — fix this note in the same change.

## The pyramid, as shipped

| Layer | Tool | Runs against | Wired in |
|---|---|---|---|
| Static | Biome · ESLint · `tsc` · design-token ratchet | source | `ci.yml`, every PR |
| Unit | Vitest, colocated in `app/src/lib/` | pure logic, no I/O | `ci.yml`, every PR |
| End-to-end (hermetic) | Playwright, `app/tests/e2e/` | local app (port 3002) + **local Supabase** | `e2e.yml`, every PR |
| End-to-end (integ) | same suites, remote mode | `dev.bridgecircle.org` + dev DB | `cd.yml`, every push to `main` |
| Schema gate | `next build` type-check vs `database.types.ts` | migrations in the PR | `ci.yml`, every PR |

## The database contract

- **`supabase start`** boots the local stack (`app/supabase/config.toml`; API 54321, DB 54322).
- **Migrations** (`app/supabase/migrations/`) are the only source of schema, identical across local, CI, dev, prod.
- **The seed** (`app/supabase/seeds/seed.sql`) is the deterministic world: the local org, the 15 personas shared with `seed-dev.ts` (same emails and passwords), asks in every status with threads and messages, friendships, DMs, five events with RSVPs, announcements, notifications. Every id is deterministic (`10000000-…-00NN` users, `30000000-…` asks, `eeee0000-…` events). Auth users are inserted directly into `auth.users` + `auth.identities`, so the `on_auth_user_created` trigger runs exactly as in real sign-up.
- **`supabase db reset`** is the single wipe-and-reseed command — the same one for local dev setup, pre-E2E cleaning, and CI (`pnpm db:reset`).
- Seed targeting is split by environment: local + CI use the SQL seed; remote `bridgecircle-dev` keeps `scripts/seed-dev.ts`; production is never seeded.

## Env: Doppler `dev_local`

One secrets mechanism everywhere. `bridgecircle/dev_local` is a branch config of `dev` that overrides Supabase values to the local stack, dummies out outbound services (Resend, Anthropic; `ASK_MATCHING_PIPELINE=legacy`), and pins `NODE_ENV=development`. The E2E harness (`tests/e2e/helpers/env.ts`) fetches it — personal `doppler login` locally, the `DOPPLER_TOKEN_LOCAL` repo secret in CI (a service token scoped to `dev_local` only) — and **refuses to run if the config points at a non-local Supabase**. `pnpm dev:local` runs the app against the same config.

## The two Playwright modes

- **Hermetic (default)**: global setup runs `supabase db reset`; the suite owns a dev server on port 3002 (never reuses `pnpm dev`'s 3001, so a server pointed at remote dev can't be picked up silently); `dev_local` env overrides `.env.local`. Parallel workers, one CI retry (trace capture, not flake masking).
- **Integ (`PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org`, set by `cd.yml`)**: no webServer, no reset, env from the outer `doppler run`. Suites whose assertions depend on the freshly-seeded world mark themselves `test.skip(isRemote, …)` — currently `events/`.

## Suites and the parity rule

`app/tests/e2e/<feature>/`, converging toward 1:1 parity with the specs in this folder:

| Suite | Covers | Spec |
|---|---|---|
| `invites-sign-in/` | unauthenticated redirect, seeded-persona sign-in | [[user-flows]] |
| `asks/` | the core loop: invite → sign-up → onboarding → find helper → ask → accept → thread message (fresh non-seeded invitee) | [[spec\|Phase 1 spec]] |
| `events/` | seeded events list, RSVP state flip (hermetic-only) | [[spec\|Phase 1 spec]] |

Open slots to reach parity: onboarding (beyond the core-loop pass-through) · open asks · profiles & privacy · notifications · admin. **The graduation rule stands: a spec moving from `Prototype/` into this folder arrives with its suite.**

Isolation: the seed is the shared world; mutating suites create their own entities or touch rows no other suite reads; no suite depends on another having run.

## CI and CD wiring

- **`e2e.yml`** (every PR): detects docs-only PRs by diff; boots local Supabase on the runner; runs the suite; **`e2e-gate`** always reports so it can be a required check. No skip label exists.
- **`cd.yml`** (every push to `main`, ADR 0014): deploy-dev → **integ** (these suites, remote mode) → manual approval → promote. One suite, two harnesses.
- Verified in anger: hermetic suite green locally (~1.3m) and in CI (~3m15s); integ green against the deployed dev stage.

## Status / open items

- [ ] Mark **E2E gate** required on `main` (GitHub settings; needs Pro on a personal-account private repo).
- [ ] Grow suites to full `Production/` parity (list above).

## Related

- [[Testing Suite|Vision/Testing Suite]] — the direction and guardrails this implements
- [e2e-testing runbook](../../docs/runbooks/e2e-testing.md) — day-to-day operation
- [ADR 0014](../../docs/decisions/0014-scripted-cd-pipeline.md) — the pipeline the integ mode plugs into
- [[Product to App Pipeline]] — where this sits in the end-to-end workflow
