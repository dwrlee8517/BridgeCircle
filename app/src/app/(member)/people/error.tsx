'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function PeopleError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="We couldn’t load the directory"
      description="Your filters are safe. Check your connection and try again."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
