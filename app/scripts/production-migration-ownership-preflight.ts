import { execFileSync, spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  migrationVersionsFromFilenames,
  PROD_PROJECT_REF,
  validateMigrationHistory,
  validateProductionTarget,
} from '../src/lib/cutover/production-target'

function git(args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function databaseUrl(): URL {
  const value = process.env.SUPABASE_DB_URL
  if (!value) throw new Error('SUPABASE_DB_URL is missing')
  try {
    return new URL(value)
  } catch {
    throw new Error('SUPABASE_DB_URL is not a valid URL')
  }
}

function psql(url: URL, sql: string): string[] {
  const result = spawnSync(
    'psql',
    [
      '-X',
      '--no-psqlrc',
      '--tuples-only',
      '--no-align',
      '--set',
      'ON_ERROR_STOP=1',
      '--host',
      url.hostname,
      '--port',
      url.port || '5432',
      '--username',
      decodeURIComponent(url.username),
      '--dbname',
      url.pathname.replace(/^\//, ''),
      '--command',
      sql,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        PGPASSWORD: decodeURIComponent(url.password),
        PGSSLMODE: url.searchParams.get('sslmode') ?? 'require',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT') {
    throw new Error('psql is required for production migration preflight')
  }
  if (result.status !== 0) {
    throw new Error('Production migration preflight query failed')
  }
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function localMigrationVersions(): string[] {
  return migrationVersionsFromFilenames(readdirSync(resolve('supabase/migrations')))
}

function run(): void {
  const actualSha = git(['rev-parse', 'HEAD'])
  const url = databaseUrl()

  validateProductionTarget({
    appEnv: process.env.APP_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    databaseUrl: process.env.SUPABASE_DB_URL,
    declaredProjectRef: process.env.PRODUCTION_PROJECT_REF,
    expectedSha: process.env.EXPECTED_SHA,
    actualSha,
    githubRef: process.env.GITHUB_REF,
    githubRepository: process.env.GITHUB_REPOSITORY,
    cleanWorktree: git(['status', '--porcelain']) === '',
  })

  const identity = psql(
    url,
    "select current_database() || '|' || current_user || '|' || current_setting('server_version_num') || '|' || pg_is_in_recovery()::text",
  )
  if (identity.length !== 1) throw new Error('Production database identity query was ambiguous')
  const [database, user, serverVersion, recovery] = identity[0].split('|')
  if (database !== 'postgres' || user !== 'postgres' || !/^\d+$/.test(serverVersion)) {
    throw new Error('Production database identity did not match the expected Postgres owner')
  }
  if (recovery !== 'false') throw new Error('Production database target is read-only recovery')

  const localVersions = localMigrationVersions()
  const remoteVersions = psql(
    url,
    'select version::text from supabase_migrations.schema_migrations order by version',
  )
  const pending = validateMigrationHistory({
    localVersions,
    remoteVersions,
    expectedPendingMigration: process.env.EXPECTED_PENDING_MIGRATION,
  })

  console.log(`project_ref=${PROD_PROJECT_REF}`)
  console.log(`sha=${actualSha}`)
  console.log(`postgres_version_num=${serverVersion}`)
  console.log(`local_migration_count=${localVersions.length}`)
  console.log(`remote_migration_count=${remoteVersions.length}`)
  console.log(`approved_pending_migration=${pending[0] ?? 'none'}`)
  console.log('production_migration_preflight=pass')
}

try {
  run()
} catch (error) {
  console.error(
    `Production migration preflight failed: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exitCode = 1
}
