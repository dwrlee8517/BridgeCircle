import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import { isNotificationType, type NotificationType } from '@/lib/notifications/types'

const notificationPreferenceSchema = z.object({
  notification_type: z.string(),
  in_app_enabled: z.boolean(),
  email_enabled: z.boolean(),
  updated_at: z.string(),
})

const savedNotificationPreferenceSchema = notificationPreferenceSchema.extend({
  result_code: z.enum(['saved', 'not_available', 'invalid_type']),
  notification_type: z.string().nullable(),
  in_app_enabled: z.boolean().nullable(),
  email_enabled: z.boolean().nullable(),
  updated_at: z.string().nullable(),
})

const communicationPreferenceSchema = z.object({
  school_newsletter_email_enabled: z.boolean(),
  updated_at: z.string(),
})

const blockedMemberSchema = z.object({
  blocked_user_id: z.guid(),
  display_name: z.string(),
  avatar_path: z.string().nullable(),
  blocked_at: z.string(),
})

const deletionScheduleSchema = z.object({
  result_code: z.enum(['scheduled', 'not_available']),
  delete_scheduled_for: z.string().nullable(),
})

const deletionCancelSchema = z.object({
  result_code: z.enum(['cancelled', 'active', 'too_late', 'not_available']),
  account_state: z.enum(['active', 'deletion_scheduled', 'deleted']).nullable(),
})

const exportSchema = z.object({
  export_request_id: z.guid().nullable(),
  status: z.enum(['queued', 'processing', 'ready', 'failed', 'expired']).nullable(),
  created_at: z.string().nullable(),
  completed_at: z.string().nullable().optional(),
  expires_at: z.string().nullable(),
  result_code: z.enum(['queued', 'current', 'not_available']).optional(),
})

const exportDownloadSchema = z.object({ storage_bucket: z.string(), storage_path: z.string() })

export type NotificationPreference = {
  type: NotificationType
  inAppEnabled: boolean
  emailEnabled: boolean
  updatedAt: string
}

export type BlockedMember = {
  userId: string
  displayName: string
  avatarPath: string | null
  blockedAt: string
}

export type AccountExport = {
  id: string
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'expired'
  createdAt: string
  completedAt: string | null
  expiresAt: string | null
}

function parseExport(row: unknown): AccountExport | null {
  const parsed = exportSchema.parse(row)
  if (!parsed.export_request_id || !parsed.status || !parsed.created_at) return null
  return {
    id: parsed.export_request_id,
    status: parsed.status,
    createdAt: parsed.created_at,
    completedAt: parsed.completed_at ?? null,
    expiresAt: parsed.expires_at,
  }
}

export function createSettingsRepository(client: SupabaseClient<Database>) {
  return {
    async listNotificationPreferences(): Promise<NotificationPreference[]> {
      const { data, error } = await client.schema('api').rpc('get_my_notification_preferences')
      if (error) throw new Error(`getNotificationPreferences: ${error.message}`)
      return (data ?? []).flatMap((row) => {
        const parsed = notificationPreferenceSchema.parse(row)
        if (!isNotificationType(parsed.notification_type)) return []
        return [
          {
            type: parsed.notification_type,
            inAppEnabled: parsed.in_app_enabled,
            emailEnabled: parsed.email_enabled,
            updatedAt: parsed.updated_at,
          },
        ]
      })
    },

    async saveNotificationPreference(
      type: NotificationType,
      inAppEnabled: boolean,
      emailEnabled: boolean,
    ): Promise<'saved' | 'not_available' | 'invalid_type'> {
      const { data, error } = await client
        .schema('api')
        .rpc('save_my_notification_preference', {
          p_notification_type: type,
          p_in_app_enabled: inAppEnabled,
          p_email_enabled: emailEnabled,
        })
        .single()
      if (error) throw new Error(`saveNotificationPreference: ${error.message}`)
      return savedNotificationPreferenceSchema.parse(data).result_code
    },

    async getCommunicationPreferences() {
      const { data, error } = await client
        .schema('api')
        .rpc('get_my_communication_preferences')
        .single()
      if (error) throw new Error(`getCommunicationPreferences: ${error.message}`)
      const parsed = communicationPreferenceSchema.parse(data)
      return {
        schoolNewsletterEmailEnabled: parsed.school_newsletter_email_enabled,
        updatedAt: parsed.updated_at,
      }
    },

    async saveCommunicationPreferences(schoolNewsletterEmailEnabled: boolean) {
      const { data, error } = await client
        .schema('api')
        .rpc('save_my_communication_preferences', {
          p_school_newsletter_email_enabled: schoolNewsletterEmailEnabled,
        })
        .single()
      if (error) throw new Error(`saveCommunicationPreferences: ${error.message}`)
      const parsed = z
        .object({
          result_code: z.enum(['saved', 'not_available']),
          school_newsletter_email_enabled: z.boolean().nullable(),
          updated_at: z.string().nullable(),
        })
        .parse(data)
      return parsed.result_code
    },

    async listBlockedMembers(): Promise<BlockedMember[]> {
      const { data, error } = await client.schema('api').rpc('list_my_blocked_members')
      if (error) throw new Error(`listBlockedMembers: ${error.message}`)
      return (data ?? []).map((row) => {
        const parsed = blockedMemberSchema.parse(row)
        return {
          userId: parsed.blocked_user_id,
          displayName: parsed.display_name,
          avatarPath: parsed.avatar_path,
          blockedAt: parsed.blocked_at,
        }
      })
    },

    async scheduleDeletion() {
      const { data, error } = await client
        .schema('api')
        .rpc('schedule_my_account_deletion')
        .single()
      if (error) throw new Error(`scheduleAccountDeletion: ${error.message}`)
      return deletionScheduleSchema.parse(data)
    },

    async cancelDeletion() {
      const { data, error } = await client.schema('api').rpc('cancel_my_account_deletion').single()
      if (error) throw new Error(`cancelAccountDeletion: ${error.message}`)
      return deletionCancelSchema.parse(data)
    },

    async requestExport(requestId: string): Promise<AccountExport | null> {
      const { data, error } = await client
        .schema('api')
        .rpc('request_my_account_export', { p_request_id: requestId })
        .single()
      if (error) throw new Error(`requestAccountExport: ${error.message}`)
      return parseExport(data)
    },

    async getExport(): Promise<AccountExport | null> {
      const { data, error } = await client.schema('api').rpc('get_my_account_export')
      if (error) throw new Error(`getAccountExport: ${error.message}`)
      return data?.[0] ? parseExport(data[0]) : null
    },

    async getExportDownload(): Promise<{ bucket: string; path: string } | null> {
      const { data, error } = await client.schema('api').rpc('get_my_account_export_download')
      if (error) throw new Error(`getAccountExportDownload: ${error.message}`)
      if (!data?.[0]) return null
      const parsed = exportDownloadSchema.parse(data[0])
      return { bucket: parsed.storage_bucket, path: parsed.storage_path }
    },
  }
}
