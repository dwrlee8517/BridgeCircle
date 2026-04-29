import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/db/server'
import { requireAdmin } from '@/lib/auth/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  const supabase = await createClient()

  // Surface the pending count as a badge on the Approvals link so the admin
  // sees at a glance whether anyone's waiting. RLS-protected: the
  // "admins read all org memberships" policy gates this, and head:true keeps
  // the query cheap.
  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)

  const orgId = roles?.[0]?.organization_id ?? null
  let pendingCount = 0
  if (orgId) {
    const { count } = await supabase
      .from('organization_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'pending')
    pendingCount = count ?? 0
  }

  return (
    <>
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto px-4 py-2 text-sm">
          <span className="shrink-0 font-medium text-muted-foreground">Admin</span>
          <nav className="flex shrink-0 gap-3 whitespace-nowrap">
            <Link href="/admin/invite" className="hover:underline">
              Invite
            </Link>
            <Link
              href="/admin/approvals"
              className="hover:underline inline-flex items-center gap-1"
            >
              Approvals
              {pendingCount > 0 ? (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] leading-4">
                  {pendingCount}
                </Badge>
              ) : null}
            </Link>
            <Link href="/admin/members" className="hover:underline">
              Members
            </Link>
            <Link href="/admin/events" className="hover:underline">
              Events
            </Link>
            <Link href="/admin/announcements" className="hover:underline">
              Announcements
            </Link>
            <Link href="/admin/analytics" className="hover:underline">
              Analytics
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </>
  )
}
