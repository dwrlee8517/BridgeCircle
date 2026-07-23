'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function SelectCircleError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="Couldn’t load your circles."
      description="Check your connection and try again — your memberships did not change."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
