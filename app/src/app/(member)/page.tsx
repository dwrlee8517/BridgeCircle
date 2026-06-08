import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getHomeFeed } from '@/lib/home/getHomeFeed'
import { displayName, displayOrgName } from '@/lib/utils'
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
    .select(
      'id, organization_id, organizations!organization_memberships_organization_id_fkey(name)',
    )
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

  const viewerName = displayName(viewerBase?.name, null, 'there')
  const firstName = viewerName.split(' ')[0] ?? 'there'
  const cohortYear = viewerOrgProfile?.graduation_year ?? null
  const isHelper = !!(viewerHelperPrefs?.open_to_advice || viewerHelperPrefs?.open_to_mentorship)

  const feed = await getHomeFeed(supabase, membership.organization_id, session.userId)

  return (
    // density-cozy: list-of-cards member surface. See
    // docs/experience/ui/design-system/tokens.md § Density modes.
    <div className="density-cozy min-h-screen bg-background">
      <DashboardClient
        feed={feed}
        firstName={firstName}
        viewerName={viewerName}
        cohortYear={cohortYear}
        orgDisplayName={orgDisplayName}
        viewerCity={viewerBase?.city ?? null}
        isHelper={isHelper}
      />
    </div>
  )
}
