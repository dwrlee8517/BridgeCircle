import { requireAdmin } from '@/lib/auth/session'

/**
 * Admin gate. Redirects non-admins to /. The (member) layout above already
 * ran requireSession + profile-complete, so we just need the role check here.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <>{children}</>
}
