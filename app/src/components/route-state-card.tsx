'use client'

import { CircleAlert } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function RouteStateCard({
  title,
  description,
  actionLabel,
  href,
  onRetry,
}: {
  title: string
  description: string
  actionLabel: string
  href?: string
  onRetry?: () => void
}) {
  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-lg rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-7 py-11 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-faint)]">
          <CircleAlert aria-hidden className="size-5" />
        </span>
        <h1 className="mt-3 text-lg font-extrabold tracking-heading">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed font-medium text-[var(--text-secondary)]">
          {description}
        </p>
        {href ? (
          <Button asChild variant="cta" className="mt-5">
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
