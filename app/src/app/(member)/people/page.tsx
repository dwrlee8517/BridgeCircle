import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  getMemberSearchResults,
  MEMBER_SEARCH_PAGE_SIZE,
  memberSearchPageHref,
  type RawSearchParams,
} from '@/lib/search/getMemberSearchResults'
import type { SearchHit } from '@/lib/search/searchAlumni'
import { PeopleSearchSurface, ResultGrid } from './people-search-surface'
import { ResultCard } from './result-card'

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const params = await searchParams
  const results = await getMemberSearchResults(params, { surface: 'people' })

  if (!results) return null

  return (
    <div className="density-cozy min-h-full bg-background">
      <PeopleSearchSurface
        filtersOpen={results.filtersOpen}
        resultCount={results.resultCount}
        openCount={results.openCount}
        defaults={results.defaults}
      >
        {results.nlError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-card">
            {results.nlError}
          </div>
        ) : null}

        {results.showNaturalLanguageResults ? (
          results.nlHits.length === 0 ? (
            <EmptyResults
              text={
                results.nlPoolSize === 0
                  ? 'No alumni matched the filters extracted from your query. Try removing constraints in the filter panel.'
                  : 'The pool was narrowed but no candidates scored highly. Try a broader query.'
              }
            />
          ) : (
            <>
              <ResultGrid>
                {results.pagedNlHits.map((h) => (
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
                    isFriend={results.friendIds.has(h.userId)}
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
                currentPage={results.currentPage}
                totalPages={results.totalPages}
                totalResults={results.resultCount}
                params={params}
              />
              <PeopleFeedbackStrip />
            </>
          )
        ) : (
          <>
            {results.structuredHits.length > 0 ? (
              <>
                <ResultGrid>
                  {results.pagedStructuredHits.map((h) => (
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
                      isFriend={results.friendIds.has(h.userId)}
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
                  currentPage={results.currentPage}
                  totalPages={results.totalPages}
                  totalResults={results.resultCount}
                  params={params}
                />
                <PeopleFeedbackStrip />
              </>
            ) : null}
            {results.structuredHits.length === 0 && results.hasActiveSearch ? (
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
            {results.structuredHits.length === 0 && !results.hasActiveSearch ? (
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
        <p className="text-caption font-semibold text-foreground">Are these the right people?</p>
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
  const start = (currentPage - 1) * MEMBER_SEARCH_PAGE_SIZE + 1
  const end = Math.min(currentPage * MEMBER_SEARCH_PAGE_SIZE, totalResults)

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
              href={memberSearchPageHref('/people', params, page)}
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

function pickTopCareerEntry(
  history: SearchHit['careerHistory'],
): { employer: string; title: string; dates: string } | null {
  if (!history || history.length === 0) return null
  const e = history[0]
  if (!e) return null
  const dates = [e.start_date, e.end_date ?? 'present'].filter(Boolean).join('–')
  return { employer: e.employer, title: e.title, dates }
}
