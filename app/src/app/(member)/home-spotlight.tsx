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
          className="px-0.5 text-caption font-extrabold tracking-wide text-text-secondary"
        >
          This week in the circle
        </h2>
        <div className="rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-6 py-7 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          <p className="text-body-lg font-extrabold tracking-tight text-foreground">
            You’re caught up.
          </p>
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
          className="text-caption font-extrabold tracking-wide text-text-secondary"
        >
          This week in the circle
        </h2>
        <span className="text-kicker font-semibold text-text-secondary tabular-nums">
          {safeIndex + 1} of {items.length}
        </span>
      </div>
      <div className="rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-6.5 sm:pt-5 sm:pb-4.5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-kicker font-bold',
              item.tone === 'green' && 'bg-[var(--give-tint)] text-[var(--action-give-text)]',
              item.tone === 'blue' && 'bg-[var(--blue-50)] text-[var(--blue-800)]',
              item.tone === 'neutral' && 'bg-surface-subtle text-text-secondary',
            )}
          >
            {item.label}
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
            {item.meta}
          </span>
          {items.length > 1 ? (
            <span className="ml-auto flex shrink-0 gap-1.5">
              <button
                type="button"
                aria-label="Previous spotlight"
                onClick={() => move(-1)}
                className="inline-flex size-8 items-center justify-center rounded-full bg-surface-subtle text-text-secondary hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next spotlight"
                onClick={() => move(1)}
                className="inline-flex size-8 items-center justify-center rounded-full bg-surface-subtle text-text-secondary hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </span>
          ) : null}
        </div>

        <div className="mt-3.5 min-h-[88px]">
          <h3 className="text-heading leading-tight font-extrabold tracking-tight text-balance text-foreground">
            {item.title}
          </h3>
          {item.body ? (
            <p className="mt-1.5 line-clamp-2 text-body-sm leading-relaxed font-medium text-text-secondary text-pretty">
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
                item.tone === 'green'
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
              className="rounded-md text-xs font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
                  className={cn(
                    'h-[7px] rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                    candidateIndex === safeIndex
                      ? 'w-[18px] bg-primary'
                      : 'w-[7px] bg-[var(--grey-300)]',
                  )}
                />
              ))}
            </fieldset>
          ) : null}
        </div>
      </div>
    </section>
  )
}
