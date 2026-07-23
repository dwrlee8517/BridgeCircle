import { defineConfig, devices } from '@playwright/test'
import { e2eEnv } from './tests/e2e/helpers/env'

export default defineConfig({
  testDir: './tests/manual',
  timeout: 60_000,
  reporter: 'list',
  expect: { timeout: 15_000 },
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/sign-in',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...(process.env as Record<string, string>),
      ...e2eEnv(),
      NODE_ENV: 'development',
    },
  },
})
