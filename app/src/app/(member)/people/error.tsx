'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function PeopleError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="We couldn’t load the directory"
      description="Check your connection and try again."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
