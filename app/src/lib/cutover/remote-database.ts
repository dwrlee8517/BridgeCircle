import { execFileSync, spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  migrationVersionsFromFilenames,
  type RemoteTarget,
  validateExactGitState,
  validateRemoteTarget,
} from './remote-target'

export function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

export function databaseUrlFromEnvironment(): string {
  const value = process.env.SUPABASE_DB_URL
  if (!value) throw new Error('SUPABASE_DB_URL is missing')
  return value
}

export function runPsql(databaseUrl: string, sql: string): string {
  const url = new URL(databaseUrl)
  const result = spawnSync(
    'psql',
    [
      '-X',
      '--no-psqlrc',
      '--quiet',
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
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        PGPASSWORD: decodeURIComponent(url.password),
        PGSSLMODE: url.searchParams.get('sslmode') ?? 'require',
      },
      input: sql,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )
  if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT') {
    throw new Error('psql is required for cutover checks')
  }
  if (result.status !== 0) {
    throw new Error(`Cutover SQL failed: ${result.stderr.trim() || 'unknown psql error'}`)
  }
  return result.stdout.trim()
}

export function activeMigrationVersions(): string[] {
  return migrationVersionsFromFilenames(readdirSync(resolve('supabase/migrations')))
}

export function remoteMigrationVersions(databaseUrl: string): string[] {
  const output = runPsql(
    databaseUrl,
    'select version::text from supabase_migrations.schema_migrations order by version;\n',
  )
  return output === '' ? [] : output.split('\n')
}

export function validateRemoteExecution(target: RemoteTarget): {
  databaseUrl: string
  headSha: string
} {
  const databaseUrl = databaseUrlFromEnvironment()
  const headSha = git(['rev-parse', 'HEAD'])
  validateRemoteTarget({
    target,
    appEnv: process.env.APP_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    databaseUrl,
  })
  validateExactGitState({
    headSha,
    expectedSha: process.env.CUTOVER_SHA,
    cleanWorktree: git(['status', '--porcelain']) === '',
    branch: git(['branch', '--show-current']),
    githubRef: process.env.GITHUB_REF,
    remoteTarget: target,
    devCandidateConfirmation: process.env.ALLOW_DEV_CANDIDATE_DEPLOY,
  })
  return { databaseUrl, headSha }
}

export function spawnSupabase(args: string[], databaseUrl: string): void {
  const result = spawnSync('pnpm', ['exec', 'supabase', ...args, '--db-url', databaseUrl], {
    encoding: 'utf8',
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  if (result.error)
    throw new Error(`Could not run the pinned Supabase CLI: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`Supabase CLI exited with status ${result.status}`)
}
