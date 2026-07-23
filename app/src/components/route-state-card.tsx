'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export function RouteStateCard({
  kind,
  title,
  description,
  actionLabel,
  href,
  onRetry,
}: {
  kind?: 'not-found' | 'permission-denied' | 'recoverable-error' | 'stale'
  title: string
  description: string
  actionLabel: string
  href?: string
  onRetry?: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const resolvedKind = kind ?? (onRetry ? 'recoverable-error' : 'not-found')

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--surface-canvas)] px-5 py-10">
      <section
        aria-labelledby="route-state-title"
        className="grid w-full max-w-[400px] justify-items-center text-center"
      >
        <StateGlyph kind={resolvedKind} />
        <h1
          ref={headingRef}
          id="route-state-title"
          tabIndex={-1}
          className="mt-[18px] text-xl font-bold tracking-heading text-[var(--text-primary)] outline-none"
        >
          {title}
        </h1>
        <p className="mt-2 max-w-sm text-control leading-[1.65] font-medium text-[var(--text-secondary)] text-pretty">
          {description}
        </p>
        {href ? (
          <Button asChild variant="secondary" className="mt-5">
            <Link href={href}>{actionLabel}</Link>
          </Button>
        ) : null}
        {onRetry ? (
          <Button type="button" variant="cta" className="mt-5" onClick={onRetry}>
            {actionLabel}
          </Button>
        ) : null}
      </section>
    </div>
  )
}

function StateGlyph({
  kind,
}: {
  kind: 'not-found' | 'permission-denied' | 'recoverable-error' | 'stale'
}) {
  if (kind === 'not-found') {
    return (
      <svg aria-hidden width="44" height="44" viewBox="0 0 28 28">
        <title>Decorative overlapping circles</title>
        <circle cx="11" cy="14" r="9" fill="none" stroke="#b0b8c1" strokeWidth="1.6" />
        <circle cx="17" cy="14" r="9" fill="none" stroke="#d1d6db" strokeWidth="1.6" />
      </svg>
    )
  }

  if (kind === 'permission-denied') {
    return (
      <svg aria-hidden width="44" height="44" viewBox="0 0 28 28">
        <title>Decorative nested circles</title>
        <circle cx="14" cy="14" r="9" fill="none" stroke="#b0b8c1" strokeWidth="1.6" />
        <circle cx="14" cy="14" r="3.5" fill="none" stroke="#d1d6db" strokeWidth="1.6" />
      </svg>
    )
  }

  return (
    <svg aria-hidden width="44" height="44" viewBox="0 0 28 28">
      <title>Decorative dashed circle</title>
      <circle
        cx="14"
        cy="14"
        r="9"
        fill="none"
        stroke="#b0b8c1"
        strokeWidth="1.6"
        strokeDasharray={kind === 'stale' ? '1.5 3' : '3.5 4'}
      />
    </svg>
  )
}
