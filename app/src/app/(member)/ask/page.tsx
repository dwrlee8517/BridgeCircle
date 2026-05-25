import { GitBranch, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
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
  type HelpNetworkPerson,
  MatchBriefCard,
  PromptChips,
} from '../help-network-ui'

type SearchParams = { q?: string; page?: string }

const PAGE_SIZE = 5
const MAX_RESULT_PAGES = 5

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

export default async function AskPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireSession()
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const requestedPage = Number.parseInt(params.page ?? '1', 10)
  const supabase = await createClient()

  const { data: viewerMembership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!viewerMembership) return null

  const [
    { data: viewerBase },
    { data: viewerOrgProfile },
    totalAlumniRes,
    pendingHelpRes,
    eventRes,
  ] = await Promise.all([
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
      const fallback = await openHelperFallback(
        supabase,
        viewerMembership.organization_id,
        session.userId,
        viewerBase,
        viewerOrgProfile,
      )
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

  const totalPages = Math.min(MAX_RESULT_PAGES, Math.max(1, Math.ceil(hits.length / PAGE_SIZE)))
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagedHits = hits.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border bg-surface-panel/35">
        <AskSignalMotif />
        <div className="relative mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-10">
          <div className="space-y-6">
            <p className="bc-section-kicker">Ask · {orgName}</p>
            <div className="max-w-3xl space-y-4">
              <h1 className="font-heading text-4xl font-semibold leading-[1.02] text-foreground sm:text-5xl">
                {query
                  ? 'Rank the right people for this ask.'
                  : 'Turn a question into people worth asking.'}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Describe the decision, industry, city, school, or career path. BridgeCircle should
                return a short list with reasons, trust path, and a next ask.
              </p>
            </div>
            <div className="space-y-3">
              <AskBar defaultValue={query} />
              <PromptChips prompts={PROMPTS} />
            </div>
          </div>

          <div className="relative self-end overflow-hidden rounded-xl border border-border/80 bg-card/88 p-5 shadow-hero backdrop-blur">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1"
              style={{
                background:
                  'linear-gradient(90deg, var(--primary), var(--accent-sage), var(--accent-ochre), var(--accent-plum))',
              }}
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase text-primary">Ask workflow</p>
              <div className="mt-5 space-y-4">
                <WorkflowStep
                  icon={<Search className="size-4" />}
                  title="Interpret need"
                  tone="primary"
                />
                <WorkflowStep
                  icon={<GitBranch className="size-4" />}
                  title="Trace fit and trust"
                  tone="sage"
                />
                <WorkflowStep
                  icon={<Sparkles className="size-4" />}
                  title="Suggest the first ask"
                  tone="ochre"
                />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/70 pt-4">
                <WorkflowMetric value={totalAlumni} label="Alumni" tone="primary" />
                <WorkflowMetric value={pendingHelpCount} label="Replies" tone="sage" />
                <WorkflowMetric value={eventCount} label="Events" tone="ochre" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-panel/55">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:py-10">
          <div className="min-w-0">
            <div className="mb-6">
              <p className="bc-section-kicker mb-3">Ranked path</p>
              <h2 className="font-heading text-2xl font-semibold leading-tight text-foreground">
                {query ? 'Best matches for your question' : 'Start with open helpers'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {query
                  ? `Searching for: “${query}”`
                  : 'Use the prompt above for more precise matching, or start with people already open to helping.'}
              </p>
            </div>

            {status ? (
              <div className="mb-5 rounded-xl border border-border bg-warning-tint px-4 py-3 text-sm text-foreground">
                {status}
              </div>
            ) : null}

            {hits.length > 0 ? (
              <div className="space-y-3">
                <div className="space-y-3">
                  {pagedHits.map(({ person, reason }) => (
                    <MatchBriefCard
                      key={person.userId}
                      person={person}
                      query={query}
                      reason={reason}
                    />
                  ))}
                </div>
                <PaginationFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={hits.length}
                  query={query}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <Search className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">
                  No matches surfaced yet.
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Try a broader question, or explore People while the network gets seeded with more
                  helper profiles.
                </p>
                <Button asChild className="mt-5 rounded-lg">
                  <Link href="/people">Open People</Link>
                </Button>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24">
            <FreshnessReviewCard />
          </aside>
        </div>
      </section>
    </main>
  )
}

function AskSignalMotif() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgb(37_99_235/0.14),transparent_28%),radial-gradient(circle_at_72%_18%,rgb(59_110_81/0.12),transparent_26%),radial-gradient(circle_at_86%_78%,rgb(200_118_26/0.14),transparent_24%)]" />
      <svg
        viewBox="0 0 1100 420"
        className="absolute inset-x-0 bottom-0 h-full w-full stroke-current opacity-[0.16]"
        preserveAspectRatio="none"
      >
        <title>Decorative ask signal paths</title>
        <path
          d="M80 290 C220 120 340 155 470 230 S730 345 1000 110"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
        />
        <path
          d="M120 110 C270 210 390 320 580 250 S820 80 1010 250"
          fill="none"
          stroke="var(--accent-sage)"
          strokeWidth="1.4"
          strokeDasharray="8 10"
        />
        <path
          d="M20 365 C200 310 390 355 570 305 S835 225 1080 340"
          fill="none"
          stroke="var(--accent-ochre)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  )
}

function PaginationFooter({
  currentPage,
  totalPages,
  totalResults,
  query,
}: {
  currentPage: number
  totalPages: number
  totalResults: number
  query: string
}) {
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
  const start = (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, totalResults)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs font-medium text-muted-foreground">
        Showing {start}-{end} of {Math.min(totalResults, PAGE_SIZE * MAX_RESULT_PAGES)}
      </p>
      <nav aria-label="Helper result pages" className="flex items-center gap-1.5">
        {pageNumbers.map((page) => {
          const isCurrent = page === currentPage
          return (
            <Link
              key={page}
              href={askPageHref(query, page)}
              aria-current={isCurrent ? 'page' : undefined}
              className={
                isCurrent
                  ? 'flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground'
                  : 'flex size-8 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground'
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

function askPageHref(query: string, page: number) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (page > 1) params.set('page', String(page))
  const search = params.toString()
  return search ? `/ask?${search}` : '/ask'
}

function WorkflowStep({
  icon,
  title,
  tone,
}: {
  icon: ReactNode
  title: string
  tone: 'primary' | 'sage' | 'ochre'
}) {
  const toneClass =
    tone === 'sage'
      ? 'border-accent-sage/20 bg-accent-sage/10 text-accent-sage'
      : tone === 'ochre'
        ? 'border-accent-ochre/20 bg-accent-ochre/10 text-accent-ochre'
        : 'border-primary/15 bg-primary/[0.08] text-primary'

  return (
    <div className="flex items-center gap-3">
      <div className={`flex size-8 items-center justify-center rounded-lg border ${toneClass}`}>
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
    </div>
  )
}

function WorkflowMetric({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone: 'primary' | 'sage' | 'ochre'
}) {
  const style =
    tone === 'sage'
      ? { borderColor: 'rgb(59 110 81 / 0.22)', backgroundColor: 'rgb(59 110 81 / 0.08)' }
      : tone === 'ochre'
        ? { borderColor: 'rgb(200 118 26 / 0.22)', backgroundColor: 'rgb(200 118 26 / 0.09)' }
        : { borderColor: 'rgb(37 99 235 / 0.22)', backgroundColor: 'rgb(37 99 235 / 0.08)' }

  return (
    <div className="rounded-lg border p-2" style={style}>
      <p className="font-heading text-xl font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
    </div>
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
    limit: PAGE_SIZE * MAX_RESULT_PAGES,
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
