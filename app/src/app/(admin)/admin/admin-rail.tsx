'use client'

import {
  CalendarDays,
  Flag,
  type LucideIcon,
  MailPlus,
  Megaphone,
  UserCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export type AdminRailCounts = {
  approvals: number
  reports: number
}

type RailItem = {
  href: string
  label: string
  icon: LucideIcon
  count?: keyof AdminRailCounts
}

type RailGroup = { label: string; items: RailItem[] }

// The Members group grows a Directory item when /admin/members lands; groups
// exist so the rail scales without another IA pass.
const GROUPS: RailGroup[] = [
  {
    label: 'Members',
    items: [
      { href: '/admin/members', label: 'Directory', icon: Users },
      { href: '/admin/invite', label: 'Invites', icon: MailPlus },
      { href: '/admin/approvals', label: 'Approvals', icon: UserCheck, count: 'approvals' },
    ],
  },
  {
    label: 'Help & safety',
    items: [{ href: '/admin/reports', label: 'Reports', icon: Flag, count: 'reports' }],
  },
  {
    label: 'School',
    items: [
      { href: '/admin/events', label: 'Events', icon: CalendarDays },
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
]

/**
 * Grouped admin nav. Vertical in the desktop rail; `horizontal` renders the
 * same items as a scrollable strip for small screens (admin stays
 * desktop-primary, but nothing should be unreachable on a phone).
 */
export function AdminRail({
  counts,
  horizontal = false,
}: {
  counts: AdminRailCounts
  horizontal?: boolean
}) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === '/admin/members' && pathname === '/admin')

  if (horizontal) {
    return (
      <nav
        aria-label="Admin sections"
        className="flex gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {GROUPS.flatMap((group) => group.items).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'bc-motion-control inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring',
              isActive(item.href)
                ? 'bg-[image:var(--nav-active-bg)] text-[var(--nav-active-text)]'
                : 'text-muted-foreground hover:bg-[var(--hover-tint)] hover:text-foreground',
            )}
          >
            {item.label}
            <RailCount value={item.count ? counts[item.count] : 0} />
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-4">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 text-[11px] font-bold tracking-[0.1em] text-[var(--text-faint)] uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'bc-motion-control flex min-h-9 items-center gap-2.5 rounded-[var(--radius-box)] px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                    isActive(item.href)
                      ? 'bg-[image:var(--nav-active-bg)] text-[var(--nav-active-text)]'
                      : 'text-muted-foreground hover:bg-[var(--hover-tint)] hover:text-foreground',
                  )}
                >
                  <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.9} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <RailCount value={item.count ? counts[item.count] : 0} />
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function RailCount({ value }: { value: number }) {
  if (value <= 0) return null
  return (
    <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--closing-soon-tint)] px-1.5 text-[10.5px] font-bold text-[var(--closing-soon-text)] tabular-nums">
      {value > 99 ? '99+' : value}
    </span>
  )
}
