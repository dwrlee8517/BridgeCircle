'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createNotificationRepository } from '@/db/repositories/notifications'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/notifications/markRead'

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
