'use client'

import { useEffect } from 'react'

export default function SchoolError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface-canvas px-5">
      <div className="max-w-md rounded-2xl bg-surface-card p-7 text-center shadow-card ring-1 ring-border-subtle">
        <h1 className="text-body font-extrabold text-text-primary">
          School did not load this time
        </h1>
        <p className="mt-2 text-caption leading-relaxed text-text-secondary">
          Your response is safe. Try the page again when you are ready.
        </p>
        <button
          type="button"
          onClick={unstable_retry}
          className="mt-5 rounded-xl bg-action-primary-pressed px-4 py-2.5 text-caption font-bold text-action-on-primary"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
