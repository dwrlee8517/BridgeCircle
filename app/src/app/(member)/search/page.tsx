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
import { ResultCard } from './result-card'
import { SearchForm } from './search-form'

type RawSearchParams = Record<string, string | string[] | undefined>

export default async function SearchPage({
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

  const [{ data: viewerBase }, { data: viewerOrgProfile }] = await Promise.all([
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
  ])

  const orgName = displayOrgName((viewerMembership.organizations as { name: string } | null)?.name)

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

  // Whether the structured filter row is open by default. Open it if the
  // user has any filter set, OR if NL produced no results so they have an
  // obvious next step.
  const anyFilter = !!(
    filters.q ||
    filters.city ||
    filters.employer ||
    filters.university ||
    filters.major ||
    filters.topic ||
    filters.gradYearMin ||
    filters.gradYearMax ||
    filters.openToMentor
  )
  const filtersOpen = anyFilter || (useNL && nlHits.length === 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Search {orgName}</h1>
        <p className="text-sm text-muted-foreground">
          Describe who you&apos;re looking for in plain English, or use filters below.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <SearchForm
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
            }}
          />
        </CardContent>
      </Card>

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

      <div className="space-y-3">
        {useNL ? (
          nlHits.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                {nlPoolSize === 0
                  ? 'No alumni matched the filters extracted from your query. Try removing constraints in the filter panel.'
                  : 'The pool was narrowed but no candidates scored highly. Try a broader query.'}
              </CardContent>
            </Card>
          ) : (
            nlHits.map((h) => (
              <ResultCard
                key={h.userId}
                userId={h.userId}
                name={h.name}
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
                rationale={h.rationale}
                rerankScore={h.rerankScore}
                topCareerEntry={pickTopCareerEntry(h.careerHistory)}
              />
            ))
          )
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {structuredHits.length} {structuredHits.length === 1 ? 'result' : 'results'}
            </p>
            {structuredHits.map((h) => (
              <ResultCard
                key={h.userId}
                userId={h.userId}
                name={h.name}
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
                rationale={null}
                rerankScore={null}
                topCareerEntry={null}
              />
            ))}
            {structuredHits.length === 0 && anyFilter ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No alumni matched these filters.{' '}
                  <Link href="/search" className="text-primary hover:underline">
                    Clear all
                  </Link>{' '}
                  and try again.
                </CardContent>
              </Card>
            ) : null}
            {structuredHits.length === 0 && !anyFilter ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Type a question above or open the filters to browse alumni.
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>
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
    <Card className="bg-muted/30">
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap text-sm">
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
