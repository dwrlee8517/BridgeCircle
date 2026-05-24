'use client'

import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { EventAttendee } from '@/lib/events/attendeePreviewHelpers'
import type { EventRow } from '@/lib/events/listEvents'
import { rsvpAction } from './actions'
import { getEventMetadata, getEventStableColor } from './metadata'

type Props = {
  events: EventRow[]
  attendeesByEvent: Record<string, EventAttendee[]>
  view: 'upcoming' | 'past'
  initialSelectedId: string | null
}

const STACK_PALETTE = [
  { bg: 'bg-primary/10 border-primary/20', text: 'text-primary' }, // Electric Sky
  { bg: 'bg-accent-ochre/10 border-accent-ochre/20', text: 'text-accent-ochre' }, // Ochre
  { bg: 'bg-accent-sage/10 border-accent-sage/20', text: 'text-accent-sage' }, // Sage
  { bg: 'bg-accent-plum/10 border-accent-plum/20', text: 'text-accent-plum' }, // Plum
  { bg: 'bg-accent-rust/10 border-accent-rust/20', text: 'text-accent-rust' }, // Rust
] as const

export function EventsMasterDetail({ events, attendeesByEvent, view }: Props) {
  return (
    <div className="space-y-12 animate-slideup">
      {/* Cover Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((e, idx) => {
          const dateObj = new Date(e.startsAt)
          const accent = getEventStableColor(e.title)
          const meta = getEventMetadata(e.title)
          const attendees = attendeesByEvent[e.id] ?? []
          const displayIndex = String(idx + 1).padStart(2, '0')

          return (
            <EventCard
              key={e.id}
              event={e}
              displayIndex={displayIndex}
              accent={accent}
              meta={meta}
              dateObj={dateObj}
              attendees={attendees}
              view={view}
            />
          )
        })}
      </div>
    </div>
  )
}

function EventCard({
  event: e,
  displayIndex,
  accent,
  meta,
  dateObj,
  attendees,
  view,
}: {
  event: EventRow
  displayIndex: string
  accent: ReturnType<typeof getEventStableColor>
  meta: ReturnType<typeof getEventMetadata>
  dateObj: Date
  attendees: EventAttendee[]
  view: 'upcoming' | 'past'
}) {
  const router = useRouter()

  function handleCardClick() {
    router.push(`/events/${e.id}`)
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: card navigation is handled programmatically
    // biome-ignore lint/a11y/noStaticElementInteractions: standard card navigation pattern
    <div
      onClick={handleCardClick}
      className="bg-card rounded-[6px] border border-border/40 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer h-full"
      style={{ borderTop: `4px solid ${accent.hex}` }}
    >
      {/* Upper Section */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span
            className="font-heading text-3xl font-bold opacity-15 group-hover:opacity-100 transition-opacity"
            style={{ color: accent.hex }}
          >
            {displayIndex}
          </span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {meta.category}
          </span>
        </div>

        <h4 className="font-heading text-xl font-bold tracking-tight text-foreground leading-snug group-hover:underline">
          {e.title}
        </h4>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Calendar className="size-3.5" />
          <span>{format(dateObj, 'EEE, MMM d · h:mm a')}</span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-sans">
          {meta.tagline || e.description}
        </p>

        {/* Preparations Checklists */}
        <div className="pt-4 border-t border-dashed border-border/40">
          <span className="font-mono text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
            Required Preparations
          </span>
          <div className="space-y-1.5">
            {meta.preparations.slice(0, 2).map((item, pi) => (
              /* biome-ignore lint/suspicious/noArrayIndexKey: static list from db */
              <div key={pi} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span
                  className="size-1 rounded-full shrink-0"
                  style={{ backgroundColor: accent.hex }}
                />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Section */}
      <div className="p-6 bg-secondary/20 dark:bg-secondary/10 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {attendees.length > 0 ? (
            <div className="flex -space-x-1.5">
              {attendees.slice(0, 3).map((a, aIdx) => {
                const palette = STACK_PALETTE[aIdx % STACK_PALETTE.length] || STACK_PALETTE[0]
                return (
                  <span
                    key={a.userId}
                    className={`inline-flex size-6 items-center justify-center rounded-[4px] text-[8px] font-mono font-bold border border-background ring-1 ring-background/10 ${palette.bg} ${palette.text}`}
                    title={a.name ?? undefined}
                  >
                    {initialsFor(a.name)}
                  </span>
                )
              })}
            </div>
          ) : null}
          <span className="text-[10px] text-muted-foreground font-medium">
            {e.goingCount} attending
          </span>
        </div>

        {view === 'upcoming' ? (
          <ConceptBInlineRsvpButton eventId={e.id} current={e.viewerRsvp} accentHex={accent.hex} />
        ) : (
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] border border-border/40 px-2.5 py-1 rounded-[6px] text-muted-foreground">
            Ended
          </span>
        )}
      </div>
    </div>
  )
}

function initialsFor(name: string | null): string {
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

type InlineRsvpProps = {
  eventId: string
  current: 'going' | 'not_going' | 'waitlisted' | null
  accentHex: string
}

function ConceptBInlineRsvpButton({ eventId, current, accentHex }: InlineRsvpProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isGoing = current === 'going' || current === 'waitlisted'

  function submit(ev: React.MouseEvent) {
    ev.preventDefault()
    ev.stopPropagation()
    const fd = new FormData()
    fd.set('eventId', eventId)
    fd.set('status', isGoing ? 'not_going' : 'going')
    setError(null)
    startTransition(async () => {
      const result = await rsvpAction(fd)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] border px-2.5 py-1 rounded-[6px] transition-all cursor-pointer disabled:opacity-50 hover:bg-muted/10"
        style={{
          borderColor: isGoing ? 'var(--accent-sage)' : accentHex,
          color: isGoing ? 'var(--accent-sage)' : accentHex,
          backgroundColor: isGoing ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
        }}
      >
        {pending ? '...' : isGoing ? '✓ Going' : 'Register'}
      </button>
      {error ? (
        <span className="absolute bottom-[-16px] right-0 text-[8px] text-destructive whitespace-nowrap truncate max-w-[120px]">
          {error}
        </span>
      ) : null}
    </div>
  )
}
