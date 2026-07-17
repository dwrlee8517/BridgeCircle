export const PROD_PROJECT_REF = 'edumxwzilfgvamzarwvo'
export const PROD_SUPABASE_ORIGIN = `https://${PROD_PROJECT_REF}.supabase.co`
export const PROD_GITHUB_REPOSITORY = 'dwrlee8517/BridgeCircle'
export const PROD_GITHUB_REF = 'refs/heads/main'

export type ProductionTargetInput = {
  appEnv: string | undefined
  supabaseUrl: string | undefined
  databaseUrl: string | undefined
  declaredProjectRef: string | undefined
  expectedSha: string | undefined
  actualSha: string
  githubRef: string | undefined
  githubRepository: string | undefined
  cleanWorktree: boolean
}

function parsedUrl(value: string | undefined, label: string): URL {
  if (!value) throw new Error(`${label} is missing`)

  try {
    return new URL(value)
  } catch {
    throw new Error(`${label} is not a valid URL`)
  }
}

function isExactOrigin(url: URL, origin: string): boolean {
  return url.origin === origin && url.pathname === '/' && url.search === '' && url.hash === ''
}

function isProductionDatabase(url: URL): boolean {
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') return false
  const username = decodeURIComponent(url.username)
  const direct =
    url.hostname === `db.${PROD_PROJECT_REF}.supabase.co` &&
    username === 'postgres' &&
    (url.port === '' || url.port === '5432')
  const pooler =
    url.hostname.endsWith('.pooler.supabase.com') &&
    username === `postgres.${PROD_PROJECT_REF}` &&
    (url.port === '5432' || url.port === '6543')

  return (direct || pooler) && url.pathname === '/postgres' && url.hash === ''
}

export function validateProductionTarget(input: ProductionTargetInput): void {
  if (input.appEnv !== 'prod') throw new Error('APP_ENV must be prod')
  if (input.declaredProjectRef !== PROD_PROJECT_REF) {
    throw new Error('PRODUCTION_PROJECT_REF does not match the allowlisted production project')
  }
  if (input.githubRepository !== PROD_GITHUB_REPOSITORY) {
    throw new Error('GITHUB_REPOSITORY does not match the allowlisted repository')
  }
  if (input.githubRef !== PROD_GITHUB_REF) {
    throw new Error('Production migration ownership runs only from main')
  }
  if (!input.cleanWorktree) {
    throw new Error('Production migration ownership requires a clean checkout')
  }
  if (!/^[0-9a-f]{40}$/.test(input.expectedSha ?? '')) {
    throw new Error('EXPECTED_SHA must be a full lowercase Git SHA')
  }
  if (input.actualSha !== input.expectedSha) {
    throw new Error('Checked-out SHA does not match EXPECTED_SHA')
  }

  const supabaseUrl = parsedUrl(input.supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')
  if (!isExactOrigin(supabaseUrl, PROD_SUPABASE_ORIGIN)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL does not target production')
  }

  const databaseUrl = parsedUrl(input.databaseUrl, 'SUPABASE_DB_URL')
  if (!isProductionDatabase(databaseUrl)) {
    throw new Error('SUPABASE_DB_URL does not target the allowlisted production database')
  }
  if (!databaseUrl.password) throw new Error('SUPABASE_DB_URL is missing its password')
}

export type MigrationHistoryInput = {
  localVersions: string[]
  remoteVersions: string[]
  expectedPendingMigration: string | undefined
}

export function migrationVersionsFromFilenames(filenames: string[]): string[] {
  return filenames
    .filter((filename) => filename.endsWith('.sql'))
    .map((filename) => {
      const match = filename.match(/^(\d{14})_[a-z0-9_]+\.sql$/)
      if (!match) throw new Error(`Invalid migration filename: ${filename}`)
      return match[1]
    })
    .sort()
}

function normalizedVersions(versions: string[], label: string): string[] {
  if (versions.some((version) => !/^\d{14}$/.test(version))) {
    throw new Error(`${label} contains an invalid migration version`)
  }

  const sorted = [...versions].sort()
  if (new Set(sorted).size !== sorted.length) {
    throw new Error(`${label} contains duplicate migration versions`)
  }
  return sorted
}

export function validateMigrationHistory(input: MigrationHistoryInput): string[] {
  const local = normalizedVersions(input.localVersions, 'Local migration history')
  const remote = normalizedVersions(input.remoteVersions, 'Remote migration history')
  const localSet = new Set(local)
  const remoteSet = new Set(remote)
  const remoteOnly = remote.filter((version) => !localSet.has(version))
  if (remoteOnly.length > 0) {
    throw new Error(`Remote-only migration versions found: ${remoteOnly.join(',')}`)
  }

  const pending = local.filter((version) => !remoteSet.has(version))
  const expected = input.expectedPendingMigration
  if (expected === 'none') {
    if (pending.length > 0) {
      throw new Error(`Expected no pending migrations, found: ${pending.join(',')}`)
    }
    return pending
  }
  if (!/^\d{14}$/.test(expected ?? '')) {
    throw new Error('EXPECTED_PENDING_MIGRATION must be none or one 14-digit version')
  }
  if (pending.length !== 1 || pending[0] !== expected) {
    throw new Error(
      `Pending migrations do not match the approved version ${expected}: ${pending.join(',') || 'none'}`,
    )
  }
  return pending
}
