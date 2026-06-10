import { createClient } from '@/db/server'
import { requireAdmin } from '@/lib/auth/session'
import { AdminTabs } from './admin-tabs'

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
    // density-pro: operator surfaces — admin tables, analytics, ambassador dash.
    // CTA buttons (variant="cta") auto-revert to primary blue in this scope.
    // See docs/experience/ui/design-system/tokens.md § Density modes.
    <div className="density-pro">
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto px-4 py-2 text-sm">
          {/* Section label, styled so it can't be mistaken for the active tab. */}
          <span className="shrink-0 text-xs font-semibold uppercase tracking-label text-muted-foreground">
            Admin
          </span>
          <AdminTabs pendingCount={pendingCount} />
        </div>
      </div>
      {children}
    </div>
  )
}
