'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createBlockRepository } from '@/db/repositories/blocks'
import { createSettingsRepository } from '@/db/repositories/settings'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { createAccountExportSignedUrl } from '@/lib/settings/export-service'
import { notificationGroup } from '@/lib/settings/notification-groups'

export async function saveNotificationGroupAction(formData: FormData) {
  await requireSession('/settings')
  const group = notificationGroup(String(formData.get('group') ?? ''))
  if (!group) redirect('/settings?error=invalid_group')

  const repository = createSettingsRepository(await createClient())
  const inApp = formData.get('inApp') === 'on'
  const email = formData.get('email') === 'on'
  await Promise.all(
    group.types.map((type) => repository.saveNotificationPreference(type, inApp, email)),
  )
  revalidatePath('/settings')
  redirect('/settings?saved=notifications')
}

export async function saveCommunicationAction(formData: FormData) {
  await requireSession('/settings')
  await createSettingsRepository(await createClient()).saveCommunicationPreferences(
    formData.get('newsletter') === 'on',
  )
  revalidatePath('/settings')
  redirect('/settings?saved=school')
}

export async function changeEmailAction(formData: FormData) {
  await requireSession('/settings')
  const email = z.email().safeParse(formData.get('email'))
  if (!email.success) redirect('/settings?error=invalid_email')
  const client = await createClient()
  const { error } = await client.auth.updateUser({ email: email.data })
  if (error) redirect('/settings?error=email_change')
  redirect('/settings?saved=email')
}

export async function requestExportAction() {
  await requireSession('/settings')
  await createSettingsRepository(await createClient()).requestExport(crypto.randomUUID())
  revalidatePath('/settings')
  redirect('/settings?saved=export')
}

export async function downloadExportAction() {
  await requireSession('/settings')
  const download = await createSettingsRepository(await createClient()).getExportDownload()
  if (!download) redirect('/settings?error=export_unavailable')
  redirect(await createAccountExportSignedUrl(download.bucket, download.path))
}

export async function scheduleDeletionAction() {
  await requireSession('/settings')
  const result = await createSettingsRepository(await createClient()).scheduleDeletion()
  if (result.result_code !== 'scheduled') redirect('/settings?error=deletion')
  redirect('/cancel-delete')
}

export async function unblockMemberAction(formData: FormData) {
  await requireSession('/settings')
  const userId = z.guid().safeParse(formData.get('userId'))
  if (!userId.success) redirect('/settings?error=invalid_member')
  await createBlockRepository(await createClient()).unblock(userId.data)
  revalidatePath('/settings')
  redirect('/settings?saved=unblocked')
}
