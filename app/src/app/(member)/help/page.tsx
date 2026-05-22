import { ArrowRight, HandHelping, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { getHelperPreference } from '@/lib/asks/preferences'
import { requireSession } from '@/lib/auth/session'
import { FreshnessReviewCard, HelpOpportunityCard, NetworkMotif } from '../help-network-ui'

export default async function HelpPage() {
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

  const [prefs, incomingRes, recentJoinersRes, eventCountRes] = await Promise.all([
    getHelperPreference(supabase, session.userId),
    supabase
      .from('asks')
      .select('id, asker_id, ask_type, reason, help_needed, created_at')
      .eq('helper_id', session.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(8),
    supabase
      .from('organization_memberships')
      .select('user_id, joined_at, organization_profiles(graduation_year)')
      .eq('organization_id', membership.organization_id)
      .eq('status', 'active')
      .neq('user_id', session.userId)
      .order('joined_at', { ascending: false })
      .limit(6),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', membership.organization_id)
      .gte('starts_at', new Date().toISOString())
      .not('published_at', 'is', null),
  ])

  const askUserIds = (incomingRes.data ?? []).map((ask) => ask.asker_id)
  const joinerUserIds = (recentJoinersRes.data ?? []).map((member) => member.user_id)
  const userIds = [...new Set([...askUserIds, ...joinerUserIds])]

  const profileMap = new Map<
    string,
    {
      name: string | null
      currentTitle: string | null
      currentEmployer: string | null
      city: string | null
    }
  >()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('base_profiles')
      .select('user_id, name, current_title, current_employer, city')
      .in('user_id', userIds)
    for (const profile of profiles ?? []) {
      profileMap.set(profile.user_id, {
        name: profile.name,
        currentTitle: profile.current_title,
        currentEmployer: profile.current_employer,
        city: profile.city,
      })
    }
  }

  const incoming = incomingRes.data ?? []
  const recentJoiners = recentJoinersRes.data ?? []
  const isOpen = !!(prefs?.openToAdvice || prefs?.openToMentorship)
  const helperCount = (prefs?.openToAdvice ? 1 : 0) + (prefs?.openToMentorship ? 1 : 0)

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Help · Offer help where your experience fits
            </p>
            <div className="max-w-4xl space-y-4">
              <h1 className="font-serif text-5xl font-semibold leading-[0.98] tracking-tight text-foreground sm:text-6xl">
                Your experience can shorten someone else’s path.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Help does not have to mean a formal mentorship. Reply to a quick ask, make a useful
                suggestion, or keep your availability clear so the right people find you.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={isOpen ? 'open' : 'muted'} size="sm" dot>
                {isOpen ? 'Available to help' : 'Not open yet'}
              </StatusBadge>
              {prefs?.openToAdvice ? (
                <StatusBadge tone="info" size="sm">
                  Quick advice
                </StatusBadge>
              ) : null}
              {prefs?.openToMentorship ? (
                <StatusBadge tone="info" size="sm">
                  Mentorship
                </StatusBadge>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-[6px]">
                <Link href="/inbox">
                  <HandHelping className="size-4" />
                  Review requests
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-[6px]">
                <Link href="/mentorship/settings">
                  <Settings2 className="size-4" />
                  Set availability
                </Link>
              </Button>
            </div>
          </div>

          <NetworkMotif
            helperCount={helperCount}
            requestCount={incoming.length}
            eventCount={eventCountRes.count ?? 0}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold leading-tight text-foreground">
                  Needs your reply
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  These are people who already chose you. Start here before browsing.
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="w-fit rounded-[6px]">
                <Link href="/inbox">
                  Open Inbox
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {incoming.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {incoming.map((ask) => {
                  const profile = profileMap.get(ask.asker_id)
                  return (
                    <HelpOpportunityCard
                      key={ask.id}
                      title={`${profile?.name ?? 'Someone'} asked for ${ask.ask_type === 'advice' ? 'advice' : 'mentorship'}`}
                      subtitle={buildProfileSubtitle(profile)}
                      body={
                        ask.reason ?? ask.help_needed ?? 'Review the ask and reply if you can help.'
                      }
                      href={`/ask/${ask.id}`}
                      cta="Review request"
                      tone="ochre"
                    />
                  )
                })}
              </div>
            ) : (
              <div className="rounded-[8px] border border-dashed border-border bg-card p-8">
                <p className="font-serif text-2xl font-semibold text-foreground">
                  No one is waiting on you right now.
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Keep your helper settings current. BridgeCircle will route relevant people to you
                  when your background fits their question.
                </p>
                <Button asChild className="mt-5 rounded-[6px]">
                  <Link href="/mentorship/settings">Update availability</Link>
                </Button>
              </div>
            )}

            <div className="space-y-4 border-t border-border pt-5">
              <div>
                <h2 className="font-serif text-2xl font-semibold leading-tight text-foreground">
                  People you could help
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Lightweight prompts based on recent joins and visible profile signals.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {recentJoiners.slice(0, 3).map((member) => {
                  const profile = profileMap.get(member.user_id)
                  const profileObj = Array.isArray(member.organization_profiles)
                    ? member.organization_profiles[0]
                    : member.organization_profiles
                  return (
                    <HelpOpportunityCard
                      key={member.user_id}
                      title={profile?.name ?? 'New member'}
                      subtitle={
                        profileObj?.graduation_year
                          ? `Class of ${profileObj.graduation_year}`
                          : buildProfileSubtitle(profile)
                      }
                      body={buildHelpFit(profile)}
                      href={`/profile/${member.user_id}`}
                      cta="See where you can help"
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <FreshnessReviewCard />
            <div className="rounded-[8px] border border-border bg-card p-5 shadow-sm">
              <p className="font-serif text-lg font-semibold text-foreground">How helping works</p>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>1. Keep your help topics and availability clear.</p>
                <p>2. BridgeCircle routes relevant asks to you.</p>
                <p>3. Reply when you can, decline when you cannot.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function buildProfileSubtitle(
  profile:
    | { currentTitle: string | null; currentEmployer: string | null; city: string | null }
    | undefined,
) {
  if (!profile) return 'School circle member'
  const role = [profile.currentTitle, profile.currentEmployer].filter(Boolean).join(' at ')
  return role || profile.city || 'School circle member'
}

function buildHelpFit(
  profile:
    | { currentTitle: string | null; currentEmployer: string | null; city: string | null }
    | undefined,
) {
  if (!profile) return 'A quick welcome or useful pointer can make the network feel alive.'
  const role = [profile.currentTitle, profile.currentEmployer].filter(Boolean).join(' at ')
  if (role)
    return `${role}. Your experience may help them understand a path, company, or next step.`
  if (profile.city)
    return `They are connected to ${profile.city}. Local context is often the easiest help to give.`
  return 'A quick welcome or useful pointer can make the network feel alive.'
}
