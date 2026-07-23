'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createMembershipDecisionRepository } from '@/db/repositories/memberships'
import { createClient } from '@/db/server'
import { decideMembership } from '@/lib/admin/decideMembership'
import { requireAdmin } from '@/lib/auth/session'

const decideSchema = z.object({
  membershipId: z.uuid(),
  decision: z.enum(['approve', 'reject']),
  reasonCode: z.enum(['could_not_verify', 'not_eligible', 'duplicate_request', 'other']).nullable(),
  privateNote: z.string().nullable(),
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
  await requireAdmin()

  const parsed = decideSchema.safeParse({
    membershipId: formData.get('membershipId'),
    decision: formData.get('decision'),
    reasonCode: formData.get('reasonCode') || null,
    privateNote: formData.get('privateNote') || null,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid request.' }
  }

  const result = await decideMembership(
    createMembershipDecisionRepository(await createClient()),
    parsed.data,
  )

  if (!result.ok) {
    if (result.error === 'not_available') {
      return { error: 'This membership is no longer available to you.' }
    }
    if (result.error === 'not_found') return { error: 'Membership not found.' }
    if (result.error === 'not_pending') return { error: 'This member is no longer pending.' }
    if (result.error === 'not_authorized')
      return { error: 'You no longer have access to decide this membership.' }
    if (result.error === 'invalid_reason') {
      return {
        error: 'Choose a rejection reason and keep the private note under 4,000 characters.',
      }
    }
    return { error: 'Could not save the decision. Try again.' }
  }

  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
  return {
    ok: true,
    decidedFor: null,
    decision: parsed.data.decision,
  }
}
