'use client'

import { useCallback, useSyncExternalStore } from 'react'

const PREFERENCE_EVENT = 'bridgecircle:messages-preference'

export function useWaitingFoldedPreference(userId: string): [boolean, (folded: boolean) => void] {
  const key = `bridgecircle:messages:v1:${userId}:waiting-folded`
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener('storage', notify)
    window.addEventListener(PREFERENCE_EVENT, notify)
    return () => {
      window.removeEventListener('storage', notify)
      window.removeEventListener(PREFERENCE_EVENT, notify)
    }
  }, [])
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) === 'true'
    } catch {
      return false
    }
  }, [key])
  const folded = useSyncExternalStore(subscribe, getSnapshot, () => false)
  const setFolded = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, String(next))
      } catch {
        // The preference is optional; the current view still updates through the event.
      }
      window.dispatchEvent(new Event(PREFERENCE_EVENT))
    },
    [key],
  )
  return [folded, setFolded]
}
