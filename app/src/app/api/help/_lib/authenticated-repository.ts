import { createHelpRepository } from '@/db/repositories/help'
import { createClient } from '@/db/server'

export async function authenticatedHelpRepository() {
  const client = await createClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return null
  return createHelpRepository(client)
}
