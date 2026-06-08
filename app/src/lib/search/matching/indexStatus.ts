import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'

export type ProfileEmbeddingIndexState = 'dirty' | 'indexing' | 'ready' | 'failed'

export type ProfileEmbeddingIndexStatusRow =
  Database['public']['Tables']['profile_embedding_index_status']['Row']

export type ProfileEmbeddingDirtyInput = {
  userId: string
  organizationId?: string
  organizationMembershipId?: string
  reason: string
}

export type ProfileEmbeddingStatusTarget = {
  organizationId: string
  userId: string
  organizationMembershipId: string
}

export type ClaimDirtyProfilesInput = {
  limit?: number
  organizationId?: string
  retryFailed?: boolean
  workerId?: string
  staleLockMs?: number
}

export type IndexStatusOptions = {
  admin?: SupabaseClient<Database>
}

const DEFAULT_LIMIT = 25
const DEFAULT_STALE_LOCK_MS = 15 * 60 * 1000
const MAX_ERROR_LENGTH = 500

export async function markProfileEmbeddingDirty(
  input: ProfileEmbeddingDirtyInput,
  options: IndexStatusOptions = {},
): Promise<void> {
  try {
    const admin = options.admin ?? createAdminClient()
    const membership = await resolveActiveMembership(admin, input)
    if (!membership) {
      console.info('[ask-matching] profile embedding dirty mark skipped: no active membership', {
        userId: input.userId,
        reason: input.reason,
      })
      return
    }

    const now = new Date().toISOString()
    const { error } = await admin.from('profile_embedding_index_status').upsert(
      {
        organization_id: membership.organization_id,
        user_id: membership.user_id,
        organization_membership_id: membership.id,
        status: 'dirty',
        dirty_reason: input.reason,
        dirty_since: now,
        last_error: null,
        locked_at: null,
        locked_by: null,
        updated_at: now,
      },
      { onConflict: 'organization_id,user_id,organization_membership_id' },
    )
    if (error) throw error
  } catch (err) {
    console.warn('[ask-matching] profile embedding dirty mark failed', {
      userId: input.userId,
      reason: input.reason,
      error: sanitizeIndexError(err),
    })
  }
}

export async function markProfileEmbeddingReady(
  target: ProfileEmbeddingStatusTarget,
  options: IndexStatusOptions = {},
) {
  const admin = options.admin ?? createAdminClient()
  const now = new Date().toISOString()
  const { error } = await admin.from('profile_embedding_index_status').upsert(
    {
      organization_id: target.organizationId,
      user_id: target.userId,
      organization_membership_id: target.organizationMembershipId,
      status: 'ready',
      dirty_reason: null,
      dirty_since: null,
      last_indexed_at: now,
      last_success_at: now,
      last_error: null,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    },
    { onConflict: 'organization_id,user_id,organization_membership_id' },
  )

  if (error) throw new Error(`mark profile embedding ready: ${error.message}`)
}

export async function markProfileEmbeddingFailed(
  target: ProfileEmbeddingStatusTarget,
  errorDetail: unknown,
  options: IndexStatusOptions = {},
) {
  const admin = options.admin ?? createAdminClient()
  const now = new Date().toISOString()
  const { error } = await admin.from('profile_embedding_index_status').upsert(
    {
      organization_id: target.organizationId,
      user_id: target.userId,
      organization_membership_id: target.organizationMembershipId,
      status: 'failed',
      dirty_since: now,
      last_indexed_at: now,
      last_error: sanitizeIndexError(errorDetail),
      locked_at: null,
      locked_by: null,
      updated_at: now,
    },
    { onConflict: 'organization_id,user_id,organization_membership_id' },
  )

  if (error) throw new Error(`mark profile embedding failed: ${error.message}`)
}

export async function claimDirtyProfiles(
  input: ClaimDirtyProfilesInput = {},
  options: IndexStatusOptions = {},
): Promise<ProfileEmbeddingIndexStatusRow[]> {
  const admin = options.admin ?? createAdminClient()
  const workerId = input.workerId ?? defaultWorkerId()
  const eligible = await listPendingProfileEmbeddingRows(input, options)

  const claimed: ProfileEmbeddingIndexStatusRow[] = []
  for (const row of eligible) {
    const now = new Date().toISOString()
    const { data: updated, error: updateError } = await admin
      .from('profile_embedding_index_status')
      .update({
        status: 'indexing',
        locked_at: now,
        locked_by: workerId,
        attempt_count: row.attempt_count + 1,
        updated_at: now,
      })
      .eq('organization_id', row.organization_id)
      .eq('user_id', row.user_id)
      .eq('organization_membership_id', row.organization_membership_id)
      .select('*')
      .maybeSingle()

    if (updateError) throw new Error(`claim profile embedding row: ${updateError.message}`)
    if (updated) claimed.push(updated)
  }

  return claimed
}

export async function listPendingProfileEmbeddingRows(
  input: ClaimDirtyProfilesInput = {},
  options: IndexStatusOptions = {},
): Promise<ProfileEmbeddingIndexStatusRow[]> {
  const admin = options.admin ?? createAdminClient()
  const limit = Math.max(1, Math.min(input.limit ?? DEFAULT_LIMIT, 100))
  const staleCutoff = new Date(
    Date.now() - (input.staleLockMs ?? DEFAULT_STALE_LOCK_MS),
  ).toISOString()
  const statuses: ProfileEmbeddingIndexState[] = input.retryFailed
    ? ['dirty', 'failed', 'indexing']
    : ['dirty', 'indexing']

  let query = admin
    .from('profile_embedding_index_status')
    .select('*')
    .in('status', statuses)
    .order('dirty_since', { ascending: true, nullsFirst: false })
    .limit(limit * 3)

  if (input.organizationId) {
    query = query.eq('organization_id', input.organizationId)
  }

  const { data, error } = await query
  if (error) throw new Error(`list profile embedding rows: ${error.message}`)

  return (data ?? [])
    .filter((row) => isClaimable(row, staleCutoff, !!input.retryFailed))
    .slice(0, limit)
}

export function sanitizeIndexError(errorDetail: unknown): string {
  const text =
    errorDetail instanceof Error
      ? errorDetail.message
      : typeof errorDetail === 'string'
        ? errorDetail
        : JSON.stringify(errorDetail)
  return text.replace(/\s+/g, ' ').slice(0, MAX_ERROR_LENGTH)
}

async function resolveActiveMembership(
  admin: SupabaseClient<Database>,
  input: ProfileEmbeddingDirtyInput,
) {
  let query = admin
    .from('organization_memberships')
    .select('id, user_id, organization_id, status')
    .eq('user_id', input.userId)
    .eq('status', 'active')
    .limit(1)

  if (input.organizationMembershipId) {
    query = query.eq('id', input.organizationMembershipId)
  }
  if (input.organizationId) {
    query = query.eq('organization_id', input.organizationId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

function isClaimable(
  row: ProfileEmbeddingIndexStatusRow,
  staleCutoff: string,
  retryFailed: boolean,
) {
  const staleLocked = !!row.locked_at && row.locked_at < staleCutoff
  const unlocked = !row.locked_at
  if (row.status === 'indexing') return staleLocked
  if (row.status === 'failed') return retryFailed && (unlocked || staleLocked)
  return row.status === 'dirty' && (unlocked || staleLocked)
}

function defaultWorkerId() {
  return `profile-embedding-index:${process.pid}:${Date.now()}`
}
