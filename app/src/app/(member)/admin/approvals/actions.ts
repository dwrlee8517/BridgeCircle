'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { decideMembership } from '@/lib/admin/decideMembership'
import { requireAdmin } from '@/lib/auth/session'

const decideSchema = z.object({
  membershipId: z.uuid(),
  decision: z.enum(['approve', 'reject']),
})

export type DecideFormState = {
  ok?: boolean
  error?: string
  decidedFor?: string | null
  decision?: 'approve' | 'reject'
}

export async function decideMembershipAction(
  _prev: DecideFormState,
  formData: FormData,
): Promise<DecideFormState> {
  const session = await requireAdmin()

  const parsed = decideSchema.safeParse({
    membershipId: formData.get('membershipId'),
    decision: formData.get('decision'),
  })
  if (!parsed.success) {
    return { error: 'Invalid request.' }
  }

  const result = await decideMembership({
    membershipId: parsed.data.membershipId,
    adminUserId: session.userId,
    decision: parsed.data.decision,
  })

  if (!result.ok) {
    if (result.error === 'membership_not_found') return { error: 'Membership not found.' }
    if (result.error === 'not_pending') return { error: 'This member is no longer pending.' }
    return { error: 'Could not save the decision. Try again.' }
  }

  revalidatePath('/admin/approvals')
  revalidatePath('/admin/members')
  revalidatePath('/admin')
  return {
    ok: true,
    decidedFor: result.userName ?? result.userEmail,
    decision: parsed.data.decision,
  }
}
