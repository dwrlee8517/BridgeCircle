'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getMemberNavIcon } from './member-nav-icons'
import { isMemberNavLinkActive, MEMBER_NAV_LINKS } from './nav-links'

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
        const active = isMemberNavLinkActive(pathname, link)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className="flex min-h-[60px] min-w-0 flex-1 items-center justify-center text-kicker font-medium"
          >
            <span
              className={cn(
                'flex h-12 w-[calc(100%-4px)] min-w-0 max-w-[58px] flex-col items-center justify-center gap-1 rounded-[var(--radius-box)] px-1 transition-[color,background-color]',
                active
                  ? 'bg-[image:var(--nav-active-bg)] font-bold text-[var(--nav-active-text)]'
                  : 'text-muted-foreground hover:bg-[var(--hover-tint)] hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'size-5 transition-colors',
                  active ? 'text-current' : 'text-muted-foreground/75',
                )}
                strokeWidth={active ? 2.1 : 1.9}
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
