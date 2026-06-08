/**
 * Process dirty Ask profile embedding index rows.
 *
 * Dry run from app/:
 *   NODE_OPTIONS='--conditions react-server' doppler run -- pnpm dlx tsx scripts/process-profile-embedding-index.ts --dry-run
 *
 * Process a batch from app/:
 *   NODE_OPTIONS='--conditions react-server' doppler run -- pnpm dlx tsx scripts/process-profile-embedding-index.ts --limit=25
 *
 * Process one user from app/:
 *   NODE_OPTIONS='--conditions react-server' doppler run -- pnpm dlx tsx scripts/process-profile-embedding-index.ts --user=<user_id>
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../src/db/database.types'
import {
  claimDirtyProfiles,
  listPendingProfileEmbeddingRows,
  markProfileEmbeddingFailed,
  markProfileEmbeddingReady,
  type ProfileEmbeddingIndexStatusRow,
} from '../src/lib/search/matching/indexStatus'
import {
  indexProfileForAskMatching,
  loadActiveIndexableMemberships,
} from '../src/lib/search/matching/profileIndexing'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY
const DRY_RUN = process.argv.includes('--dry-run')
const RETRY_FAILED = process.argv.includes('--retry-failed')
const JSON_OUTPUT = process.argv.includes('--json')
const LIMIT = Number.parseInt(argValue('--limit') ?? '25', 10)
const ORG_ID = argValue('--org')
const USER_ID = argValue('--user')
const WORKER_ID = argValue('--worker-id') ?? `profile-index:${process.pid}:${Date.now()}`

function refuse(reason: string): never {
  console.error(`\n[process-profile-embedding-index] refusing to run: ${reason}\n`)
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  refuse('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env.')
}

if (!DRY_RUN && !process.env.VOYAGE_API_KEY) {
  refuse('Missing VOYAGE_API_KEY for indexing.')
}

const admin: SupabaseClient<Database> = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const rows = USER_ID ? await directUserRows() : await queueRows()
  const summary = {
    candidates: rows.length,
    succeeded: 0,
    failed: 0,
    chunks: 0,
    embeddedChunks: 0,
    reusedChunks: 0,
    deletedChunks: 0,
    dryRun: DRY_RUN,
  }

  for (const row of rows) {
    const result = await indexProfileForAskMatching(
      {
        organizationId: row.organization_id,
        userId: row.user_id,
        organizationMembershipId: row.organization_membership_id,
        reason: row.dirty_reason ?? 'worker',
        dryRun: DRY_RUN,
      },
      { admin },
    )

    if (result.ok) {
      summary.succeeded += 1
      summary.chunks += result.chunksTotal
      summary.embeddedChunks += result.embeddedChunks
      summary.reusedChunks += result.reusedChunks
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
        `[ready] ${result.userId}: ${result.chunksTotal} chunks (${result.embeddedChunks} embedded, ${result.reusedChunks} reused, ${result.deletedChunks} deleted)`,
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
      `[process-profile-embedding-index] complete: ${summary.candidates} candidates, ${summary.succeeded} succeeded, ${summary.failed} failed`,
    )
  }
}

async function queueRows() {
  const input = {
    limit: safeLimit(),
    organizationId: ORG_ID,
    retryFailed: RETRY_FAILED,
    workerId: WORKER_ID,
  }
  return DRY_RUN
    ? listPendingProfileEmbeddingRows(input, { admin })
    : claimDirtyProfiles(input, { admin })
}

async function directUserRows(): Promise<ProfileEmbeddingIndexStatusRow[]> {
  const memberships = await loadActiveIndexableMemberships(admin, {
    organizationId: ORG_ID,
    userId: USER_ID,
    limit: 10,
  })
  return memberships.map((membership) => ({
    organization_id: membership.organization_id,
    user_id: membership.user_id,
    organization_membership_id: membership.id,
    status: 'dirty',
    dirty_reason: 'direct-user',
    dirty_since: new Date().toISOString(),
    last_indexed_at: null,
    last_success_at: null,
    last_error: null,
    attempt_count: 0,
    locked_at: null,
    locked_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}

function safeLimit() {
  return Number.isFinite(LIMIT) ? Math.max(1, Math.min(LIMIT, 100)) : 25
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
