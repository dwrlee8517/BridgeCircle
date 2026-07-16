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
      className="mb-4 flex items-center gap-2 rounded-xl bg-[var(--warning-tint)] px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_rgb(245_166_35_/_0.16)]"
    >
      <WifiOff aria-hidden className="size-4 shrink-0" />
      You’re offline. You can keep reading, but changes will not save until you reconnect.
    </div>
  )
}
