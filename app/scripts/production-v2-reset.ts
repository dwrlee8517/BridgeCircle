import { spawnSync } from 'node:child_process'
import {
  databaseUrlFromEnvironment,
  git,
  remoteMigrationVersions,
  runPsql,
} from '../src/lib/cutover/remote-database'
import {
  PROD_PROJECT_REF,
  validateExactGitState,
  validateProductionResetAuthorization,
  validateRemoteTarget,
} from '../src/lib/cutover/remote-target'

type Mode = 'plan' | 'execute'

const ZERO_DATA_RELATIONS = [
  'auth.users',
  'public.users',
  'public.organization_memberships',
  'public.invites',
  'public.messages',
  'storage.objects',
] as const

function mode(): Mode {
  const value = process.argv.find((item) => item.startsWith('--mode='))?.slice('--mode='.length)
  if (value !== 'plan' && value !== 'execute') throw new Error('Expected --mode=plan or --mode=execute')
  return value
}

function count(databaseUrl: string, relation: string): number {
  const value = Number.parseInt(runPsql(databaseUrl, `select count(*)::bigint from ${relation};\n`), 10)
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid count for ${relation}`)
  return value
}

function run(): void {
  const selectedMode = mode()
  const databaseUrl = databaseUrlFromEnvironment()
  const headSha = git(['rev-parse', 'HEAD'])
  const gitInput = {
    headSha,
    expectedSha: process.env.CUTOVER_SHA,
    cleanWorktree: git(['status', '--porcelain']) === '',
    branch: git(['branch', '--show-current']),
    requireDetached: true,
  }
  const targetInput = {
    target: 'production' as const,
    appEnv: process.env.APP_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    databaseUrl,
  }
  validateRemoteTarget(targetInput)
  validateExactGitState(gitInput)

  const counts = Object.fromEntries(ZERO_DATA_RELATIONS.map((relation) => [relation, count(databaseUrl, relation)]))
  const nonzero = Object.entries(counts).filter(([, value]) => value !== 0)
  if (nonzero.length > 0) {
    throw new Error(`Clean-reset premise failed: ${nonzero.map(([name, value]) => `${name}=${value}`).join(', ')}`)
  }

  const versions = remoteMigrationVersions(databaseUrl)
  const objects = runPsql(
    databaseUrl,
    `select n.nspname || '.' || c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname in ('public', 'api', 'private')
        and c.relkind in ('r', 'p', 'v', 'm', 'S')
      order by 1;\n`,
  )
  console.log(`target_project=${PROD_PROJECT_REF}`)
  console.log(`cutover_sha=${headSha}`)
  console.log(`legacy_migration_count=${versions.length}`)
  console.log(`legacy_migrations=${versions.join(',')}`)
  for (const [relation, value] of Object.entries(counts)) console.log(`count:${relation}=${value}`)
  console.log('application_objects_begin')
  console.log(objects)
  console.log('application_objects_end')

  if (selectedMode === 'plan') {
    console.log('reset_plan=pass-no-change')
    return
  }

  validateProductionResetAuthorization({
    ...targetInput,
    ...gitInput,
    execute: process.env.PRODUCTION_V2_RESET_EXECUTE,
    zeroDataAcknowledged: process.env.PRODUCTION_V2_ZERO_DATA_ACK,
    confirmation: process.env.PRODUCTION_V2_RESET_CONFIRM,
  })

  const result = spawnSync(
    'pnpm',
    ['exec', 'supabase', 'db', 'reset', '--db-url', databaseUrl, '--no-seed', '--yes'],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  )
  if (result.error) throw new Error(`Could not run the pinned Supabase CLI: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`Production v2 reset exited with status ${result.status}`)
  console.log('production_v2_reset=complete')
}

try {
  run()
} catch (error) {
  console.error(`Production v2 reset failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
