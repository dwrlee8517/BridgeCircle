'use client'

import { useCallback, useSyncExternalStore } from 'react'

const PREFERENCE_EVENT = 'bridgecircle:messages-preference'

export function useBooleanPreference(
  key: string,
  serverDefault: boolean,
): [boolean, (value: boolean) => void] {
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
      const stored = window.localStorage.getItem(key)
      return stored === null ? serverDefault : stored === 'true'
    } catch {
      return serverDefault
    }
  }, [key, serverDefault])
  const value = useSyncExternalStore(subscribe, getSnapshot, () => serverDefault)
  const setValue = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, String(next))
      } catch {
        // Preference storage is optional; the control remains usable.
      }
      window.dispatchEvent(new Event(PREFERENCE_EVENT))
    },
    [key],
  )
  return [value, setValue]
}
