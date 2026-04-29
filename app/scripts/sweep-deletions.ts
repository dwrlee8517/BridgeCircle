/**
 * Sweep script: finalize every user account whose deletion grace period has
 * expired.
 *
 * Run from app/:
 *   pnpm dlx tsx --env-file=.env.local scripts/sweep-deletions.ts
 *
 * Or with a dry-run preview first:
 *   DRY_RUN=YES pnpm dlx tsx --env-file=.env.local scripts/sweep-deletions.ts
 *
 * What it does:
 *   - Selects every users row where delete_scheduled_for < now() AND
 *     deleted_at IS NULL (i.e. past grace, not yet finalized).
 *   - For each, calls finalizeAccount() to tombstone profile data, ban auth,
 *     and set deleted_at.
 *   - Prints a summary of how many were processed and any errors.
 *
 * When to run:
 *   - Weekly is generous. Daily is fine. The "past grace, not yet finalized"
 *     state is harmless — those users are already locked out and hidden — so
 *     missing a day doesn't break anything.
 *   - Production setup later: convert to a Railway worker or a Supabase
 *     scheduled function (pg_cron). The lib function can be invoked from
 *     anywhere with service-role credentials.
 *
 * Safety:
 *   - finalizeAccount is irreversible. The pre-flight prints exactly which
 *     users will be tombstoned; pass DRY_RUN=YES to print only.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/db/database.types'
import { finalizeAccount } from '../src/lib/admin/finalizeAccount'

// .env.local is loaded by `tsx --env-file=.env.local` per the run command
// above; no explicit dotenv import needed.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
const dryRun = process.env.DRY_RUN === 'YES'

if (!url || !secret) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const admin = createClient<Database>(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`Sweep target: ${url}`)
  console.log(`Dry run: ${dryRun ? 'YES (no changes will be applied)' : 'no'}`)
  console.log('')

  const nowIso = new Date().toISOString()

  const { data: rows, error } = await admin
    .from('users')
    .select('id, delete_scheduled_for, delete_initiated_by_admin, delete_reason')
    .lt('delete_scheduled_for', nowIso)
    .is('deleted_at', null)
    .order('delete_scheduled_for', { ascending: true })

  if (error) {
    console.error('Failed to query expired schedules:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('Nothing to finalize. ✨')
    return
  }

  console.log(`Found ${rows.length} expired deletion(s):`)
  for (const r of rows) {
    const initiator = r.delete_initiated_by_admin ? 'admin' : 'self'
    console.log(`  - ${r.id} (initiated by ${initiator}, scheduled ${r.delete_scheduled_for})`)
  }
  console.log('')

  if (dryRun) {
    console.log('Dry run — no changes applied.')
    return
  }

  let succeeded = 0
  let failed = 0
  for (const r of rows) {
    const result = await finalizeAccount({ userId: r.id, actorUserId: null })
    if (result.ok) {
      console.log(`  ✓ finalized ${r.id}`)
      succeeded++
    } else {
      console.error(`  ✗ ${r.id}: ${result.error}`)
      failed++
    }
  }
  console.log('')
  console.log(`Done. Finalized ${succeeded}, failed ${failed}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
