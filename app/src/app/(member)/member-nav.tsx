'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'
import { getMemberNavIcon } from './member-nav-icons'
import { MEMBER_NAV_LINKS } from './nav-links'

export { MEMBER_NAV_LINKS }

export function MemberNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const links = isAdmin
    ? [...MEMBER_NAV_LINKS, { href: '/admin/invite', label: 'Admin', match: ['/admin'] }]
    : MEMBER_NAV_LINKS

  return (
    <nav className="hidden h-full items-center gap-1.5 text-sm @[900px]:flex">
      {links.map((link) => {
        const Icon = getMemberNavIcon(link.href)
        const active = link.match.some((prefix) => {
          if (prefix === '/') {
            return pathname === '/'
          }
          return pathname === prefix || pathname.startsWith(`${prefix}/`)
        })
        const activeAccent = getMemberNavAccent(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            style={active ? activeNavStyle(activeAccent) : undefined}
            className={cn(
              'relative flex h-10 items-center gap-1.5 self-center rounded-md border border-transparent px-2.5 text-sm font-medium tracking-tight transition-[color,background-color,border-color,box-shadow]',
              active
                ? 'text-foreground shadow-card after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-[var(--member-nav-accent)]'
                : 'text-muted-foreground hover:border-border/70 hover:bg-muted/35 hover:text-foreground',
            )}
          >
            <Icon
              className={cn(
                'size-3.5 transition-colors',
                active ? 'text-[var(--member-nav-accent)]' : 'text-muted-foreground/75',
              )}
              strokeWidth={1.8}
              aria-hidden
            />
            <span>{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function getMemberNavAccent(href: string) {
  if (href === '/help') return 'var(--action-offer)'
  if (href === '/people') return 'var(--accent-plum)'
  if (href === '/admin/invite') return 'var(--accent-plum)'
  return 'var(--primary)'
}

function activeNavStyle(accent: string): CSSProperties {
  return {
    '--member-nav-accent': accent,
    borderColor: `color-mix(in srgb, ${accent} 18%, var(--border))`,
    background: `linear-gradient(180deg, var(--card), color-mix(in srgb, ${accent} 7%, var(--card)))`,
    boxShadow: `0 1px 0 rgb(12 12 11 / 5%), 0 10px 20px color-mix(in srgb, ${accent} 6%, transparent)`,
  } as CSSProperties
}
