import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import {
  databaseUrlFromEnvironment,
  git,
  runPsql,
} from '../src/lib/cutover/remote-database'
import {
  PROD_PROJECT_REF,
  validateExactGitState,
  validateRemoteTarget,
} from '../src/lib/cutover/remote-target'

type Mode = 'plan' | 'execute'

function mode(): Mode {
  const value = process.argv.find((item) => item.startsWith('--mode='))?.slice('--mode='.length)
  if (value !== 'plan' && value !== 'execute') throw new Error('Expected --mode=plan or --mode=execute')
  return value
}

function command(binary: string, args: string[], env?: Record<string, string>): void {
  const result = spawnSync(binary, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'inherit', 'inherit'] })
  if (result.error) throw new Error(`${binary} could not start: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`${binary} exited with status ${result.status}`)
}

function checksum(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function encrypt(path: string, recipient: string): string {
  const encrypted = `${path}.gpg`
  command('gpg', ['--batch', '--yes', '--trust-model', 'always', '--recipient', recipient, '--output', encrypted, '--encrypt', path])
  unlinkSync(path)
  return encrypted
}

function run(): void {
  const selectedMode = mode()
  const databaseUrl = databaseUrlFromEnvironment()
  const headSha = git(['rev-parse', 'HEAD'])
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
    branch: git(['branch', '--show-current']),
    requireDetached: true,
  })

  const outputDirectory = process.env.SNAPSHOT_OUTPUT_DIR ?? ''
  if (!isAbsolute(outputDirectory)) throw new Error('SNAPSHOT_OUTPUT_DIR must be an absolute path outside the repository')
  const repository = resolve('..')
  const output = resolve(outputDirectory)
  if (output === repository || output.startsWith(`${repository}/`)) {
    throw new Error('Production snapshots must never be written inside the repository')
  }
  const recipient = process.env.SNAPSHOT_GPG_RECIPIENT ?? ''
  if (recipient.length < 3) throw new Error('SNAPSHOT_GPG_RECIPIENT is missing')

  const counts = runPsql(
    databaseUrl,
    `select json_build_object(
       'auth_users', (select count(*) from auth.users),
       'public_users', (select count(*) from public.users),
       'memberships', (select count(*) from public.organization_memberships),
       'storage_objects', (select count(*) from storage.objects),
       'migration_records', (select count(*) from supabase_migrations.schema_migrations)
     )::text;\n`,
  )
  console.log(`target_project=${PROD_PROJECT_REF}`)
  console.log(`cutover_sha=${headSha}`)
  console.log(`snapshot_counts=${counts}`)
  console.log(`snapshot_output_directory=${output}`)
  if (selectedMode === 'plan') {
    console.log('snapshot_plan=pass-no-change')
    return
  }

  const confirmation = `SNAPSHOT ${PROD_PROJECT_REF} AT ${headSha}`
  if (process.env.PRODUCTION_SNAPSHOT_EXECUTE !== '1') {
    throw new Error('PRODUCTION_SNAPSHOT_EXECUTE must equal 1')
  }
  if (process.env.PRODUCTION_SNAPSHOT_CONFIRM !== confirmation) {
    throw new Error(`PRODUCTION_SNAPSHOT_CONFIRM must exactly equal: ${confirmation}`)
  }

  mkdirSync(output, { recursive: true, mode: 0o700 })
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-')
  const prefix = resolve(output, `bridgecircle-production-before-v2-${stamp}`)
  const dump = `${prefix}.dump`
  const url = new URL(databaseUrl)
  command(
    'pg_dump',
    [
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      '--host',
      url.hostname,
      '--port',
      url.port || '5432',
      '--username',
      decodeURIComponent(url.username),
      '--dbname',
      url.pathname.replace(/^\//, '') || 'postgres',
      '--schema=public',
      '--schema=api',
      '--schema=private',
      '--schema=auth',
      '--schema=storage',
      '--schema=supabase_migrations',
      '--file',
      dump,
    ],
    { PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: url.searchParams.get('sslmode') ?? 'require' },
  )

  const manifest = `${prefix}-manifest.txt`
  const storageObjects = runPsql(
    databaseUrl,
    `select bucket_id || '|' || name || '|' || coalesce((metadata->>'size'), '')
       from storage.objects order by bucket_id, name;\n`,
  )
  writeFileSync(
    manifest,
    [
      `project=${PROD_PROJECT_REF}`,
      `cutover_sha=${headSha}`,
      `created_at=${new Date().toISOString()}`,
      `counts=${counts}`,
      'storage_objects_begin',
      storageObjects,
      'storage_objects_end',
      'manual_configuration_inventory=auth URLs/providers/templates, storage buckets, realtime publications, extensions, scheduled jobs',
      `deletion_date=${process.env.SNAPSHOT_DELETION_DATE ?? 'UNSET'}`,
      '',
    ].join('\n'),
    { mode: 0o600 },
  )

  const encryptedDump = encrypt(dump, recipient)
  const encryptedManifest = encrypt(manifest, recipient)
  const checksums = `${prefix}-checksums.txt`
  writeFileSync(
    checksums,
    `${checksum(encryptedDump)}  ${encryptedDump.split('/').at(-1)}\n${checksum(encryptedManifest)}  ${encryptedManifest.split('/').at(-1)}\n`,
    { mode: 0o600 },
  )
  console.log(`encrypted_dump=${encryptedDump}`)
  console.log(`encrypted_manifest=${encryptedManifest}`)
  console.log(`checksums=${checksums}`)
  console.log('production_snapshot=complete-restore-test-required')
}

try {
  run()
} catch (error) {
  console.error(`Production snapshot failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
