'use client'

import { RouteStateCard } from '@/components/route-state-card'

export default function SettingsError({ reset }: { reset: () => void }) {
  return (
    <RouteStateCard
      title="Couldn’t load your settings."
      description="Check your connection and try again — no preferences were changed."
      actionLabel="Try again"
      onRetry={reset}
    />
  )
}
