'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAccountAuthRepository } from '@/db/repositories/account-auth'
import { createAccountExportStorage } from '@/db/repositories/account-export-storage'
import { createBlockRepository } from '@/db/repositories/blocks'
import { createSettingsRepository } from '@/db/repositories/settings'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { unblockMember } from '@/lib/safety/operations'
import {
  changeAccountEmail,
  createAccountExportDownload,
  requestAccountExport,
  saveCommunicationPreference,
  saveNotificationGroup,
  scheduleAccountDeletion,
} from '@/lib/settings/operations'

const notificationGroupFormSchema = z.object({
  groupId: z.string().trim().min(1),
  inApp: z.preprocess((value) => value === 'on', z.boolean()),
  email: z.preprocess((value) => value === 'on', z.boolean()),
})

const communicationFormSchema = z.object({
  newsletterEnabled: z.preprocess((value) => value === 'on', z.boolean()),
})

export async function saveNotificationGroupAction(formData: FormData) {
  await requireSession('/settings')
  const parsed = notificationGroupFormSchema.safeParse({
    groupId: formData.get('group'),
    inApp: formData.get('inApp'),
    email: formData.get('email'),
  })
  if (!parsed.success) redirect('/settings?error=invalid_group')

  const repository = createSettingsRepository(await createClient())
  const result = await saveNotificationGroup(parsed.data, repository)
  if (result === 'invalid_group') redirect('/settings?error=invalid_group')
  if (result !== 'saved') {
    redirect('/settings?error=notifications')
  }
  revalidatePath('/settings')
  redirect('/settings?saved=notifications')
}

export async function saveCommunicationAction(formData: FormData) {
  await requireSession('/settings')
  const parsed = communicationFormSchema.safeParse({
    newsletterEnabled: formData.get('newsletter'),
  })
  if (!parsed.success) redirect('/settings?error=communication')
  const result = await saveCommunicationPreference(
    parsed.data.newsletterEnabled,
    createSettingsRepository(await createClient()),
  )
  if (result !== 'saved') redirect('/settings?error=communication')
  revalidatePath('/settings')
  redirect('/settings?saved=school')
}

export async function changeEmailAction(formData: FormData) {
  await requireSession('/settings')
  const email = z.email().safeParse(formData.get('email'))
  if (!email.success) redirect('/settings?error=invalid_email')
  const result = await changeAccountEmail(
    email.data,
    createAccountAuthRepository(await createClient()),
  )
  if (result !== 'changed') redirect('/settings?error=email_change')
  redirect('/settings?saved=email')
}

export async function requestExportAction() {
  await requireSession('/settings')
  const accountExport = await requestAccountExport(
    createSettingsRepository(await createClient()),
    crypto.randomUUID,
  )
  if (!accountExport) redirect('/settings?error=export_request')
  revalidatePath('/settings')
  redirect('/settings?saved=export')
}

export async function downloadExportAction() {
  await requireSession('/settings')
  const client = await createClient()
  const download = await createAccountExportDownload(
    createSettingsRepository(client),
    createAccountExportStorage(client),
  )
  if (!download) redirect('/settings?error=export_unavailable')
  redirect(download)
}

export async function scheduleDeletionAction() {
  await requireSession('/settings')
  const result = await scheduleAccountDeletion(createSettingsRepository(await createClient()))
  if (result.result_code !== 'scheduled') redirect('/settings?error=deletion')
  redirect('/cancel-delete')
}

export async function unblockMemberAction(formData: FormData) {
  await requireSession('/settings')
  const userId = z.guid().safeParse(formData.get('userId'))
  if (!userId.success) redirect('/settings?error=invalid_member')
  const result = await unblockMember(userId.data, createBlockRepository(await createClient()))
  if (result !== 'unblocked') redirect('/settings?error=invalid_member')
  revalidatePath('/settings')
  redirect('/settings?saved=unblocked')
}
