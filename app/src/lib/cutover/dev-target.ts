export const CUTOVER_BRANCH = 'codex/redesign-v2'
export const DEV_PROJECT_REF = 'ojpvahiuafdcynbdbmri'
export const DEV_APP_ORIGIN = 'https://dev.bridgecircle.org'
export const DEV_SUPABASE_ORIGIN = `https://${DEV_PROJECT_REF}.supabase.co`

// Production is named explicitly so a future accidental relink fails with a
// clear production-specific error instead of looking like a generic mismatch.
export const PROD_PROJECT_REF = 'edumxwzilfgvamzarwvo'

export type DevPreflightInput = {
  branch: string
  cleanWorktree: boolean
  mainIsAncestor: boolean
  linkedProjectRef: string
  appEnv: string | undefined
  supabaseUrl: string | undefined
  databaseUrl: string | undefined
}

function parsedUrl(value: string | undefined, label: string): URL {
  if (!value) throw new Error(`${label} is missing`)

  try {
    return new URL(value)
  } catch {
    throw new Error(`${label} is not a valid URL`)
  }
}

function isProductionHost(hostname: string): boolean {
  return hostname === `${PROD_PROJECT_REF}.supabase.co` || hostname.includes(PROD_PROJECT_REF)
}

export function validateDevPreflight(input: DevPreflightInput): void {
  if (input.branch !== CUTOVER_BRANCH) {
    throw new Error(`Cutover preflight requires branch ${CUTOVER_BRANCH}`)
  }
  if (!input.cleanWorktree) throw new Error('Cutover preflight requires a clean worktree')
  if (!input.mainIsAncestor) throw new Error('Local main must be an ancestor of the cutover SHA')

  if (input.linkedProjectRef === PROD_PROJECT_REF) {
    throw new Error('Cutover preflight refuses the production Supabase project')
  }
  if (input.linkedProjectRef !== DEV_PROJECT_REF) {
    throw new Error('Linked Supabase project is not the allowlisted development project')
  }
  if (input.appEnv !== 'dev') throw new Error('APP_ENV must be dev')

  const supabaseUrl = parsedUrl(input.supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')
  if (isProductionHost(supabaseUrl.hostname)) {
    throw new Error('Cutover preflight refuses the production Supabase URL')
  }
  if (
    supabaseUrl.origin !== DEV_SUPABASE_ORIGIN ||
    supabaseUrl.pathname !== '/' ||
    supabaseUrl.search !== '' ||
    supabaseUrl.hash !== ''
  ) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL does not target the allowlisted development project')
  }

  const databaseUrl = parsedUrl(input.databaseUrl, 'SUPABASE_DB_URL')
  if (isProductionHost(databaseUrl.hostname) || databaseUrl.username.includes(PROD_PROJECT_REF)) {
    throw new Error('Cutover preflight refuses the production database target')
  }
  const databaseUsername = decodeURIComponent(databaseUrl.username)
  const isDirectDatabase =
    databaseUrl.hostname === `db.${DEV_PROJECT_REF}.supabase.co` && databaseUsername === 'postgres'
  const isPoolerDatabase =
    databaseUrl.hostname.endsWith('.pooler.supabase.com') &&
    databaseUsername === `postgres.${DEV_PROJECT_REF}`
  if ((!isDirectDatabase && !isPoolerDatabase) || databaseUrl.pathname !== '/postgres') {
    throw new Error('SUPABASE_DB_URL does not target the allowlisted development project')
  }
}

export type HostedDevAuthorizationInput = {
  baseUrl: string | undefined
  appEnv: string | undefined
  allowSeed: string | undefined
}

export type DevSmokeAuthorizationInput = {
  baseUrl: string | undefined
  appEnv: string | undefined
  enabled: string | undefined
  cutoverSha: string | undefined
}

/**
 * Fail-closed authorization for the one-time seed-owned hosted acceptance run.
 * An absent flag means "ordinary integ mode" and is not an error. Once the
 * flag is requested, every target assertion becomes mandatory.
 */
export function authorizeHostedDevSeed(input: HostedDevAuthorizationInput): boolean {
  if (input.allowSeed !== '1') return false
  if (input.appEnv !== 'dev') {
    throw new Error('E2E_ALLOW_DEV_SEED=1 requires APP_ENV=dev')
  }

  const baseUrl = parsedUrl(input.baseUrl, 'PLAYWRIGHT_BASE_URL')
  if (
    baseUrl.origin !== DEV_APP_ORIGIN ||
    baseUrl.pathname !== '/' ||
    baseUrl.search !== '' ||
    baseUrl.hash !== ''
  ) {
    throw new Error(`E2E_ALLOW_DEV_SEED=1 is restricted to ${DEV_APP_ORIGIN}`)
  }

  return true
}

/** Allow the read-only smoke only on localhost or the exact hosted dev app. */
export function authorizeDevSmoke(input: DevSmokeAuthorizationInput): boolean {
  if (input.enabled !== '1') return false

  const baseUrl = parsedUrl(input.baseUrl, 'PLAYWRIGHT_BASE_URL')
  const isLocal =
    (baseUrl.hostname === 'localhost' || baseUrl.hostname === '127.0.0.1') &&
    (baseUrl.protocol === 'http:' || baseUrl.protocol === 'https:')

  if (isLocal) return true
  if (
    baseUrl.origin !== DEV_APP_ORIGIN ||
    baseUrl.pathname !== '/' ||
    baseUrl.search !== '' ||
    baseUrl.hash !== ''
  ) {
    throw new Error(`E2E_DEV_SMOKE=1 refuses remote targets other than ${DEV_APP_ORIGIN}`)
  }
  if (input.appEnv !== 'dev') throw new Error('Hosted dev smoke requires APP_ENV=dev')
  if (!/^[0-9a-f]{40}$/.test(input.cutoverSha ?? '')) {
    throw new Error('Hosted dev smoke requires the exact 40-character CUTOVER_SHA')
  }

  return true
}

export function parseReadOnlyCountResult(input: {
  status: number | null
  stdout: string
  stderr: string
}): number | 'absent' {
  if (input.status !== 0) {
    if (/\b42P01\b/.test(input.stderr)) return 'absent'
    throw new Error('Read-only database count failed')
  }

  const count = Number.parseInt(input.stdout.trim(), 10)
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error('Read-only database count returned an invalid value')
  }
  return count
}
