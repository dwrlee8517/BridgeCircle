import { defineConfig, devices } from '@playwright/test'
import { baseURL, e2eEnv, isRemote } from './tests/e2e/helpers/env'

/**
 * BridgeCircle e2e config. Two modes, detected from the base URL:
 *
 * Local/hermetic (default, also PR CI): the suite owns a dev server on port
 * 3002 (separate from `pnpm dev`'s 3000 so it can never silently reuse a
 * server pointed at a remote database) wired to the LOCAL Supabase stack.
 * Env comes from the Doppler `bridgecircle/dev_local` config — nothing
 * remote, nothing deployed. global-setup wipes and reseeds the local
 * database first.
 *
 * Integ mode (the CD pipeline sets PLAYWRIGHT_BASE_URL=
 * https://dev.bridgecircle.org): the suite drives the deployed dev stage and
 * its database directly — no webServer, no reset, env from Doppler.
 *
 * Run: pnpm test:e2e   (local stack must be up: pnpm db:start)
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Most acceptance roads intentionally exercise the canonical disposable
  // seed and mutate shared rows (messages, blocks, memberships, events).
  // A single worker keeps those roads hermetic until every suite owns a
  // factory-built organization and cast.
  fullyParallel: false,
  workers: 1,
  // The webServer is `next dev`, which compiles routes on first hit. With
  // parallel workers all landing on a cold server, first navigations can
  // exceed Playwright's default 30s test timeout — give cold compiles room.
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  // One retry in CI so a genuine flake still captures its trace; treat any
  // retry as a bug to investigate, not a pass.
  retries: process.env.CI ? 1 : 0,
  globalSetup: './tests/e2e/global-setup.ts',
  // In CI we emit both: "github" annotates failures inline on the PR and
  // "html" produces the playwright-report directory the e2e workflow uploads
  // as an artifact for trace inspection. Locally we keep the simpler "list".
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // Dev-mode Next compiles routes lazily, so a first visit or server-action
  // round trip can exceed Playwright's 5s default expect timeout.
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: isRemote
    ? undefined
    : {
        command: 'pnpm exec next dev -p 3002',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        // dev_local values override anything in .env.local (explicit
        // process env beats Next's dotenv loading), so a developer's
        // remote-dev .env.local can never leak into a hermetic run.
        env: {
          ...(process.env as Record<string, string>),
          ...e2eEnv(),
          NODE_ENV: 'development',
        },
      },
})
