import type { AccountAuthRepository, AccountExportStorage, SettingsRepository } from './contracts'
import { notificationGroup } from './notification-groups'

export async function saveNotificationGroup(
  input: { groupId: string; inApp: boolean; email: boolean },
  repository: Pick<SettingsRepository, 'saveNotificationPreference'>,
) {
  const group = notificationGroup(input.groupId)
  if (!group) return 'invalid_group' as const
  const results = await Promise.all(
    group.types.map((type) =>
      repository.saveNotificationPreference(type, input.inApp, input.email),
    ),
  )
  return results.every((result) => result === 'saved') ? 'saved' : 'failed'
}

export function saveCommunicationPreference(
  newsletterEnabled: boolean,
  repository: Pick<SettingsRepository, 'saveCommunicationPreferences'>,
) {
  return repository.saveCommunicationPreferences(newsletterEnabled)
}

export function changeAccountEmail(email: string, repository: AccountAuthRepository) {
  return repository.changeEmail(email)
}

export function requestAccountExport(
  repository: Pick<SettingsRepository, 'requestExport'>,
  makeId: () => string,
) {
  return repository.requestExport(makeId())
}

export async function createAccountExportDownload(
  repository: Pick<SettingsRepository, 'getExportDownload'>,
  storage: AccountExportStorage,
) {
  const download = await repository.getExportDownload()
  if (!download) return null
  return storage.createSignedUrl(download.bucket, download.path)
}

export function scheduleAccountDeletion(repository: Pick<SettingsRepository, 'scheduleDeletion'>) {
  return repository.scheduleDeletion()
}
