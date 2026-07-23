'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemberShellHeaderState } from './member-shell-header-context'
import { getMemberPageTitle } from './nav-links'

export function MemberPageTitle() {
  const pathname = usePathname()
  const headerOverride = useMemberShellHeaderState()

  return (
    <div className="flex min-w-0 items-center gap-3">
      {headerOverride?.backHref ? (
        <Link
          href={headerOverride.backHref}
          aria-label={headerOverride.backLabel ?? 'Back'}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--grey-200)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <ArrowLeft aria-hidden className="size-4.5" strokeWidth={2.2} />
        </Link>
      ) : null}
      <span className="truncate text-lg font-bold tracking-tight">
        {headerOverride?.title ?? getMemberPageTitle(pathname)}
      </span>
      {headerOverride?.meta ? (
        <span className="hidden shrink-0 text-xs font-semibold text-[var(--text-faint)] sm:inline">
          · {headerOverride.meta}
        </span>
      ) : null}
    </div>
  )
}
