'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin/invite', label: 'Invite' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/events', label: 'Org events' },
  { href: '/admin/announcements', label: 'Announcements' },
  { href: '/admin/analytics', label: 'Analytics' },
] as const

/**
 * Admin sub-nav with a real active state (underline + aria-current), same
 * pattern as the member nav. `/admin` itself renders the invite surface, so
 * it highlights the Invite tab.
 */
export function AdminTabs({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname()

  return (
    <nav className="flex shrink-0 gap-1 whitespace-nowrap">
      {TABS.map((tab) => {
        const isActive =
          pathname === tab.href ||
          pathname.startsWith(`${tab.href}/`) ||
          (tab.href === '/admin/invite' && pathname === '/admin')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative inline-flex items-center gap-1 rounded-sm px-2 py-1 transition-colors',
              isActive
                ? 'font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-[-9px] after:h-0.5 after:rounded-full after:bg-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.href === '/admin/approvals' && pendingCount > 0 ? (
              <Badge variant="secondary" className="px-1.5 py-0 text-xs leading-4">
                {pendingCount}
              </Badge>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
