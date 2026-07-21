'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function MemberProfileLink({ label, children }: { label: string; children: ReactNode }) {
  const active = usePathname() === '/profile/me'

  return (
    <Link
      href="/profile/me"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center justify-center gap-3 rounded-[var(--radius-box)] px-1 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring xl:justify-start xl:px-2',
        active
          ? 'bg-[image:var(--nav-active-bg)] text-[var(--nav-active-text)]'
          : 'hover:bg-[var(--hover-tint)]',
      )}
    >
      {children}
    </Link>
  )
}
