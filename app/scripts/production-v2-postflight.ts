import {
  activeMigrationVersions,
  databaseUrlFromEnvironment,
  git,
  remoteMigrationVersions,
  runPsql,
} from '../src/lib/cutover/remote-database'
import {
  pendingMigrationVersions,
  validateExactGitState,
  validateRemoteTarget,
} from '../src/lib/cutover/remote-target'
import { PRODUCTION_V2_ASSERTIONS } from '../src/lib/cutover/production-postflight'

function run(): void {
  const databaseUrl = databaseUrlFromEnvironment()
  const headSha = git(['rev-parse', 'HEAD'])
  const branch = git(['branch', '--show-current'])
  validateRemoteTarget({
    target: 'production',
    appEnv: process.env.APP_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    databaseUrl,
  })
  validateExactGitState({
    headSha,
    expectedSha: process.env.CUTOVER_SHA,
    cleanWorktree: git(['status', '--porcelain']) === '',
    branch,
    githubRef: process.env.GITHUB_REF,
    requireDetached: branch === '' && process.env.GITHUB_REF !== 'refs/heads/main',
  })

  const local = activeMigrationVersions()
  const remote = remoteMigrationVersions(databaseUrl)
  const pending = pendingMigrationVersions({ localVersions: local, remoteVersions: remote })
  if (pending.length > 0 || local.length !== remote.length) {
    throw new Error('Production migration history does not exactly match active v2 history')
  }

  for (const [name, sql] of PRODUCTION_V2_ASSERTIONS) {
    const result = runPsql(databaseUrl, `${sql}\n`)
    if (result !== 'true') throw new Error(`Postflight assertion failed: ${name}`)
    console.log(`assertion:${name}=pass`)
  }
  console.log(`cutover_sha=${headSha}`)
  console.log(`migration_count=${local.length}`)
  console.log('production_v2_postflight=pass')
}

try {
  run()
} catch (error) {
  console.error(`Production v2 postflight failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
