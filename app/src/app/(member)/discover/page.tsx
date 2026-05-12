import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import type { ExtractedFilters } from '@/lib/search/extractFilters'
import { parseSearchParams } from '@/lib/search/schemas'
import { type SearchHit, searchAlumni } from '@/lib/search/searchAlumni'
import { type NLSearchHit, searchAlumniNL } from '@/lib/search/searchAlumniNL'
import { displayOrgName } from '@/lib/utils'
import { DiscoverSearchSurface } from './discover-search-surface'
import { ResultCard } from './result-card'

type RawSearchParams = Record<string, string | string[] | undefined>

export default async function DiscoverPage({
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
    <div>
      <Hero orgName={orgName} totalAlumni={totalAlumni} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-8">
        <DiscoverSearchSurface
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
            <Card className="border-destructive/40">
              <CardContent className="pt-6 text-sm text-destructive">{nlError}</CardContent>
            </Card>
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
                    mentorPaused={h.mentorPaused}
                    isFriend={friendIds.has(h.userId)}
                    rationale={h.rationale}
                    rerankScore={h.rerankScore}
                    topCareerEntry={pickTopCareerEntry(h.careerHistory)}
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
                      mentorPaused={h.mentorPaused}
                      isFriend={friendIds.has(h.userId)}
                      rationale={null}
                      rerankScore={null}
                      topCareerEntry={null}
                    />
                  ))}
                </ResultGrid>
              ) : null}
              {structuredHits.length === 0 && anyFilter ? (
                <EmptyResults
                  text={
                    <>
                      No alumni matched these filters.{' '}
                      <Link href="/discover" className="text-primary hover:underline">
                        Clear all
                      </Link>{' '}
                      and try again.
                    </>
                  }
                />
              ) : null}
              {structuredHits.length === 0 && !anyFilter ? (
                <EmptyResults text="Type a question above or open the filters to browse alumni." />
              ) : null}
            </>
          )}
        </DiscoverSearchSurface>
      </div>
    </div>
  )
}

// =============================================================================
// Hero — soft white-to-slate gradient + Fraunces title.
// =============================================================================

function Hero({ orgName, totalAlumni }: { orgName: string; totalAlumni: number }) {
  return (
    <section className="border-b bg-[linear-gradient(180deg,#fff_0%,#fafbfd_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Discover · {totalAlumni.toLocaleString()} {totalAlumni === 1 ? 'member' : 'members'}
        </p>
        <h1
          className="bc-fraunces mt-2 text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-[44px]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          Discover alumni
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Find someone in {orgName} to ask, learn from, or simply meet. Describe who you&apos;re
          looking for in plain English, or use the filters below.
        </p>
      </div>
    </section>
  )
}

function ResultsHeader({ resultCount, hasFilter }: { resultCount: number; hasFilter: boolean }) {
  // Avoid claiming "match your filters" when no filter is set — at the
  // base state the count is just the org's directory.
  const suffix = hasFilter
    ? resultCount === 1
      ? 'alum matches your filters'
      : 'alumni match your filters'
    : resultCount === 1
      ? 'alum in your circle'
      : 'alumni in your circle'
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{resultCount.toLocaleString()}</strong> {suffix}
      </p>
    </div>
  )
}

function ResultGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}

function EmptyResults({ text }: { text: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">{text}</CardContent>
    </Card>
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
    <Card className="bg-muted/30">
      <CardContent className="space-y-2 py-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Searching for:</span>
          <span className="font-medium">&ldquo;{query}&rdquo;</span>
        </div>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <Badge
                key={`${c.label}-${c.value}`}
                variant="outline"
                className="text-xs font-normal"
              >
                <span className="text-muted-foreground">{c.label}:</span>&nbsp;{c.value}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No structured filters extracted — ranking purely on theme.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Showing {shownCount} of {poolSize} matched alumni, ranked by Claude.
          {fallback === 'rerank_failed'
            ? ' (Reranker hiccupped — falling back to default order.)'
            : ''}
        </p>
      </CardContent>
    </Card>
  )
}
