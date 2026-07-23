'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function PendingError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="Couldn’t check your approval."
      description="Your place is still saved. Check your connection and try again."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
