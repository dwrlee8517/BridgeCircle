import { CircleHelp, Lock } from 'lucide-react'
import Link from 'next/link'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { countOpenAskMatches, getOpenAskForUser } from '@/lib/asks/openAsks'
import {
  type AskStarterStats,
  getAskStarterStats,
  SOCIAL_PROOF_MIN_HELPERS,
} from '@/lib/asks/starterStats'
import { requireSession } from '@/lib/auth/session'
import { getHomeFeed, type HomeFeed } from '@/lib/home/getHomeFeed'
import { classYearShort, displayName, displayOrgName, preferredAskType } from '@/lib/utils'
import { OpenAskRow } from './ask/open-ask-ui'
import { AskBar } from './ask-bar'
import { type CarouselHelper, HelperCarousel } from './helper-carousel'
import { HomeAnnouncementStrip, YourAsksRail } from './home-ui'

const STARTER_ASKS = [
  'How do I move from agency design into an in-house product team?',
  'Is a gap year before med school a mistake?',
  'What does day-to-day work actually look like in venture capital?',
]

const CAROUSEL_LIMIT = 5

/**
 * The merged home + ask surface. Home IS the ask entry moment — one front
 * door instead of two near-identical ones (the pre-merge / and /ask starter
 * duplicated the bar and split the trust scaffolding from where members
 * actually land). Rendered at /, at /ask without a query, and behind the
 * composer sheet via ask/default.tsx. The ask bar submits to /ask?nl=…,
 * which stays the results URL.
 */
export async function AskHome({ defaultValue = '' }: { defaultValue?: string }) {
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

  let admin = null
  try {
    admin = createAdminClient()
  } catch {
    // No service key in this environment — skip the admin-only aggregates.
  }

  let feed: HomeFeed | null = null
  let stats: AskStarterStats | null = null
  let firstName: string | null = null
  let cohortLabel: string | null = null
  let orgDisplay: string | null = null

  if (membership) {
    const [{ data: viewerBase }, { data: viewerOrgProfile }, feedResult, statsResult] =
      await Promise.all([
        supabase
          .from('base_profiles')
          .select('name, preferred_name')
          .eq('user_id', session.userId)
          .maybeSingle(),
        supabase
          .from('organization_profiles')
          .select('graduation_year')
          .eq('organization_membership_id', membership.id)
          .maybeSingle(),
        getHomeFeed(supabase, membership.organization_id, session.userId),
        // Admin stays null here on purpose: the answered-asks aggregate isn't
        // rendered on this surface, so don't spend the query.
        getAskStarterStats(supabase, null, { organizationId: membership.organization_id }),
      ])

    feed = feedResult
    stats = statsResult
    const viewerDisplay = displayName(viewerBase?.name, viewerBase?.preferred_name ?? null, '')
    firstName = viewerDisplay.split(/\s+/)[0] || null
    const year = classYearShort(viewerOrgProfile?.graduation_year ?? null)
    cohortLabel = year ? `Class of ${year}` : null
    const orgName = (membership.organizations as { name: string } | null)?.name ?? null
    orgDisplay = orgName ? displayOrgName(orgName) : null
  }

  const openAsk = await getOpenAskForUser(supabase, { userId: session.userId })
  const openAskMatchCount =
    openAsk && admin ? await countOpenAskMatches(admin, { openAskId: openAsk.id }) : 0

  const kicker = [cohortLabel, orgDisplay].filter(Boolean).join(' · ') || 'Ask'
  const heading = firstName
    ? `Hi ${firstName} — what are you trying to figure out?`
    : 'What are you trying to figure out?'

  const helperCount = stats?.helperCount ?? 0
  const carouselHelpers: CarouselHelper[] = (feed?.openMentors ?? [])
    .slice(0, CAROUSEL_LIMIT)
    .map(toCarouselHelper)
  const recentAsks = feed?.myRecentAsks ?? []

  return (
    <div className="density-cozy min-h-full bg-background">
      {feed ? (
        <HomeAnnouncementStrip
          announcement={feed.latestAnnouncement}
          event={feed.upcomingEvents[0] ?? null}
        />
      ) : null}

      <section className="relative overflow-hidden bg-surface-editorial text-surface-editorial-foreground">
        <svg
          aria-hidden="true"
          viewBox="0 0 520 380"
          className="absolute -top-28 -right-20 h-[300px] w-[415px] opacity-20"
        >
          <title>Decorative two-circle motif</title>
          <circle cx="200" cy="190" r="140" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle
            cx="320"
            cy="190"
            r="140"
            fill="none"
            stroke="var(--primary-on-dark)"
            strokeWidth="1.5"
          />
        </svg>
        <div className="relative mx-auto max-w-5xl px-4 pt-8 pb-14 sm:px-8 lg:pt-10">
          <p className="flex items-center gap-2 text-kicker font-bold uppercase tracking-kicker text-primary-on-dark">
            <span aria-hidden className="h-0.5 w-7 rounded-full bg-primary-on-dark" />
            {kicker}
          </p>
          <h1 className="mt-3 max-w-2xl font-heading text-display-md font-semibold leading-[1.12]">
            {heading}
          </h1>
          <p className="mt-2.5 max-w-2xl text-body-lg leading-[1.55] text-surface-editorial-muted">
            Describe the situation in your own words, or offer help where your experience matters.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-5xl px-4 sm:px-8">
        <AskBar
          defaultValue={defaultValue}
          autoFocus={Boolean(defaultValue)}
          hint={
            <span className="flex items-center gap-1.5">
              <Lock aria-hidden className="size-3 shrink-0" />
              Plain words work best. Nothing is sent yet — you&rsquo;ll choose who sees this later.
            </span>
          }
        />
      </section>

      {openAsk ? <OpenAskRow openAsk={openAsk} matchCount={openAskMatchCount} /> : null}

      {recentAsks.length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pt-7 sm:px-8">
          <YourAsksRail asks={recentAsks} />
        </section>
      ) : null}

      <section className="mx-auto max-w-5xl px-4 py-7 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <p className="bc-card-label">Not sure how to put it?</p>
            <div className="mt-3 space-y-2.5">
              {STARTER_ASKS.map((ask) => (
                <StarterAsk key={ask} href={`/ask?nl=${encodeURIComponent(ask)}`}>
                  {ask}
                </StarterAsk>
              ))}
            </div>
          </div>

          <div>
            <p className="bc-card-label">People who can help you</p>
            <div className="mt-3">
              <HelperCarousel
                helpers={carouselHelpers}
                openCount={helperCount}
                showOpenCount={helperCount >= SOCIAL_PROOF_MIN_HELPERS}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl border-border border-t px-4 py-8 sm:px-8">
        <p className="bc-card-label">How asking works</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <HowItWorksStep
            number="01"
            title="Describe the situation"
            body="Only members who chose to be askable will ever see it."
          />
          <HowItWorksStep
            number="02"
            title="See who fits, and why"
            body="Every name comes with a reason. No mystery scores."
          />
          <HowItWorksStep
            number="03"
            title="Send a short note"
            body="We help with the draft. If the timing's wrong, they can pass quietly — no awkwardness on either side."
          />
        </div>
      </section>
    </div>
  )
}

function toCarouselHelper(member: HomeFeed['openMentors'][number]): CarouselHelper {
  const name = displayName(member.name, null)
  const role = [member.currentTitle, member.currentEmployer].filter(Boolean).join(' at ')
  return {
    userId: member.userId,
    name,
    yearShort: classYearShort(member.graduationYear),
    role: [role || null, member.city].filter(Boolean).join(' · ') || null,
    reason: buildHelperReason(role, member.university),
    avatarUrl: member.avatarUrl,
    askType: preferredAskType({ isOpenAsAdviceHelper: true, isOpenAsMentor: true }),
  }
}

function buildHelperReason(role: string, university: string | null) {
  if (role) return `Their path as ${role} could be useful context.`
  if (university) return 'They share school context and are open to helping.'
  return 'They are part of your trusted school circle.'
}

function StarterAsk({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-md border border-border bg-card p-3.5 shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-primary/30 hover:shadow-card-hover"
    >
      <CircleHelp aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="text-sm font-medium leading-snug text-foreground group-hover:text-primary">
        {children}
      </span>
    </Link>
  )
}

function HowItWorksStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="border-border border-t pt-3">
      <p className="font-mono text-xs text-primary">{number}</p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}
