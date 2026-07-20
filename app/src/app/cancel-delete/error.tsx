'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function CancelDeleteError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="Couldn’t load your account status."
      description="Check your connection and try again. Your deletion schedule did not change."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
