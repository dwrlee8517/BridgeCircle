'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function OnboardingError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="Couldn’t load setup."
      description="Your completed steps are saved. Check your connection and try again."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
