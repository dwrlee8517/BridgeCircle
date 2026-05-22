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

  return (
    <nav className="hidden h-full items-stretch gap-[28px] text-[13px] @[900px]:flex">
      {links.map((link, idx) => {
        const active = link.match.some((prefix) => {
          if (prefix === '/') {
            return pathname === '/'
          }
          return pathname === prefix || pathname.startsWith(`${prefix}/`)
        })
        const indexStr = String(idx + 1).padStart(2, '0')
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-full items-center text-[13px] font-medium tracking-tight transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'font-mono text-[9.5px] tracking-wider font-bold mr-1.5 uppercase transition-colors',
                active ? 'text-primary dark:text-foreground' : 'text-muted-foreground/60',
              )}
            >
              {indexStr}
            </span>
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
