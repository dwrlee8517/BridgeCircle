'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function MyCircleError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="We couldn’t load your circle"
      description="Nothing changed. Check your connection and try again."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
