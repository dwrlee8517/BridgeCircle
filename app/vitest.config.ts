import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Vitest's default discovery (`**/*.{test,spec}.{ts,tsx}`) matches Playwright's
// browser specs under tests/e2e and tests/manual, which crash on import because they call
// `test.describe()` outside of Playwright's runner. Exclude that directory so
// `pnpm vitest run` only picks up unit/integration specs colocated under src/.
//
// Aliases:
// - `@/*` mirrors tsconfig.json so test files can use the same import style as
//   production code.
// - `server-only` resolves to an empty shim. Next.js ships `server-only` as a
//   virtual module that throws if imported into a client component; vitest has
//   no such concept, so we drop it.
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      'tests/e2e/**',
      'tests/manual/**',
      'tests/integration/**',
    ],
    server: {
      deps: {
        // graphql relies on `instanceof` across its own modules. Vitest would
        // otherwise load it as both ESM and CJS (two instances of the same
        // version), so a Pothos-built schema fails printSchema/validate with
        // "from another module or realm". Inline graphql + Pothos so vitest
        // serves ONE graphql instance to both. Next bundles consistently, so
        // this only affects the test runtime.
        inline: [/@pothos/, 'graphql'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './src/test/server-only-shim.ts'),
    },
    dedupe: ['graphql'],
  },
})
