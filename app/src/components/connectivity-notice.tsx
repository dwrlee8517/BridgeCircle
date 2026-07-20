'use client'

import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ConnectivityNotice() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-[var(--surface-card)] px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] md:bottom-5"
    >
      <WifiOff aria-hidden className="size-4 shrink-0" />
      You’re offline. Nothing was lost; reconnect before saving a change.
    </div>
  )
}
