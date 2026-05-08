import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { type SearchHit, searchAlumni } from '@/lib/search/searchAlumni'
import { displayName } from '@/lib/utils'

type RawSearchParams = Record<string, string | string[] | undefined>

/**
 * The Ask landing page — sender perspective. Two jobs:
 *
 *   1. Start a new ask. The "Start a new ask" card at the top is a
 *      composer-first surface: search by keyword, see helpers inline,
 *      pick advice or mentorship from the same row. This replaces the
 *      old "Find someone to ask → /discover → profile → /ask/new"
 *      round-trip. Discover stays as the rich browsing surface for
 *      anyone who wants more.
 *
 *   2. Track open and closed asks. Same as before — outgoing list
 *      grouped by status.
 *
 * The receiver perspective still lives at /inbox.
 */
export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const session = await requireSession()
  const supabase = await createClient()
  const params = await searchParams

  const rawQ = params.q
  const query = (Array.isArray(rawQ) ? rawQ[0] : rawQ)?.trim() ?? ''
  const hasQuery = query.length > 0

  // Run the recipient picker search and the past-asks query in parallel.
  const [pickerHits, outgoingRes] = await Promise.all([
    hasQuery ? findHelpers(supabase, session.userId, query) : Promise.resolve([] as SearchHit[]),
    supabase
      .from('asks')
      .select('id, helper_id, status, ask_type, reason, help_needed, created_at, responded_at')
      .eq('asker_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const outgoing = outgoingRes.data ?? []
  const helperIds = outgoing.map((r) => r.helper_id)
  const profileMap = new Map<string, { name: string | null; avatarUrl: string | null }>()
  if (helperIds.length > 0) {
    const { data: profiles } = await supabase
      .from('base_profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', helperIds)
    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, { name: p.name, avatarUrl: p.avatar_url })
    }
  }

  const open = outgoing.filter((r) => r.status === 'pending' || r.status === 'accepted')
  const closed = outgoing.filter((r) => r.status === 'declined' || r.status === 'expired')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="mb-8 border-b pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ask
        </p>
        <h1
          className="bc-fraunces mt-2 text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-[44px]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          Your asks
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Start a new ask, or keep tabs on the ones you&apos;ve already sent.
        </p>
      </div>

      <RecipientPicker query={query} hits={pickerHits} hasQuery={hasQuery} />

      {outgoing.length === 0 ? null : (
        <>
          <h2
            className="bc-fraunces mt-10 mb-4 text-2xl font-bold tracking-[-0.02em]"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
          >
            Your sent asks
          </h2>
          <Section
            title="Open"
            description="Pending or accepted — still going."
            emptyText="Nothing open right now."
          >
            {open.map((r) => (
              <AskRow key={r.id} row={r} profile={profileMap.get(r.helper_id)} />
            ))}
          </Section>
          {closed.length > 0 ? (
            <Section title="Closed" description="Past asks — declined or expired.">
              {closed.map((r) => (
                <AskRow key={r.id} row={r} profile={profileMap.get(r.helper_id)} />
              ))}
            </Section>
          ) : null}
        </>
      )}

      {outgoing.length === 0 && !hasQuery ? (
        <div className="mt-10">
          <EmptyState
            title="You haven't asked anyone yet"
            description="Search above for someone you'd like to learn from. Quick advice or ongoing mentorship — both are first-class."
          />
        </div>
      ) : null}
    </div>
  )
}

// =============================================================================
// Recipient picker — search box + inline results with per-helper ask CTAs.
// =============================================================================

function RecipientPicker({
  query,
  hits,
  hasQuery,
}: {
  query: string
  hits: SearchHit[]
  hasQuery: boolean
}) {
  return (
    <Card className="border-primary/20 shadow-[0_4px_20px_-4px_rgba(19,27,46,0.06)]">
      <CardHeader className="pb-4">
        <CardTitle
          className="bc-fraunces text-2xl font-bold tracking-[-0.02em]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          Start a new ask
        </CardTitle>
        <CardDescription>
          Search someone in your network to ask for advice or mentorship.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Native GET form — server-rendered, no client JS needed. The page
            re-runs on submit and renders results below. */}
        <form action="/ask" method="get" className="flex gap-2">
          <Input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Try a name, employer, or topic — e.g. &ldquo;Mark&rdquo; or &ldquo;finance&rdquo;"
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit">Search</Button>
        </form>

        {hasQuery ? (
          <div className="mt-6">
            {hits.length === 0 ? (
              <p className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
                No one open to advice or mentorship matched &ldquo;{query}&rdquo;.{' '}
                <Link href="/discover" className="text-primary hover:underline">
                  Browse all alumni
                </Link>
                .
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {hits.length === 1 ? '1 match' : `${hits.length} matches`}
                </p>
                <ul className="divide-y divide-border rounded-md border">
                  {hits.map((h) => (
                    <RecipientRow key={h.userId} hit={h} />
                  ))}
                </ul>
              </>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              Don&rsquo;t see them?{' '}
              <Link href="/discover" className="text-primary hover:underline">
                Browse all alumni
              </Link>
              .
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function RecipientRow({ hit }: { hit: SearchHit }) {
  const subtitle = [
    hit.currentTitle && hit.currentEmployer
      ? `${hit.currentTitle} · ${hit.currentEmployer}`
      : (hit.currentTitle ?? hit.currentEmployer),
    hit.city,
  ]
    .filter(Boolean)
    .join(' — ')

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <Link
        href={`/profile/${hit.userId}`}
        className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90"
      >
        <Avatar className="size-10 shrink-0">
          {hit.avatarUrl ? (
            <AvatarImage src={hit.avatarUrl} alt={displayName(hit.name, hit.preferredName, '')} />
          ) : null}
          <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
            {displayName(hit.name, hit.preferredName, '?').slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {displayName(hit.name, hit.preferredName)}
            {hit.graduationYear ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                &rsquo;{String(hit.graduationYear).slice(-2)}
              </span>
            ) : null}
          </p>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </Link>
      <div className="flex shrink-0 flex-wrap gap-2">
        {hit.isOpenAsAdviceHelper ? (
          <Button asChild size="sm" variant={hit.isOpenAsMentor ? 'outline' : 'default'}>
            <Link href={`/ask/new?to=${hit.userId}&type=advice`}>Ask for advice</Link>
          </Button>
        ) : null}
        {hit.isOpenAsMentor ? (
          <Button asChild size="sm">
            <Link href={`/ask/new?to=${hit.userId}&type=mentorship`}>Request mentorship</Link>
          </Button>
        ) : null}
      </div>
    </li>
  )
}

// =============================================================================
// Helper: search for people open to advice OR mentorship that match a keyword.
// Used by the recipient picker. Keeps NL search out of /ask — keyword is enough
// for "I have a name in mind" and avoids the LLM cost on every Ask page load.
// =============================================================================

async function findHelpers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewerId: string,
  query: string,
): Promise<SearchHit[]> {
  const { data: viewerMembership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id')
    .eq('user_id', viewerId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!viewerMembership) return []

  const [{ data: viewerBase }, { data: viewerOrgProfile }] = await Promise.all([
    supabase
      .from('base_profiles')
      .select('university, major, city')
      .eq('user_id', viewerId)
      .maybeSingle(),
    supabase
      .from('organization_profiles')
      .select('graduation_year')
      .eq('organization_membership_id', viewerMembership.id)
      .maybeSingle(),
  ])

  const hits = await searchAlumni(supabase, {
    organizationId: viewerMembership.organization_id,
    viewerId,
    viewerUniversity: viewerBase?.university ?? null,
    viewerMajor: viewerBase?.major ?? null,
    viewerCity: viewerBase?.city ?? null,
    viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
    filters: {
      q: query,
      city: undefined,
      employer: undefined,
      university: undefined,
      major: undefined,
      topic: undefined,
      gradYearMin: undefined,
      gradYearMax: undefined,
      openToMentor: undefined,
      peopleIKnow: undefined,
    },
    limit: 50,
  })

  // Only show people who are actually open to *some* form of helping, since
  // the whole point of /ask is to start an ask. Filter post-search so the
  // existing "in your network" scoring still applies.
  return hits.filter((h) => h.isOpenAsAdviceHelper || h.isOpenAsMentor).slice(0, 6)
}

// =============================================================================
// Past-asks list, unchanged.
// =============================================================================

function Section({
  title,
  description,
  emptyText,
  children,
}: {
  title: string
  description: string
  emptyText?: string
  children: React.ReactNode
}) {
  const arr = (Array.isArray(children) ? children : [children]).filter(Boolean)
  return (
    <Card className="mb-6 transition-all hover:border-primary/60 hover:shadow-[0_4px_20px_-4px_rgba(19,27,46,0.06)]">
      <CardHeader>
        <CardTitle
          className="bc-fraunces text-2xl font-bold tracking-[-0.02em]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {arr.length > 0 ? (
          arr
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText ?? 'Nothing here.'}</p>
        )}
      </CardContent>
    </Card>
  )
}

type AskRowData = {
  id: string
  status: string
  ask_type: string
  reason: string | null
  help_needed: string | null
  created_at: string
  responded_at: string | null
}

function AskRow({
  row,
  profile,
}: {
  row: AskRowData
  profile: { name: string | null; avatarUrl: string | null } | undefined
}) {
  const typeLabel = row.ask_type === 'advice' ? 'Advice' : 'Mentorship'
  const statusBadge =
    row.status === 'pending' ? (
      <StatusBadge tone="warn">Pending</StatusBadge>
    ) : row.status === 'accepted' ? (
      <StatusBadge tone="open">Accepted</StatusBadge>
    ) : row.status === 'declined' ? (
      <StatusBadge tone="alert">Declined</StatusBadge>
    ) : (
      <StatusBadge tone="muted">{row.status}</StatusBadge>
    )
  const summary = row.reason ?? row.help_needed ?? ''
  const ts = row.responded_at ?? row.created_at
  const name = profile?.name ?? 'Someone'
  return (
    <Link href={`/ask/${row.id}`}>
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[0_4px_20px_-4px_rgba(19,27,46,0.06)]">
        <Avatar className="size-10">
          {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={name} /> : null}
          <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
            {name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{name}</span>
            <StatusBadge tone="info">{typeLabel}</StatusBadge>
            {statusBadge}
            <span
              className="ml-auto text-xs text-muted-foreground"
              title={format(new Date(ts), 'PPpp')}
            >
              {formatDistanceToNow(new Date(ts), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{summary}</p>
        </div>
      </div>
    </Link>
  )
}
