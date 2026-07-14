'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { setMembershipPreference } from '@/app/_lib/membership-cookie'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { memberDestination, selectedMembership } from '@/lib/membership/selection'

export async function chooseCircleAction(formData: FormData): Promise<void> {
  await requireSession('/select-circle')
  const membershipId = z.guid().safeParse(formData.get('membershipId'))
  if (!membershipId.success) redirect('/select-circle?error=invalid')

  const client = await createClient()
  const context = await getMemberContext(client, membershipId.data)
  const membership = selectedMembership(context)
  if (!membership || membership.membershipId !== membershipId.data) {
    redirect('/select-circle?error=unavailable')
  }

  await setMembershipPreference(membership.membershipId)
  switch (memberDestination(context)) {
    case 'onboarding':
    case 'pending-approval':
      return redirect('/onboarding')
    case 'cancel-delete':
      return redirect('/cancel-delete')
    case 'member-shell':
      return redirect('/')
    default:
      return redirect('/select-circle?error=unavailable')
  }
}
