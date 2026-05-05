import { defineConfig } from 'vitest/config'

// Vitest's default discovery (`**/*.{test,spec}.{ts,tsx}`) matches Playwright's
// E2E specs under tests/e2e, which crash on import because they call
// `test.describe()` outside of Playwright's runner. Exclude that directory so
// `pnpm vitest run` only picks up unit/integration specs colocated under src/.
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/.next/**', 'tests/e2e/**'],
  },
})
