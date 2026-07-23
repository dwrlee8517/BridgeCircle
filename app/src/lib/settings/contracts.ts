import type { NotificationType } from '@/lib/notifications/types'

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

export type SettingsRepository = {
  listNotificationPreferences(): Promise<NotificationPreference[]>
  saveNotificationPreference(
    type: NotificationType,
    inAppEnabled: boolean,
    emailEnabled: boolean,
  ): Promise<'saved' | 'not_available' | 'invalid_type'>
  getCommunicationPreferences(): Promise<{
    schoolNewsletterEmailEnabled: boolean
    updatedAt: string
  }>
  saveCommunicationPreferences(enabled: boolean): Promise<'saved' | 'not_available'>
  listBlockedMembers(): Promise<BlockedMember[]>
  scheduleDeletion(): Promise<{
    result_code: 'scheduled' | 'not_available'
    delete_scheduled_for: string | null
  }>
  cancelDeletion(): Promise<{
    result_code: 'cancelled' | 'active' | 'too_late' | 'not_available'
    account_state: 'active' | 'deletion_scheduled' | 'deleted' | null
  }>
  requestExport(requestId: string): Promise<AccountExport | null>
  getExport(): Promise<AccountExport | null>
  getExportDownload(): Promise<{ bucket: string; path: string } | null>
}

export type AccountAuthRepository = {
  changeEmail(email: string): Promise<'changed' | 'failed'>
}

export type AccountExportStorage = {
  createSignedUrl(bucket: string, path: string): Promise<string>
}
