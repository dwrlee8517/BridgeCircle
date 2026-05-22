import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { getDashboardMetrics } from '@/lib/analytics/getDashboardMetrics'
import type { MetricCard } from '@/lib/analytics/types'
import { requireAdmin } from '@/lib/auth/session'
import { displayOrgName } from '@/lib/utils'

/**
 * Admin analytics dashboard. Six aggregate cards covering signup conversion,
 * activity, mentorship engagement, profile freshness, and event RSVPs.
 *
 * Server-rendered on each request — no caching layer, queries are cheap
 * enough that a fresh read on each page load is fine. Sparklines, drilldown,
 * and date-range filtering are tracked as follow-ups (see Day 18 mockup).
 */
export default async function AdminAnalyticsPage() {
  const session = await requireAdmin()
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)

  const adminOrg = roles?.[0]
  if (!adminOrg) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-muted-foreground">No admin organization.</p>
      </div>
    )
  }

  const orgName = displayOrgName(
    (adminOrg.organizations as { name: string } | null)?.name ?? 'your organization',
  )

  let metrics: Awaited<ReturnType<typeof getDashboardMetrics>> | null = null
  let loadError: string | null = null
  try {
    metrics = await getDashboardMetrics(adminOrg.organization_id)
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unknown error'
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          A snapshot of community health for {orgName}. Most metrics cover the last 30 days.
        </p>
      </div>

      {loadError ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-destructive">Couldn&apos;t load analytics.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The query failed. Refresh to retry. If this persists, check Sentry.
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">{loadError}</p>
          </CardContent>
        </Card>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.cards.map((card) => (
              <MetricCardView key={card.key} card={card} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Computed {format(new Date(metrics.computedAt), 'PPpp')}. Refresh to recompute.
          </p>
        </>
      ) : null}
    </div>
  )
}

function MetricCardView({ card }: { card: MetricCard }) {
  const subClass =
    card.tone === 'up'
      ? 'text-accent-sage'
      : card.tone === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground'
  return (
    <Card title={card.tooltip}>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
        <p className="mt-1 text-3xl font-semibold leading-none">{card.value}</p>
        <p className={`mt-1 text-xs ${subClass}`}>{card.sub}</p>
        <p className="mt-3 border-t border-dashed pt-2 text-[11px] text-muted-foreground">
          {card.footnote}
        </p>
      </CardContent>
    </Card>
  )
}
