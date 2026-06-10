import { ArrowRight, CircleHelp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  getMemberSearchResults,
  MEMBER_SEARCH_PAGE_SIZE,
  memberSearchPageHref,
  type RawSearchParams,
} from '@/lib/search/getMemberSearchResults'
import type { SearchHit } from '@/lib/search/searchAlumni'
import type { NLSearchHit } from '@/lib/search/searchAlumniNL'
import { AskBar, type HelpNetworkPerson, MatchBriefCard } from '../help-network-ui'

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const rawParams = await searchParams
  const params = normalizeAskSearchParams(rawParams)
  const query = singleParam(params.nl)?.trim() ?? ''

  if (!query) {
    return <AskStarter />
  }

  const results = await getMemberSearchResults(params, { surface: 'ask' })

  if (!results) return null

  const hits = results.showNaturalLanguageResults
    ? results.pagedNlHits
    : results.pagedStructuredHits
  const hasHits = hits.length > 0

  return (
    <div className="density-cozy min-h-full bg-background">
      <section className="bc-page-band border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
          <div className="space-y-5">
            <div>
              <p className="bc-section-kicker">Ask</p>
              <h1 className="mt-2 font-heading text-[28px] font-semibold leading-tight text-foreground sm:text-display-md">
                People who can help with this ask
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Here&rsquo;s who might help, and why they fit.
              </p>
            </div>

            {/* Re-running a search is not the social-commitment moment — amber
                stays off browse surfaces so the cards' actions read first. */}
            <AskBar defaultValue={query} submitVariant="default" />

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-3 py-1.5 font-mono">
                {results.resultCount === 1
                  ? '1 match'
                  : `${results.resultCount.toLocaleString()} matches`}
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 font-mono">
                {results.openCount.toLocaleString()} open to help
              </span>
              <Link
                href={`/people?nl=${encodeURIComponent(query)}`}
                className="ml-auto inline-flex items-center gap-1.5 font-medium text-link hover:text-link-hover"
              >
                Open in People
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-8">
        {results.nlError ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-card">
            {results.nlError}
          </div>
        ) : null}

        {hasHits ? (
          <>
            <div className="overflow-hidden rounded-md border border-border bg-card shadow-card">
              <div className="border-b border-border bg-surface-panel/50 px-4 py-3 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-label text-muted-foreground">
                  You asked
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">&ldquo;{query}&rdquo;</p>
              </div>
              {hits.map((hit) => (
                <MatchBriefCard
                  key={hit.userId}
                  person={toHelpNetworkPerson(hit)}
                  query={query}
                  intent={query}
                  reason={matchReason(hit)}
                  variant="list-row"
                />
              ))}
            </div>
            <AskPagination
              currentPage={results.currentPage}
              totalPages={results.totalPages}
              totalResults={results.resultCount}
              params={params}
            />
          </>
        ) : (
          <AskEmptyResults query={query} poolSize={results.nlPoolSize} />
        )}
      </section>
    </div>
  )
}

function AskStarter() {
  return (
    <div className="density-cozy min-h-full bg-background">
      <section className="bc-page-band border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 lg:py-14">
          <div className="space-y-6">
            <div>
              <p className="bc-section-kicker">Ask</p>
              <h1 className="mt-2 max-w-2xl font-heading text-display-md font-semibold leading-[1.1] text-foreground sm:text-display-lg">
                Start with what you are trying to figure out.
              </h1>
              <p className="mt-3 max-w-2xl text-body-lg leading-[1.55] text-muted-foreground">
                Tell us what you&rsquo;re working through — we&rsquo;ll find people who&rsquo;ve
                been there.
              </p>
            </div>

            <AskBar />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <StarterAsk href="/ask?nl=I%27m%20thinking%20about%20product%20management">
            I&rsquo;m thinking about product management
          </StarterAsk>
          <StarterAsk href="/ask?nl=I%20want%20to%20understand%20founder%20paths">
            I want to understand founder paths
          </StarterAsk>
          <StarterAsk href="/ask?nl=Can%20someone%20review%20a%20career%20decision%3F">
            Can someone review a career decision?
          </StarterAsk>
        </div>
      </section>
    </div>
  )
}

function StarterAsk({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 flex-col justify-between rounded-md border border-border bg-card p-4 shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-primary/30 hover:shadow-card-hover"
    >
      <CircleHelp className="size-4 text-primary" />
      <span className="mt-4 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
        {children}
      </span>
    </Link>
  )
}

function AskEmptyResults({ query, poolSize }: { query: string; poolSize: number }) {
  const body =
    poolSize === 0
      ? "We don't have many alumni in this area yet. Try widening the question, or browse People."
      : 'No one was a clear fit for this question. Try rephrasing it, or browse People.'

  return (
    <div className="rounded-md border border-border bg-card p-8 text-center shadow-card">
      <p className="font-heading text-lg font-semibold text-foreground">
        We didn&rsquo;t find a match this time
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-md">
          <Link href="/ask">Edit your ask</Link>
        </Button>
        <Button asChild size="sm" className="rounded-md">
          <Link href={`/people?nl=${encodeURIComponent(query)}`}>Try People search</Link>
        </Button>
      </div>
    </div>
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
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-muted-foreground">
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
