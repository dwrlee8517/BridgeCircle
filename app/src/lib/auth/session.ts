import 'server-only'
import { redirect } from 'next/navigation'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'

export type Session = {
  userId: string
  email: string
}

/**
 * Returns the current user session, or null if not signed in.
 * Use this for routes that render differently based on auth state but don't
 * require it (e.g. the home page).
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user || !data.user.email) return null
  return { userId: data.user.id, email: data.user.email }
}

/**
 * Throws a redirect to /sign-in if not signed in.
 * Use this from server components and server actions that require auth.
 */
export async function requireSession(redirectTo?: string): Promise<Session> {
  const session = await getSession()
  if (session) return session
  const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''
  redirect(`/sign-in${next}`)
}

/**
 * Throws a redirect to / if the signed-in user is not an admin of any org,
 * or specifically not an admin of the given org if orgId is provided.
 */
export async function requireAdmin(orgId?: string): Promise<Session> {
  const session = await requireSession()
  const supabase = await createClient()

  const context = await getMemberContext(supabase)
  const isAdmin = context.memberships.some(
    (membership) =>
      membership.status === 'active' &&
      (!orgId || membership.organization.id === orgId) &&
      membership.roles.some((role) => role === 'super_admin' || role === 'admin'),
  )
  if (!isAdmin) redirect('/')
  return session
}
