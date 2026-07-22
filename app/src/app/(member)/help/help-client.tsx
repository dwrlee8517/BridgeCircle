'use client'

import { ArrowRight, ChevronDown, Plus, Search, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { avatarColorClasses, cn, getInitials } from '@/lib/utils'

export type HelpAvailability = {
  openToHelp: boolean
  topics: string[]
  paused: boolean
}

export type HelpSubject = {
  id: string
  label: string
  ask: number
  helped: number
  color: string
}

export type HelpPick = {
  id: string
  personId: string
  name: string
  avatarUrl: string | null
  cohort: string | null
  role: string
  city: string | null
  subject: string
  subjectId: string
  subjectColor: string
  /**
   * True when `need` is the member's own words (renders quoted). System
   * suggestions render unquoted — the product never fabricates member speech.
   */
  isRealAsk: boolean
  need: string
  why: string[]
  posted: string
  estReply: string
  href: string
}

export function HelpClient({
  availability,
  picks,
  subjects,
  waitingCount,
}: {
  availability: HelpAvailability
  picks: HelpPick[]
  subjects: HelpSubject[]
  waitingCount: number
}) {
  const [active, setActive] = useState('featured')
  const [query, setQuery] = useState('')
  const isFeatured = active === 'featured'
  const activeSubject = subjects.find((subject) => subject.id === active) ?? null

  const filteredPicks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return picks.filter((pick) => {
      const matchesSubject = isFeatured || pick.subjectId === active
      if (!matchesSubject) return false
      if (!q) return true
      return [pick.name, pick.role, pick.city, pick.subject, pick.need]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(q))
    })
  }, [active, isFeatured, picks, query])

  const featuredPick = filteredPicks[0] ?? null
  const nextPick = picks[0] ?? null
  const moreFeaturedPicks = filteredPicks.filter((pick) => pick.id !== nextPick?.id).slice(0, 6)

  return (
    // The route layout owns the page <main>; keep this a <div> so landmarks
    // don't nest.
    <div className="min-h-screen bg-background">
      <section
        className="border-b border-border"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--card) 60%, transparent), transparent), radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--action-offer) 7%, transparent), transparent 38%), radial-gradient(circle at 82% 100%, color-mix(in srgb, var(--accent-ochre) 5%, transparent), transparent 40%), var(--background)',
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-12 text-center detail:px-8 detail:py-16">
          <div className="max-w-[720px] space-y-3">
            <div className="bc-section-kicker justify-center">Help queue</div>
            <h1 className="font-heading text-display-lg font-semibold leading-[1.08] tracking-normal text-foreground max-[480px]:text-display-md">
              {waitingCount > 0 ? 'Who should you help next?' : 'Your help queue is clear.'}
            </h1>
            <p className="mx-auto max-w-[620px] text-base leading-[1.55] text-muted-foreground">
              {waitingCount > 0
                ? 'Start with the best matched request, send one useful reply, then browse the rest when you have time.'
                : 'Keep your availability current so the next useful ask finds you.'}
            </p>
          </div>

          {nextPick ? (
            <NextHelpCard pick={nextPick} waitingCount={waitingCount} />
          ) : (
            <EmptyNextHelpCard />
          )}

          <div className="w-full max-w-[860px] text-left">
            <AvailabilityRail availability={availability} subjects={subjects} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-[18px] flex flex-col gap-4 detail:flex-row detail:items-end detail:justify-between detail:gap-6">
          <div>
            <h2 className="font-heading text-h1 font-semibold leading-tight tracking-normal text-foreground">
              More people you can help
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Search, browse by subject, or pick another match after the first reply.
            </p>
          </div>
          <label className="flex w-full items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2.25 detail:max-w-[360px] detail:flex-1">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, role, or topic..."
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-caption text-foreground outline-none placeholder:text-muted-foreground/60"
              aria-label="Search people to help"
            />
          </label>
        </div>

        <div className="flex items-end gap-1 border-b border-muted">
          <button
            type="button"
            onClick={() => setActive('featured')}
            className={cn(
              'relative inline-flex items-center gap-2 px-3.5 py-3 pb-3.5 font-heading text-sm font-semibold',
              isFeatured ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <Sparkles className="size-[13px]" />
            Featured
            {isFeatured ? (
              <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-foreground" />
            ) : null}
          </button>
          <SubjectPicker
            subjects={subjects}
            activeId={isFeatured ? null : active}
            onPick={setActive}
          />
        </div>

        <div className="pt-[22px]">
          {isFeatured ? (
            <div className="flex min-w-0 flex-col gap-4.5">
              <div className="flex items-baseline justify-between gap-3 pt-1">
                <p className="font-heading text-caption font-semibold uppercase tracking-label text-foreground">
                  People you could help
                </p>
                <span className="text-xs text-muted-foreground">Suggested first</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {moreFeaturedPicks.length > 0 ? (
                  moreFeaturedPicks.map((pick) => <AltPickCard key={pick.id} pick={pick} />)
                ) : featuredPick ? (
                  <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
                    That best next request is the only current match in this view.
                  </p>
                ) : (
                  <EmptyHelpCard />
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 detail:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="mb-0.5 flex items-baseline justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    <strong className="font-semibold text-foreground">
                      {filteredPicks.length} {filteredPicks.length === 1 ? 'person' : 'people'}
                    </strong>{' '}
                    asked about{' '}
                    <em
                      className="not-italic font-semibold"
                      style={{ color: activeSubject?.color ?? 'var(--primary)' }}
                    >
                      {activeSubject?.label ?? 'this subject'}
                    </em>{' '}
                    recently
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">Suggested first</span>
                </div>
                {filteredPicks.length > 0 ? (
                  filteredPicks.map((pick) => <SubjectFeedRow key={pick.id} pick={pick} />)
                ) : (
                  <EmptyHelpCard />
                )}
              </div>
              {activeSubject ? <SubjectSideRail subject={activeSubject} /> : null}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function AvailabilityRail({
  availability,
  subjects,
}: {
  availability: HelpAvailability
  subjects: HelpSubject[]
}) {
  const [topicsOpen, setTopicsOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-3.5 shadow-card-hover detail:flex-row detail:items-center detail:gap-5 detail:px-4.5 py-3.5">
      <div className="flex flex-wrap items-center gap-3.5 detail:gap-5">
        <AvailabilityStatus
          dot="var(--action-offer)"
          label="Open to helping"
          sub={availability.paused ? 'Paused' : availability.openToHelp ? 'Open' : 'Off'}
        />
      </div>

      <Divider className="hidden detail:block" />
      <div className="h-px w-full bg-muted detail:hidden" />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setTopicsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 text-left detail:pointer-events-none"
          aria-expanded={topicsOpen}
        >
          <span className="text-kicker font-semibold uppercase tracking-wider text-muted-foreground detail:mb-[5px]">
            Topics you offer · <span className="text-foreground">{subjects.length}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-kicker font-medium text-muted-foreground detail:hidden">
            {topicsOpen ? 'Hide' : 'Show'}
            <ChevronDown
              className={cn('size-3 transition-transform', topicsOpen && 'rotate-180')}
            />
          </span>
        </button>
        <div
          className={cn(
            'mt-2 flex flex-wrap gap-1.5 detail:mt-0 detail:gap-1',
            !topicsOpen && 'hidden detail:flex',
          )}
        >
          {subjects.map((subject) => (
            <TopicPill key={subject.id} accent={subject.color}>
              {subject.label}
            </TopicPill>
          ))}
        </div>
      </div>

      <Button asChild variant="outline" size="sm" className="w-full rounded-md detail:w-auto">
        <Link href="/settings#helping">Edit availability</Link>
      </Button>

      {availability.paused ? (
        <p className="rounded-md border border-accent-ochre/25 bg-accent-ochre/10 p-2 text-kicker leading-relaxed text-foreground detail:hidden">
          Paused while away. Editing availability clears the pause.
        </p>
      ) : null}
    </div>
  )
}

function AvailabilityStatus({
  dot,
  label,
  sub,
  mono = false,
}: {
  dot: string
  label: string
  sub: string
  mono?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <span
        className="size-3 rounded-full"
        style={{
          background: dot,
          boxShadow: `0 0 0 4px color-mix(in srgb, ${dot} 18%, transparent)`,
        }}
        aria-hidden
      />
      <div>
        <p className="text-caption font-semibold leading-none text-foreground">{label}</p>
        <p
          className={cn(
            'mt-0.5 text-kicker font-medium leading-tight text-muted-foreground',
            mono && 'font-mono',
          )}
        >
          {sub}
        </p>
      </div>
    </div>
  )
}

function Divider({ className }: { className?: string }) {
  return <div className={cn('h-9 w-px shrink-0 bg-muted', className)} aria-hidden />
}

function TopicPill({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <span
      className="whitespace-nowrap rounded-sm border px-2 py-1 font-mono text-xs font-medium"
      style={{
        background: `color-mix(in srgb, ${accent} 7%, var(--card))`,
        borderColor: `color-mix(in srgb, ${accent} 20%, transparent)`,
        color: accent,
      }}
    >
      {children}
    </span>
  )
}

function NextHelpCard({ pick, waitingCount }: { pick: HelpPick; waitingCount: number }) {
  return (
    <article className="w-full max-w-[860px] rounded-md border border-border bg-card p-5 text-left shadow-hero detail:px-6.5 py-6">
      <div className="grid gap-5 detail:grid-cols-[minmax(0,1fr)_210px]">
        <div className="min-w-0">
          <p className="bc-section-kicker mb-4">Best next reply</p>
          <div className="flex items-center gap-4">
            <HelpAvatar pick={pick} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/profile/${pick.personId}`}
                  className="font-heading text-xl font-semibold tracking-normal text-foreground hover:text-primary"
                >
                  {pick.name}
                </Link>
                {pick.cohort ? (
                  <span className="font-mono text-kicker text-muted-foreground">{pick.cohort}</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-caption text-muted-foreground">
                {pick.role} · {pick.posted}
              </p>
            </div>
          </div>

          {pick.isRealAsk ? (
            <p className="mt-[18px] font-heading text-lg leading-[1.45] tracking-normal text-foreground">
              &ldquo;{pick.need}&rdquo;
            </p>
          ) : (
            <p className="mt-[18px] font-heading text-lg leading-[1.45] tracking-normal text-foreground">
              {pick.need}
            </p>
          )}

          <p className="mt-3.5 text-caption text-muted-foreground">{pick.why[0]}</p>
        </div>

        <div className="rounded-md border border-muted bg-background p-4">
          <p className="bc-card-label">Today</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="font-heading text-2xl font-semibold leading-none text-foreground">
                {Math.max(waitingCount, 1)}
              </p>
              <p className="mt-1 text-kicker leading-tight text-muted-foreground">
                {waitingCount === 1 ? 'ask waiting' : 'asks waiting'}
              </p>
            </div>
            <div>
              <p className="font-heading text-2xl font-semibold leading-none text-foreground">
                {pick.estReply}
              </p>
              <p className="mt-1 text-kicker leading-tight text-muted-foreground">
                for a useful reply
              </p>
            </div>
          </div>
          <div className="mt-4">
            <TopicPill accent={pick.subjectColor}>{pick.subject}</TopicPill>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Button asChild variant="offer" size="default" className="rounded-md">
          <Link href={pick.href}>
            Offer help
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-md text-muted-foreground"
        >
          Not now
        </Button>
      </div>
    </article>
  )
}

function EmptyNextHelpCard() {
  return (
    <EmptyState
      title="No one is waiting today"
      description="You can still browse recent members below, or adjust the topics where classmates should find you."
      action={{ label: 'Edit availability', href: '/settings#helping' }}
      className="w-full max-w-[720px]"
    />
  )
}

function AltPickCard({ pick }: { pick: HelpPick }) {
  return (
    <div className="grid gap-3 rounded-md border border-muted bg-card px-4 py-3.5 detail:grid-cols-[36px_minmax(0,1fr)_auto] detail:items-start detail:gap-x-3">
      <HelpAvatar pick={pick} size={36} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/profile/${pick.personId}`}
            className="font-heading text-sm font-semibold tracking-copy text-foreground hover:text-primary"
          >
            {pick.name}
          </Link>
          {pick.cohort ? (
            <span className="font-mono text-xs text-muted-foreground">{pick.cohort}</span>
          ) : null}
          <span className="text-kicker text-muted-foreground">· {pick.role}</span>
        </div>
        <p className="mt-1.5 font-heading text-sm leading-[1.4] tracking-body-tight text-foreground">
          {pick.isRealAsk ? <>&ldquo;{pick.need}&rdquo;</> : pick.need}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-kicker text-muted-foreground">
          <span>{pick.why[0]}</span>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <span className="font-mono">{pick.posted}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 detail:flex-col detail:items-end">
        <Button asChild variant="outline" size="sm" className="rounded-md">
          <Link href={pick.href}>Offer help</Link>
        </Button>
      </div>
    </div>
  )
}

function SubjectFeedRow({ pick }: { pick: HelpPick }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted bg-card px-4.5 py-4 detail:flex-row detail:items-start detail:gap-4">
      <HelpAvatar pick={pick} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/profile/${pick.personId}`}
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            {pick.name}
          </Link>
          {pick.cohort ? (
            <span className="font-mono text-kicker text-muted-foreground">{pick.cohort}</span>
          ) : null}
          <span className="text-xs text-muted-foreground">{pick.role}</span>
          <span className="ml-auto font-mono text-kicker text-muted-foreground">{pick.posted}</span>
        </div>
        <p className="mt-2 text-caption leading-normal text-foreground">
          {pick.isRealAsk ? <>&ldquo;{pick.need}&rdquo;</> : pick.need}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <span className="text-kicker text-primary">{pick.why[0]}</span>
          <span className="text-kicker text-muted-foreground">
            · {pick.estReply} for a useful reply
          </span>
          <div className="flex gap-1.5 detail:ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-md text-muted-foreground"
            >
              Not now
            </Button>
            <Button asChild variant="offer" size="sm" className="rounded-md">
              <Link href={pick.href}>Offer help</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubjectSideRail({ subject }: { subject: HelpSubject }) {
  // No invented stats here — the previous "Your record" panel charted
  // hardcoded bars, which breaks the honesty rule. Real history can return
  // when we have real data to show.
  return (
    <aside className="flex flex-col gap-3.5">
      <div className="rounded-md border border-muted bg-card px-4.5 py-4">
        <p className="bc-card-label mb-2.5">{subject.label} · settings</p>
        <div className="flex flex-col gap-2 text-caption">
          <ToggleRow label="Email me new requests" on />
        </div>
        <Button asChild variant="outline" size="sm" className="mt-3.5 w-full rounded-md">
          <Link href="/settings#helping">Pause this subject</Link>
        </Button>
      </div>
    </aside>
  )
}

function SubjectPicker({
  subjects,
  activeId,
  onPick,
}: {
  subjects: HelpSubject[]
  activeId: string | null
  onPick: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const active = subjects.find((subject) => subject.id === activeId) ?? null
  const filtered = filter
    ? subjects.filter((subject) => subject.label.toLowerCase().includes(filter.toLowerCase()))
    : subjects

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'relative inline-grid max-w-[280px] grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3.5 py-3 pb-3.5 font-heading text-sm font-semibold',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {active ? (
          <span className="size-[7px] rounded-full" style={{ background: active.color }} />
        ) : (
          <span className="size-[7px] rounded-full border-[1.5px] border-muted-foreground" />
        )}
        <span className="min-w-0 truncate">{active ? active.label : 'Browse by subject'}</span>
        {active ? (
          <span className="font-mono text-kicker font-medium text-muted-foreground">
            {active.ask}
          </span>
        ) : null}
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
        {active ? <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-foreground" /> : null}
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-md border border-border bg-card p-1.5 shadow-[0_18px_40px_-12px_rgb(12_12_11_/_0.18),0_2px_6px_rgb(12_12_11_/_0.06)]">
          {subjects.length > 6 ? (
            <div className="-m-1.5 mb-1.5 flex items-center gap-2 border-b border-muted bg-background px-2.5 py-2">
              <Search className="size-[13px] text-muted-foreground" />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter subjects..."
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-caption text-foreground outline-none"
              />
            </div>
          ) : null}
          <div className="max-h-80 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => {
                    onPick(subject.id)
                    setOpen(false)
                    setFilter('')
                  }}
                  className={cn(
                    'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-caption text-foreground hover:bg-background',
                    subject.id === activeId && 'bg-background font-semibold',
                  )}
                >
                  <span className="size-2 rounded-full" style={{ background: subject.color }} />
                  <span className="min-w-0 truncate">{subject.label}</span>
                  <span className="font-mono text-kicker text-muted-foreground">{subject.ask}</span>
                </button>
              ))
            ) : (
              <p className="p-3.5 text-center text-caption text-muted-foreground">
                No subjects match.
              </p>
            )}
          </div>
          <div className="-mx-1.5 -mb-1.5 mt-1.5 flex items-center justify-between border-t border-muted px-3 py-2 text-kicker text-muted-foreground">
            <span>{subjects.length} subjects total</span>
            <Link
              href="/settings#helping"
              className="inline-flex items-center gap-1 font-semibold text-foreground"
            >
              <Plus className="size-[11px]" />
              Add subject
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EmptyHelpCard() {
  return (
    <EmptyState
      size="inline"
      title="No open requests in this view right now"
      description="When someone in the circle asks for help here, they'll show up for you."
      action={{ label: 'Edit availability', href: '/settings#helping' }}
    />
  )
}

function HelpAvatar({ pick, size }: { pick: HelpPick; size: number }) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md',
        avatarColorClasses(pick.personId),
      )}
      style={{ width: size, height: size }}
    >
      {pick.avatarUrl ? (
        <Image src={pick.avatarUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center font-heading text-sm font-semibold">
          {getInitials(pick.name)}
        </span>
      )}
    </div>
  )
}

function ToggleRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex cursor-default items-center justify-between gap-3">
      <span>{label}</span>
      <span
        className={cn(
          'relative h-[17px] w-[30px] rounded-full',
          on ? 'bg-accent-sage' : 'bg-border',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'absolute top-0.5 size-[13px] rounded-full bg-card',
            on ? 'right-0.5' : 'left-0.5',
          )}
        />
      </span>
    </div>
  )
}
