'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PersonAvatar } from '@/components/ui/person-card'
import { askComposeHref, cn } from '@/lib/utils'

export type CarouselHelper = {
  userId: string
  name: string
  yearShort: string | null
  role: string | null
  reason: string
  avatarUrl: string | null
  openToHelp: boolean
}

/**
 * "People who can help you" — one real person at a time, flipped by hand.
 * Deliberately no auto-advance (calm, not urgent): arrows, dots, done. The
 * footer count line carries the social proof even for members who never
 * touch an arrow; it hides below the floor so the room never reads as
 * empty. Slide motion uses motion-medium + the emphasized ease and goes
 * static under prefers-reduced-motion via the global contract.
 */
export function HelperCarousel({
  helpers,
  openCount,
  showOpenCount,
}: {
  helpers: CarouselHelper[]
  openCount: number
  showOpenCount: boolean
}) {
  const [index, setIndex] = useState(0)
  const count = helpers.length
  const multi = count > 1

  if (count === 0) {
    return (
      <div className="rounded-md border border-border border-dashed bg-card p-5">
        <p className="font-heading text-base font-semibold text-foreground">
          No one to suggest just yet
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          As more alumni open up to helping, they&rsquo;ll show up here. Browse People to find
          someone yourself.
        </p>
        <Link
          href="/people"
          className="mt-2.5 inline-block text-sm font-semibold text-link hover:text-link-hover"
        >
          Browse people
        </Link>
      </div>
    )
  }

  function go(delta: number) {
    setIndex((current) => (current + delta + count) % count)
  }

  return (
    <div className="rounded-md border border-border bg-card shadow-card">
      <div className="flex items-center gap-2 p-3">
        {multi ? (
          <CarouselArrow label="Previous person" onClick={() => go(-1)}>
            <ChevronLeft className="size-4" />
          </CarouselArrow>
        ) : null}

        {/* Labeled <section> = implicit region role, which
            aria-roledescription needs to attach to (APG carousel pattern). */}
        <section
          className="min-w-0 flex-1 overflow-hidden"
          aria-roledescription="carousel"
          aria-label="People who can help you"
        >
          <div
            className="flex transition-transform duration-medium ease-emphasized"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {helpers.map((helper, i) => {
              const active = i === index
              return (
                <div
                  key={helper.userId}
                  className={cn('min-w-full px-1 py-0.5', !active && 'pointer-events-none')}
                  aria-hidden={!active}
                >
                  <div className="flex items-center gap-2.5">
                    <PersonAvatar
                      userId={helper.userId}
                      name={helper.name}
                      avatarUrl={helper.avatarUrl}
                      shape="square"
                      className="size-10 text-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate">
                        <Link
                          href={`/profile/${helper.userId}`}
                          tabIndex={active ? 0 : -1}
                          className="font-heading text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {helper.name}
                        </Link>
                        {helper.yearShort ? (
                          <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                            {helper.yearShort}
                          </span>
                        ) : null}
                      </p>
                      {helper.role ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {helper.role}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground">
                    {helper.reason}
                  </p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <Link
                      href={`/profile/${helper.userId}`}
                      tabIndex={active ? 0 : -1}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      View profile
                    </Link>
                    {helper.openToHelp ? (
                      <Link
                        href={askComposeHref(helper.userId)}
                        tabIndex={active ? 0 : -1}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-link hover:text-link-hover"
                      >
                        Ask
                        <ChevronRight className="size-3" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {multi ? (
          <CarouselArrow label="Next person" onClick={() => go(1)}>
            <ChevronRight className="size-4" />
          </CarouselArrow>
        ) : null}
      </div>

      {multi ? (
        <div className="flex items-center justify-center gap-1.5 pb-2.5">
          {helpers.map((helper, i) => (
            <button
              key={helper.userId}
              type="button"
              aria-label={`Show ${helper.name}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                'size-1.5 rounded-full transition-[background-color,transform] duration-fast ease-standard',
                i === index ? 'scale-125 bg-primary' : 'bg-border hover:bg-muted-foreground/40',
              )}
            />
          ))}
        </div>
      ) : null}

      {showOpenCount ? (
        <div className="flex items-center justify-between border-border/70 border-t px-3.5 py-2 text-xs text-muted-foreground">
          <span>
            <span className="font-mono font-semibold text-foreground">{openCount}</span> members
            open to help
          </span>
          <Link href="/people" className="font-medium text-link hover:text-link-hover">
            Browse all
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function CarouselArrow({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors duration-base ease-standard hover:border-primary/35 hover:text-foreground"
    >
      {children}
    </button>
  )
}
