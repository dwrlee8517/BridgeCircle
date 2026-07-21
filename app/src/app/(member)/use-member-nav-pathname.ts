'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'

let lastNonProfilePathname: string | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function rememberNonProfilePathname(pathname: string) {
  if (lastNonProfilePathname === pathname) return
  lastNonProfilePathname = pathname
  listeners.forEach((listener) => {
    listener()
  })
}

function getSnapshot() {
  return lastNonProfilePathname
}

function getServerSnapshot() {
  return null
}

function isProfilePath(pathname: string) {
  return pathname === '/profile' || pathname.startsWith('/profile/')
}

/**
 * Intercepted profile routes keep the member shell mounted. Remembering the
 * last non-profile location lets the shell keep its originating section
 * selected without pretending a directly loaded profile belongs to People.
 */
export function useMemberNavPathname() {
  const pathname = usePathname()
  const rememberedPathname = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (!isProfilePath(pathname)) rememberNonProfilePathname(pathname)
  }, [pathname])

  if (!isProfilePath(pathname) || pathname === '/profile/me') return pathname
  return rememberedPathname ?? pathname
}
