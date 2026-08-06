import { sweepAllTestData } from './resetDb'

/**
 * Global setup file (globalSetup in vitest.integration.config.ts). Vitest calls
 * the exported `teardown` once after the whole suite — there is no separate
 * `globalTeardown` option.
 *
 * Per-file afterAll already tears down each run's data; this is the backstop
 * that purges any it+/it- leftovers from a crashed run. Gated on
 * INTEGRATION_SWEEP so it only fires from the test:int / test:int:dev scripts
 * (which set it), never an ad-hoc `vitest` invocation.
 */
export async function teardown(): Promise<void> {
  if (process.env.INTEGRATION_SWEEP === '1') {
    await sweepAllTestData()
  }
}
