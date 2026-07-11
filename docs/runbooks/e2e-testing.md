# End-To-End Testing With Playwright

## Purpose

BridgeCircle uses [Playwright](https://playwright.dev) for end-to-end browser tests. These run a real browser against a real running app and verify user-facing behavior — sign-in flows, ask submission, RSVP buttons, etc. They are the slowest tier of test in the project but the only tier that catches regressions in the integration between client components, server actions, middleware, RLS, and Supabase.

Unit-level tests (component logic, pure functions) live alongside their source under `src/` and use a separate runner. This doc is only about the E2E suite. The target architecture lives in [Testing Suite](../../product-spec-obsidian-vault/Vision/Testing%20Suite.md) (the vision note this setup implements).

## The Two Modes

The suite runs in one of two modes, detected from the base URL in `app/playwright.config.ts`:

| | Local / hermetic (default, PR CI) | Integ (CD pipeline) |
|---|---|---|
| Target app | dev server the suite starts on **port 3002** | `https://dev.bridgecircle.org` |
| Database | **local Supabase stack** (Docker) | remote `bridgecircle-dev` |
| Env source | Doppler `bridgecircle/dev_local` | Doppler `bridgecircle/dev` |
| DB state | wiped + reseeded every run (`supabase db reset`) | live dev data; specs clean up after themselves |
| Trigger | `pnpm test:e2e`, every PR (`e2e.yml`) | push to `main` (`cd.yml` integ job) |

The hermetic mode is the vision-note contract: no remote project, nothing deployed, and a database that is wiped at will. Doppler stays the single secrets mechanism: `dev_local` is a **branch config of `dev`** that overrides the Supabase values to the local stack (the CLI's well-known local development keys, identical for every `supabase start` stack) and dummies out outbound services (`RESEND_API_KEY=e2e-dummy`, empty `ANTHROPIC_API_KEY`, `ASK_MATCHING_PIPELINE=legacy`) so runs stay offline and deterministic. It also pins `NODE_ENV=development` (see [doppler.md](doppler.md) "The NODE_ENV Gotcha").

## The Local Database

One local stack, one seed, one reset command — shared by local development and E2E:

```bash
cd app
pnpm db:start    # supabase start — boots the local stack (requires Docker)
pnpm db:reset    # wipe → re-apply all migrations → load supabase/seeds/*.sql
pnpm db:stop     # shut the stack down
pnpm dev:local   # run the app at :3001 against the local stack (Doppler dev_local)
```

- Migrations come from `app/supabase/migrations/` — the same files every other environment uses.
- The seed (`app/supabase/seeds/seed.sql`) creates the deterministic world: the local org, 15 recognizable personas (`richard@example.com` / `devseed-password-richard` has the richest home feed), asks in every status, threads with messages, friendships, DMs, five events, announcements, and notifications. It mirrors the cast in `scripts/seed-dev.ts` (which seeds the **remote** dev project and stays admin-API based).
- Seeded auth users are inserted directly into `auth.users` + `auth.identities` with deterministic UUIDs, so the `on_auth_user_created` trigger fires exactly as in real sign-up.

`supabase db reset` only ever touches the local stack (it is not `--linked`). The SQL seed must never be pointed at a remote project.

## How A Test Run Works

`pnpm test:e2e` reads `playwright.config.ts` and:

1. **Global setup wipes and reseeds** the local database (`supabase db reset`). Skip with `E2E_SKIP_RESET=1` when iterating on a spec. Never runs in integ mode.
2. Checks whether something is already serving on `http://localhost:3002` — the E2E-owned port, deliberately separate from `pnpm dev`'s 3001 so the suite can never silently reuse a server pointed at the remote dev database.
3. If not, starts `pnpm exec next dev -p 3002` with the `dev_local` env injected (explicit process env beats Next's `.env.local` loading, so your remote-dev `.env.local` can't leak in). The fetch uses your personal `doppler login` locally, or `DOPPLER_TOKEN` in CI.
4. Runs every spec in `tests/e2e/**/*.spec.ts` in parallel and reports pass/fail. In CI there is one retry, purely so a flake captures its trace — treat any retry as a bug to investigate.

## Suites Are Organized By Feature

Specs live in per-feature directories that converge toward 1:1 parity with the specs in `product-spec-obsidian-vault/Production/` (the vision-note parity rule — a spec graduating out of `Prototype/` arrives with its suite):

```
tests/e2e/
├── helpers/            env loading + signIn(page, email, password)
├── global-setup.ts     the wipe-and-reseed step
├── invites-sign-in/    redirect smoke + seeded-persona sign-in
├── asks/               core-loop.spec.ts — invite → onboard → ask → accept → chat
└── events/             seeded events list + RSVP
```

Isolation rules:

- The seed provides the shared world. A suite that **mutates** state creates its own uniquely-identified entities (the core loop signs up a fresh `e2e-invitee-ivan@example.com`, which is not in the seed) or touches rows no other suite reads (the events suite RSVPs Richard to the one event he's seeded as *not* attending).
- No suite depends on another suite having run. Every suite passes alone and the whole set passes in parallel.
- Don't re-test what a Vitest suite already covers — E2E is for integration truth.

To run one suite or spec:

```bash
pnpm test:e2e tests/e2e/events
pnpm test:e2e -g "redirects unauthenticated"
pnpm test:e2e:ui         # interactive UI mode for authoring
```

## CI Setup

Wired at `.github/workflows/e2e.yml`, on every PR to `main` plus manual dispatch. The job boots the local Supabase stack on the runner (`supabase start`); app + runner resolve env from `bridgecircle/dev_local` via the `DOPPLER_TOKEN_LOCAL` repo secret — a Doppler **service token scoped to `dev_local` only** (it can read local-stack values and dummies, never real dev/prod secrets). Create it with:

```bash
doppler configs tokens create e2e-ci -p bridgecircle -c dev_local --plain | \
  gh secret set DOPPLER_TOKEN_LOCAL --repo dwrlee8517/BridgeCircle
```

Three jobs:

1. `changes` — detects docs-only PRs by diffing against the PR base.
2. `playwright` — the suite, skipped when the PR is docs-only.
3. `e2e-gate` — **always reports**: green when the suite passed or was legitimately skipped for a docs-only PR, red otherwise. This is the job to add to required status checks — a plain `paths-ignore` skip would leave a required check pending forever.

### Making it required

Once a run has registered the check, add **E2E gate** to the required status checks for `main` (Settings → Branches → Branch protection rules). Enforcement requires GitHub Pro on a personal-account private repo — see [environments.md](../architecture/environments.md) "GitHub repository". There is deliberately no skip label: a red suite means the code or the test is wrong, and both get fixed, not bypassed.

The integ run in `cd.yml` is unchanged: it sets `PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org`, pulls env from Doppler, and re-drives the suites against the deployed dev stage before the prod promote. Suites whose assertions depend on the wiped-and-reseeded local world (currently `events/`) call `test.skip(isRemote, …)` and run only in hermetic mode — the integ database is persistent, so "Richard hasn't RSVP'd yet" style preconditions don't survive repeated runs there.

## Writing A New Test

The pattern:

```ts
import { expect, test } from "@playwright/test";
import { signIn } from "../helpers/auth";

test.describe("<feature>", () => {
  test("<what it does>", async ({ page }) => {
    await signIn(page, "richard@example.com", "devseed-password-richard");
    await page.goto("/some-route");
    await expect(page.getByText(/expected copy/i)).toBeVisible();
  });
});
```

Project-specific notes:

- **Locators.** Prefer `getByRole`, `getByLabel`, and `getByText` over CSS selectors. Not every shadcn/ui component renders as the role you'd expect — `CardTitle` renders as a `<div>`, not a heading. When in doubt, fall back to `getByText`.
- **Seeded personas.** Sign in with the cast from `supabase/seeds/seed.sql`. Deterministic IDs (`10000000-…-00NN` users, `eeee0000-…` events) let specs reference rows directly when needed.
- **Admin setup.** For programmatic setup (like the core loop's invite), call `loadE2eEnv()` from `../helpers/env` in `beforeAll`, then use `createAdminClient()` — it targets the local stack in hermetic mode and the dev DB (via Doppler) in integ mode.
- **Screenshots and traces.** On failure Playwright drops a trace under `test-results/<test-name>/`. Open it with `pnpm exec playwright show-trace <path>`.

## Troubleshooting

**`supabase db reset` fails in global setup**

The local stack isn't running. `pnpm db:start` (requires Docker Desktop). First boot pulls container images and takes a few minutes.

**"Error: connect ECONNREFUSED 127.0.0.1:3002"**

Playwright's `webServer` couldn't boot the dev server within 120s. Check that `pnpm dev:local` works in isolation; if port 3002 is occupied by an unrelated process, free it.

**Sign-in fails for every seeded persona**

The local keys in the `dev_local` Doppler config no longer match your stack (a CLI upgrade can change them). Compare with `pnpm dlx supabase status` and update the config: `doppler secrets set -p bridgecircle -c dev_local NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... SUPABASE_SECRET_KEY=...`.

**A `getByRole("heading")` assertion fails with "element(s) not found"**

The component probably doesn't render as a heading element. Use `getByText` or inspect the failure trace.

**Tests pass locally, fail in CI**

With hermetic mode both run the identical stack, so look for machine-specific leakage first: an `.env.local` var that `dev_local` doesn't override (add the override to the Doppler config), or a dependence on `E2E_SKIP_RESET` state.

## Related Documentation

- [Testing Suite vision](../../product-spec-obsidian-vault/Vision/Testing%20Suite.md) — the target architecture this implements
- [Seeding the dev database](seed-dev.md) — the **remote** dev project's seed script (same cast, different mechanism)
- [Environments and dev/prod separation](../architecture/environments.md)
- [ADR 0014 — Scripted CD pipeline](../decisions/0014-scripted-cd-pipeline.md) — where the integ run fits
