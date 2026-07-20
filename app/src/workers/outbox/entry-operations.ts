import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import { OutboxJobError } from '@/lib/outbox/contracts'
import { sendInviteEmail } from '@/notify/resend'

const CANONICAL_EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/

const invitePayloadSchema = z.object({
  inviteId: z.guid(),
  organizationId: z.guid(),
  recipientEmail: z.string().max(320).regex(CANONICAL_EMAIL_PATTERN),
  token: z.string().min(32),
})

const exportPayloadSchema = z.object({
  userId: z.guid(),
  exportRequestId: z.guid(),
})

const deletionPayloadSchema = z.object({ userId: z.guid() })
const storageBucketSchema = z.enum(['avatars', 'resumes', 'account-exports'])
const storageCleanupPayloadSchema = z.union([
  z.object({
    userId: z.guid(),
    buckets: z.array(storageBucketSchema).min(1),
    pathPrefix: z.string().min(1),
  }),
  z.object({
    userId: z.guid(),
    bucket: storageBucketSchema,
    paths: z.array(z.string().min(1)).min(1),
  }),
])

export type EntryOperationsWorker = {
  sendInvite(payload: unknown, idempotencyKey: string, signal: AbortSignal): Promise<void>
  generateAccountExport(payload: unknown, signal: AbortSignal): Promise<void>
  failAccountExport(payload: unknown, errorCode: string): Promise<void>
  processAccountDeletion(
    payload: unknown,
    signal: AbortSignal,
  ): Promise<'completed' | 'already_applied' | 'skipped'>
  deleteStorageObjects(
    payload: unknown,
    signal: AbortSignal,
  ): Promise<'completed' | 'already_applied'>
  expireAccountExports(): Promise<number>
}

export function createEntryOperationsWorker(
  client: SupabaseClient<Database>,
  appBaseUrl: string,
): EntryOperationsWorker {
  const origin = new URL(appBaseUrl).origin

  return {
    async sendInvite(payload, idempotencyKey, signal) {
      if (signal.aborted) throw new OutboxJobError('invite_send_aborted', false)
      const parsed = invitePayloadSchema.safeParse(payload)
      if (!parsed.success) throw new OutboxJobError('invalid_invite_payload', true)
      const input = parsed.data
      const [
        { data: organization, error: organizationError },
        { data: invite, error: inviteError },
      ] = await Promise.all([
        client.from('organizations').select('name').eq('id', input.organizationId).maybeSingle(),
        client.from('invites').select('full_name, status').eq('id', input.inviteId).maybeSingle(),
      ])
      if (organizationError || inviteError) throw new OutboxJobError('invite_context_failed', false)
      if (!organization || !invite || invite.status !== 'pending') return

      const sent = await sendInviteEmail({
        to: input.recipientEmail,
        fullName: invite.full_name,
        schoolName: organization.name,
        joinUrl: `${origin}/join?token=${encodeURIComponent(input.token)}`,
        idempotencyKey,
      })
      if (!sent.ok) throw new OutboxJobError('invite_email_failed', false)
    },

    async generateAccountExport(payload, signal) {
      if (signal.aborted) throw new OutboxJobError('account_export_aborted', false)
      const input = exportPayloadSchema.parse(payload)
      const { data: startResult, error: startError } = await client
        .schema('api')
        .rpc('start_account_export', { p_export_request_id: input.exportRequestId })
      if (startError) throw new OutboxJobError('account_export_start_failed', false)
      if (startResult === 'ready') return
      if (startResult !== 'processing') {
        throw new OutboxJobError('account_export_not_available', true)
      }

      const [user, profile, memberships, conversations, notifications, preferences, blocks] =
        await Promise.all([
          client.from('users').select('*').eq('id', input.userId).maybeSingle(),
          client.from('profiles').select('*').eq('user_id', input.userId).maybeSingle(),
          client.from('organization_memberships').select('*').eq('user_id', input.userId),
          client
            .from('conversations')
            .select('*')
            .or(`user_a_id.eq.${input.userId},user_b_id.eq.${input.userId}`),
          client.from('notifications').select('*').eq('recipient_user_id', input.userId),
          client.from('notification_preferences').select('*').eq('user_id', input.userId),
          client.from('member_blocks').select('*').eq('blocker_user_id', input.userId),
        ])
      const failures = [
        user.error,
        profile.error,
        memberships.error,
        conversations.error,
        notifications.error,
        preferences.error,
        blocks.error,
      ]
      if (failures.some(Boolean)) throw new OutboxJobError('account_export_query_failed', false)

      const membershipIds = (memberships.data ?? []).map((row) => row.id)
      const conversationIds = (conversations.data ?? []).map((row) => row.id)
      const [
        organizationProfiles,
        education,
        experiences,
        skills,
        links,
        visibility,
        helperPreferences,
        asks,
        messages,
      ] = await Promise.all([
        membershipIds.length
          ? client
              .from('organization_profiles')
              .select('*')
              .in('organization_membership_id', membershipIds)
          : Promise.resolve({ data: [], error: null }),
        client.from('profile_education').select('*').eq('user_id', input.userId),
        client.from('profile_experiences').select('*').eq('user_id', input.userId),
        client.from('profile_skills').select('*').eq('user_id', input.userId),
        membershipIds.length
          ? client
              .from('profile_contact_links')
              .select('*')
              .in('organization_membership_id', membershipIds)
          : Promise.resolve({ data: [], error: null }),
        membershipIds.length
          ? client
              .from('profile_field_visibility')
              .select('*')
              .in('organization_membership_id', membershipIds)
          : Promise.resolve({ data: [], error: null }),
        membershipIds.length
          ? client
              .from('helper_preferences')
              .select('*')
              .in('organization_membership_id', membershipIds)
          : Promise.resolve({ data: [], error: null }),
        membershipIds.length
          ? client.from('asks').select('*').in('asker_membership_id', membershipIds)
          : Promise.resolve({ data: [], error: null }),
        conversationIds.length
          ? client.from('messages').select('*').in('conversation_id', conversationIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (
        [
          organizationProfiles,
          education,
          experiences,
          skills,
          links,
          visibility,
          helperPreferences,
          asks,
          messages,
        ].some((result) => result.error)
      ) {
        throw new OutboxJobError('account_export_query_failed', false)
      }

      const archive = {
        generatedAt: new Date().toISOString(),
        user: user.data,
        profile: profile.data,
        memberships: memberships.data,
        organizationProfiles: organizationProfiles.data,
        education: education.data,
        experiences: experiences.data,
        skills: skills.data,
        contactLinks: links.data,
        fieldVisibility: visibility.data,
        helperPreferences: helperPreferences.data,
        asks: asks.data,
        conversations: conversations.data,
        messages: messages.data,
        notifications: notifications.data,
        notificationPreferences: preferences.data,
        blocks: blocks.data,
      }
      const bucket = 'account-exports'
      const path = `${input.userId}/${input.exportRequestId}.json`
      const uploaded = await client.storage.from(bucket).upload(path, JSON.stringify(archive), {
        contentType: 'application/json',
        upsert: true,
      })
      if (uploaded.error) throw new OutboxJobError('account_export_upload_failed', false)

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await client.schema('api').rpc('complete_account_export', {
        p_export_request_id: input.exportRequestId,
        p_storage_bucket: bucket,
        p_storage_path: path,
        p_expires_at: expiresAt,
      })
      if (error || data !== 'ready') {
        // Completion is the point at which the artifact becomes discoverable.
        // If that state transition fails, remove the deterministic private
        // object immediately so a retry cannot leave an untracked archive.
        await client.storage.from(bucket).remove([path])
        throw new OutboxJobError('account_export_complete_failed', false)
      }
    },

    async failAccountExport(payload, errorCode) {
      const input = exportPayloadSchema.parse(payload)
      const { data, error } = await client.schema('api').rpc('fail_account_export', {
        p_export_request_id: input.exportRequestId,
        p_error: errorCode,
      })
      if (error || (data !== 'failed' && data !== 'not_available')) {
        throw new OutboxJobError('account_export_failure_state_failed', true)
      }
    },

    async processAccountDeletion(payload, signal) {
      if (signal.aborted) throw new OutboxJobError('account_deletion_aborted', false)
      const input = deletionPayloadSchema.parse(payload)
      const { data, error } = await client
        .schema('api')
        .rpc('process_scheduled_account_deletion', { p_user_id: input.userId })
      if (error) throw new OutboxJobError('account_deletion_finalize_failed', false)
      if (data === 'cancelled' || data === 'not_due' || data === 'not_available') return 'skipped'
      if (data !== 'deleted' && data !== 'already_deleted') {
        throw new OutboxJobError('account_deletion_invalid_result', true)
      }

      const authUser = await client.auth.admin.getUserById(input.userId)
      if (authUser.error) {
        if (isMissingAuthUser(authUser.error)) return 'already_applied'
        throw new OutboxJobError('account_auth_lookup_failed', false)
      }
      if (!authUser.data.user) return 'already_applied'

      const deleted = await client.auth.admin.deleteUser(input.userId, false)
      if (deleted.error && !isMissingAuthUser(deleted.error)) {
        throw new OutboxJobError('account_auth_delete_failed', false)
      }
      return data === 'already_deleted' ? 'already_applied' : 'completed'
    },

    async deleteStorageObjects(payload, signal) {
      if (signal.aborted) throw new OutboxJobError('storage_cleanup_aborted', false)
      const input = storageCleanupPayloadSchema.parse(payload)
      const ownerPrefix = `${input.userId}/`

      if ('paths' in input) {
        const paths = [...new Set(input.paths)]
        if (paths.some((path) => !path.startsWith(ownerPrefix))) {
          throw new OutboxJobError('storage_cleanup_invalid_path', true)
        }
        await removeStoragePaths(client, input.bucket, paths, signal)
        return 'completed'
      }

      if (input.pathPrefix !== ownerPrefix) {
        throw new OutboxJobError('storage_cleanup_invalid_prefix', true)
      }
      let removed = 0
      for (const bucket of [...new Set(input.buckets)]) {
        const paths = await listStoragePaths(client, bucket, input.pathPrefix, signal)
        removed += paths.length
        await removeStoragePaths(client, bucket, paths, signal)
      }
      return removed === 0 ? 'already_applied' : 'completed'
    },

    async expireAccountExports() {
      const { data, error } = await client.schema('api').rpc('expire_account_exports', {
        p_limit: 100,
      })
      if (error) throw new OutboxJobError('account_export_expiry_failed', false)
      return data
    },
  }
}

async function listStoragePaths(
  client: SupabaseClient<Database>,
  bucket: z.infer<typeof storageBucketSchema>,
  prefix: string,
  signal: AbortSignal,
): Promise<string[]> {
  const folder = prefix.replace(/\/+$/, '')
  const paths: string[] = []
  let offset = 0

  while (true) {
    if (signal.aborted) throw new OutboxJobError('storage_cleanup_aborted', false)
    const { data, error } = await client.storage.from(bucket).list(folder, {
      limit: 100,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw new OutboxJobError('storage_cleanup_list_failed', false)
    const entries = data ?? []
    for (const entry of entries) {
      const path = `${folder}/${entry.name}`
      if (entry.id === null) {
        paths.push(...(await listStoragePaths(client, bucket, `${path}/`, signal)))
      } else {
        paths.push(path)
      }
    }
    if (entries.length < 100) break
    offset += entries.length
  }
  return paths
}

async function removeStoragePaths(
  client: SupabaseClient<Database>,
  bucket: z.infer<typeof storageBucketSchema>,
  paths: string[],
  signal: AbortSignal,
) {
  for (let offset = 0; offset < paths.length; offset += 100) {
    if (signal.aborted) throw new OutboxJobError('storage_cleanup_aborted', false)
    const { error } = await client.storage.from(bucket).remove(paths.slice(offset, offset + 100))
    if (error) throw new OutboxJobError('storage_cleanup_remove_failed', false)
  }
}

function isMissingAuthUser(error: { code?: string; status?: number }) {
  return error.status === 404 || error.code === 'user_not_found'
}
