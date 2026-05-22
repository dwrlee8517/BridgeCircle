import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import type { SearchFilters } from '@/lib/search/schemas'
import { type SearchHit, searchAlumni } from '@/lib/search/searchAlumni'
import { type NLSearchHit, searchAlumniNL } from '@/lib/search/searchAlumniNL'
import { displayOrgName } from '@/lib/utils'
import {
  AskBar,
  FreshnessReviewCard,
  MatchBriefCard,
  NetworkMotif,
  PromptChips,
  type HelpNetworkPerson,
} from '../help-network-ui'

type SearchParams = { q?: string }

const PROMPTS = [
  'I want to understand product careers after consulting',
  'I need advice on US college applications',
  'I am moving to Seoul and want local alumni advice',
  'I need a resume or portfolio review',
  'I want to find an ongoing mentor in finance',
  'I want to talk with someone who studied design',
]

const EMPTY_FILTERS: SearchFilters = {
  q: undefined,
  city: undefined,
  employer: undefined,
  university: undefined,
  major: undefined,
  topic: undefined,
  gradYearMin: undefined,
  gradYearMax: undefined,
  openToMentor: undefined,
  peopleIKnow: undefined,
}

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const supabase = await createClient()

  const { data: viewerMembership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!viewerMembership) return null

  const [{ data: viewerBase }, { data: viewerOrgProfile }, totalAlumniRes, pendingHelpRes, eventRes] =
    await Promise.all([
      supabase
        .from('base_profiles')
        .select('university, major, city')
        .eq('user_id', session.userId)
        .maybeSingle(),
      supabase
        .from('organization_profiles')
        .select('graduation_year')
        .eq('organization_membership_id', viewerMembership.id)
        .maybeSingle(),
      supabase
        .from('organization_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', viewerMembership.organization_id)
        .eq('status', 'active'),
      supabase
        .from('asks')
        .select('id', { count: 'exact', head: true })
        .eq('helper_id', session.userId)
        .eq('status', 'pending'),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', viewerMembership.organization_id)
        .gte('starts_at', new Date().toISOString())
        .not('published_at', 'is', null),
    ])

  const orgName = displayOrgName((viewerMembership.organizations as { name: string } | null)?.name)
  const totalAlumni = totalAlumniRes.count ?? 0
  const pendingHelpCount = pendingHelpRes.count ?? 0
  const eventCount = eventRes.count ?? 0

  let hits: Array<{ person: HelpNetworkPerson; reason: string | null }> = []
  let status: string | null = null

  if (query) {
    const result = await searchAlumniNL(supabase, {
      query,
      organizationId: viewerMembership.organization_id,
      viewerId: session.userId,
      viewerUniversity: viewerBase?.university ?? null,
      viewerMajor: viewerBase?.major ?? null,
      viewerCity: viewerBase?.city ?? null,
      viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
      extraFilters: EMPTY_FILTERS,
    })

    if (result.ok) {
      hits = result.hits.map((hit) => ({
        person: toPerson(hit),
        reason: hit.rationale ?? hit.reason,
      }))
      if (result.llmFallback === 'rerank_failed') {
        status = 'The matcher fell back to structured ranking, so results may be less precise.'
      } else if (result.poolSize === 0) {
        status = 'No strong matches yet. Try broadening the question or exploring People.'
      }
    } else {
      status =
        result.error === 'no_api_key'
          ? 'Natural-language matching is not configured in this environment. Showing open helpers instead.'
          : 'The matcher could not read that question. Showing open helpers instead.'
      const fallback = await openHelperFallback(supabase, viewerMembership.organization_id, session.userId, viewerBase, viewerOrgProfile)
      hits = fallback.map((hit) => ({ person: toPerson(hit), reason: hit.reason }))
    }
  } else {
    const fallback = await openHelperFallback(
      supabase,
      viewerMembership.organization_id,
      session.userId,
      viewerBase,
      viewerOrgProfile,
    )
    hits = fallback.map((hit) => ({ person: toPerson(hit), reason: hit.reason }))
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-12">
          <div className="space-y-7">
            <div className="space-y-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Ask · {orgName}
              </p>
              <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[0.98] tracking-tight text-foreground sm:text-6xl">
                Find someone who has been there.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Describe the decision, industry, city, school, or career path you are trying to
                understand. BridgeCircle will turn it into a few meaningful people to ask.
              </p>
            </div>
            <div className="space-y-4">
              <AskBar defaultValue={query} />
              <PromptChips prompts={PROMPTS} />
            </div>
          </div>
          <NetworkMotif
            helperCount={totalAlumni}
            requestCount={pendingHelpCount}
            eventCount={eventCount}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold leading-tight text-foreground">
              {query ? 'Best matches for your question' : 'Start with open helpers'}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {query
                ? `Searching for: “${query}”`
                : 'Use the prompt above for more precise matching, or start with people already open to helping.'}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-fit rounded-[6px]">
            <Link href="/people">
              Explore People
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {status ? (
          <div className="mb-5 rounded-[8px] border border-border bg-warning-tint px-4 py-3 text-sm text-foreground">
            {status}
          </div>
        ) : null}

        {hits.length > 0 ? (
          <div className="space-y-4">
            {hits.map(({ person, reason }) => (
              <MatchBriefCard key={person.userId} person={person} query={query} reason={reason} />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-dashed border-border bg-card p-10 text-center">
            <Search className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
              No matches surfaced yet.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Try a broader question, or explore People while the network gets seeded with more
              helper profiles.
            </p>
            <Button asChild className="mt-5 rounded-[6px]">
              <Link href="/people">Open People</Link>
            </Button>
          </div>
        )}

        <div className="mt-10 max-w-xl">
          <FreshnessReviewCard />
        </div>
      </section>
    </main>
  )
}

async function openHelperFallback(
  supabase: Parameters<typeof searchAlumni>[0],
  organizationId: string,
  viewerId: string,
  viewerBase: { university: string | null; major: string | null; city: string | null } | null,
  viewerOrgProfile: { graduation_year: number | null } | null,
) {
  return searchAlumni(supabase, {
    organizationId,
    viewerId,
    viewerUniversity: viewerBase?.university ?? null,
    viewerMajor: viewerBase?.major ?? null,
    viewerCity: viewerBase?.city ?? null,
    viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
    filters: { ...EMPTY_FILTERS, openToMentor: true },
    limit: 8,
  })
}

function toPerson(hit: SearchHit | NLSearchHit): HelpNetworkPerson {
  return {
    userId: hit.userId,
    name: hit.name,
    preferredName: hit.preferredName,
    avatarUrl: hit.avatarUrl,
    graduationYear: hit.graduationYear,
    currentTitle: hit.currentTitle,
    currentEmployer: hit.currentEmployer,
    city: hit.city,
    university: hit.university,
    major: hit.major,
    isOpenAsMentor: hit.isOpenAsMentor,
    isOpenAsAdviceHelper: hit.isOpenAsAdviceHelper,
    mentorPaused: hit.mentorPaused,
    mentoringTopics: hit.mentoringTopics,
    rationale: 'rationale' in hit ? hit.rationale : hit.reason,
    matchScore: 'rerankScore' in hit ? hit.rerankScore : null,
  }
}
