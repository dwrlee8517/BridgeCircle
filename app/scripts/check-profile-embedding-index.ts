/**
 * Check Ask profile embedding index coverage and queue health.
 *
 * Run from app/:
 *   NODE_OPTIONS='--conditions react-server' doppler run -- pnpm dlx tsx scripts/check-profile-embedding-index.ts
 *   NODE_OPTIONS='--conditions react-server' doppler run -- pnpm dlx tsx scripts/check-profile-embedding-index.ts --json
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../src/db/database.types'
import {
  RAW_CHUNK_PROMPT_VERSION,
  SYNTHETIC_CHUNK_PROMPT_VERSION,
  VOYAGE_EMBEDDING_DIMENSIONS,
  VOYAGE_EMBEDDING_MODEL,
} from '../src/lib/search/matching/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY
const JSON_OUTPUT = process.argv.includes('--json')
const ORG_ID = argValue('--org')

function refuse(reason: string): never {
  console.error(`\n[check-profile-embedding-index] refusing to run: ${reason}\n`)
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  refuse('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env.')
}

const admin: SupabaseClient<Database> = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const [memberships, chunks, statuses] = await Promise.all([
    loadActiveMemberships(),
    loadChunks(),
    loadStatuses(),
  ])

  const activeUserIds = new Set(memberships.map((m) => m.user_id))
  const indexedUserIds = new Set(chunks.map((c) => c.user_id))
  const missing = memberships.filter((m) => !indexedUserIds.has(m.user_id))
  const staleModelChunks = chunks.filter(
    (chunk) =>
      chunk.embedding_model !== VOYAGE_EMBEDDING_MODEL ||
      chunk.embedding_dim !== VOYAGE_EMBEDDING_DIMENSIONS,
  )
  const stalePromptChunks = chunks.filter((chunk) => {
    const expected =
      chunk.chunk_kind === 'raw' ? RAW_CHUNK_PROMPT_VERSION : SYNTHETIC_CHUNK_PROMPT_VERSION
    return chunk.synthetic_prompt_version !== expected
  })

  const summary = {
    activeMembers: memberships.length,
    indexedUsers: [...indexedUserIds].filter((id) => activeUserIds.has(id)).length,
    activeMembersMissingChunks: missing.length,
    chunks: chunks.length,
    rawChunks: chunks.filter((chunk) => chunk.chunk_kind === 'raw').length,
    syntheticChunks: chunks.filter((chunk) => chunk.chunk_kind === 'synthetic').length,
    friendsChunks: chunks.filter((chunk) => chunk.visibility_tier === 'friends').length,
    statusCounts: countBy(statuses, (row) => row.status),
    staleModelChunks: staleModelChunks.length,
    stalePromptChunks: stalePromptChunks.length,
    missingUsers: missing.map((m) => ({
      userId: m.user_id,
      organizationId: m.organization_id,
      organizationMembershipId: m.id,
    })),
    failures: statuses
      .filter((row) => row.status === 'failed')
      .map((row) => ({
        userId: row.user_id,
        organizationId: row.organization_id,
        organizationMembershipId: row.organization_membership_id,
        attemptCount: row.attempt_count,
        lastError: row.last_error,
      })),
  }

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  console.log('[check-profile-embedding-index]')
  console.log(`active members: ${summary.activeMembers}`)
  console.log(`indexed users: ${summary.indexedUsers}`)
  console.log(`active members missing chunks: ${summary.activeMembersMissingChunks}`)
  console.log(`chunks: ${summary.chunks}`)
  console.log(`raw chunks: ${summary.rawChunks}`)
  console.log(`synthetic chunks: ${summary.syntheticChunks}`)
  console.log(`friends chunks: ${summary.friendsChunks}`)
  console.log(`status counts: ${JSON.stringify(summary.statusCounts)}`)
  console.log(`stale model chunks: ${summary.staleModelChunks}`)
  console.log(`stale prompt chunks: ${summary.stalePromptChunks}`)
  if (summary.failures.length > 0) {
    console.log(`failed profiles: ${summary.failures.length}`)
  }
}

async function loadActiveMemberships() {
  let query = admin
    .from('organization_memberships')
    .select('id, user_id, organization_id')
    .eq('status', 'active')
    .limit(10000)
  if (ORG_ID) query = query.eq('organization_id', ORG_ID)
  const { data, error } = await query
  if (error) throw new Error(`memberships: ${error.message}`)
  return data ?? []
}

async function loadChunks() {
  let query = admin
    .from('profile_embedding_chunks')
    .select(
      'organization_id, user_id, organization_membership_id, chunk_kind, visibility_tier, embedding_model, embedding_dim, synthetic_prompt_version',
    )
    .limit(50000)
  if (ORG_ID) query = query.eq('organization_id', ORG_ID)
  const { data, error } = await query
  if (error) throw new Error(`profile_embedding_chunks: ${error.message}`)
  return data ?? []
}

async function loadStatuses() {
  let query = admin
    .from('profile_embedding_index_status')
    .select(
      'organization_id, user_id, organization_membership_id, status, attempt_count, last_error',
    )
    .limit(50000)
  if (ORG_ID) query = query.eq('organization_id', ORG_ID)
  const { data, error } = await query
  if (error) throw new Error(`profile_embedding_index_status: ${error.message}`)
  return data ?? []
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const key = keyFn(item)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function argValue(name: string) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
