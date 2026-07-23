import { loadSchoolAdminContext } from '@/app/(member)/admin/_lib/school-admin'
import { createAdminEntryRepository } from '@/db/repositories/admin-entry'
import { AdminTabs } from './admin-tabs'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { client, membership } = await loadSchoolAdminContext()
  const pendingCount = (
    await createAdminEntryRepository(client).listPending({
      organizationId: membership.organization.id,
      limit: 200,
    })
  ).length

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
