'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { RouteStateCard } from '@/components/route-state-card'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="m-0 min-h-dvh bg-[#f2f4f6] font-sans text-[#191f28]">
        <RouteStateCard
          title="Couldn’t load BridgeCircle."
          description="Check your connection and try again — nothing was lost."
          actionLabel="Try again"
          onRetry={reset}
        />
      </body>
    </html>
  )
}
