'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { RouteStateCard } from '@/components/route-state-card'

export default function MemberError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <RouteStateCard
      title="Couldn’t load that."
      description="Check your connection and try again — nothing was lost."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
