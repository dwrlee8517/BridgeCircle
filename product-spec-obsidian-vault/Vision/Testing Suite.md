# Testing Suite

The enduring shape of how BridgeCircle proves the product works — the target state the test infrastructure builds toward, not a description of what exists today. Where this note and the code disagree, the code is the current state and this is the direction. The concrete implementation work (repointing the E2E suite, writing seeds, rewiring CI) gets its own specs in [`Prototype/`](../Prototype/) as it's taken on; this note stays as the "why" and the destination.

The hermetic core landed in July 2026: local Supabase + SQL seeds (`app/supabase/seeds/`), `supabase db reset` as the wipe-and-reseed contract, per-feature suites under `app/tests/e2e/`, env via the Doppler `dev_local` branch config (local-stack values + dummied outbound services), and an `e2e.yml` with the always-report gate job. Still open from this note: flipping `E2E gate` to a required check (a GitHub settings toggle), and growing the suites to full parity with `Production/`.

## North star

> Every pull request proves, on ephemeral local infrastructure, that the member-facing loops still work — before it is allowed to merge.

Three properties define the target:

- **Hermetic.** A full E2E run needs nothing deployed: no remote Supabase project, no shared environment another run can collide with, no real third-party credentials. Doppler stays the secrets mechanism, but the E2E config (`dev_local`) resolves to local-stack values and dummies only. `git clone` + local Supabase + one command = the same run CI does.
- **Deterministic.** Every run starts from the same wiped-and-seeded world. No `beforeAll` cleanup archaeology, no "it depends what's in dev right now."
- **Feature-complete.** The suite is organized by feature and converges toward 1:1 parity with the specs in [`Production/`](../Production/): if a feature has a canonical spec, it has a suite proving the spec's flows.

## The pyramid (target state)

| Layer | Tool | Runs against | Status |
|---|---|---|---|
| Static | Biome · ESLint · `tsc` · design-token ratchet | source | ✅ in CI today |
| Unit | Vitest, colocated in `app/src/lib/` | pure logic, no I/O | ✅ in CI today |
| End-to-end | Playwright, `app/tests/e2e/` | local app + **local Supabase** | 🔨 the centerpiece of this vision |
| Schema gate | `next build` type-check vs `database.types.ts` | migrations in the PR | ✅ in CI today |

The pyramid stays a pyramid: business logic gets proven at the unit layer where it's cheap; E2E proves the *integration* — client components, server actions, middleware, RLS, and the database behaving together the way the spec says. E2E suites should not re-test what a Vitest suite already covers.

## The database contract

One local Supabase stack, one seed, one reset command — shared by local development and E2E testing, locally and in CI.

- **`supabase start`** boots the local stack. `app/supabase/config.toml` is already configured for this (API 54321, DB 54322, Studio 54323, Inbucket for local email capture).
- **Migrations** (`app/supabase/migrations/`) are the only source of schema. Local, CI, dev, and prod all get their schema the same way.
- **Seeds** (`app/supabase/seeds/*.sql`) define the deterministic world: the pilot org, a hand-curated cast of recognizable personas (admins, mentors, members), profiles, asks, events, RSVPs — enough to exercise every Phase 1 flow. `config.toml` already has `db.seed` enabled and pointed at this glob; the directory just doesn't exist yet.
- **`supabase db reset`** is the single wipe-and-seed command: drop, re-migrate, re-seed. It is the same command for "set me up for local development," "give me a clean slate before an E2E run," and "prepare the CI database." There is no second path.

**Seeding auth users is the one hard constraint.** Supabase auth users live in the `auth` schema, and the `0001_init` trigger mirrors them into `public.users`. SQL seeds must insert `auth.users` rows with deterministic UUIDs and pre-hashed passwords so that trigger (and every downstream FK) behaves exactly as it does in production sign-up. This is a known, solvable pattern — but it's the part of the seed to verify against the trigger, not assume.

**Which seed runs where:**

| Environment | Seed mechanism |
|---|---|
| Local Supabase (dev machine) | `supabase/seeds/*.sql` via `supabase db reset` |
| CI (ephemeral, per-run) | same SQL seeds, same command |
| Remote `bridgecircle-dev` | [`seed-dev.ts`](../../app/scripts/seed-dev.ts), explicitly and manually, as today |
| Production | never seeded, ever |

The SQL seeds never target a remote project; `seed-dev.ts` keeps its existing belt-and-braces guards. Two mechanisms, deliberately: the SQL seed is the hermetic contract, the TS script is a convenience for the one shared environment that can't be hermetic.

## E2E on every commit

- **Every PR runs the full E2E suite.** The CI job boots local Supabase on the runner, runs `supabase db reset`, starts the app pointed at `localhost:54321` with local keys (via the `dev_local` Doppler config), and runs Playwright. No remote database, no remote project, no deploy of anything.
- **E2E blocks merge to `main`.** The suite becomes a **required status check**. Two consequences to design in, not around:
  - The current `paths-ignore` docs-skip must switch to the always-report gate-job pattern (a skipped required check leaves the PR stuck "pending" — the existing comment in `ci.yml` already anticipates this).
  - The `skip-e2e` label escape hatch retires. A red suite means the code or the test is wrong; both are fixed, not bypassed.
- **Release path.** The scripted CD pipeline ([ADR 0014](../../docs/decisions/0014-scripted-cd-pipeline.md)) already runs Playwright as its *integ* stage — against the deployed dev URL, gating the prod promote. This vision adds the complementary hermetic tier and reuses the same suites at both levels: **pre-merge**, every PR runs the full suite against the local stack, no deploy needed; **post-merge**, the same feature suites re-run in integ mode (`PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org` — `playwright.config.ts` already switches off its webServer for remote targets) against deployed code before prod moves. One suite, two harnesses: E2E never *requires* a deployment, but the deployment pipeline still uses it.
- **Hermeticity retires the crutches.** `workers: 1` and `retries: 2` in CI exist because runs share a mutable database. Once each run owns its database, suites run parallel and a retry is a flake investigation, not a masking strategy.

## Suites organized by feature

E2E specs live in per-feature suites — `app/tests/e2e/<feature>/` — not in a flat directory of scenario files.

- **The parity rule:** suites converge toward 1:1 correspondence with the feature specs in [`Production/`](../Production/). The suite is the executable half of the spec — it proves the flows the spec describes.
- **The graduation rule:** when a spec graduates from `Prototype/` to `Production/` (feature lands in mainline), it arrives *with* its E2E suite. No suite, no graduation. This is how parity is maintained instead of restored.
- **Target Phase 1 suites** (from [[spec|the Phase 1 spec]] and [[user-flows]]): invites & sign-in · onboarding · asks (the core loop) · open asks · events & RSVP · profiles & privacy · notifications · admin. Today's `sign-in.spec.ts` and `core-loop.spec.ts` are the embryos of the first and third.
- **Isolation rules:** the seed provides the shared, recognizable world; a suite that mutates state creates its own uniquely-identified entities on top of it rather than editing shared personas. No suite depends on another suite having run. Any suite passes alone, and the whole set passes in parallel.

## Guardrails

What this must not become, even under pressure:

- **Never point E2E at production or any shared remote database.** The whole design exists so that's never expedient again.
- **Keep the suite fast enough to run on every PR without resentment.** Budget: the E2E job stays under ~10 minutes end-to-end (Supabase boot included). When it grows past that, shard it — don't demote it to nightly.
- **Flakes get fixed or quarantined the same week, not retried into invisibility.** A required check only stays credible if red reliably means broken.
- **Don't let E2E absorb the pyramid.** If a case can be proven in Vitest, it's proven in Vitest; E2E stays reserved for integration truth.
- **Seed data is curated, not generated.** Recognizable personas keep failures debuggable ("mentor Maya's RSVP vanished") in a way random fixtures never do.

## Related

- [[Product to App Pipeline]] — this note fills in the "Testing" box of the pipeline (End to End: Local App → Local DB, plus the seed script it already sketches)
- [[North Star and Long-Horizon Roadmap]] — the product direction the suite protects
- [Production/phase-1](../Production/phase-1/spec.md) — the specs the suites converge toward
- [ADR 0014 — Scripted CD pipeline](../../docs/decisions/0014-scripted-cd-pipeline.md) — the release pipeline whose integ stage reuses these suites
- [e2e-testing runbook](../../docs/runbooks/e2e-testing.md) — current-state operational doc; supersede it as the local-DB target lands
- [`ci.yml`](../../.github/workflows/ci.yml) / [`e2e.yml`](../../.github/workflows/e2e.yml) — the workflows this vision rewires
