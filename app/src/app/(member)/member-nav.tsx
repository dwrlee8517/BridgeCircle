'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { getMemberNavIcon } from './member-nav-icons'
import { MessagesAttentionBadge } from './messages-attention-badge'
import { isMemberNavLinkActive, MEMBER_NAV_LINKS } from './nav-links'
import { useUserControl } from './user-control-provider'

export { MEMBER_NAV_LINKS }

export function MemberNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const { messagesAttentionCount } = useUserControl()

  return (
    <nav aria-label="Primary" className={cn('flex flex-col gap-1', className)}>
      {MEMBER_NAV_LINKS.map((link) => {
        const Icon = getMemberNavIcon(link.href)
        const active = isMemberNavLinkActive(pathname, link)
        const isMessages = link.href === '/messages'
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-label={
              isMessages && messagesAttentionCount > 0
                ? `${link.label} (${messagesAttentionCount} items need attention)`
                : link.label
            }
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex min-h-11 items-center justify-center gap-3 rounded-[var(--radius-box)] px-3 text-nav font-semibold transition-[color,background-color] xl:justify-start',
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
            {isMessages ? (
              <MessagesAttentionBadge className="absolute top-1.5 right-1.5 xl:static" />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
