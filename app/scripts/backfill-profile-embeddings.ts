/**
 * Backfill profile_embedding_chunks for the Voyage hybrid Ask pipeline.
 *
 * Dry run from app/:
 *   NODE_OPTIONS='--conditions react-server' doppler run -- pnpm dlx tsx scripts/backfill-profile-embeddings.ts --dry-run
 *
 * Real run from app/:
 *   BACKFILL_CONFIRM=YES NODE_OPTIONS='--conditions react-server' doppler run -- pnpm dlx tsx scripts/backfill-profile-embeddings.ts
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../src/db/database.types'
import {
  markProfileEmbeddingFailed,
  markProfileEmbeddingReady,
} from '../src/lib/search/matching/indexStatus'
import {
  indexProfileForAskMatching,
  loadActiveIndexableMemberships,
} from '../src/lib/search/matching/profileIndexing'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY
const PROD_PROJECT_REF = process.env.PROD_PROJECT_REF
const DRY_RUN = process.argv.includes('--dry-run')
const JSON_OUTPUT = process.argv.includes('--json')
const ORG_ID = argValue('--org')
const USER_ID = argValue('--user')

function refuse(reason: string): never {
  console.error(`\n[backfill-profile-embeddings] refusing to run: ${reason}\n`)
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  refuse('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env.')
}

if (!DRY_RUN && process.env.BACKFILL_CONFIRM !== 'YES') {
  refuse('BACKFILL_CONFIRM=YES not set. Re-run with --dry-run or BACKFILL_CONFIRM=YES.')
}

if (process.env.NODE_ENV === 'production') {
  refuse('NODE_ENV=production. Run from a controlled job with production env only after verification.')
}

if (PROD_PROJECT_REF && SUPABASE_URL.includes(PROD_PROJECT_REF) && !DRY_RUN) {
  refuse(`SUPABASE_URL appears to be production (matches PROD_PROJECT_REF=${PROD_PROJECT_REF}).`)
}

if (!DRY_RUN && !process.env.VOYAGE_API_KEY) {
  refuse('Missing VOYAGE_API_KEY for real backfill.')
}

const admin: SupabaseClient<Database> = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  log(`[backfill-profile-embeddings] target Supabase URL: ${SUPABASE_URL}`)
  log(`[backfill-profile-embeddings] mode: ${DRY_RUN ? 'dry-run' : 'write'}`)

  const memberships = await loadActiveIndexableMemberships(admin, {
    organizationId: ORG_ID,
    userId: USER_ID,
  })

  const summary = {
    profiles: 0,
    succeeded: 0,
    failed: 0,
    chunks: 0,
    rawChunks: 0,
    syntheticChunks: 0,
    reusedChunks: 0,
    embeddedChunks: 0,
    deletedChunks: 0,
  }

  for (const membership of memberships) {
    summary.profiles += 1
    const result = await indexProfileForAskMatching(
      {
        organizationId: membership.organization_id,
        userId: membership.user_id,
        organizationMembershipId: membership.id,
        reason: 'backfill',
        dryRun: DRY_RUN,
      },
      { admin },
    )

    if (result.ok) {
      summary.succeeded += 1
      summary.chunks += result.chunksTotal
      summary.rawChunks += result.rawChunks
      summary.syntheticChunks += result.syntheticChunks
      summary.reusedChunks += result.reusedChunks
      summary.embeddedChunks += result.embeddedChunks
      summary.deletedChunks += result.deletedChunks

      if (!DRY_RUN) {
        await markProfileEmbeddingReady(
          {
            organizationId: result.organizationId,
            userId: result.userId,
            organizationMembershipId: result.organizationMembershipId,
          },
          { admin },
        )
      }

      log(
        `[${DRY_RUN ? 'dry-run' : 'write'}] ${result.userId}: ${result.chunksTotal} chunks (${result.syntheticChunks} synthetic, ${result.embeddedChunks} embedded, ${result.reusedChunks} reused, ${result.deletedChunks} deleted)`,
      )
    } else {
      summary.failed += 1
      if (!DRY_RUN && result.organizationMembershipId) {
        await markProfileEmbeddingFailed(
          {
            organizationId: result.organizationId,
            userId: result.userId,
            organizationMembershipId: result.organizationMembershipId,
          },
          `${result.error}${result.detail ? `: ${result.detail}` : ''}`,
          { admin },
        )
      }
      log(`[failed] ${result.userId}: ${result.error}${result.detail ? ` ${result.detail}` : ''}`)
    }
  }

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    log(
      `[backfill-profile-embeddings] complete: ${summary.profiles} profiles, ${summary.succeeded} succeeded, ${summary.failed} failed, ${summary.chunks} chunks, ${summary.embeddedChunks} embedded, ${summary.reusedChunks} reused`,
    )
  }
}

function argValue(name: string) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function log(message: string) {
  if (!JSON_OUTPUT) console.log(message)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
