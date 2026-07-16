import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import { OutboxJobError } from '@/lib/outbox/contracts'
import { sendInviteEmail } from '@/notify/resend'

const invitePayloadSchema = z.object({
  inviteId: z.guid(),
  organizationId: z.guid(),
  recipientEmail: z.email(),
  token: z.string().min(32),
})

const exportPayloadSchema = z.object({
  userId: z.guid(),
  exportRequestId: z.guid(),
})

export type EntryOperationsWorker = {
  sendInvite(payload: unknown, idempotencyKey: string, signal: AbortSignal): Promise<void>
  generateAccountExport(payload: unknown, signal: AbortSignal): Promise<void>
}

export function createEntryOperationsWorker(
  client: SupabaseClient<Database>,
  appBaseUrl: string,
): EntryOperationsWorker {
  const origin = new URL(appBaseUrl).origin

  return {
    async sendInvite(payload, idempotencyKey, signal) {
      if (signal.aborted) throw new OutboxJobError('invite_send_aborted', false)
      const input = invitePayloadSchema.parse(payload)
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
      if (error || data !== 'ready')
        throw new OutboxJobError('account_export_complete_failed', false)
    },
  }
}
