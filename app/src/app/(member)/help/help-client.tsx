'use client'

import { ArrowRight, ChevronDown, Plus, Search, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type HelpAvailability = {
  openToAdvice: boolean
  openToMentorship: boolean
  activeMentees: number
  maxMentees: number
  topics: string[]
  paused: boolean
  responseRate: number
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
  fit: number
  mode: 'advice' | 'mentorship'
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
    <main className="min-h-screen bg-background">
      <section
        className="border-b border-border"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--card) 60%, transparent), transparent), radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--action-offer) 7%, transparent), transparent 38%), radial-gradient(circle at 82% 100%, color-mix(in srgb, var(--accent-ochre) 5%, transparent), transparent 40%), var(--background)',
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-12 text-center min-[761px]:px-8 min-[761px]:py-16">
          <div className="max-w-[720px] space-y-3">
            <div className="bc-section-kicker justify-center">Help queue</div>
            <h1 className="font-heading text-[38px] font-semibold leading-[1.08] tracking-normal text-foreground max-[480px]:text-[31px]">
              {waitingCount > 0 ? 'Who should you help next?' : 'Your help queue is clear.'}
            </h1>
            <p className="mx-auto max-w-[620px] text-[16px] leading-[1.55] text-muted-foreground">
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
        <div className="mb-[18px] flex flex-col gap-4 min-[761px]:flex-row min-[761px]:items-end min-[761px]:justify-between min-[761px]:gap-6">
          <div>
            <h2 className="font-heading text-[22px] font-semibold leading-tight tracking-normal text-foreground">
              More people you can help
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Search, browse by subject, or pick another match after the first reply.
            </p>
          </div>
          <label className="flex w-full items-center gap-2.5 rounded-md border border-border bg-card px-3 py-[9px] min-[761px]:max-w-[360px] min-[761px]:flex-1">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, role, or topic..."
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
              aria-label="Search people to help"
            />
          </label>
        </div>

        <div className="flex items-end gap-1 border-b border-muted">
          <button
            type="button"
            onClick={() => setActive('featured')}
            className={cn(
              'relative inline-flex items-center gap-2 px-[14px] py-3 pb-3.5 font-heading text-sm font-semibold',
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
            <div className="flex min-w-0 flex-col gap-[18px]">
              <div className="flex items-baseline justify-between gap-3 pt-1">
                <p className="font-heading text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground">
                  Matched asks and introductions
                </p>
                <span className="text-xs text-muted-foreground">Sorted by AI fit</span>
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
            <div className="grid gap-6 min-[761px]:grid-cols-[minmax(0,1fr)_280px]">
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
                  <span className="shrink-0 text-xs text-muted-foreground">Sorted by AI fit</span>
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
    </main>
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
  const mentorshipSub = availability.openToMentorship
    ? `${availability.activeMentees} / ${availability.maxMentees} active`
    : 'Off'

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-[14px_16px] shadow-card-hover min-[761px]:flex-row min-[761px]:items-center min-[761px]:gap-5 min-[761px]:p-[14px_18px]">
      <div className="flex flex-wrap items-center gap-3.5 min-[761px]:gap-5">
        <AvailabilityStatus
          dot="var(--primary)"
          label="Advice"
          sub={availability.openToAdvice ? 'Open' : 'Off'}
        />
        <Divider />
        <AvailabilityStatus dot="var(--action-offer)" label="Mentorship" sub={mentorshipSub} mono />
      </div>

      <Divider className="hidden min-[761px]:block" />
      <div className="h-px w-full bg-muted min-[761px]:hidden" />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setTopicsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 text-left min-[761px]:pointer-events-none"
          aria-expanded={topicsOpen}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground min-[761px]:mb-[5px]">
            Topics you offer · <span className="text-foreground">{subjects.length}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground min-[761px]:hidden">
            {topicsOpen ? 'Hide' : 'Show'}
            <ChevronDown
              className={cn('size-3 transition-transform', topicsOpen && 'rotate-180')}
            />
          </span>
        </button>
        <div
          className={cn(
            'mt-2 flex flex-wrap gap-1.5 min-[761px]:mt-0 min-[761px]:gap-1',
            !topicsOpen && 'hidden min-[761px]:flex',
          )}
        >
          {subjects.map((subject) => (
            <TopicPill key={subject.id} accent={subject.color}>
              {subject.label}
            </TopicPill>
          ))}
        </div>
      </div>

      <Button asChild variant="outline" size="sm" className="w-full rounded-md min-[761px]:w-auto">
        <Link href="/mentorship/settings">Edit availability</Link>
      </Button>

      {availability.paused ? (
        <p className="rounded-md border border-accent-ochre/25 bg-accent-ochre/10 p-2 text-[11px] leading-relaxed text-foreground min-[761px]:hidden">
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
        <p className="text-[13.5px] font-semibold leading-none text-foreground">{label}</p>
        <p
          className={cn(
            'mt-0.5 text-[11px] font-medium leading-tight text-muted-foreground',
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
    <article className="w-full max-w-[860px] rounded-md border border-border bg-card p-5 text-left shadow-hero min-[761px]:p-[24px_26px]">
      <div className="grid gap-5 min-[761px]:grid-cols-[minmax(0,1fr)_210px]">
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
                  <span className="font-mono text-[11.5px] text-muted-foreground">
                    {pick.cohort}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {pick.role} · {pick.posted}
              </p>
            </div>
          </div>

          <p className="mt-[18px] font-heading text-lg leading-[1.45] tracking-normal text-foreground">
            &ldquo;{pick.need}&rdquo;
          </p>

          <p className="mt-3.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <Sparkles className="size-[11px] shrink-0" />
            <span className="italic">{pick.why[0]}</span>
          </p>
        </div>

        <div className="rounded-md border border-muted bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.10em] text-muted-foreground">
              Today
            </p>
            <FitBadge fit={pick.fit} compact />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="font-heading text-2xl font-semibold leading-none text-foreground">
                {Math.max(waitingCount, 1)}
              </p>
              <p className="mt-1 text-[11.5px] leading-tight text-muted-foreground">
                {waitingCount === 1 ? 'ask waiting' : 'asks waiting'}
              </p>
            </div>
            <div>
              <p className="font-heading text-2xl font-semibold leading-none text-foreground">
                {pick.estReply}
              </p>
              <p className="mt-1 text-[11.5px] leading-tight text-muted-foreground">useful reply</p>
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
            {pick.mode === 'mentorship' ? 'Offer mentorship' : 'Offer advice'}
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
    <div className="w-full max-w-[720px] rounded-md border border-dashed border-border bg-card p-6 text-center shadow-card">
      <p className="font-heading text-lg font-semibold text-foreground">No one is waiting today.</p>
      <p className="mx-auto mt-2 max-w-[460px] text-sm leading-relaxed text-muted-foreground">
        You can still browse recent members below or tune the topics where classmates should find
        you.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4 rounded-md">
        <Link href="/mentorship/settings">Tune availability</Link>
      </Button>
    </div>
  )
}

function AltPickCard({ pick }: { pick: HelpPick }) {
  return (
    <div className="grid gap-3 rounded-md border border-muted bg-card p-[14px_16px] min-[761px]:grid-cols-[36px_minmax(0,1fr)_auto] min-[761px]:items-start min-[761px]:gap-x-3">
      <HelpAvatar pick={pick} size={36} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/profile/${pick.personId}`}
            className="font-heading text-sm font-semibold tracking-[-0.005em] text-foreground hover:text-primary"
          >
            {pick.name}
          </Link>
          {pick.cohort ? (
            <span className="font-mono text-xs text-muted-foreground">{pick.cohort}</span>
          ) : null}
          <span className="text-[11.5px] text-muted-foreground">· {pick.role}</span>
        </div>
        <p className="mt-1.5 font-heading text-sm leading-[1.4] tracking-[-0.003em] text-foreground">
          &ldquo;{pick.need}&rdquo;
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <Sparkles className="size-2.5 shrink-0" />
          <span className="italic">{pick.why[0]}</span>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <span className="font-mono">{pick.posted}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 min-[761px]:flex-col min-[761px]:items-end">
        <FitBadge fit={pick.fit} compact />
        <Button asChild variant="outline" size="sm" className="rounded-md">
          <Link href={pick.href}>{pick.mode === 'mentorship' ? 'Mentor' : 'Help'}</Link>
        </Button>
      </div>
    </div>
  )
}

function SubjectFeedRow({ pick }: { pick: HelpPick }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted bg-card p-[16px_18px] min-[761px]:flex-row min-[761px]:items-start min-[761px]:gap-4">
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
            <span className="font-mono text-[11px] text-muted-foreground">{pick.cohort}</span>
          ) : null}
          <span className="text-xs text-muted-foreground">{pick.role}</span>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">{pick.posted}</span>
        </div>
        <p className="mt-2 text-[13.5px] leading-normal text-foreground">
          &ldquo;{pick.need}&rdquo;
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] italic text-primary">
            <Sparkles className="size-[11px]" />
            {pick.why[0]}
          </span>
          <span className="text-[11.5px] text-muted-foreground">
            · {pick.fit}% fit · {pick.estReply}
          </span>
          <div className="flex gap-1.5 min-[761px]:ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-md text-muted-foreground"
            >
              Pass
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
  const bars = [
    { id: 'jun-01', value: 2 },
    { id: 'jun-02', value: 1 },
    { id: 'jun-03', value: 3 },
    { id: 'jun-04', value: 1 },
    { id: 'jun-05', value: 2 },
    { id: 'jun-06', value: 0 },
    { id: 'may-01', value: 2 },
    { id: 'may-02', value: 1 },
    { id: 'may-03', value: 2 },
    { id: 'may-04', value: 3 },
    { id: 'may-05', value: 2 },
    { id: 'may-06', value: 1 },
  ]

  return (
    <aside className="flex flex-col gap-3.5">
      <div className="rounded-md border border-muted bg-card p-[16px_18px]">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.10em] text-muted-foreground">
          Your record · {subject.label}
        </p>
        <p className="font-heading text-[32px] font-semibold" style={{ color: subject.color }}>
          {subject.helped}
        </p>
        <p className="text-[12.5px] text-muted-foreground">people helped this year</p>
        <div className="mt-4 grid h-10 grid-cols-12 items-end gap-[3px]">
          {bars.map((bar) => (
            <div
              key={`${subject.id}-${bar.id}`}
              className="rounded-sm"
              style={{
                height: `${(bar.value / 3) * 100 || 8}%`,
                background: bar.value ? subject.color : 'var(--surface-subtle)',
                opacity: bar.value ? 0.4 + (bar.value / 3) * 0.6 : 1,
              }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground">
          <span>Jun</span>
          <span>May</span>
        </div>
      </div>

      <div className="rounded-md border border-muted bg-card p-[16px_18px]">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.10em] text-muted-foreground">
          Tune this channel
        </p>
        <div className="flex flex-col gap-2 text-[13px]">
          <ToggleRow label="Email me new matches" on />
          <ToggleRow label="Show low-fit (<70%)" on={false} />
        </div>
        <Button asChild variant="outline" size="sm" className="mt-3.5 w-full rounded-md">
          <Link href="/mentorship/settings">Pause this subject</Link>
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
          'relative inline-grid max-w-[280px] grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-[14px] py-3 pb-3.5 font-heading text-sm font-semibold',
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
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
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
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-foreground outline-none"
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
                    'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13.5px] text-foreground hover:bg-background',
                    subject.id === activeId && 'bg-background font-semibold',
                  )}
                >
                  <span className="size-2 rounded-full" style={{ background: subject.color }} />
                  <span className="min-w-0 truncate">{subject.label}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{subject.ask}</span>
                </button>
              ))
            ) : (
              <p className="p-3.5 text-center text-[13px] text-muted-foreground">
                No subjects match.
              </p>
            )}
          </div>
          <div className="-mx-1.5 -mb-1.5 mt-1.5 flex items-center justify-between border-t border-muted px-3 py-2 text-[11.5px] text-muted-foreground">
            <span>{subjects.length} subjects total</span>
            <Link
              href="/mentorship/settings"
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
    <div className="rounded-md border border-border bg-card p-6 text-center">
      <p className="font-heading text-base font-semibold text-foreground">
        No open asks in this view right now.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        We will surface matched asks here as they arrive.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4 rounded-md">
        <Link href="/mentorship/settings">Tune availability</Link>
      </Button>
    </div>
  )
}

function FitBadge({ fit, compact = false }: { fit: number; compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-muted bg-background font-bold uppercase tracking-[0.08em] text-muted-foreground',
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      )}
    >
      <Sparkles className={compact ? 'size-3' : 'size-3'} />
      {fit}% fit
    </span>
  )
}

function HelpAvatar({ pick, size }: { pick: HelpPick; size: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-md bg-surface-subtle"
      style={{ width: size, height: size }}
    >
      {pick.avatarUrl ? (
        <Image src={pick.avatarUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center font-heading text-sm font-semibold text-muted-foreground">
          {initials(pick.name)}
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
