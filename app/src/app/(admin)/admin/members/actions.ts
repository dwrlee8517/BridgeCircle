'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { loadSchoolAdminContext } from '@/app/(admin)/admin/_lib/school-admin'
import { createAdminMembersRepository } from '@/db/repositories/admin-members'
import { changeAdminRole } from '@/lib/admin/members'

const roleChangeInput = z.object({
  targetMembershipId: z.uuid(),
  role: z.enum(['admin', 'event_moderator', 'ambassador']),
  action: z.enum(['grant', 'revoke']),
})

export type RoleChangeActionState = { error: string | null }

export async function changeRoleAction(
  _previous: RoleChangeActionState,
  formData: FormData,
): Promise<RoleChangeActionState> {
  const parsed = roleChangeInput.safeParse({
    targetMembershipId: formData.get('targetMembershipId'),
    role: formData.get('role'),
    action: formData.get('action'),
  })
  if (!parsed.success) return { error: 'That role change didn’t go through. Try once more.' }

  const { client, membership } = await loadSchoolAdminContext()
  const result = await changeAdminRole(createAdminMembersRepository(client), {
    membershipId: membership.membershipId,
    ...parsed.data,
  })

  if (!result.ok) {
    return {
      error:
        result.error === 'forbidden'
          ? 'Only a super admin can change this role.'
          : 'That role change didn’t go through. Try once more.',
    }
  }
  revalidatePath('/admin/members')
  return { error: null }
}
