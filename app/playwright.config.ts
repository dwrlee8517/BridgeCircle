import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001'

// A remote baseURL (the CD integ job sets
// PLAYWRIGHT_BASE_URL=https://dev.bridgecircle.org) means we are testing a
// deployed stage — there is no local server for Playwright to manage.
const isRemote = !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(baseURL)

/**
 * BridgeCircle e2e config.
 *
 * Local / PR mode: the dev server runs under Doppler so all secrets
 * (Supabase URL/keys, etc.) are injected at startup. Locally we reuse an
 * already-running server when one is detected; CI always starts its own.
 *
 * Integ mode (remote baseURL): the suite drives the deployed dev stage and
 * its database directly; no webServer is started.
 *
 * Run: pnpm exec playwright test
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
        // NODE_ENV is pinned inside the pnpm scripts themselves (see
        // package.json / doppler.md "The NODE_ENV Gotcha"), so the value a
        // Doppler config injects doesn't matter here.
        command: 'doppler run -- pnpm dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
