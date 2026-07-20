'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function EntryError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="Couldn’t load that."
      description="Check your connection and try again — nothing was lost."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
