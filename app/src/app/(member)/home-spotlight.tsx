'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { HomeSpotlight } from '@/lib/home/contracts'
import { cn } from '@/lib/utils'

const ROTATION_MS = 6_000

export function HomeSpotlightDeck({
  items,
  onAskFocus,
}: {
  items: HomeSpotlight[]
  onAskFocus(): void
}) {
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (items.length < 2 || held || reducedMotion) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length)
    }, ROTATION_MS)
    return () => window.clearInterval(timer)
  }, [held, items.length, reducedMotion])

  if (items.length === 0) {
    return (
      <section aria-labelledby="home-week-heading" className="grid min-w-0 grid-cols-1 gap-2">
        <h2
          id="home-week-heading"
          className="px-0.5 text-body-sm font-bold tracking-tight text-foreground"
        >
          This week in the circle
        </h2>
        <div className="rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-6 py-7 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          <p className="text-body-lg font-bold tracking-tight text-foreground">You’re caught up.</p>
          <p className="mt-1.5 text-body-sm leading-relaxed font-medium text-text-secondary">
            Nothing needs the spotlight right now. Your circle will fill this in as things happen.
          </p>
        </div>
      </section>
    )
  }

  const safeIndex = index % items.length
  const item = items[safeIndex] as HomeSpotlight
  const move = (direction: number) =>
    setIndex((current) => (current + direction + items.length) % items.length)

  return (
    <section
      aria-labelledby="home-week-heading"
      className="grid min-w-0 grid-cols-1 gap-2"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false)
      }}
    >
      <div className="flex items-baseline gap-2 px-0.5">
        <h2
          id="home-week-heading"
          className="text-body-sm font-bold tracking-tight text-foreground"
        >
          This week in the circle
        </h2>
        <span className="text-kicker font-semibold text-text-secondary tabular-nums">
          {safeIndex + 1} of {items.length}
        </span>
      </div>
      <div
        className={cn(
          'rounded-[var(--radius-card-xl)] px-5 py-5 sm:px-6.5 sm:pt-5 sm:pb-4.5',
          item.kind === 'event'
            ? 'bg-[image:var(--cover-event)] text-white shadow-[var(--shadow-band-card)]'
            : 'bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]',
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-kicker font-bold',
              item.kind === 'event'
                ? 'bg-[var(--glass-tile)] text-[var(--cover-accent)] shadow-[var(--ring-glass)]'
                : [
                    item.tone === 'green' && 'bg-[var(--give-tint)] text-[var(--action-give-text)]',
                    item.tone === 'blue' && 'bg-[var(--blue-50)] text-[var(--blue-800)]',
                    item.tone === 'neutral' && 'bg-surface-subtle text-text-secondary',
                  ],
            )}
          >
            {item.label}
          </span>
          <span
            className={cn(
              'min-w-0 truncate text-xs font-semibold',
              item.kind === 'event' ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            {item.meta}
          </span>
          {items.length > 1 ? (
            <span className="ml-auto flex shrink-0 gap-1.5">
              <button
                type="button"
                aria-label="Previous spotlight"
                onClick={() => move(-1)}
                className={cn(
                  'inline-flex size-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                  item.kind === 'event'
                    ? 'bg-[var(--glass-tile)] text-white shadow-[var(--ring-glass)] hover:bg-white/20'
                    : 'bg-surface-subtle text-text-secondary hover:bg-muted',
                )}
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next spotlight"
                onClick={() => move(1)}
                className={cn(
                  'inline-flex size-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                  item.kind === 'event'
                    ? 'bg-[var(--glass-tile)] text-white shadow-[var(--ring-glass)] hover:bg-white/20'
                    : 'bg-surface-subtle text-text-secondary hover:bg-muted',
                )}
              >
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </span>
          ) : null}
        </div>

        <div className="mt-3.5 min-h-[88px]">
          <h3
            className={cn(
              'text-heading leading-tight font-bold tracking-tight text-balance',
              item.kind === 'event' ? 'text-white' : 'text-foreground',
            )}
          >
            {item.title}
          </h3>
          {item.body ? (
            <p
              className={cn(
                'mt-1.5 line-clamp-2 text-body-sm leading-relaxed font-medium text-pretty',
                item.kind === 'event' ? 'text-white/75' : 'text-text-secondary',
              )}
            >
              {item.body}
            </p>
          ) : null}
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
          {item.kind === 'people_are_asking' ? (
            <button
              type="button"
              onClick={onAskFocus}
              className="inline-flex min-h-9 items-center rounded-full bg-[var(--action-weak)] px-4 text-xs font-bold text-[var(--action-weak-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {item.actionLabel}
            </button>
          ) : item.href && item.actionLabel ? (
            <Link
              href={item.href}
              className={cn(
                'inline-flex min-h-9 items-center rounded-full px-4 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                item.kind === 'event'
                  ? 'bg-white/95 text-[var(--cover-ink)] hover:bg-white'
                  : item.tone === 'green'
                    ? 'bg-[var(--give-tint)] text-[var(--action-give-text)]'
                    : 'bg-[var(--action-weak)] text-[var(--action-weak-text)]',
              )}
            >
              {item.actionLabel}
            </Link>
          ) : null}
          {item.moreHref && item.moreLabel ? (
            <Link
              href={item.moreHref}
              className={cn(
                'rounded-md text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                item.kind === 'event' ? 'text-[var(--cover-accent)]' : 'text-primary',
              )}
            >
              {item.moreLabel} →
            </Link>
          ) : null}
          {items.length > 1 ? (
            <fieldset className="ml-auto flex items-center gap-1.5">
              <legend className="sr-only">Choose spotlight</legend>
              {items.map((candidate, candidateIndex) => (
                <button
                  key={candidate.kind}
                  type="button"
                  aria-label={`Show ${candidate.label}`}
                  aria-current={candidateIndex === index ? 'true' : undefined}
                  onClick={() => setIndex(candidateIndex)}
                  className="inline-flex size-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'h-[7px] rounded-full',
                      candidateIndex === safeIndex
                        ? cn('w-[18px]', item.kind === 'event' ? 'bg-white' : 'bg-primary')
                        : cn(
                            'w-[7px]',
                            item.kind === 'event' ? 'bg-white/35' : 'bg-[var(--grey-300)]',
                          ),
                    )}
                  />
                </button>
              ))}
            </fieldset>
          ) : null}
        </div>
      </div>
    </section>
  )
}
