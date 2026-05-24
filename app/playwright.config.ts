import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001'

/**
 * BridgeCircle e2e config.
 *
 * The dev server runs under Doppler so all secrets (Supabase URL/keys, etc.)
 * are injected at startup. Locally we reuse an already-running server when
 * one is detected; CI always starts its own.
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
  webServer: {
    command: 'doppler run -- pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
