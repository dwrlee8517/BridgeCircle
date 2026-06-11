import { ArrowRight, Lock, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/db/server'
import { getOpenAskForUser, OPEN_ASK_MIN_LENGTH, type OpenAsk } from '@/lib/asks/openAsks'
import { requireSession } from '@/lib/auth/session'
import {
  getMemberSearchResults,
  MEMBER_SEARCH_PAGE_SIZE,
  memberSearchPageHref,
  type RawSearchParams,
} from '@/lib/search/getMemberSearchResults'
import { readingTags } from '@/lib/search/readingTags'
import type { SearchHit } from '@/lib/search/searchAlumni'
import type { NLSearchHit } from '@/lib/search/searchAlumniNL'
import { AskHome } from '../ask-home'
import type { HelpNetworkPerson } from '../help-network-ui'
import { KeepAskOpenCard } from './open-ask-ui'
import { ResultsFocus } from './results-focus'
import { CompactMatchRow, MatchRowDivider } from './results-ui'

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const rawParams = await searchParams
  const params = normalizeAskSearchParams(rawParams)
  const query = singleParam(params.nl)?.trim() ?? ''
  const editing = singleParam(params.edit) === '1'

  if (!query || editing) {
    return <AskHome defaultValue={query} />
  }

  const results = await getMemberSearchResults(params, { surface: 'ask' })

  if (!results) return null

  const hits = results.showNaturalLanguageResults
    ? results.pagedNlHits
    : results.pagedStructuredHits
  const hasHits = hits.length > 0
  // NL page 1 gets the focus viewer: the strongest fit starts featured and
  // any row can be promoted into the slot client-side. Structured results
  // and later pages keep the static row list.
  const useFocusViewer = results.currentPage === 1 && results.showNaturalLanguageResults
  const tags = results.nlFilters ? readingTags(results.nlFilters) : []

  // The no-match dead end becomes a deferred promise: offer to keep the ask
  // open. Only fetched when needed.
  let existingOpenAsk: OpenAsk | null = null
  if (!hasHits) {
    const session = await requireSession()
    const supabase = await createClient()
    existingOpenAsk = await getOpenAskForUser(supabase, { userId: session.userId })
  }

  return (
    <div className="density-cozy min-h-full bg-background">
      <section className="bc-page-band border-border border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-3 px-4 py-6 sm:px-8 lg:py-7">
          <div>
            <p className="bc-section-kicker">Ask</p>
            <h1 className="mt-2 font-heading text-h1 font-semibold leading-tight text-foreground">
              People who can help with this
            </h1>
          </div>
          <Link
            href={`/people?nl=${encodeURIComponent(query)}`}
            className="inline-flex items-center gap-1.5 pb-1 text-sm font-medium text-link hover:text-link-hover"
          >
            Open in People
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-8">
        {results.nlError ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-card">
            {results.nlError}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8">
          <AskContextRail
            query={query}
            tags={tags}
            resultCount={results.resultCount}
            openCount={results.openCount}
          />

          <div className="min-w-0">
            {hasHits ? (
              <>
                {useFocusViewer ? (
                  <ResultsFocus
                    people={hits.map(toHelpNetworkPerson)}
                    intent={query}
                    initialFocusId={singleParam(params.focus) ?? null}
                  />
                ) : (
                  <div>
                    <p className="bc-card-label">People who might fit</p>
                    <div className="mt-2">
                      <MatchRowDivider>
                        {hits.map((hit) => (
                          <CompactMatchRow
                            key={hit.userId}
                            person={toHelpNetworkPerson(hit)}
                            intent={query}
                            reason={matchReason(hit)}
                          />
                        ))}
                      </MatchRowDivider>
                    </div>
                  </div>
                )}

                <AskPagination
                  currentPage={results.currentPage}
                  totalPages={results.totalPages}
                  totalResults={results.resultCount}
                  params={params}
                />
              </>
            ) : (
              <KeepAskOpenCard
                query={query}
                poolSize={results.nlPoolSize}
                existingOpenAsk={existingOpenAsk}
                canKeepOpen={query.trim().length >= OPEN_ASK_MIN_LENGTH}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function AskContextRail({
  query,
  tags,
  resultCount,
  openCount,
}: {
  query: string
  tags: string[]
  resultCount: number
  openCount: number
}) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-md border border-border bg-card p-3.5 shadow-card">
        <p className="bc-card-label">Your ask</p>
        {/* Member-written words — quotes are sacred and allowed here. */}
        <blockquote className="mt-2 border-primary border-l-2 pl-3 text-sm font-medium leading-relaxed text-foreground">
          &ldquo;{query}&rdquo;
        </blockquote>
        <Button asChild variant="outline" size="xs" className="mt-3 rounded-md">
          <Link href={`/ask?edit=1&nl=${encodeURIComponent(query)}`}>
            <Pencil className="size-3" />
            Edit ask
          </Link>
        </Button>
      </div>

      {tags.length > 0 ? (
        <div>
          <p className="bc-card-label">How we read it</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-primary-tint px-2 py-1 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Off the mark? Edit your ask and we&rsquo;ll match again.
          </p>
        </div>
      ) : null}

      <div className="space-y-2.5 border-border border-t pt-3.5 text-xs text-muted-foreground">
        <p>
          <span className="font-mono font-semibold text-foreground">{resultCount}</span>{' '}
          {resultCount === 1 ? 'person matches' : 'people match'} ·{' '}
          <span className="font-mono font-semibold text-accent-sage">{openCount}</span> open now
        </p>
        <p className="flex gap-1.5 leading-relaxed">
          <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
          Asks only reach members who opted in to be asked.
        </p>
      </div>
    </aside>
  )
}

function AskPagination({
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
    <div className="mt-5 flex flex-col gap-3 border-border border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-mono text-xs font-medium text-muted-foreground">
        Showing {start}-{end} of {totalResults}
      </p>
      <nav aria-label="Ask result pages" className="flex items-center gap-1.5">
        {pageNumbers.map((page) => {
          const isCurrent = page === currentPage
          return (
            <Link
              key={page}
              href={memberSearchPageHref('/ask', params, page)}
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

function toHelpNetworkPerson(hit: SearchHit | NLSearchHit): HelpNetworkPerson {
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
    rationale: matchReason(hit),
    matchScore: 'rerankScore' in hit ? hit.rerankScore : null,
  }
}

function matchReason(hit: SearchHit | NLSearchHit) {
  if ('rationale' in hit && hit.rationale) return hit.rationale
  return hit.reason
}

function normalizeAskSearchParams(params: RawSearchParams): RawSearchParams {
  const nl = singleParam(params.nl)?.trim()
  if (nl) return params

  const q = singleParam(params.q)?.trim()
  if (!q) return params

  return { ...params, nl: q, q: undefined }
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
