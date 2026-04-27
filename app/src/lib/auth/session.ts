import 'server-only'
import { redirect } from 'next/navigation'
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

  const query = supabase
    .from('admin_role_assignments')
    .select('organization_id, role')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])

  if (orgId) query.eq('organization_id', orgId)

  const { data, error } = await query.limit(1)
  if (error || !data || data.length === 0) {
    redirect('/')
  }
  return session
}
