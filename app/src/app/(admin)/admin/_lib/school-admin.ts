import 'server-only'

import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { selectedMembership } from '@/lib/membership/selection'

export async function loadSchoolAdminContext() {
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  const isAdmin = membership?.roles.some((role) => role === 'super_admin' || role === 'admin')

  if (!membership || membership.status !== 'active' || !isAdmin) redirect('/')

  return { client, membership }
}
