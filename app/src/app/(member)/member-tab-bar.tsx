'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getMemberNavIcon } from './member-nav-icons'
import { activeMemberNavStyle, getMemberNavAccent } from './member-nav-style'
import { MEMBER_NAV_LINKS } from './nav-links'

/**
 * Mobile bottom tab bar — the Civic Editorial prototype's primary mobile
 * navigation. Shown below `md` (≈760px); the header's hamburger covers the
 * 768–900px band and the inline nav takes over at ≥900px. Icons are keyed by
 * href so `nav-links.ts` (shared with the RSC header) stays as plain route
 * metadata while the desktop and mobile surfaces share the same icon set.
 */
export function MemberTabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(60px+env(safe-area-inset-bottom))] items-start justify-around border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_14px_-4px_rgb(12_12_11_/_0.06)] md:hidden"
    >
      {MEMBER_NAV_LINKS.map((link) => {
        const Icon = getMemberNavIcon(link.href)
        const active = link.match.some((prefix) =>
          prefix === '/'
            ? pathname === '/'
            : pathname === prefix || pathname.startsWith(`${prefix}/`),
        )
        const activeAccent = getMemberNavAccent(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className="flex min-h-[60px] flex-1 items-center justify-center px-1 text-[11px] font-medium"
          >
            <span
              style={active ? activeMemberNavStyle(activeAccent, '--member-tab-accent') : undefined}
              className={cn(
                'relative flex h-12 min-w-[58px] flex-col items-center justify-center gap-1 rounded-md border px-2 transition-[color,background-color,border-color,box-shadow]',
                active
                  ? 'border-transparent text-foreground shadow-card after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-[var(--member-tab-accent)]'
                  : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/35 hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'size-5 transition-colors',
                  active ? 'text-[var(--member-tab-accent)]' : 'text-muted-foreground/75',
                )}
                strokeWidth={1.8}
                aria-hidden
              />
              <span>{link.label}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
