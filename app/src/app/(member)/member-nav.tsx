'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export const MEMBER_NAV_LINKS = [
  // Discover frames the directory as exploration, not a query — matches
  // the brand thesis that members shouldn't start at a blank search box.
  // /friends folded in here as a "People I know" filter; incoming friend
  // requests live on /inbox alongside ask requests.
  { href: '/discover', label: 'Discover', match: ['/discover', '/profile', '/friends'] },
  // /ask is the verb-driven heart of the product — your sent asks + a CTA
  // to start a new one. The composer at /ask/new and the thread at
  // /ask/thread/* are reached from this surface or from a profile.
  { href: '/ask', label: 'Ask', match: ['/ask'] },
  { href: '/inbox', label: 'Inbox', match: ['/inbox'] },
  { href: '/messages', label: 'Messages', match: ['/messages'] },
  { href: '/events', label: 'Events', match: ['/events'] },
  { href: '/announcements', label: 'Announcements', match: ['/announcements'] },
] as const

export function MemberNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const links = isAdmin
    ? [...MEMBER_NAV_LINKS, { href: '/admin/invite', label: 'Admin', match: ['/admin'] }]
    : MEMBER_NAV_LINKS

  return (
    <nav className="hidden items-center gap-7 text-sm @[900px]:flex">
      {links.map((link) => {
        const active = link.match.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        )
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative py-2 font-medium text-slate-300 transition-colors hover:text-white',
              active && 'font-semibold text-[#b4c5ff]',
            )}
          >
            {link.label}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-0 -bottom-3 h-0.5 rounded-full bg-[#316bf3] opacity-0 transition-opacity',
                active && 'opacity-100',
              )}
            />
          </Link>
        )
      })}
    </nav>
  )
}
