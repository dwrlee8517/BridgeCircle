'use client'

import { usePathname } from 'next/navigation'
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type MemberShellHeaderOverride = {
  title: string
  meta?: string
  backHref?: string
  backLabel?: string
  hideNotifications?: boolean
}

type StoredHeaderOverride = MemberShellHeaderOverride & {
  pathname: string
}

type MemberShellHeaderContextValue = {
  override: MemberShellHeaderOverride | null
  setStoredOverride: Dispatch<SetStateAction<StoredHeaderOverride | null>>
}

const MemberShellHeaderContext = createContext<MemberShellHeaderContextValue | null>(null)

export function MemberShellHeaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [storedOverride, setStoredOverride] = useState<StoredHeaderOverride | null>(null)
  const value = useMemo<MemberShellHeaderContextValue>(
    () => ({
      override: storedOverride?.pathname === pathname ? storedOverride : null,
      setStoredOverride,
    }),
    [pathname, storedOverride],
  )

  return (
    <MemberShellHeaderContext.Provider value={value}>{children}</MemberShellHeaderContext.Provider>
  )
}

export function useMemberShellHeaderState() {
  return useMemberShellHeaderContext().override
}

export function useMemberShellHeader(override: MemberShellHeaderOverride | null) {
  const value = useMemberShellHeaderContext()
  useStoreMemberShellHeader(value, override)
}

export function useOptionalMemberShellHeader(override: MemberShellHeaderOverride | null) {
  const value = useContext(MemberShellHeaderContext)
  useStoreMemberShellHeader(value, override)
}

function useStoreMemberShellHeader(
  value: MemberShellHeaderContextValue | null,
  override: MemberShellHeaderOverride | null,
) {
  const pathname = usePathname()
  const setStoredOverride = value?.setStoredOverride
  const title = override?.title
  const meta = override?.meta
  const backHref = override?.backHref
  const backLabel = override?.backLabel
  const hideNotifications = override?.hideNotifications

  useEffect(() => {
    if (!title || !setStoredOverride) return

    setStoredOverride({
      pathname,
      title,
      meta,
      backHref,
      backLabel,
      hideNotifications,
    })

    return () => {
      setStoredOverride((current) => (current?.pathname === pathname ? null : current))
    }
  }, [backHref, backLabel, hideNotifications, meta, pathname, setStoredOverride, title])
}

function useMemberShellHeaderContext() {
  const value = useContext(MemberShellHeaderContext)
  if (!value)
    throw new Error('Member shell header hooks must be used inside MemberShellHeaderProvider')
  return value
}
