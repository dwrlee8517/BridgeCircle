'use client'

import { usePathname } from 'next/navigation'
import { getMemberPageTitle } from './nav-links'

export function MemberPageTitle() {
  const pathname = usePathname()

  return (
    <span className="truncate text-lg font-bold tracking-tight">
      {getMemberPageTitle(pathname)}
    </span>
  )
}
