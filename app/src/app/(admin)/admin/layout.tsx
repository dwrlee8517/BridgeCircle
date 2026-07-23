import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { loadSchoolAdminContext } from '@/app/(admin)/admin/_lib/school-admin'
import { Wordmark } from '@/components/ui/wordmark'
import { createAdminEntryRepository } from '@/db/repositories/admin-entry'
import { createAdminModerationRepository } from '@/db/repositories/admin-moderation'
import { AdminRail, type AdminRailCounts } from './admin-rail'

/**
 * Admin takeover shell. Lives in its own route group so the member sidebar
 * and tab bar never render here — entering admin is an explicit mode switch,
 * and "← Back to BridgeCircle" is the only way out. density-pro applies to
 * everything inside (operator surfaces, see tokens.md § Density modes).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { client, membership } = await loadSchoolAdminContext()
  const [pending, openReports] = await Promise.all([
    createAdminEntryRepository(client).listPending({
      organizationId: membership.organization.id,
      limit: 200,
    }),
    createAdminModerationRepository(client).list({
      membershipId: membership.membershipId,
      status: 'open',
      limit: 100,
    }),
  ])
  const counts: AdminRailCounts = {
    approvals: pending.length,
    reports: openReports.ok ? openReports.items.length : 0,
  }

  return (
    <div className="density-pro flex min-h-dvh bg-[var(--surface-canvas)]">
      <aside className="sticky top-0 hidden h-dvh w-[228px] shrink-0 flex-col border-r border-border-subtle bg-card px-3 py-4 md:flex">
        <Link
          href="/"
          className="bc-motion-control flex min-h-9 items-center gap-2 rounded-[var(--radius-box)] px-3 text-xs font-bold text-[var(--action-weak-text)] hover:bg-[var(--action-weak)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Back to BridgeCircle
        </Link>
        <div className="mt-4 mb-5 px-3">
          <p className="truncate text-sm font-bold text-foreground">
            {membership.organization.name}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Admin console</p>
        </div>
        <AdminRail counts={counts} />
        <div className="mt-auto px-3 pb-1">
          <Wordmark className="opacity-60" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Small screens: compact header with the exit + a scrollable strip. */}
        <div className="flex flex-col gap-2 border-b border-border-subtle bg-card px-3 py-2 md:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-box)] pr-2 text-xs font-bold text-[var(--action-weak-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <ArrowLeft aria-hidden className="size-3.5" />
              Back
            </Link>
            <span className="min-w-0 truncate text-sm font-bold">
              {membership.organization.name} · Admin
            </span>
          </div>
          <AdminRail counts={counts} horizontal />
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
