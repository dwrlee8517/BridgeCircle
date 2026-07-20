'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="We couldn’t load this profile"
      description="Check your connection and try again."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
