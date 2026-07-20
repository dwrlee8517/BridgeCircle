'use client'

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react'
import {
  restoreThreadComposer,
  serializeThreadComposer,
  type ThreadComposerState,
} from '@/lib/messages/thread-state'

const COMPOSER_EVENT = 'bridgecircle:messages-composer'
const FALLBACK_COMPOSERS = new Map<string, string>()

export function useThreadComposer(
  storageKey: string,
): [ThreadComposerState, Dispatch<SetStateAction<ThreadComposerState>>] {
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener(COMPOSER_EVENT, notify)
    return () => window.removeEventListener(COMPOSER_EVENT, notify)
  }, [])
  const getSnapshot = useCallback(() => {
    try {
      return window.sessionStorage.getItem(storageKey) ?? FALLBACK_COMPOSERS.get(storageKey) ?? null
    } catch {
      return FALLBACK_COMPOSERS.get(storageKey) ?? null
    }
  }, [storageKey])
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null)
  const composer = useMemo(() => restoreThreadComposer(raw), [raw])
  const setComposer = useCallback<Dispatch<SetStateAction<ThreadComposerState>>>(
    (update) => {
      const current = restoreThreadComposer(getSnapshot())
      const next = typeof update === 'function' ? update(current) : update
      const serialized = serializeThreadComposer(next)
      if (serialized) FALLBACK_COMPOSERS.set(storageKey, serialized)
      else FALLBACK_COMPOSERS.delete(storageKey)
      try {
        if (serialized) window.sessionStorage.setItem(storageKey, serialized)
        else window.sessionStorage.removeItem(storageKey)
      } catch {
        // The module-local fallback keeps the draft usable for this tab session.
      }
      window.dispatchEvent(new Event(COMPOSER_EVENT))
    },
    [getSnapshot, storageKey],
  )
  return [composer, setComposer]
}
