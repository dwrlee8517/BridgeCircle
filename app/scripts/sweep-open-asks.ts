/**
 * Nightly ask-lifecycle sweep: standing asks + direct-ask expiry.
 *
 * Run from app/ (the react-server condition is required because the lib
 * modules import 'server-only'):
 *   pnpm dlx tsx --conditions react-server --env-file=.env.local scripts/sweep-open-asks.ts
 *
 * Or with a dry-run preview first:
 *   DRY_RUN=YES pnpm dlx tsx --conditions react-server --env-file=.env.local scripts/sweep-open-asks.ts
 *
 * What it does:
 *   - Closes every open_asks row past its expires_at and notifies the asker
 *     gently (open_ask_expired).
 *   - Re-runs each remaining open ask through the same NL matcher as the
 *     live /ask page; records new strong fits in open_ask_matches and
 *     notifies the asker with a count (open_ask_match). The asker meets the
 *     helper by re-running the ask on /ask — identities never travel
 *     through notifications or client-readable rows.
 *   - Expires direct asks that sat pending past the 14-day window
 *     (ask_expired, quiet) — this is what keeps the asker-side "it closes
 *     on its own" timeline step honest.
 *
 * When to run:
 *   - Nightly. At pilot scale this approximates event-driven matching:
 *     joins, opt-ins, unpauses, and enrichment updates land within a day.
 *   - Production setup later: convert to a Railway worker or pg_cron, same
 *     as the other sweeps.
 *
 * Cost note: each open ask spends one extraction + one rerank call
 * (~$0.005). With the one-open-ask-per-member cap this stays negligible.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/db/database.types'
import { sweepExpirePendingAsks } from '../src/lib/asks/askLifecycle'
import { sweepOpenAsks } from '../src/lib/asks/openAskSweep'

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

  const result = await sweepOpenAsks(admin, { dryRun })

  console.log(`Open asks scanned:   ${result.scanned}`)
  console.log(`Expired:             ${result.expired}`)
  console.log(`New strong matches:  ${result.newMatches}`)
  console.log(`Askers notified:     ${result.askersNotified}`)

  const directResult = await sweepExpirePendingAsks(admin, { dryRun })
  console.log('')
  console.log(`Stale direct asks:   ${directResult.scanned}`)
  console.log(`Expired quietly:     ${directResult.expired}`)

  const errors = [...result.errors, ...directResult.errors]
  if (errors.length > 0) {
    console.error('')
    console.error('Errors:')
    for (const message of errors) console.error(`  - ${message}`)
    process.exit(1)
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
