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
  // Window-class viewport projects. Widths come from parity/window-classes.json
  // (compact <761, medium 761–1023, expanded ≥1024 — the same classes the
  // mobile app's useWindowClass resolves). Untagged specs run desktop-only;
  // a spec tagged @layout:compact / @layout:medium opts into the matching
  // viewport project. parity/check-parity.mjs enforces which features need
  // which layouts covered.
  projects: [
    {
      name: 'chromium',
      grepInvert: /@layout:(compact|medium)/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-medium',
      grep: /@layout:medium/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 834, height: 1112 } },
    },
    {
      name: 'chromium-compact',
      grep: /@layout:compact/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'doppler run -- pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
