import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Integration suite — drives real server actions and route handlers in-process
 * against a real Supabase (local by default; the dev target is opt-in via the
 * test:int:dev script). Separate from vitest.config.ts, which runs the fast,
 * DB-free unit specs colocated under src.
 *
 * Why in-process instead of HTTP: importing and calling the exported action /
 * handler functions is what lets v8 collect their line coverage. Firing HTTP
 * at a running dev server would exercise the same code but instrument nothing.
 *
 * The next/* aliases replace framework hooks the actions call — cookies()
 * backed by a real per-user jar (so Supabase sessions actually persist),
 * redirect()/notFound() as catchable control flow, and revalidate* as no-ops.
 * See tests/integration/harness/.
 */
const harness = path.resolve(__dirname, './tests/integration/harness')

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.int.test.ts'],
    setupFiles: ['tests/integration/harness/setup.ts'],
    globalSetup: ['tests/integration/harness/globalSetup.ts'],
    // One shared database: run files and tests serially so seed/teardown never
    // races. Isolation comes from per-run namespacing, not parallelism.
    fileParallelism: false,
    sequence: { concurrent: false },
    // Real DB round-trips (provisioning does several writes + an auth call).
    testTimeout: 30_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      // The API surface this suite is responsible for.
      include: ['src/app/**/actions.ts', 'src/app/**/route.ts', 'src/lib/**'],
      exclude: ['src/lib/**/*.test.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage/integration',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './src/test/server-only-shim.ts'),
      'next/headers': path.resolve(harness, './shims/next-headers.ts'),
      'next/navigation': path.resolve(harness, './shims/next-navigation.ts'),
      'next/cache': path.resolve(harness, './shims/next-cache.ts'),
    },
  },
})
