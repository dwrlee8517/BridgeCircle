'use client'

import { CalendarDays, ChevronRight, Pin, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import type { HelpAskSummary } from '@/lib/help/contracts'
import type { HomeDashboard as HomeDashboardData } from '@/lib/home/contracts'
import type { SchoolHome } from '@/lib/school/contracts'
import { cn } from '@/lib/utils'
import { writeHelpQuestionDraft } from './help/help-draft-storage'
import { HomeSpotlightDeck } from './home-spotlight'
import { HomeWaiting } from './home-waiting'

const MAX_QUESTION_LENGTH = 2_000

export function HomeDashboard({
  dashboard,
  membershipId,
  userId,
  avatarUrls,
  renderedAt,
}: {
  dashboard: HomeDashboardData
  membershipId: string
  userId: string
  avatarUrls: Record<string, string>
  renderedAt: string
}) {
  const router = useRouter()
  const questionRef = useRef<HTMLInputElement | null>(null)
  const [question, setQuestion] = useState('')
  const [questionError, setQuestionError] = useState<string | null>(null)
  const firstName = dashboard.greetingName?.split(/\s+/)[0] ?? null

  function handOffQuestion() {
    const cleaned = question.trim()
    if (!cleaned) {
      setQuestionError('Type your question first — it carries into Help from here.')
      questionRef.current?.focus()
      return
    }
    if (cleaned.length > MAX_QUESTION_LENGTH) {
      setQuestionError(
        `Keep your question under ${MAX_QUESTION_LENGTH.toLocaleString()} characters.`,
      )
      questionRef.current?.focus()
      return
    }
    writeHelpQuestionDraft(window.sessionStorage, membershipId, cleaned)
    router.push('/help?from=home')
  }

  if (dashboard.coldStart) {
    return (
      <HomeSurface>
        <ColdStart
          firstName={firstName}
          graduationYear={dashboard.graduationYear}
          organizationName={dashboard.organizationName}
        />
      </HomeSurface>
    )
  }

  const asks = dashboard.asks.status === 'ready' ? dashboard.asks.data : []
  const openAsks = asks
    .filter((ask) => ['waiting', 'open', 'accepted'].includes(ask.status))
    .slice(0, 4)
  const waiting = dashboard.waiting.status === 'ready' ? dashboard.waiting.data : []
  const school = dashboard.school.status === 'ready' ? dashboard.school.data : null

  return (
    <HomeSurface>
      <header>
        <h1 className="text-page-title leading-tight font-extrabold tracking-display text-foreground">
          {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
        </h1>
        <p className="mt-1.5 text-body-sm font-medium text-text-secondary">{dashboard.pulse}</p>
      </header>

      <HomeSpotlightDeck
        items={dashboard.spotlight}
        onAskFocus={() => {
          questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          questionRef.current?.focus()
        }}
      />
      {dashboard.paused ? (
        <p className="-mt-3 px-0.5 text-xs font-medium text-muted-foreground">
          You’re paused — flip the switch on{' '}
          <Link href="/help?mode=give" className="font-bold text-primary">
            Help · Give
          </Link>{' '}
          when you’re ready.
        </p>
      ) : null}

      <div className="mt-1 grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
        <div className="grid min-w-0 grid-cols-1 gap-4">
          <section className="rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-4.5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
            <h2 className="text-body-sm font-extrabold tracking-tight text-foreground">
              What do you need?
            </h2>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                handOffQuestion()
              }}
            >
              <label htmlFor="home-question" className="sr-only">
                What do you need help with?
              </label>
              <input
                ref={questionRef}
                id="home-question"
                value={question}
                onChange={(event) => {
                  setQuestion(event.target.value)
                  setQuestionError(null)
                }}
                maxLength={MAX_QUESTION_LENGTH + 1}
                aria-invalid={Boolean(questionError)}
                aria-describedby={
                  questionError
                    ? 'home-question-error home-question-privacy'
                    : 'home-question-privacy'
                }
                placeholder="Ask it the way it comes out…"
                className="min-h-11 min-w-0 flex-1 rounded-[14px] border-0 bg-card px-4 text-body-sm font-medium text-foreground shadow-[var(--ring-outline)] outline-none placeholder:text-muted-foreground focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
              />
              <button
                type="submit"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-45"
              >
                <Search aria-hidden className="size-4" /> Find people
              </button>
            </form>
            {questionError ? (
              <p
                id="home-question-error"
                role="alert"
                className="mt-2 text-xs font-semibold text-destructive"
              >
                {questionError}
              </p>
            ) : null}
            <p
              id="home-question-privacy"
              className="mt-2 text-xs font-medium text-muted-foreground"
            >
              Typing carries it to Help. Nothing is sent to anyone.
            </p>
          </section>

          {dashboard.waiting.status === 'failed' ? (
            <SourceUnavailable label="Waiting on you" />
          ) : waiting.length > 0 ? (
            <HomeWaiting userId={userId} initialItems={waiting} avatarUrls={avatarUrls} />
          ) : null}

          {dashboard.asks.status === 'failed' ? (
            <SourceUnavailable label="Your asks" />
          ) : (
            <OpenAsks
              asks={openAsks}
              renderedAt={renderedAt}
              activeCount={
                dashboard.help.status === 'ready'
                  ? dashboard.help.data.activeAskCount
                  : openAsks.length
              }
              activeLimit={
                dashboard.help.status === 'ready' ? dashboard.help.data.activeAskLimit : null
              }
            />
          )}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4">
          {dashboard.school.status === 'failed' ? (
            <SourceUnavailable label="From the school" />
          ) : school ? (
            <SchoolRail school={school} />
          ) : null}
          {[dashboard.help, dashboard.native, dashboard.messageCounts].some(
            (source) => source.status === 'failed',
          ) ? (
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-[var(--radius-card-xl)] bg-card px-5 py-4 text-left text-xs font-semibold text-text-secondary shadow-[var(--ring-card)] hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Some Home details could not refresh. Everything else is still current.{' '}
              <span className="font-extrabold text-primary">Try again →</span>
            </button>
          ) : null}
        </div>
      </div>
    </HomeSurface>
  )
}

function HomeSurface({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto grid w-full min-w-0 max-w-[1020px] grid-cols-1 gap-5">{children}</div>
    </div>
  )
}

function ColdStart({
  firstName,
  graduationYear,
  organizationName,
}: {
  firstName: string | null
  graduationYear: number | null
  organizationName: string
}) {
  const rows = [
    {
      href: '/help',
      title: 'Anything you’re trying to figure out?',
      body: 'Ask it the way it comes out — we’ll find who can speak to it.',
      action: 'Ask',
    },
    {
      href: '/help?mode=give',
      title: 'Want to help someone?',
      body: 'A few open asks may already match what you told us you know.',
      action: 'See asks',
    },
    {
      href: graduationYear ? `/people?classYear=${graduationYear}` : '/people',
      title: graduationYear ? `Say hi to your class` : 'Find someone you know',
      body: graduationYear
        ? `Class of ’${String(graduationYear).slice(-2)} is here — one hello starts your circle and your Messages.`
        : 'One hello starts your circle and your Messages.',
      action: graduationYear ? 'See your class' : 'See people',
    },
  ]

  return (
    <>
      <header>
        <h1 className="text-page-title leading-tight font-extrabold tracking-display text-foreground">
          {firstName ? `Welcome, ${firstName}.` : 'Welcome to your circle.'}
        </h1>
        <p className="mt-1.5 text-body-sm font-medium text-text-secondary">
          You’re in. A quiet start is normal — here are three ways to make the circle yours.
        </p>
      </header>
      <section
        aria-label="Ways to get started"
        className="overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]"
      >
        {rows.map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className="flex min-h-20 items-center gap-4 border-t border-border-subtle px-5 py-4 text-foreground first:border-t-0 hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring sm:px-6"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-body-sm font-extrabold tracking-tight">{row.title}</span>
              <span className="mt-1 block text-xs leading-relaxed font-medium text-text-secondary">
                {row.body}
              </span>
            </span>
            <span className="shrink-0 text-xs font-bold text-primary">{row.action} →</span>
          </Link>
        ))}
      </section>
      <p className="px-0.5 text-xs font-medium text-muted-foreground">
        Nothing here is required — the dashboard fills in as the circle does. {organizationName}’s
        events live on{' '}
        <Link href="/school" className="font-bold text-primary">
          School
        </Link>
        .
      </p>
    </>
  )
}

function OpenAsks({
  asks,
  renderedAt,
  activeCount,
  activeLimit,
}: {
  asks: HelpAskSummary[]
  renderedAt: string
  activeCount: number
  activeLimit: number | null
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
      <div className="flex items-baseline gap-2 px-5 py-3.5">
        <h2 className="text-body-sm font-extrabold tracking-tight text-foreground">Your asks</h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {activeLimit ? `${activeCount} of ${activeLimit} open` : `${activeCount} open`}
        </span>
        <Link href="/help/asks" className="ml-auto text-xs font-bold text-primary">
          See all →
        </Link>
      </div>
      {asks.length > 0 ? (
        <div>
          {asks.map((ask) => (
            <Link
              key={ask.id}
              href={`/help/asks/${ask.id}`}
              className="flex items-center gap-3 border-t border-border-subtle px-5 py-3.5 text-foreground hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-caption font-bold">{ask.question}</span>
                  <AskStatus ask={ask} renderedAt={renderedAt} />
                </span>
                <span className="mt-1 block text-xs font-medium text-text-secondary">
                  {askMeta(ask)}
                </span>
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="border-t border-border-subtle px-5 py-5">
          <p className="text-xs font-medium text-text-secondary">No open asks right now.</p>
          <Link href="/help" className="mt-1.5 inline-block text-xs font-bold text-primary">
            Ask the circle →
          </Link>
        </div>
      )}
    </section>
  )
}

function AskStatus({ ask, renderedAt }: { ask: HelpAskSummary; renderedAt: string }) {
  const days = Math.max(
    0,
    Math.ceil((Date.parse(ask.expiresAt) - Date.parse(renderedAt)) / 86_400_000),
  )
  const closing = ask.status !== 'accepted' && days <= 3
  const label =
    ask.status === 'accepted'
      ? 'Answered'
      : ask.offerCount > 0
        ? `${ask.offerCount} ${ask.offerCount === 1 ? 'offer' : 'offers'}`
        : closing
          ? `Closes in ${days}d`
          : ask.status === 'open'
            ? 'Open'
            : 'Waiting'
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-kicker font-bold',
        ask.status === 'accepted' && 'bg-[var(--give-tint)] text-[var(--action-give-text)]',
        ask.status !== 'accepted' &&
          !closing &&
          'bg-[var(--action-weak)] text-[var(--action-weak-text)]',
        closing && 'bg-[var(--closing-soon-tint)] text-[var(--closing-soon-text)]',
      )}
    >
      {label}
    </span>
  )
}

function SchoolRail({ school }: { school: SchoolHome }) {
  const events = school.events.slice(0, 2)
  const pinned = school.announcements.find((announcement) => announcement.pinned)
  if (events.length === 0 && !pinned) return null
  return (
    <section className="overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
      <div className="flex items-center gap-2 px-5 py-3.5">
        <h2 className="text-body-sm font-extrabold tracking-tight text-foreground">
          From the school
        </h2>
        <Link href="/school" className="ml-auto text-xs font-bold text-primary">
          School →
        </Link>
      </div>
      {events.map((event) => {
        const date = new Date(event.startsAt)
        return (
          <Link
            key={event.id}
            href={`/school/events/${event.id}`}
            className="flex items-center gap-3 border-t border-border-subtle px-5 py-3 text-foreground hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
          >
            <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-[var(--radius-comfortable)] bg-[linear-gradient(180deg,#eef5ff,#e2eeff)] leading-none shadow-[inset_0_0_0_1px_rgb(49_130_246_/_0.16)]">
              <span className="text-micro font-extrabold tracking-wider text-primary uppercase">
                {date.toLocaleDateString('en-US', { month: 'short', timeZone: event.timeZone })}
              </span>
              <span className="mt-0.5 text-caption font-extrabold text-foreground">
                {date.toLocaleDateString('en-US', { day: 'numeric', timeZone: event.timeZone })}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-caption font-bold">{event.title}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">
                {event.locationName ?? (event.format === 'online' ? 'Online' : event.campus)}
              </span>
            </span>
            {event.viewerRsvp === 'going' ? (
              <span className="shrink-0 rounded-full bg-[var(--give-tint)] px-2.5 py-1 text-kicker font-bold text-[var(--action-give-text)]">
                ✓ Going
              </span>
            ) : (
              <CalendarDays aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            )}
          </Link>
        )
      })}
      {pinned ? (
        <Link
          href={`/school/announcements/${pinned.id}`}
          className="block border-t border-border-subtle bg-[linear-gradient(90deg,#eaf3ff,#fbfdff)] px-5 py-3.5 text-foreground shadow-[inset_3px_0_0_var(--action-primary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
        >
          <span className="inline-flex items-center gap-1.5 text-kicker font-bold text-primary">
            <Pin aria-hidden className="size-3" /> Pinned
          </span>
          <span className="mt-1 block text-caption leading-snug font-bold">{pinned.title}</span>
          <span className="mt-1 block text-kicker font-medium text-muted-foreground">
            {pinned.tag.charAt(0).toUpperCase() + pinned.tag.slice(1)}
          </span>
        </Link>
      ) : null}
    </section>
  )
}

function SourceUnavailable({ label }: { label: string }) {
  const router = useRouter()
  return (
    <section className="rounded-[var(--radius-card-xl)] bg-card px-5 py-4 shadow-[var(--ring-card)]">
      <h2 className="text-body-sm font-extrabold text-foreground">{label}</h2>
      <p className="mt-1 text-xs font-medium text-text-secondary">
        This part couldn’t refresh. The rest of Home is still available.
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-2 text-xs font-bold text-primary"
      >
        Try again →
      </button>
    </section>
  )
}

function askMeta(ask: HelpAskSummary) {
  if (ask.kind === 'direct' && ask.recipient) {
    return `To ${ask.recipient.displayName} · sent ${formatDate(ask.createdAt)}`
  }
  return `Asked the circle · posted ${formatDate(ask.createdAt)}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(value),
  )
}
