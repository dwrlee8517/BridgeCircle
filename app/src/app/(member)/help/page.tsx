import { ArrowRight, HandHelping, Inbox, Settings2, UserCheck } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { getHelperPreference } from '@/lib/asks/preferences'
import { requireSession } from '@/lib/auth/session'
import { FreshnessReviewCard, HelpOpportunityCard } from '../help-network-ui'

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

  // Synthesis P2-7: dropped the upcoming-events count query — it only fed
  // the removed NetworkMotif.
  const [prefs, incomingRes, recentJoinersRes] = await Promise.all([
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

  return (
    <main className="min-h-screen bg-background">
      {/* Synthesis P2-7: removed NetworkMotif. Help is task-mode supply-side
          work; lead with the action, not a repeat of the Home identity moment.
          Synthesis P1-6: demoted hero from text-5xl/6xl to text-3xl/4xl. */}
      <section className="bc-page-band border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-8">
          <div className="space-y-5">
            <p className="bc-section-kicker">
              Help · Offer help where your experience fits
            </p>
            <div className="max-w-2xl space-y-2">
              <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground">
                Your experience can shorten someone else’s path.
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
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
          <div className="self-end rounded-[8px] border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Helper state
            </p>
            <div className="mt-5 grid gap-3">
              <HelpMetric icon={<Inbox className="size-4" />} value={incoming.length} label="Needs reply" />
              <HelpMetric icon={<UserCheck className="size-4" />} value={recentJoiners.length} label="Possible fits" />
              <HelpMetric icon={<Settings2 className="size-4" />} value={isOpen ? 'On' : 'Off'} label="Availability" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="bc-section-kicker mb-3">Priority queue</p>
                <h2 className="font-heading text-2xl font-semibold leading-tight text-foreground">
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
              <div className="bc-action-rail rounded-[8px] border border-primary/10 p-8">
                <p className="font-heading text-2xl font-semibold text-foreground">
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
                <p className="bc-section-kicker mb-3">Likely fit</p>
                <h2 className="font-heading text-2xl font-semibold leading-tight text-foreground">
                  People you could help
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Lightweight prompts based on recent joins and visible profile signals.
                </p>
              </div>
              <div className="grid gap-3">
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
            <div className="bc-action-rail rounded-[8px] border border-primary/10 p-5">
              <p className="font-heading text-lg font-semibold text-foreground">
                How helping works
              </p>
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

function HelpMetric({
  icon,
  value,
  label,
}: {
  icon: ReactNode
  value: number | string
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-[6px] border border-border bg-surface-panel/45 p-3">
      <div className="flex size-8 items-center justify-center rounded-[6px] bg-primary/[0.08] text-primary">
        {icon}
      </div>
      <div>
        <p className="font-heading text-xl font-semibold leading-none text-foreground">{value}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
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
