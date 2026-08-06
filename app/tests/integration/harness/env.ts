/**
 * Env preflight for the integration suite.
 *
 * The tests run in-process but talk to a *real* Supabase (local by default,
 * dev via the opt-in target), so the same connection env the app reads must be
 * present. We validate up front and fail with an actionable message rather
 * than letting a missing key surface as an opaque 500 deep inside an action.
 *
 * Everything here is supplied by Doppler at runtime (see the test:int scripts),
 * so this file never hardcodes secrets.
 */

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'PROVISION_SECRET',
] as const

export type IntegrationEnv = {
  supabaseUrl: string
  provisionSecret: string
  /** True when pointed at a non-local Supabase (the dev target). */
  isRemote: boolean
}

let cached: IntegrationEnv | null = null

export function requireIntegrationEnv(): IntegrationEnv {
  if (cached) return cached

  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `Integration tests need these env vars: ${missing.join(', ')}. ` +
        'Run via `pnpm test:int` (local) or `pnpm test:int:dev`, both of which wrap Doppler.',
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const isRemote = !/localhost|127\.0\.0\.1/.test(supabaseUrl)

  cached = {
    supabaseUrl,
    provisionSecret: process.env.PROVISION_SECRET as string,
    isRemote,
  }
  return cached
}
