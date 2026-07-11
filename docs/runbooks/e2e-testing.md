# End-To-End Testing With Playwright

## Purpose

BridgeCircle uses [Playwright](https://playwright.dev) for end-to-end browser tests. These run a real browser against a real running app and verify user-facing behavior — sign-in flows, mentorship request submission, RSVP buttons, etc. They are the slowest tier of test in the project but the only tier that catches regressions in the integration between client components, server actions, middleware, and Supabase.

Unit-level tests (component logic, pure functions) live alongside their source under `src/` and use a separate runner. This doc is only about the E2E suite.

## What Is Set Up

- `@playwright/test` is a `devDependency` in `app/package.json`.
- `app/playwright.config.ts` is the Playwright config — testDir, baseURL, webServer, browser projects.
- `app/tests/e2e/` is where every spec file lives. New tests go here.
- `app/tests/e2e/sign-in.spec.ts` is the first smoke test, covering the unauthenticated-redirect flow.
- `app/.gitignore` is updated to ignore Playwright's per-run artifacts (`/test-results`, `/playwright-report`, `/playwright/.cache`).
- Two scripts are wired up in `app/package.json`:
  - `pnpm test:e2e` — run the suite headless with the list reporter.
  - `pnpm test:e2e:ui` — open Playwright's interactive UI mode for writing and debugging tests.

The Chromium binary itself lives in `~/Library/Caches/ms-playwright/` (machine-global, not in the repo). `pnpm exec playwright install chromium` downloads it the first time.

## How A Test Run Works

When you run `pnpm test:e2e`, Playwright reads `playwright.config.ts` and:

1. Checks whether something is already serving on `http://localhost:3000`.
2. If the dev server is up (the common local case), it reuses it. Tests start immediately.
3. If nothing is on port 3000, it runs the configured `webServer.command` — `doppler run -- pnpm dev` — and waits for the server to respond before starting the suite.
4. Spins up Chromium, runs every spec in `tests/e2e/**/*.spec.ts`, and reports pass/fail.

The `reuseExistingServer: !process.env.CI` flag is the important bit:

- **Locally:** `CI` is unset, so the flag is `true`. If you already have `doppler run -- pnpm dev` running in a Terminal window, tests piggyback on it. They run in ~3 seconds instead of 30+.
- **In CI:** `CI=true` is set, so the flag is `false`. Playwright always starts its own dev server, ensuring tests run against a known-clean state.

The Doppler dependency means E2E tests need the same `bridgecircle-dev` / `dev_personal` Doppler config the dev server uses. Locally that's transparent because your shell is already authenticated. In CI it requires a Doppler service token (see "CI Setup" below).

## Running Tests Locally

Default workflow:

```bash
cd app

# In one Terminal, start the dev server (if it isn't already running):
doppler run -- pnpm dev

# In another Terminal, run the tests:
pnpm test:e2e
```

If you don't have the dev server running, Playwright will start it automatically — but the run will be slower (~30s warmup) and the server will shut down with the test process.

For an interactive workflow when authoring new tests, use UI mode:

```bash
pnpm test:e2e:ui
```

This opens the Playwright UI where you can pick individual tests, watch them run live, replay traces, inspect locators, and time-travel through assertions.

To run a single spec or filter by name:

```bash
pnpm test:e2e tests/e2e/sign-in.spec.ts
pnpm test:e2e -g "redirects unauthenticated"
```

## Writing A New Test

Specs live at `app/tests/e2e/<feature>.spec.ts`. Each spec file should focus on one feature or page. The pattern is:

```ts
import { expect, test } from "@playwright/test";

test.describe("<feature name>", () => {
  test("<what it does>", async ({ page }) => {
    await page.goto("/some-route");

    // Assert what the user should see.
    await expect(page.getByText(/expected copy/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^submit$/i })).toBeEnabled();

    // Drive interactions.
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByRole("button", { name: /^submit$/i }).click();

    // Assert the post-action state.
    await expect(page).toHaveURL(/\/thank-you/);
  });
});
```

A few project-specific notes:

- **Locators.** Prefer `getByRole`, `getByLabel`, and `getByText` over CSS selectors. They are more resilient to refactors and they push us toward accessible markup. Be aware that not every shadcn/ui component renders as the role you'd expect — `CardTitle` for example is rendered as a `<div>` in this version, not a heading. When in doubt, fall back to `getByText`.
- **Authenticated flows.** Most tests will need a signed-in user. Use the seeded test accounts from `docs/seed-dev.md` (e.g., `mentor-mark@example.com` / `devseed-password-2`). For now, sign in via the form at the start of the test. Once we have several auth-required specs, we'll factor a shared `storageState` fixture so each test doesn't pay the sign-in cost.
- **Test data isolation.** Tests run against `bridgecircle-dev`, which is shared. Avoid leaving residue (created mentorship requests, sent messages, etc.) — clean up at the end of the test, or use API-level reset helpers instead of UI flows for setup.
- **Screenshots and traces.** On test failure Playwright drops a trace under `test-results/<test-name>/`. Open it with `pnpm exec playwright show-trace <path>`.

## CI Setup

Wired at `.github/workflows/e2e.yml`. The job runs on every PR to `main` and via manual dispatch.

What it does:

- Installs pnpm 10.33.2 and Node 22, restoring the pnpm store from cache.
- Installs the Doppler CLI and authenticates non-interactively via the `DOPPLER_TOKEN` secret.
- Caches and installs the Playwright Chromium binary (`pnpm exec playwright install --with-deps chromium`).
- Runs `pnpm test:e2e`. Playwright's `webServer.command` (`doppler run -- pnpm dev`) inherits the `DOPPLER_TOKEN` from env and boots the Next.js dev server with `bridgecircle-dev` secrets.
- Uploads the Playwright HTML report on every run and per-test traces on failure (artifact retention: 14 days).

To bypass on a specific PR (hotfixes, doc-only changes), apply the `skip-e2e` label.

### Required GitHub secret

Add a single repo secret named `DOPPLER_TOKEN`:

1. In the Doppler dashboard, generate a **service token** scoped to the config you want CI to use. The simplest setup is the existing `bridgecircle-dev` / `dev` config; a dedicated `ci` config (sibling of `dev`) is cleaner long-term. Whichever you pick must have `NODE_ENV=development` set explicitly (see [doppler.md](doppler.md) "The NODE_ENV Gotcha") so the dev server boots correctly.
2. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**, name it `DOPPLER_TOKEN`, paste the value.

Rotate the token through the Doppler dashboard and update the GitHub secret in the same operation.

### Adding it to required status checks

Once a successful run has registered the check name with GitHub, add **Playwright (chromium)** to the required status checks for `main` (Settings → Branches → Branch protection rules). This is the same caveat as the Supabase Preview check: enforcement requires GitHub Pro on a personal-account private repo. See [environments.md](../architecture/environments.md) "GitHub repository" for the trade-off.

## Troubleshooting

**"Error: connect ECONNREFUSED 127.0.0.1:3000"**

Playwright's `webServer` couldn't reach the dev server within its 120s timeout. Either start the server yourself and re-run, or check whether `doppler run -- pnpm dev` actually works in isolation (`NODE_ENV` set wrong, missing Doppler binding, port 3000 occupied by an unrelated process).

**A test that asserts on a `getByRole("heading")` fails with "element(s) not found"**

The component you're targeting probably doesn't render as a heading element. Use `getByText` or check the rendered DOM in the failure trace. shadcn/ui's `CardTitle` is a common offender.

**"Another next dev server is already running"**

Stale `.next/dev/lock` from a previous run. Usually benign — Next.js clears it on the next startup. If it doesn't, delete `app/.next/dev/lock` and try again.

**Tests pass locally, fail in CI**

Most often means the `dev_personal` Doppler config has a secret your local machine has cached but CI's service token doesn't have access to. Compare `doppler secrets` locally versus what's available to the CI token.

## Related Documentation

- [Environments and dev/prod separation](../architecture/environments.md) — why we run tests against `bridgecircle-dev`, not prod.
- [Seeding the dev database](seed-dev.md) — what test users are available and how to reset state.
- [Phase 1 launch spec](../../product-spec-obsidian-vault/Production/phase-1/launch-cut.md) — what flows need to be covered before launch.
