'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="Couldn’t load this admin tool."
      description="Check your connection and try again — no member or invitation was changed."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
