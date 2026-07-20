'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createNotificationRepository } from '@/db/repositories/notifications'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/notifications/markRead'
import { notificationTargetUrl } from '@/lib/notifications/types'

const markOneSchema = z.object({ notificationId: z.coerce.number().int().positive() })

export async function markNotificationReadAction(formData: FormData): Promise<{ ok: boolean }> {
  await requireSession()
  const parsed = markOneSchema.safeParse({
    notificationId: formData.get('notificationId'),
  })
  if (!parsed.success) return { ok: false }

  const repository = createNotificationRepository(await createClient())
  const result = await markNotificationRead(repository, parsed.data.notificationId)
  // Refresh both the popover (server-rendered initial list) and the
  // standalone /notifications page.
  revalidatePath('/notifications')
  return { ok: result.ok }
}

export async function markAllNotificationsReadAction(): Promise<{
  ok: boolean
  count?: number
}> {
  await requireSession()
  const repository = createNotificationRepository(await createClient())
  const result = await markAllNotificationsRead(repository)
  revalidatePath('/notifications')
  if (!result.ok) return { ok: false }
  return { ok: true, count: result.count }
}

export async function openNotificationAction(formData: FormData): Promise<void> {
  await requireSession()
  const parsed = markOneSchema.safeParse({ notificationId: formData.get('notificationId') })
  if (!parsed.success) redirect('/notifications')

  const repository = createNotificationRepository(await createClient())
  const row = (await repository.list({ limit: 100 })).find(
    (notification) => notification.id === parsed.data.notificationId,
  )
  if (!row) redirect('/notifications')

  await markNotificationRead(repository, row.id)
  revalidatePath('/notifications')
  redirect(notificationTargetUrl(row) ?? '/notifications')
}

export async function markAllNotificationsReadFromPageAction(): Promise<void> {
  await markAllNotificationsReadAction()
  redirect('/notifications')
}
