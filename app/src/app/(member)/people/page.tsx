import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { parseSearchParams } from '@/lib/search/schemas'
import { type SearchHit, searchAlumni } from '@/lib/search/searchAlumni'
import { type NLSearchHit, searchAlumniNL } from '@/lib/search/searchAlumniNL'
import { PeopleSearchSurface, ResultGrid } from './people-search-surface'
import { ResultCard } from './result-card'

type RawSearchParams = Record<string, string | string[] | undefined>

const PAGE_SIZE = 10

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
  const requestedPage = Number.parseInt(singleParam(params.page) ?? '1', 10)

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

  const [{ data: viewerBase }, { data: viewerOrgProfile }, friendsRes] = await Promise.all([
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
      .from('friendships')
      .select('user_a_id, user_b_id')
      .or(`user_a_id.eq.${session.userId},user_b_id.eq.${session.userId}`),
  ])

  const friendIds = new Set(
    (friendsRes.data ?? []).map((f) =>
      f.user_a_id === session.userId ? f.user_b_id : f.user_a_id,
    ),
  )

  let nlHits: NLSearchHit[] = []
  let structuredHits: SearchHit[] = []
  let nlPoolSize = 0
  let nlError: string | null = null

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
    } else {
      nlError =
        result.error === 'no_api_key'
          ? 'Natural-language search is not configured. Showing keyword results instead.'
          : `Could not understand the query (${result.detail ?? 'unknown error'}). Showing keyword results instead.`
      structuredHits = await searchAlumni(supabase, {
        organizationId: viewerMembership.organization_id,
        viewerId: session.userId,
        viewerUniversity: viewerBase?.university ?? null,
        viewerMajor: viewerBase?.major ?? null,
        viewerCity: viewerBase?.city ?? null,
        viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
        filters: { ...filters, q: filters.q ?? nlQuery },
      })
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
  const showNaturalLanguageResults = useNL && !nlError
  const hasActiveSearch = anyFilter || useNL
  const filtersOpen = anyFilter || (useNL && nlHits.length === 0)
  const resultCount = showNaturalLanguageResults ? nlHits.length : structuredHits.length
  const activeHits = showNaturalLanguageResults ? nlHits : structuredHits
  const openCount = activeHits.filter(
    (hit) => hit.isOpenAsMentor || hit.isOpenAsAdviceHelper,
  ).length
  const totalPages = Math.max(1, Math.ceil(resultCount / PAGE_SIZE))
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagedNlHits = nlHits.slice(pageStart, pageStart + PAGE_SIZE)
  const pagedStructuredHits = structuredHits.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="density-cozy min-h-full bg-background">
      <PeopleSearchSurface
        filtersOpen={filtersOpen}
        resultCount={resultCount}
        openCount={openCount}
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
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-card">
            {nlError}
          </div>
        ) : null}

        {showNaturalLanguageResults ? (
          nlHits.length === 0 ? (
            <EmptyResults
              text={
                nlPoolSize === 0
                  ? 'No alumni matched the filters extracted from your query. Try removing constraints in the filter panel.'
                  : 'The pool was narrowed but no candidates scored highly. Try a broader query.'
              }
            />
          ) : (
            <>
              <ResultGrid>
                {pagedNlHits.map((h) => (
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
              <PeoplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalResults={resultCount}
                params={params}
              />
              <PeopleFeedbackStrip />
            </>
          )
        ) : (
          <>
            {structuredHits.length > 0 ? (
              <>
                <ResultGrid>
                  {pagedStructuredHits.map((h) => (
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
                <PeoplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={resultCount}
                  params={params}
                />
                <PeopleFeedbackStrip />
              </>
            ) : null}
            {structuredHits.length === 0 && hasActiveSearch ? (
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
            {structuredHits.length === 0 && !hasActiveSearch ? (
              <EmptyResults text="Type a query above or adjust filters to browse alumni." />
            ) : null}
          </>
        )}
      </PeopleSearchSurface>
    </div>
  )
}

function EmptyResults({ text }: { text: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-card">
      {text}
    </div>
  )
}

function PeopleFeedbackStrip() {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-md border border-dashed border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p className="text-[13px] font-semibold text-foreground">Are these the right people?</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Tell us why a result felt off and we&apos;ll improve your matches.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" variant="outline" size="sm" className="rounded-md">
          Off-target
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-md">
          Helpful
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden rounded-md text-muted-foreground sm:inline-flex"
        >
          Skip
        </Button>
      </div>
    </div>
  )
}

function PeoplePagination({
  currentPage,
  totalPages,
  totalResults,
  params,
}: {
  currentPage: number
  totalPages: number
  totalResults: number
  params: RawSearchParams
}) {
  if (totalPages <= 1) return null

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
  const start = (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, totalResults)

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-muted-foreground">
        Showing {start}-{end} of {totalResults}
      </p>
      <nav aria-label="People result pages" className="flex items-center gap-1.5">
        {pageNumbers.map((page) => {
          const isCurrent = page === currentPage
          return (
            <Link
              key={page}
              href={peoplePageHref(params, page)}
              aria-current={isCurrent ? 'page' : undefined}
              className={
                isCurrent
                  ? 'flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground'
                  : 'flex size-8 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground'
              }
            >
              {page}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function peoplePageHref(params: RawSearchParams, page: number) {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key === 'page' || value === undefined) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item.trim().length > 0) next.append(key, item)
    }
  }
  if (page > 1) next.set('page', String(page))
  const search = next.toString()
  return search ? `/people?${search}` : '/people'
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
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
