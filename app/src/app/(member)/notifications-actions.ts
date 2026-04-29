'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSession } from '@/lib/auth/session'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/notifications/markRead'

const markOneSchema = z.object({ notificationId: z.guid() })

export async function markNotificationReadAction(formData: FormData): Promise<{ ok: boolean }> {
  const session = await requireSession()
  const parsed = markOneSchema.safeParse({
    notificationId: formData.get('notificationId'),
  })
  if (!parsed.success) return { ok: false }

  const result = await markNotificationRead(parsed.data.notificationId, session.userId)
  // Refresh both the popover (server-rendered initial list) and the
  // standalone /notifications page.
  revalidatePath('/notifications')
  return { ok: result.ok }
}

export async function markAllNotificationsReadAction(): Promise<{
  ok: boolean
  count?: number
}> {
  const session = await requireSession()
  const result = await markAllNotificationsRead(session.userId)
  revalidatePath('/notifications')
  if (!result.ok) return { ok: false }
  return { ok: true, count: result.count }
}
