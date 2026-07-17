import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  DEV_PROJECT_REF,
  parseReadOnlyCountResult,
  validateDevPreflight,
} from '../src/lib/cutover/dev-target'

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function mainIsAncestor(): boolean {
  return spawnSync('git', ['merge-base', '--is-ancestor', 'main', 'HEAD'], {
    stdio: 'ignore',
  }).status === 0
}

function databaseUrl(): string | undefined {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const password = process.env.SUPABASE_DB_PASSWORD
  if (!password) return undefined

  try {
    const pooler = new URL(
      readFileSync(resolve('supabase/.temp/pooler-url'), 'utf8').trim(),
    )
    pooler.password = password
    return pooler.toString()
  } catch {
    return undefined
  }
}

const COUNT_RELATIONS = {
  auth_users: 'auth.users',
  memberships: 'public.organization_memberships',
  asks: 'public.asks',
  messages: 'public.messages',
  storage_objects: 'storage.objects',
  outbox_jobs: 'private.outbox_jobs',
  migration_records: 'supabase_migrations.schema_migrations',
} as const

function countRows(urlValue: string, relation: string): number | 'absent' {
  const url = new URL(urlValue)
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
      url.pathname.replace(/^\//, '') || 'postgres',
      '--command',
      `\\set VERBOSITY verbose\nselect count(*)::bigint from ${relation}`,
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
    throw new Error('psql is required to collect read-only cutover counts')
  }
  try {
    return parseReadOnlyCountResult({
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    })
  } catch {
    throw new Error(`Could not collect the read-only count for ${relation}`)
  }
}

function run(): void {
  const linkedProjectRef = readFileSync(resolve('supabase/.temp/project-ref'), 'utf8').trim()
  const resolvedDatabaseUrl = databaseUrl()

  validateDevPreflight({
    branch: git(['branch', '--show-current']),
    cleanWorktree: git(['status', '--porcelain']) === '',
    mainIsAncestor: mainIsAncestor(),
    linkedProjectRef,
    appEnv: process.env.APP_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    databaseUrl: resolvedDatabaseUrl,
  })

  // From here on every remote read is allowed only because all independent
  // branch, link, app-env, API-host, and database-host assertions passed.
  const cutoverSha = git(['rev-parse', 'HEAD'])
  const counts = Object.fromEntries(
    Object.entries(COUNT_RELATIONS).map(([label, relation]) => [
      label,
      countRows(resolvedDatabaseUrl!, relation),
    ]),
  )

  console.log(`cutover_sha=${cutoverSha}`)
  console.log(`branch=codex/redesign-v2`)
  console.log(`linked_project=${DEV_PROJECT_REF}`)
  for (const [label, count] of Object.entries(counts)) console.log(`${label}=${count}`)
  console.log('preflight=read-only-pass')
}

try {
  run()
} catch (error) {
  console.error(`Dev v2 cutover preflight failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
