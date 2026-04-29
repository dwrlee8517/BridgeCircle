'use server'

import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/db/server'
import { createAnnouncement } from '@/lib/announcements/createAnnouncement'
import { parseAnnouncementCreateForm } from '@/lib/announcements/schemas'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireAdmin } from '@/lib/auth/session'

export type AnnouncementFormState = {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
  emailsSent?: number
  emailsAttempted?: number
}

export async function createAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const session = await requireAdmin()

  const parsed = parseAnnouncementCreateForm(formData)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const supabase = await createClient()
  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)
  const orgId = roles?.[0]?.organization_id
  if (!orgId) return { error: 'No admin role found.' }

  const origin = await getAppOrigin()
  const result = await createAnnouncement({
    organizationId: orgId,
    createdBy: session.userId,
    appOrigin: origin,
    title: parsed.data.title,
    body: parsed.data.body,
    sendEmail: parsed.data.sendEmail,
  })

  if (!result.ok) {
    Sentry.captureMessage('createAnnouncement failed', {
      level: 'error',
      extra: { detail: result.detail },
    })
    return { error: 'Could not save the announcement. Try again.' }
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/announcements')
  return {
    ok: true,
    emailsSent: result.emailsSent,
    emailsAttempted: result.emailsAttempted,
  }
}
