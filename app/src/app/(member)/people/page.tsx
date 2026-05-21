import Link from 'next/link'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import type { ExtractedFilters } from '@/lib/search/extractFilters'
import { parseSearchParams } from '@/lib/search/schemas'
import { type SearchHit, searchAlumni } from '@/lib/search/searchAlumni'
import { type NLSearchHit, searchAlumniNL } from '@/lib/search/searchAlumniNL'
import { displayOrgName } from '@/lib/utils'
import { PeopleSearchSurface, ResultGrid, ResultsHeader } from './people-search-surface'
import { ResultCard } from './result-card'

type RawSearchParams = Record<string, string | string[] | undefined>

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const session = await requireSession()
  const supabase = await createClient()
  const params = await searchParams
  const filters = parseSearchParams(params)

  const rawNl = params.nl
  const nlQuery = (Array.isArray(rawNl) ? rawNl[0] : rawNl)?.trim() ?? ''
  const useNL = nlQuery.length > 0

  const { data: viewerMembership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!viewerMembership) {
    return null
  }

  const [{ data: viewerBase }, { data: viewerOrgProfile }, totalAlumniRes, friendsRes] =
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
        .from('friendships')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${session.userId},user_b_id.eq.${session.userId}`),
    ])

  const orgName = displayOrgName((viewerMembership.organizations as { name: string } | null)?.name)
  const totalAlumni = totalAlumniRes.count ?? 0
  const friendIds = new Set(
    (friendsRes.data ?? []).map((f) =>
      f.user_a_id === session.userId ? f.user_b_id : f.user_a_id,
    ),
  )

  let nlHits: NLSearchHit[] = []
  let structuredHits: SearchHit[] = []
  let nlPoolSize = 0
  let nlFallback: 'rerank_failed' | 'no_pool' | null = null
  let nlError: string | null = null
  let nlExtracted: ExtractedFilters | null = null

  if (useNL) {
    const result = await searchAlumniNL(supabase, {
      query: nlQuery,
      organizationId: viewerMembership.organization_id,
      viewerId: session.userId,
      viewerUniversity: viewerBase?.university ?? null,
      viewerMajor: viewerBase?.major ?? null,
      viewerCity: viewerBase?.city ?? null,
      viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
      extraFilters: filters,
    })
    if (result.ok) {
      nlHits = result.hits
      nlPoolSize = result.poolSize
      nlFallback = result.llmFallback
      nlExtracted = result.filters
    } else {
      nlError =
        result.error === 'no_api_key'
          ? 'NL search is not configured. Use the filters below.'
          : `Could not understand the query (${result.detail ?? 'unknown error'}). Use the filters below.`
    }
  } else {
    structuredHits = await searchAlumni(supabase, {
      organizationId: viewerMembership.organization_id,
      viewerId: session.userId,
      viewerUniversity: viewerBase?.university ?? null,
      viewerMajor: viewerBase?.major ?? null,
      viewerCity: viewerBase?.city ?? null,
      viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
      filters,
    })
  }

  const anyFilter = !!(
    filters.q ||
    filters.city ||
    filters.employer ||
    filters.university ||
    filters.major ||
    filters.topic ||
    filters.gradYearMin ||
    filters.gradYearMax ||
    filters.openToMentor ||
    filters.peopleIKnow
  )
  const filtersOpen = anyFilter || (useNL && nlHits.length === 0)
  const resultCount = useNL ? nlHits.length : structuredHits.length

  return (
    <div className="bg-background min-h-full">
      <Hero orgName={orgName} totalAlumni={totalAlumni} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <PeopleSearchSurface
          filtersOpen={filtersOpen}
          defaults={{
            nl: nlQuery,
            q: filters.q ?? '',
            city: filters.city ?? '',
            employer: filters.employer ?? '',
            university: filters.university ?? '',
            major: filters.major ?? '',
            topic: filters.topic ?? '',
            gradYearMin: filters.gradYearMin?.toString() ?? '',
            gradYearMax: filters.gradYearMax?.toString() ?? '',
            openToMentor: !!filters.openToMentor,
            peopleIKnow: !!filters.peopleIKnow,
          }}
        >
          {nlError ? (
            <div className="rounded-[6px] border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">
              {nlError}
            </div>
          ) : null}

          {useNL && nlExtracted ? (
            <NLExtractionSummary
              query={nlQuery}
              extracted={nlExtracted}
              poolSize={nlPoolSize}
              fallback={nlFallback}
              shownCount={nlHits.length}
            />
          ) : null}

          <ResultsHeader resultCount={resultCount} hasFilter={anyFilter || useNL} />

          {useNL ? (
            nlHits.length === 0 ? (
              <EmptyResults
                text={
                  nlPoolSize === 0
                    ? 'No alumni matched the filters extracted from your query. Try removing constraints in the filter panel.'
                    : 'The pool was narrowed but no candidates scored highly. Try a broader query.'
                }
              />
            ) : (
              <ResultGrid>
                {nlHits.map((h) => (
                  <ResultCard
                    key={h.userId}
                    userId={h.userId}
                    name={h.name}
                    preferredName={h.preferredName}
                    headline={h.headline}
                    currentEmployer={h.currentEmployer}
                    currentTitle={h.currentTitle}
                    city={h.city}
                    university={h.university}
                    major={h.major}
                    graduationYear={h.graduationYear}
                    avatarUrl={h.avatarUrl}
                    isOpenAsMentor={h.isOpenAsMentor}
                    isOpenAsAdviceHelper={h.isOpenAsAdviceHelper}
                    mentorPaused={h.mentorPaused}
                    mentoringTopics={h.mentoringTopics}
                    isFriend={friendIds.has(h.userId)}
                    rationale={h.rationale}
                    rerankScore={h.rerankScore}
                    topCareerEntry={pickTopCareerEntry(h.careerHistory)}
                    maxActiveMentees={h.maxActiveMentees}
                    maxPendingRequests={h.maxPendingRequests}
                    activeMenteeCount={h.activeMenteeCount}
                    pendingRequestCount={h.pendingRequestCount}
                  />
                ))}
              </ResultGrid>
            )
          ) : (
            <>
              {structuredHits.length > 0 ? (
                <ResultGrid>
                  {structuredHits.map((h) => (
                    <ResultCard
                      key={h.userId}
                      userId={h.userId}
                      name={h.name}
                      preferredName={h.preferredName}
                      headline={h.headline}
                      currentEmployer={h.currentEmployer}
                      currentTitle={h.currentTitle}
                      city={h.city}
                      university={h.university}
                      major={h.major}
                      graduationYear={h.graduationYear}
                      avatarUrl={h.avatarUrl}
                      isOpenAsMentor={h.isOpenAsMentor}
                      isOpenAsAdviceHelper={h.isOpenAsAdviceHelper}
                      mentorPaused={h.mentorPaused}
                      mentoringTopics={h.mentoringTopics}
                      isFriend={friendIds.has(h.userId)}
                      rationale={null}
                      rerankScore={null}
                      topCareerEntry={null}
                      maxActiveMentees={h.maxActiveMentees}
                      maxPendingRequests={h.maxPendingRequests}
                      activeMenteeCount={h.activeMenteeCount}
                      pendingRequestCount={h.pendingRequestCount}
                    />
                  ))}
                </ResultGrid>
              ) : null}
              {structuredHits.length === 0 && anyFilter ? (
                <EmptyResults
                  text={
                    <>
                      No alumni matched these filters.{' '}
                      <Link href="/people" className="text-primary font-semibold hover:underline">
                        Clear all
                      </Link>{' '}
                      and try again.
                    </>
                  }
                />
              ) : null}
              {structuredHits.length === 0 && !anyFilter ? (
                <EmptyResults text="Type a query above or adjust filters to browse alumni." />
              ) : null}
            </>
          )}
        </PeopleSearchSurface>
      </div>
    </div>
  )
}

function Hero({ orgName, totalAlumni }: { orgName: string; totalAlumni: number }) {
  const description = `Search ${orgName} for someone to ask, learn from, or meet. Describe who you're looking for in plain English, or narrow the circle with filters.`

  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      {/* Background Dots */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(12,12,11,0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      {/* Decorative SVG motifs */}
      <svg
        aria-hidden="true"
        role="presentation"
        viewBox="0 0 200 200"
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[200px] w-[200px] opacity-15 pointer-events-none sm:right-10 md:right-16 lg:right-24"
      >
        <title>Decorative two-circle motif</title>
        <circle cx="80" cy="100" r="60" fill="none" className="stroke-foreground" strokeWidth="1" />
        <circle cx="130" cy="100" r="60" fill="none" className="stroke-primary" strokeWidth="1" />
      </svg>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-14">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
          People · {totalAlumni.toLocaleString()} {totalAlumni === 1 ? 'member' : 'members'}
        </p>
        <h1
          className="bc-fraunces mt-2 text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-[44px]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          Find the right people
        </h1>
        <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground">{description}</p>
      </div>
    </section>
  )
}

function EmptyResults({ text }: { text: React.ReactNode }) {
  return (
    <div className="rounded-[6px] border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
      {text}
    </div>
  )
}

function pickTopCareerEntry(
  history: SearchHit['careerHistory'],
): { employer: string; title: string; dates: string } | null {
  if (!history || history.length === 0) return null
  const e = history[0]
  if (!e) return null
  const dates = [e.start_date, e.end_date ?? 'present'].filter(Boolean).join('–')
  return { employer: e.employer, title: e.title, dates }
}

function NLExtractionSummary({
  query,
  extracted,
  poolSize,
  fallback,
  shownCount,
}: {
  query: string
  extracted: ExtractedFilters
  poolSize: number
  fallback: 'rerank_failed' | 'no_pool' | null
  shownCount: number
}) {
  const chips: Array<{ label: string; value: string }> = []
  if (extracted.mentorOpen === true) chips.push({ label: 'open to mentor', value: 'yes' })
  if (extracted.country) chips.push({ label: 'country', value: extracted.country })
  if (extracted.city) chips.push({ label: 'city', value: extracted.city })
  if (extracted.university) chips.push({ label: 'school', value: extracted.university })
  if (extracted.major) chips.push({ label: 'major', value: extracted.major })
  if (extracted.employer) chips.push({ label: 'employer', value: extracted.employer })
  if (extracted.gradYearMin || extracted.gradYearMax) {
    chips.push({
      label: 'grad year',
      value: `${extracted.gradYearMin ?? '…'}–${extracted.gradYearMax ?? '…'}`,
    })
  }
  if (extracted.theme) chips.push({ label: 'theme', value: extracted.theme })

  return (
    <div className="rounded-[6px] border border-border bg-primary/[0.02] p-4 space-y-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Searching for:</span>
        <span className="font-semibold">&ldquo;{query}&rdquo;</span>
      </div>
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={`${c.label}-${c.value}`}
              className="inline-flex items-center px-2 py-0.5 border border-border/80 bg-card rounded-[4px] font-mono text-[10px] text-foreground"
            >
              <span className="text-muted-foreground font-semibold">{c.label}:</span>
              <span className="ml-1 font-bold">{c.value}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No structured filters extracted — ranking purely on theme.
        </p>
      )}
      <p className="font-mono text-[10px] text-muted-foreground tracking-wide">
        Showing {shownCount} of {poolSize} matched alumni, ranked by Claude.
        {fallback === 'rerank_failed'
          ? ' (Reranker hiccupped — falling back to default order.)'
          : ''}
      </p>
    </div>
  )
}
