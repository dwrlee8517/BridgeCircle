// Guarded, repeatable rebuild of the HOSTED DEV database.
//
// Unlike the one-time production reset (production-v2-reset.ts), dev holds
// disposable data and is meant to be rebuilt routinely: replay every checked-in
// migration and load the starter cast, erasing drift and test residue. The
// operator then reseeds the demo organization (the checklist printed at the end).
//
// Runbook: docs/runbooks/dev-reset.md. Everyone signed into dev is logged out,
// and manually uploaded storage objects are gone (buckets return via
// migrations) — announce the window before executing.
//
// Usage, from app/ (Doppler supplies APP_ENV / SUPABASE_DB_URL / NEXT_PUBLIC_SUPABASE_URL):
//   CUTOVER_SHA=$(git rev-parse HEAD) pnpm reset:dev --mode=plan
//   DEV_RESET_EXECUTE=1 DEV_RESET_CONFIRM="RESET <dev-ref> AT <sha>" \
//     CUTOVER_SHA=<sha> pnpm reset:dev --mode=execute
import { spawnSync } from 'node:child_process'
import {
  activeMigrationVersions,
  remoteMigrationVersions,
  runPsql,
  validateRemoteExecution,
} from '../src/lib/cutover/remote-database'
import { DEV_PROJECT_REF } from '../src/lib/cutover/remote-target'

type Mode = 'plan' | 'execute'

// Dev is NOT presumed empty — the point of plan mode is a written record of
// what execute will destroy.
const DOOMED_RELATIONS = [
  'auth.users',
  'public.users',
  'public.organization_memberships',
  'public.messages',
  'public.asks',
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
  // The whole guard stack in one call: dev project ref in both URLs,
  // APP_ENV=dev, and HEAD exactly equal to CUTOVER_SHA on a clean main (or the
  // explicitly allowed dev-candidate branch). Production identifiers are
  // structurally impossible past this line.
  const { databaseUrl, headSha } = validateRemoteExecution('dev')

  console.log(`target_project=${DEV_PROJECT_REF}`)
  console.log(`reset_sha=${headSha}`)

  for (const relation of DOOMED_RELATIONS) {
    console.log(`doomed:${relation}=${count(databaseUrl, relation)}`)
  }

  const localVersions = activeMigrationVersions()
  const remoteVersions = remoteMigrationVersions(databaseUrl)
  const remoteSet = new Set(remoteVersions)
  const pending = localVersions.filter((version) => !remoteSet.has(version))
  console.log(`migrations_local=${localVersions.length}`)
  console.log(`migrations_remote=${remoteVersions.length}`)
  console.log(`migrations_pending_on_remote=${pending.join(',') || 'none'}`)

  if (selectedMode === 'plan') {
    console.log('reset_plan=review-doomed-counts-then-execute')
    console.log(`confirmation_required=RESET ${DEV_PROJECT_REF} AT ${headSha}`)
    return
  }

  if (process.env.DEV_RESET_EXECUTE !== '1') {
    throw new Error('Execute mode requires DEV_RESET_EXECUTE=1')
  }
  const expectedConfirmation = `RESET ${DEV_PROJECT_REF} AT ${headSha}`
  if (process.env.DEV_RESET_CONFIRM !== expectedConfirmation) {
    throw new Error(`DEV_RESET_CONFIRM must be exactly "${expectedConfirmation}"`)
  }

  // No --no-seed: the CLI replays every migration and then loads the
  // starter cast (the only auto-loading seed since the eval corpus went
  // opt-in). Everything else is reseeded by the operator afterwards.
  const result = spawnSync(
    'pnpm',
    ['exec', 'supabase', 'db', 'reset', '--db-url', databaseUrl, '--yes'],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  )
  if (result.error) throw new Error(`Could not run the pinned Supabase CLI: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`Dev reset exited with status ${result.status}`)

  console.log('dev_reset=complete')
  console.log('next_steps_begin')
  console.log('1. Reseed the demo school (with scenes as needed):')
  console.log('   DEMO_ALLOW_REMOTE=1 SUPABASE_DB_URL=<dev pooler url> \\')
  console.log('     DEMO_SCENE=help-inbox,thread,ask-journey pnpm seed:demo-org')
  console.log('2. Re-auth operator accounts (all dev sessions and auth users were erased).')
  console.log('3. Verify the demo door: arm from /demo/arm, walk the app as the persona.')
  console.log('4. Baseline-sweep e2e residue: E2E_SWEEP_ALLOW_DEV=1 pnpm sweep:e2e')
  console.log('next_steps_end')
}

try {
  run()
} catch (error) {
  console.error(`Dev reset failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
