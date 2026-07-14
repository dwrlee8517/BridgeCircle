'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { getMemberNavIcon } from './member-nav-icons'
import { isMemberNavLinkActive, MEMBER_NAV_LINKS } from './nav-links'

export { MEMBER_NAV_LINKS }

export function MemberNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary" className={cn('flex flex-col gap-1', className)}>
      {MEMBER_NAV_LINKS.map((link) => {
        const Icon = getMemberNavIcon(link.href)
        const active = isMemberNavLinkActive(pathname, link)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-label={link.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center justify-center gap-3 rounded-[var(--radius-box)] px-3 text-nav font-semibold transition-[color,background-color] xl:justify-start',
              active
                ? 'bg-[image:var(--nav-active-bg)] font-bold text-[var(--nav-active-text)]'
                : 'text-muted-foreground hover:bg-[var(--hover-tint)] hover:text-foreground',
            )}
          >
            <Icon
              className={cn(
                'size-5 shrink-0 transition-colors',
                active ? 'text-current' : 'text-muted-foreground/75',
              )}
              strokeWidth={active ? 2.1 : 1.9}
              aria-hidden
            />
            <span className="hidden min-w-0 flex-1 xl:inline">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
