'use client'

import { CircleHelp, HeartHandshake } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { type HelpMode, readHelpMode, writeHelpMode } from './help-mode-preference'

export function HelpModeSwitch({
  membershipId,
  mode,
  explicitMode,
}: {
  membershipId: string
  mode: HelpMode
  explicitMode: boolean
}) {
  const router = useRouter()

  useEffect(() => {
    if (explicitMode) {
      writeHelpMode(window.localStorage, membershipId, mode)
      return
    }
    const preferredMode = readHelpMode(window.localStorage, membershipId)
    if (preferredMode === 'give' && mode !== 'give') {
      router.replace('/help?mode=give', { scroll: false })
    }
  }, [explicitMode, membershipId, mode, router])

  return (
    <nav
      aria-label="Get help or give help"
      className="inline-flex gap-0.5 rounded-full bg-[var(--wash-toggle-track)] p-1 shadow-[inset_0_0_0_1px_rgb(25_31_40_/_0.06)]"
    >
      <ModeLink
        href="/help"
        label="Get help"
        active={mode === 'get'}
        onSelect={() => writeHelpMode(window.localStorage, membershipId, 'get')}
        icon={<CircleHelp aria-hidden className="size-[15px]" strokeWidth={2} />}
      />
      <ModeLink
        href="/help?mode=give"
        label="Give help"
        active={mode === 'give'}
        onSelect={() => writeHelpMode(window.localStorage, membershipId, 'give')}
        icon={<HeartHandshake aria-hidden className="size-[15px]" strokeWidth={2} />}
        give
      />
    </nav>
  )
}

function ModeLink({
  href,
  label,
  active,
  onSelect,
  icon,
  give = false,
}: {
  href: string
  label: string
  active: boolean
  onSelect(): void
  icon: React.ReactNode
  give?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-body-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        active
          ? cn(
              'bg-card font-bold shadow-sm',
              give ? 'text-[var(--action-give-text)]' : 'text-[var(--blue-600)]',
            )
          : 'font-semibold text-[var(--grey-600)] hover:bg-white/45',
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
