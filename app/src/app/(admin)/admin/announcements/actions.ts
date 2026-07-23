'use server'

import { revalidatePath } from 'next/cache'
import { createSchoolRepository } from '@/db/repositories/school'
import { parseAdminAnnouncementForm } from '@/lib/school/admin-schemas'
import { loadSchoolAdminContext } from '../_lib/school-admin'

export type AnnouncementFormState = {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const parsed = parseAdminAnnouncementForm(formData)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const { client, membership } = await loadSchoolAdminContext()
  const result = await createSchoolRepository(client).publishAdminAnnouncement({
    membershipId: membership.membershipId,
    ...parsed.data,
  })

  if (result !== 'published') {
    return { error: 'Could not save the announcement. Try again.' }
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/school')
  revalidatePath('/school/announcements')
  return { ok: true }
}
