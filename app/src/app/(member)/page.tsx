import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getHomeFeed } from '@/lib/home/getHomeFeed'
import { displayOrgName } from '@/lib/utils'
import DashboardClient from './dashboard-client'

/**
 * Member home dashboard server router.
 * Fetches all necessary organizational, membership, profile, and feed telemetry
 * on the server, then delegates rendering and layout configuration to the
 * client-side DashboardClient component.
 */
export default async function HomePage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const orgName = (membership.organizations as { name: string } | null)?.name ?? 'your network'
  const orgDisplayName = displayOrgName(orgName)

  const [{ data: viewerBase }, { data: viewerOrgProfile }, { data: viewerHelperPrefs }] =
    await Promise.all([
      supabase
        .from('base_profiles')
        .select('name, city')
        .eq('user_id', session.userId)
        .maybeSingle(),
      supabase
        .from('organization_profiles')
        .select('graduation_year')
        .eq('organization_membership_id', membership.id)
        .maybeSingle(),
      supabase
        .from('helper_preferences')
        .select('open_to_advice, open_to_mentorship')
        .eq('organization_membership_id', membership.id)
        .maybeSingle(),
    ])

  const firstName = viewerBase?.name?.split(' ')[0] ?? 'there'
  const cohortYear = viewerOrgProfile?.graduation_year ?? null
  const isHelper = !!(viewerHelperPrefs?.open_to_advice || viewerHelperPrefs?.open_to_mentorship)

  const feed = await getHomeFeed(supabase, membership.organization_id, session.userId)

  return (
    // density-cozy: list-of-cards member surface. See
    // docs/experience/ui/design-system/tokens.md § Density modes.
    <div className="density-cozy min-h-screen bg-background">
      {/* Low-profile announcements strip at the very top */}
      {feed.latestAnnouncement ? (
        <AnnouncementBanner announcement={feed.latestAnnouncement} />
      ) : null}

      <DashboardClient
        feed={feed}
        firstName={firstName}
        cohortYear={cohortYear}
        orgDisplayName={orgDisplayName}
        viewerCity={viewerBase?.city ?? null}
        isHelper={isHelper}
      />
    </div>
  )
}

function AnnouncementBanner({
  announcement,
}: {
  announcement: { id: string; title: string; body: string | null; publishedAt: string }
}) {
  return (
    <Link
      href="/announcements"
      className="block border-b border-border bg-primary/[0.03] transition hover:bg-primary/[0.06]"
    >
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-8 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Megaphone className="size-3.5 text-primary shrink-0" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-primary shrink-0">
            Announcement
          </span>
          <span className="text-muted-foreground shrink-0 hidden sm:inline">·</span>
          <span className="font-medium text-foreground truncate">{announcement.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground font-medium">
          <span>
            {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
          </span>
          <ArrowRight className="size-3 text-muted-foreground" />
        </div>
      </div>
    </Link>
  )
}
