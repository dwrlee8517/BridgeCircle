import {
  activeMigrationVersions,
  remoteMigrationVersions,
  runPsql,
  spawnSupabase,
  validateRemoteExecution,
} from '../src/lib/cutover/remote-database'
import { pendingMigrationVersions, type RemoteTarget } from '../src/lib/cutover/remote-target'

type Mode = 'preflight' | 'dry-run' | 'apply' | 'postflight'

function argument<T extends string>(name: string, allowed: readonly T[]): T {
  const prefix = `--${name}=`
  const value = process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length)
  if (!value || !allowed.includes(value as T)) {
    throw new Error(`Expected ${prefix}${allowed.join('|')}`)
  }
  return value as T
}

function run(): void {
  const target = argument<RemoteTarget>('target', ['dev', 'production'])
  const mode = argument<Mode>('mode', ['preflight', 'dry-run', 'apply', 'postflight'])
  const { databaseUrl, headSha } = validateRemoteExecution(target)

  const identity = runPsql(
    databaseUrl,
    "select current_database() || '|' || current_user || '|' || current_setting('server_version_num');\n",
  )
  if (!/^postgres\|postgres(?:\.[a-z0-9]+)?\|\d+$/.test(identity)) {
    throw new Error('Remote database identity is not the expected Supabase postgres database')
  }

  const local = activeMigrationVersions()
  const remote = remoteMigrationVersions(databaseUrl)
  const pending = pendingMigrationVersions({ localVersions: local, remoteVersions: remote })
  console.log(`target=${target}`)
  console.log(`cutover_sha=${headSha}`)
  console.log(`local_migration_count=${local.length}`)
  console.log(`remote_migration_count=${remote.length}`)
  console.log(`pending_migration_count=${pending.length}`)

  if (mode === 'preflight') return
  if (mode === 'postflight') {
    if (pending.length !== 0) throw new Error(`Postflight found pending migrations: ${pending.join(',')}`)
    console.log('migration_postflight=pass')
    return
  }

  if (mode === 'dry-run') {
    spawnSupabase(['db', 'push', '--dry-run'], databaseUrl)
    console.log('migration_dry_run=pass')
    return
  }

  const confirmation = `APPLY ${target} ${headSha}`
  if (process.env.ALLOW_REMOTE_MIGRATION_PUSH !== confirmation) {
    throw new Error(`ALLOW_REMOTE_MIGRATION_PUSH must exactly equal: ${confirmation}`)
  }
  spawnSupabase(['db', 'push', '--yes'], databaseUrl)
  console.log('migration_apply=pass')
}

try {
  run()
} catch (error) {
  console.error(`Remote v2 migration command failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
