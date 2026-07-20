'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function NotificationsError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="Couldn’t load notifications."
      description="Check your connection and try again — your unread items are still there."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
