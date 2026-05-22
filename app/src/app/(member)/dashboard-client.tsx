'use client'

import { format, formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  CalendarDays,
  CalendarX,
  ChevronDown,
  ChevronUp,
  Columns,
  Eye,
  EyeOff,
  Handshake,
  LayoutGrid,
  MapPin,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Settings2,
  UserPlus,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type {
  HomeActiveMentorship,
  HomeEvent,
  HomeFeed,
  HomeMember,
  HomeNotification,
  HomePendingMentorRequest,
} from '@/lib/home/getHomeFeed'
import CircleMovesToggle from './circle-moves-toggle'

// Define the deck ID keys
export type DeckId =
  | 'daily-brief'
  | 'circle-telemetry'
  | 'circle-moves'
  | 'action-nudge'
  | 'featured-gathering'
  | 'visual-map'
  | 'thank-you-wall'
  | 'active-mentorships'
  | 'recent-activity'
  | 'quick-actions'

interface DeckItem {
  id: DeckId
  label: string
  visible: boolean
}

// Default columns layout structure
const DEFAULT_LEFT_COL: DeckItem[] = [
  { id: 'daily-brief', label: 'Daily Brief', visible: true },
  { id: 'circle-telemetry', label: 'Cohort Telemetry', visible: true },
  { id: 'circle-moves', label: 'Circle Moves', visible: true },
]

const DEFAULT_RIGHT_COL: DeckItem[] = [
  { id: 'action-nudge', label: 'One Small Thing (Action Nudge)', visible: true },
  { id: 'featured-gathering', label: 'Featured Gathering', visible: true },
  { id: 'visual-map', label: 'Where the Circle Is (Map)', visible: true },
  { id: 'thank-you-wall', label: 'Thank-You Wall', visible: true },
  { id: 'active-mentorships', label: 'Active Mentorships', visible: true },
  { id: 'recent-activity', label: 'Recent Activity', visible: true },
  { id: 'quick-actions', label: 'Quick Actions', visible: true },
]

const LOCAL_STORAGE_KEY = 'bridgecircle_dashboard_layout_v2'

interface DashboardClientProps {
  feed: HomeFeed
  firstName: string
  cohortYear: number | null
  orgDisplayName: string
  viewerCity: string | null
  isHelper: boolean
}

export default function DashboardClient({
  feed,
  firstName,
  cohortYear,
  orgDisplayName,
  viewerCity,
  isHelper,
}: DashboardClientProps) {
  const [leftCol, setLeftCol] = useState<DeckItem[]>(DEFAULT_LEFT_COL)
  const [rightCol, setRightCol] = useState<DeckItem[]>(DEFAULT_RIGHT_COL)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const { left, right } = JSON.parse(stored) as {
          left: DeckItem[]
          right: DeckItem[]
        }
        // Verify all IDs exist (for backwards compatibility if layout changes)
        const validateCol = (col: DeckItem[], defaults: DeckItem[]) => {
          const valid = col.filter((item) => defaults.some((d) => d.id === item.id))
          // Add missing items if any
          const missing = defaults.filter((d) => !col.some((item) => item.id === d.id))
          return [...valid, ...missing]
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLeftCol(validateCol(left, DEFAULT_LEFT_COL))
        setRightCol(validateCol(right, DEFAULT_RIGHT_COL))
      }
    } catch (e) {
      console.error('Failed to load dashboard layout settings', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to LocalStorage
  const saveLayout = (newLeft: DeckItem[], newRight: DeckItem[]) => {
    setLeftCol(newLeft)
    setRightCol(newRight)
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ left: newLeft, right: newRight }))
    } catch (e) {
      console.error('Failed to save dashboard layout settings', e)
    }
  }

  const handleReset = () => {
    saveLayout(DEFAULT_LEFT_COL, DEFAULT_RIGHT_COL)
  }

  // Rearranging functions
  const moveUp = (index: number, isLeft: boolean) => {
    const col = isLeft ? [...leftCol] : [...rightCol]
    if (index === 0) return
    const temp = col[index]
    col[index] = col[index - 1]
    col[index - 1] = temp
    if (isLeft) saveLayout(col, rightCol)
    else saveLayout(leftCol, col)
  }

  const moveDown = (index: number, isLeft: boolean) => {
    const col = isLeft ? [...leftCol] : [...rightCol]
    if (index === col.length - 1) return
    const temp = col[index]
    col[index] = col[index + 1]
    col[index + 1] = temp
    if (isLeft) saveLayout(col, rightCol)
    else saveLayout(leftCol, col)
  }

  const toggleVisibility = (id: DeckId, isLeft: boolean) => {
    if (isLeft) {
      const newCol = leftCol.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item,
      )
      saveLayout(newCol, rightCol)
    } else {
      const newCol = rightCol.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item,
      )
      saveLayout(leftCol, newCol)
    }
  }

  const moveToOtherColumn = (index: number, isLeft: boolean) => {
    if (isLeft) {
      const item = leftCol[index]
      const newLeft = leftCol.filter((_, i) => i !== index)
      const newRight = [...rightCol, item]
      saveLayout(newLeft, newRight)
    } else {
      const item = rightCol[index]
      const newRight = rightCol.filter((_, i) => i !== index)
      const newLeft = [...leftCol, item]
      saveLayout(newLeft, newRight)
    }
  }

  const featuredEvent = feed.upcomingEvents[0] ?? null
  const otherEvents = feed.upcomingEvents.slice(1)

  // Sub-component switch
  const renderDeck = (id: DeckId) => {
    switch (id) {
      case 'daily-brief':
        return (
          <DailyBrief
            key={id}
            text={generateDailyBrief(
              orgDisplayName,
              feed.recentJoiners,
              featuredEvent,
              feed.stats.openMentorsTotal,
              viewerCity,
            )}
          />
        )
      case 'circle-telemetry':
        return <CircleTelemetry key={id} telemetry={feed.telemetry} />
      case 'circle-moves':
        return (
          <div key={id} className="space-y-4">
            <CircleMovesToggle careerMoves={feed.careerMoves} locationMoves={feed.locationMoves} />
          </div>
        )
      case 'action-nudge':
        return (
          <ActionNudge
            key={id}
            requests={feed.pendingMentorRequests}
            viewerCity={viewerCity}
            featuredEvent={featuredEvent}
            isHelper={isHelper}
          />
        )
      case 'featured-gathering':
        return (
          <CalendarSection
            key={id}
            featured={featuredEvent}
            otherEvents={otherEvents}
            stats={feed.stats}
          />
        )
      case 'visual-map':
        return (
          <VisualMapCard key={id} telemetryCities={feed.telemetry.cities} viewerCity={viewerCity} />
        )
      case 'thank-you-wall':
        return <ThankYouWall key={id} />
      case 'active-mentorships':
        return <ActiveMentorships key={id} mentorships={feed.activeMentorships} />
      case 'recent-activity':
        return <RecentActivityWire key={id} notifications={feed.recentNotifications} />
      case 'quick-actions':
        return <QuickActions key={id} stats={feed.stats} />
      default:
        return null
    }
  }

  return (
    <div
      className={`min-h-screen bg-background pb-12 transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Editorial Midnight Hero Header */}
      <MidnightHero
        firstName={firstName}
        cohortYear={cohortYear}
        orgDisplayName={orgDisplayName}
        stats={feed.stats}
        pendingRequestsCount={feed.pendingMentorRequests.length}
        onCustomizeClick={() => setIsCustomizing(true)}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 relative">
        {/* Dynamic Columns Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[65fr_35fr] items-start">
          {/* Left Rail */}
          <div className="space-y-8">
            {leftCol.filter((d) => d.visible).map((d) => renderDeck(d.id))}
          </div>

          {/* Right Rail */}
          <div className="space-y-8">
            {rightCol.filter((d) => d.visible).map((d) => renderDeck(d.id))}
          </div>
        </div>
      </div>

      {/* Floating Layout Customize triggers */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsCustomizing(true)}
          className="rounded-[6px] shadow-lg border border-border bg-card text-foreground hover:bg-muted font-sans font-medium text-xs px-4 h-10 gap-2 cursor-pointer transition active:scale-95"
        >
          <Settings2 className="size-3.5 text-primary" />
          Customize Layout
        </Button>
      </div>

      {/* Glassmorphic Customizer Drawer */}
      {isCustomizing && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50 flex justify-end transition-all">
          <div
            className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl relative"
            style={{ animation: 'slideIn 0.3s ease' }}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
                  <LayoutGrid className="size-4 text-primary" />
                  Customize Dashboard
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rearrange, show, or hide elements to fit your workflow.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCustomizing(false)}
                className="rounded-[6px] size-8 shrink-0 hover:bg-muted"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Left Column Config */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-border/60">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Columns className="size-3 text-primary" />
                    Left Column (65% width)
                  </span>
                </div>
                <div className="space-y-2.5">
                  {leftCol.map((item, idx) => (
                    <LayoutItemCard
                      key={item.id}
                      item={item}
                      index={idx}
                      isLeft={true}
                      onMoveUp={() => moveUp(idx, true)}
                      onMoveDown={() => moveDown(idx, true)}
                      onToggle={() => toggleVisibility(item.id, true)}
                      onMoveColumn={() => moveToOtherColumn(idx, true)}
                      isFirst={idx === 0}
                      isLast={idx === leftCol.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column Config */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-border/60">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Columns className="size-3 text-primary" />
                    Right Column (35% width)
                  </span>
                </div>
                <div className="space-y-2.5">
                  {rightCol.map((item, idx) => (
                    <LayoutItemCard
                      key={item.id}
                      item={item}
                      index={idx}
                      isLeft={false}
                      onMoveUp={() => moveUp(idx, false)}
                      onMoveDown={() => moveDown(idx, false)}
                      onToggle={() => toggleVisibility(item.id, false)}
                      onMoveColumn={() => moveToOtherColumn(idx, false)}
                      isFirst={idx === 0}
                      isLast={idx === rightCol.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/20 flex gap-3">
              <Button
                variant="outline"
                className="w-full text-xs font-medium h-9 gap-1.5 rounded-[6px]"
                onClick={handleReset}
              >
                <RefreshCw className="size-3" />
                Reset Defaults
              </Button>
              <Button
                className="w-full text-xs font-semibold h-9 rounded-[6px] bg-foreground text-background hover:bg-foreground/90"
                onClick={() => setIsCustomizing(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Layout customizer row helper card
function LayoutItemCard({
  item,
  onMoveUp,
  onMoveDown,
  onToggle,
  onMoveColumn,
  isFirst,
  isLast,
}: {
  item: DeckItem
  index: number
  isLeft: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
  onMoveColumn: () => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 border rounded-[6px] transition-all bg-card ${
        item.visible
          ? 'border-border shadow-xs hover:border-border/80'
          : 'border-border/40 bg-muted/10 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-hidden shrink-0"
        >
          {item.visible ? (
            <Eye className="size-4 text-primary" />
          ) : (
            <EyeOff className="size-4 text-muted-foreground/60" />
          )}
        </button>
        <span
          className={`text-xs font-medium truncate ${
            item.visible ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {item.label}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Switch rail button */}
        <button
          type="button"
          onClick={onMoveColumn}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 cursor-pointer focus:outline-hidden"
          title="Move to other column"
        >
          <Columns className="size-3" />
        </button>
        {/* Reordering Up/Down controls */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className={`p-1 rounded hover:bg-muted shrink-0 cursor-pointer focus:outline-hidden ${
            isFirst
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className={`p-1 rounded hover:bg-muted shrink-0 cursor-pointer focus:outline-hidden ${
            isLast
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// MidnightHero Banner (Premium editorial header deck)
// =============================================================================
function MidnightHero({
  firstName,
  cohortYear,
  orgDisplayName,
  stats,
  pendingRequestsCount,
  onCustomizeClick,
}: {
  firstName: string
  cohortYear: number | null
  orgDisplayName: string
  stats: {
    newJoinersLast7d: number
    openMentorsTotal: number
    upcomingEventsTotal: number
  }
  pendingRequestsCount: number
  onCustomizeClick: () => void
}) {
  const cohortText = cohortYear ? `Class of '${`${cohortYear}`.slice(-2)}` : null

  return (
    <section className="relative overflow-hidden bg-surface-midnight text-surface-midnight-foreground py-12 px-6 sm:px-8 border-b border-border/20">
      {/* Editorial wire motif SVG */}
      <svg
        className="absolute top-[-40px] right-[-60px] w-[520px] h-[380px] opacity-15 pointer-events-none stroke-primary-on-dark"
        viewBox="0 0 520 380"
        aria-hidden="true"
      >
        <title>Symmetric wireframe circles</title>
        <circle cx="200" cy="190" r="140" fill="none" strokeWidth="1.5" />
        <circle cx="320" cy="190" r="140" fill="none" strokeWidth="1.5" />
      </svg>

      <div className="mx-auto max-w-6xl relative">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between border-b border-surface-midnight-foreground/15 pb-4">
          <p className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-primary-on-dark">
            {cohortText ? `${cohortText} · ` : ''}Welcome back to {orgDisplayName}
          </p>
          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-surface-midnight-muted flex items-center gap-2 mt-1 md:mt-0">
            <span>{format(new Date(), 'EEE d MMM yyyy')}</span>
            <span className="text-primary-on-dark">●</span>
            <span>Edition 142</span>
            <span className="text-primary-on-dark">●</span>
            <button
              type="button"
              onClick={onCustomizeClick}
              className="text-primary-on-dark hover:text-surface-midnight-foreground cursor-pointer hover:underline underline-offset-2 transition-colors focus:outline-hidden"
            >
              [Customize Layout]
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight leading-[1.1] text-surface-midnight-foreground">
              Good afternoon, {firstName}.<br />
              <span className="text-primary-on-dark">Your circle is active today.</span>
            </h1>
            <p className="text-sm text-surface-midnight-muted max-w-xl leading-relaxed">
              {pendingRequestsCount > 0
                ? `${pendingRequestsCount} pending mentorship requests need your attention, and new career updates have been posted.`
                : `Your professional circle has grown by ${stats.newJoinersLast7d} members this week. Refresh your advice focus or explore upcoming events.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              asChild
              className="rounded-[6px] text-xs font-semibold px-4 h-9 bg-surface-midnight-foreground text-surface-midnight hover:bg-surface-midnight-foreground/90 cursor-pointer transition"
            >
              <Link href="/inbox" className="flex items-center gap-1.5">
                <Handshake className="size-3.5" />
                Review Requests
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-[6px] text-xs font-semibold px-4 h-9 border-surface-midnight-foreground/25 bg-surface-midnight-foreground/5 text-surface-midnight-foreground hover:bg-surface-midnight-foreground/10 hover:text-surface-midnight-foreground cursor-pointer transition"
            >
              <Link href="/events" className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Upcoming Events
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero metrics strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-surface-midnight-foreground/15 mt-12 pt-6">
          <div className="border-l border-surface-midnight-foreground/15 pl-4 first:border-l-0 first:pl-0">
            <div className="font-serif text-3xl font-bold leading-none text-surface-midnight-foreground">
              {stats.newJoinersLast7d}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-surface-midnight-muted mt-1.5">
              New this week
            </div>
          </div>
          <div className="border-l border-surface-midnight-foreground/15 pl-4">
            <div className="font-serif text-3xl font-bold leading-none text-surface-midnight-foreground">
              {stats.openMentorsTotal}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-surface-midnight-muted mt-1.5">
              Open Mentors
            </div>
          </div>
          <div className="border-l border-surface-midnight-foreground/15 pl-4">
            <div className="font-serif text-3xl font-bold leading-none text-surface-midnight-foreground">
              {stats.upcomingEventsTotal}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-surface-midnight-muted mt-1.5">
              Gatherings
            </div>
          </div>
          <div className="border-l border-surface-midnight-foreground/15 pl-4">
            <div className="font-serif text-3xl font-bold leading-none text-surface-midnight-foreground">
              Class &apos;{`${cohortYear ?? new Date().getFullYear()}`.slice(-2)}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-surface-midnight-muted mt-1.5">
              Your Cohort
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// Dynamic editorial Daily Brief
// =============================================================================
function generateDailyBrief(
  orgName: string,
  recentJoiners: HomeMember[],
  upcomingEvent: HomeEvent | null,
  openMentorsCount: number,
  userCity: string | null,
): string {
  const parts: string[] = []

  if (recentJoiners.length > 0) {
    const primary = recentJoiners[0]
    const yearShort = primary.graduationYear ? `’${String(primary.graduationYear).slice(-2)}` : ''
    const jobText = primary.currentTitle ? ` as [${primary.currentTitle}]` : ''
    const employerText = primary.currentEmployer ? ` at [${primary.currentEmployer}]` : ''
    const locationText = primary.city ? ` in [${primary.city}]` : ''
    parts.push(
      `Recently active: [${primary.name}] (${yearShort})${jobText}${employerText}${locationText} joined the wire feed.`,
    )
  } else {
    parts.push(`Welcome to the daily briefing for [${orgName}].`)
  }

  if (userCity && recentJoiners.length > 1) {
    const localMatch = recentJoiners
      .slice(1)
      .find((m) => m.city?.toLowerCase() === userCity.toLowerCase())
    if (localMatch) {
      const yearShort = localMatch.graduationYear
        ? `’${String(localMatch.graduationYear).slice(-2)}`
        : ''
      parts.push(
        `Local connection: [${localMatch.name}] (${yearShort}) is also based in your city, [${userCity}].`,
      )
    }
  }

  if (openMentorsCount > 0) {
    parts.push(
      `There are [${openMentorsCount} open mentors] available for career advice or craft reviews.`,
    )
  }

  if (upcomingEvent) {
    const dateFormatted = format(new Date(upcomingEvent.startsAt), 'MMM d')
    const locationText = upcomingEvent.location ? ` at [${upcomingEvent.location}]` : ''
    parts.push(
      `On your calendar: the [${upcomingEvent.title}] is scheduled for [${dateFormatted}]${locationText}.`,
    )
  }

  return parts.join(' ')
}

function DailyBrief({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g)
  const renderText = () => {
    const partsWithKeys = parts.map((part, idx) => ({
      part,
      keyId: `brief-${idx}-${part.length}`,
    }))

    return partsWithKeys.map(({ part, keyId }) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const label = part.slice(1, -1)
        let href = ''
        if (label.toLowerCase().includes('mentor')) {
          href = '/people'
        } else if (
          label.toLowerCase().includes('calendar') ||
          label.toLowerCase().includes('scheduled') ||
          label.toLowerCase().includes('gathering') ||
          label.toLowerCase().includes('event')
        ) {
          href = '/events'
        }

        if (href) {
          return (
            <Link
              key={keyId}
              href={href}
              className="font-mono text-[11px] font-bold tracking-tight text-primary hover:underline underline-offset-2 inline-block mx-0.5"
            >
              [{label}]
            </Link>
          )
        }

        return (
          <span
            key={keyId}
            className="font-mono text-[11px] font-bold tracking-tight text-primary border-b border-primary/40 px-0.5"
          >
            {label}
          </span>
        )
      }
      return part
    })
  }

  return (
    <Card className="rounded-[6px] border border-border p-5 border-l-[3px] border-l-primary bg-card">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2.5">
        Daily Brief
      </div>
      <p className="font-serif text-[14.5px] leading-[1.65] text-foreground/90">{renderText()}</p>
    </Card>
  )
}

// =============================================================================
// Circle Telemetry - Redesigned split layout
// =============================================================================
function CircleTelemetry({
  telemetry,
}: {
  telemetry: {
    industries: { label: string; count: number }[]
    cities: { city: string; count: number }[]
  }
}) {
  const maxCount = Math.max(...telemetry.industries.map((ind) => ind.count), 1)

  return (
    <Card className="rounded-[6px] border border-border p-5 bg-card">
      <div className="flex items-center justify-between border-b border-border pb-2.5 mb-4">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Telemetry · Cohort stats
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent-sage">
          [Active members]
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industries Bar Chart */}
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Top Industries
          </h4>
          {telemetry.industries.map((ind) => {
            const pct = (ind.count / maxCount) * 100
            return (
              <div
                key={ind.label}
                className="grid grid-cols-[80px_1fr_24px] items-center gap-2 text-xs"
              >
                <span className="font-medium text-foreground truncate">{ind.label}</span>
                <div className="bg-muted h-1.5 rounded-full overflow-hidden border border-border/30">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground text-right tabular-nums">
                  {ind.count}
                </span>
              </div>
            )
          })}
        </div>

        {/* Top Cities List */}
        <div className="flex flex-col">
          <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Top Cities
          </h4>
          <div className="divide-y divide-border/60">
            {telemetry.cities.map((c) => (
              <div key={c.city} className="flex justify-between items-center py-2 text-xs">
                <span className="font-medium text-foreground">{c.city}</span>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// Action Nudge ("One Small Thing Today")
// =============================================================================
function ActionNudge({
  requests,
  viewerCity,
  featuredEvent,
  isHelper,
}: {
  requests: HomePendingMentorRequest[]
  viewerCity: string | null
  featuredEvent: HomeEvent | null
  isHelper: boolean
}) {
  let type: 'request' | 'profile' | 'rsvp' | 'settings' = 'settings'
  let heading = 'Update your advice settings'
  let body = 'Let classmates know what topics you are open to mentoring on.'
  let buttonLabel = 'Configure Settings'
  let buttonHref = '/profile/me'

  if (isHelper && requests.length > 0) {
    const firstRequest = requests[0]
    type = 'request'
    heading = `Reply to ${firstRequest.menteeName ?? 'mentorship request'}`
    body = firstRequest.reason
      ? `"${firstRequest.reason.slice(0, 75)}${firstRequest.reason.length > 75 ? '...' : ''}"`
      : 'Review advice request and establish coaching connection.'
    buttonLabel = 'Open Thread'
    buttonHref = `/ask/${firstRequest.id}`
  } else if (!viewerCity) {
    type = 'profile'
    heading = 'Complete your city location'
    body = 'Adding your current city helps classmates find you in their local areas.'
    buttonLabel = 'Update Profile'
    buttonHref = '/profile/me'
  } else if (featuredEvent && featuredEvent.goingCount < 5) {
    type = 'rsvp'
    heading = `RSVP to ${featuredEvent.title}`
    body = 'This gathering is scheduled soon. Secure your place today.'
    buttonLabel = 'View Event'
    buttonHref = `/events/${featuredEvent.id}`
  }

  const tagColor =
    type === 'request' ? 'bg-accent-ochre/10 text-accent-ochre' : 'bg-primary/10 text-primary'

  return (
    <Card className="relative overflow-hidden rounded-[6px] border border-accent-ochre/25 bg-accent-ochre/10 p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent-ochre">
          One small thing today
        </span>
        <span
          className={`font-mono text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${tagColor}`}
        >
          {type}
        </span>
      </div>

      <h3 className="font-serif text-lg font-semibold text-foreground mt-2.5">{heading}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>

      <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-accent-ochre/25">
        <Button
          asChild
          size="sm"
          className="rounded-[6px] text-xs font-semibold h-8 px-4 bg-accent-ochre text-foreground hover:bg-accent-ochre/90 border-none cursor-pointer transition active:translate-y-[0.5px]"
        >
          <Link href={buttonHref}>{buttonLabel}</Link>
        </Button>
      </div>
    </Card>
  )
}

// =============================================================================
// Featured Event Section
// =============================================================================
function CalendarSection({
  featured,
  otherEvents,
  stats,
}: {
  featured: HomeEvent | null
  otherEvents: HomeEvent[]
  stats: { upcomingEventsTotal: number }
}) {
  const capacityPct = featured?.capacity
    ? Math.min(100, Math.round((featured.goingCount / featured.capacity) * 100))
    : 0

  if (!featured) {
    return (
      <div className="space-y-4">
        <BucketSectionHeader
          title="On your calendar"
          count={0}
          countLabel="active"
          subtitle="Gatherings, suppers, and discussions. RSVP to attend."
        />
        <Card className="rounded-[6px] border border-border">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-xs text-muted-foreground leading-normal max-w-[220px]">
              No upcoming events on the calendar.
            </p>
            <Button asChild size="sm" variant="outline" className="rounded-[6px] text-xs">
              <Link href="/events">View Past Gatherings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const start = new Date(featured.startsAt)
  // eslint-disable-next-line react-hooks/purity
  const daysDiff = Math.max(0, Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="space-y-4">
      <BucketSectionHeader
        title="On your calendar"
        count={stats.upcomingEventsTotal}
        countLabel="active"
        subtitle="Gatherings, office hours, and Mixers. RSVP to attend."
      />

      <Card className="overflow-hidden rounded-[6px] border border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-xs">
        {/* Colorful gradient headers */}
        <div className="relative border-b border-border bg-primary/5 p-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-primary">
              Featured Gathering
            </span>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider bg-foreground text-background px-2 py-0.5 rounded-[4px]">
              {daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Tomorrow' : `T-${daysDiff}d`}
            </span>
          </div>
          <h3 className="mt-2.5 font-heading text-base font-semibold tracking-tight text-foreground line-clamp-1">
            {featured.title}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-foreground font-medium">
              <CalendarDays className="size-3.5 text-primary" />
              <span>{format(start, 'MMM d, yyyy · h:mm a')}</span>
            </div>
            {featured.location ? (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{featured.location}</span>
              </div>
            ) : null}
          </div>

          <div className="going flex items-center justify-between pt-3 border-t border-border/40">
            {/* Generate attendee stacks dynamically based on count */}
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="size-6 rounded-full border border-card bg-accent-sage text-background font-mono text-[9px] flex items-center justify-center font-bold">
                DK
              </span>
              <span className="size-6 rounded-full border border-card bg-accent-ochre text-background font-mono text-[9px] flex items-center justify-center font-bold">
                MR
              </span>
              <span className="size-6 rounded-full border border-card bg-accent-plum text-background font-mono text-[9px] flex items-center justify-center font-bold">
                SP
              </span>
              {featured.goingCount > 3 && (
                <div className="size-6 rounded-full border border-card bg-muted text-muted-foreground font-mono text-[8px] flex items-center justify-center font-semibold">
                  +{featured.goingCount - 3}
                </div>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              <b className="text-foreground font-semibold">{featured.goingCount}</b> going
            </span>
          </div>

          {featured.capacity ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground">
                <span>Capacity limit</span>
                <span>{capacityPct}% RSVP&apos;d</span>
              </div>
              <div className="w-full bg-muted h-1 rounded-full overflow-hidden border border-border/30">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>
          ) : null}

          <Button
            asChild
            className="w-full rounded-[6px] text-xs h-8.5 bg-foreground text-background hover:bg-foreground/90 cursor-pointer transition active:translate-y-[0.5px]"
          >
            <Link href={`/events/${featured.id}`}>View Event details</Link>
          </Button>
        </div>
      </Card>

      {otherEvents.length > 0 ? (
        <div className="space-y-2.5">
          {otherEvents.slice(0, 2).map((e) => {
            const eStart = new Date(e.startsAt)
            return (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group block rounded-[6px] border border-border/70 p-3 bg-card transition hover:border-primary/40 hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-heading text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {e.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(eStart, 'MMM d · h:mm a')}
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

// =============================================================================
// VisualMapCard ("Where the circle is" map component)
// =============================================================================
function VisualMapCard({
  telemetryCities,
  viewerCity,
}: {
  telemetryCities: { city: string; count: number }[]
  viewerCity: string | null
}) {
  const topCities = telemetryCities.slice(0, 2)
  const isLocalSF =
    viewerCity?.toLowerCase().includes('sf') || viewerCity?.toLowerCase().includes('francisco')

  return (
    <Card className="rounded-[6px] border border-border overflow-hidden bg-card">
      <div className="p-4 pb-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Where the circle is
        </span>
        <h3 className="font-serif text-lg font-medium text-foreground mt-1">
          Active geographic footprints
        </h3>
      </div>

      <div className="px-4 py-2 relative">
        <svg className="w-full h-auto display:block" viewBox="0 0 320 160" aria-hidden="true">
          <title>Geographic location projections</title>
          {/* stylized continent shapes */}
          <g fill="var(--muted)" className="opacity-70 dark:opacity-30">
            <path d="M10 70 Q25 40 60 45 Q90 30 110 50 Q120 70 95 90 Q70 100 50 95 Q25 95 10 70 Z" />
            <path d="M130 70 Q150 40 200 50 Q230 50 245 80 Q230 110 200 115 Q160 110 145 95 Q130 90 130 70 Z" />
            <path d="M250 60 Q270 45 295 55 Q310 75 295 95 Q275 105 260 90 Q245 75 250 60 Z" />
          </g>
          {/* city dots */}
          <g>
            {/* San Francisco */}
            <circle cx="55" cy="78" r="8" fill="var(--primary)" opacity="0.25" />
            <circle cx="55" cy="78" r="4" fill="var(--primary)" />

            {/* New York */}
            <circle cx="85" cy="68" r="7" fill="var(--primary)" opacity="0.2" />
            <circle cx="85" cy="68" r="3.5" fill="var(--primary)" />

            {/* London */}
            <circle cx="160" cy="65" r="5" fill="var(--primary)" opacity="0.15" />
            <circle cx="160" cy="65" r="2.5" fill="var(--primary)" />

            {/* Seoul */}
            <circle cx="270" cy="72" r="7" fill="var(--primary)" opacity="0.2" />
            <circle cx="270" cy="72" r="3" fill="var(--primary)" />

            {/* highlight viewer location if set */}
            {isLocalSF ? (
              <>
                <circle
                  cx="55"
                  cy="78"
                  r="14"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <text
                  x="55"
                  y="104"
                  fontSize="7"
                  textAnchor="middle"
                  fill="var(--foreground)"
                  className="font-sans font-medium"
                >
                  SF (you)
                </text>
              </>
            ) : viewerCity ? (
              <>
                {/* Fallback general location marker */}
                <circle
                  cx="85"
                  cy="68"
                  r="14"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <text
                  x="85"
                  y="92"
                  fontSize="7"
                  textAnchor="middle"
                  fill="var(--foreground)"
                  className="font-sans font-medium"
                >
                  NYC (you)
                </text>
              </>
            ) : null}
          </g>
        </svg>
      </div>

      <div className="flex justify-between p-4 pt-1 text-[11px] text-muted-foreground border-t border-border/40">
        {topCities.map((tc) => (
          <span key={tc.city}>
            <b className="text-foreground font-semibold">{tc.city}</b> · {tc.count} active
          </span>
        ))}
      </div>
    </Card>
  )
}

// =============================================================================
// ThankYouWall (Testimonial rotating block)
// =============================================================================
const THANK_YOU_STORIES = [
  {
    quote:
      "Daniel's intro to the design team at Figma is the only reason I got the interview. I owe him a coffee for life.",
    author: 'Maya Riveria',
    classYear: 17,
    thankedAuthor: 'Daniel Kim',
    thankedYear: 16,
  },
  {
    quote:
      'Having someone review my portfolio who actually graduated from my school gave me so much confidence during recruiting.',
    author: 'Sam Wood',
    classYear: 18,
    thankedAuthor: 'Sarah Patel',
    thankedYear: 15,
  },
  {
    quote:
      'Jane helped me prepare for the VP case studies, answering my late night Slack requests. Best community ever.',
    author: 'Alex Tan',
    classYear: 19,
    thankedAuthor: 'Jane Lee',
    thankedYear: 14,
  },
]

function ThankYouWall() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % THANK_YOU_STORIES.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const story = THANK_YOU_STORIES[index]

  return (
    <Card className="rounded-[6px] border border-border p-5 bg-card relative shadow-xs min-h-[160px] flex flex-col justify-between">
      <div>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent-sage">
          Thank-you wall
        </span>
        <blockquote className="font-serif text-sm leading-[1.55] italic text-foreground mt-2">
          &ldquo;{story.quote}&rdquo;
        </blockquote>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
        <cite className="text-[10px] text-muted-foreground not-italic font-sans">
          — {story.author} &apos;{String(story.classYear).slice(-2)} thanking {story.thankedAuthor}{' '}
          &apos;{String(story.thankedYear).slice(-2)}
        </cite>
        {/* Interactive indicator dots */}
        <div className="flex gap-1.5 shrink-0">
          {THANK_YOU_STORIES.map((story) => (
            <button
              key={story.author}
              type="button"
              onClick={() => setIndex(THANK_YOU_STORIES.indexOf(story))}
              className={`size-1.5 rounded-full cursor-pointer focus:outline-hidden transition-all ${
                THANK_YOU_STORIES.indexOf(story) === index
                  ? 'bg-accent-sage w-3'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// Active Mentorships Deck
// =============================================================================
function ActiveMentorships({ mentorships }: { mentorships: HomeActiveMentorship[] }) {
  if (mentorships.length === 0) return null

  return (
    <div className="space-y-4">
      <BucketSectionHeader
        title="Active mentorships"
        count={mentorships.length}
        countLabel="active"
        subtitle="Ongoing coaching paths. Click on check-in to post goals progress."
      />
      <Card className="rounded-[6px] border border-border p-4 bg-card">
        <div className="divide-y divide-border/60">
          {mentorships.map((m, i) => {
            const pct = Math.round((m.goalsMet / m.goalsTotal) * 100)
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-2.5 ${
                  i === 0 ? 'pb-3.5' : 'py-3.5'
                } first:pt-0 last:pb-0`}
              >
                <div className="flex justify-between items-baseline">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {m.name}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground">{m.year}</span>
                  </div>
                  <Link
                    href={`/ask/thread/${m.id}`}
                    className="font-mono text-[9px] font-bold text-primary uppercase hover:underline"
                  >
                    Next: {m.nextCheckIn}
                  </Link>
                </div>

                <div className="text-xs text-muted-foreground">
                  {m.role} at <span className="font-medium text-foreground">{m.org}</span>
                </div>

                <div className="space-y-1.5 mt-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Goals Met</span>
                    <span className="font-semibold text-foreground">
                      {m.goalsMet} / {m.goalsTotal} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden border border-border/10">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// =============================================================================
// RecentActivityWire Deck
// =============================================================================
function RecentActivityWire({ notifications }: { notifications: HomeNotification[] }) {
  return (
    <div className="space-y-4">
      <BucketSectionHeader
        title="Recent activity"
        count={notifications.length}
        countLabel="new"
        subtitle="Recent wire activity logs and direct inbox alerts."
      />
      <Card className="rounded-[6px] border border-border overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-muted-foreground">No recent alerts.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {notifications.slice(0, 3).map((n) => (
              <li key={n.id}>
                <NotificationRow notification={n} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function NotificationRow({ notification: n }: { notification: HomeNotification }) {
  const unread = n.readAt === null
  const { Icon, tone } = iconForType(n.type)
  const href = notificationHref(n)
  const label = notificationCopy(n)

  const content = (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 ${
        unread ? 'bg-primary/[0.02]' : ''
      }`}
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-border/50 bg-card"
        style={{ color: tone }}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[11px] leading-snug truncate ${
            unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
          }`}
        >
          {label}
        </p>
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5 block">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
      </div>
      {unread ? (
        <div aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
      ) : null}
    </div>
  )

  return href ? (
    <Link href={href} className="block cursor-pointer">
      {content}
    </Link>
  ) : (
    content
  )
}

function iconForType(type: string): { Icon: typeof Handshake; tone: string } {
  switch (type) {
    case 'ask_received':
    case 'ask_accepted':
    case 'ask_declined':
      return { Icon: Handshake, tone: 'var(--primary)' }
    case 'friend_request_received':
    case 'friend_request_accepted':
      return { Icon: UserPlus, tone: 'var(--accent-sage)' }
    case 'direct_message':
    case 'ask_message':
      return { Icon: MessageSquare, tone: 'var(--primary)' }
    case 'announcement':
      return { Icon: Megaphone, tone: 'var(--accent-ochre)' }
    case 'event_canceled':
      return { Icon: CalendarX, tone: 'var(--destructive)' }
    default:
      return { Icon: Handshake, tone: 'var(--primary)' }
  }
}

function notificationCopy(n: HomeNotification): string {
  const actor = typeof n.payload?.actor_name === 'string' ? n.payload.actor_name : 'Someone'
  switch (n.type) {
    case 'friend_request_received':
      return `${actor} sent you a friend request`
    case 'friend_request_accepted':
      return `${actor} accepted your friend request`
    case 'ask_received':
      return `${actor} requested mentorship`
    case 'ask_accepted':
      return `${actor} accepted your mentorship request`
    case 'ask_declined':
      return `${actor} declined your mentorship request`
    case 'direct_message':
      return `New message from ${actor}`
    case 'ask_message':
      return `${actor} sent a mentorship message`
    case 'announcement':
      return typeof n.payload?.title === 'string' ? n.payload.title : 'New announcement'
    case 'event_canceled': {
      const title = typeof n.payload?.event_title === 'string' ? n.payload.event_title : 'An event'
      return `${title} was canceled`
    }
    default:
      return 'New activity'
  }
}

function notificationHref(n: HomeNotification): string | null {
  switch (n.type) {
    case 'friend_request_received':
      return '/inbox'
    case 'friend_request_accepted':
      return n.targetId ? `/profile/${n.targetId}` : '/inbox'
    case 'ask_received':
    case 'ask_declined':
      return n.targetId ? `/ask/${n.targetId}` : '/inbox'
    case 'ask_accepted':
      return n.targetId ? `/ask/thread/${n.targetId}` : '/inbox'
    case 'direct_message':
      return n.targetId ? `/messages/${n.targetId}` : '/inbox'
    case 'ask_message':
      return n.targetId ? `/ask/thread/${n.targetId}` : '/inbox'
    case 'announcement':
      return '/announcements'
    case 'event_canceled':
      return n.targetId ? `/events/${n.targetId}` : '/events'
    default:
      return null
  }
}

// =============================================================================
// QuickActions Deck
// =============================================================================
function QuickActions({
  stats,
}: {
  stats: {
    openMentorsTotal: number
    upcomingEventsTotal: number
  }
}) {
  const actions = [
    { label: 'Find a Mentor', count: `${stats.openMentorsTotal} open`, href: '/people' },
    { label: 'Browse the Network', count: '1,200+ members', href: '/people' },
    { label: 'Upcoming Gatherings', count: `${stats.upcomingEventsTotal} active`, href: '/events' },
    { label: 'Your Profile settings', count: 'Update', href: '/profile/me' },
  ]

  return (
    <Card className="rounded-[6px] border border-border p-5 bg-card">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-4 border-b border-border pb-2.5">
        Quick Actions
      </div>
      <div className="flex flex-col gap-1.5">
        {actions.map((act) => (
          <Link
            key={act.label}
            href={act.href}
            className="border-b border-border/30 hover:border-primary py-2.5 flex justify-between items-center transition-colors group cursor-pointer"
          >
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              {act.label}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground group-hover:text-primary transition-colors">
              [{act.count}]
            </span>
          </Link>
        ))}
      </div>
    </Card>
  )
}

// Section Header Layout Utility
function BucketSectionHeader({
  title,
  count,
  countLabel,
  subtitle,
}: {
  title: string
  count: number
  countLabel: string
  subtitle: string
}) {
  return (
    <div className="border-t-2 border-foreground pt-4 mb-4">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-heading font-semibold text-lg tracking-tight text-foreground">
          {title}
        </h2>
        <span className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-current" />
          {count} {countLabel}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
    </div>
  )
}
