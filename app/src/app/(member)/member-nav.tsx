'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { MEMBER_NAV_LINKS } from './nav-links'

export { MEMBER_NAV_LINKS }

export function MemberNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const links = isAdmin
    ? [...MEMBER_NAV_LINKS, { href: '/admin/invite', label: 'Admin', match: ['/admin'] }]
    : MEMBER_NAV_LINKS

  // Synthesis Claude-unique: dropped the "01 Ask · 02 Help" numerals.
  // Numbers imply sequence — but Ask, Help, People, School, Inbox are
  // parallel destinations, not steps. Plain labels with an active underline
  // carry the editorial feel without the false signal.
  return (
    <nav className="hidden h-full items-stretch gap-[28px] text-sm @[900px]:flex">
      {links.map((link) => {
        const active = link.match.some((prefix) => {
          if (prefix === '/') {
            return pathname === '/'
          }
          return pathname === prefix || pathname.startsWith(`${prefix}/`)
        })
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-full items-center text-sm font-medium tracking-tight transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{link.label}</span>
            {active && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary dark:bg-foreground" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
