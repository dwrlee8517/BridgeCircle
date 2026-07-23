import { defineConfig } from 'vitest/config'

/**
 * Unit tests cover pure logic only (window classes, future formatters).
 * Anything importing react-native runs under Maestro e2e instead — vitest
 * has no RN runtime. Mirrors the web app's vitest-for-lib / e2e-for-UI split.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
