import 'server-only'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { readMembershipPreference } from './membership-cookie'

export async function loadMemberContext() {
  const client = await createClient()
  const preferredMembershipId = await readMembershipPreference()
  return {
    client,
    context: await getMemberContext(client, preferredMembershipId),
  }
}
