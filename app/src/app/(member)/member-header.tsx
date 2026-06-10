import { Menu } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wordmark } from '@/components/ui/wordmark'
import type { NotificationRow } from '@/lib/notifications/types'
import { AccountMenu } from './account-menu'
import { MemberNav } from './member-nav'
import { MEMBER_NAV_LINKS } from './nav-links'
import { NotificationsBell } from './notifications-bell'

type Props = {
  userId: string
  name: string | null
  avatarUrl: string | null
  isAdmin: boolean
  notifications: NotificationRow[]
  unreadCount: number
}

export function MemberHeader({
  userId,
  name,
  avatarUrl,
  isAdmin,
  notifications,
  unreadCount,
}: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card text-foreground">
      {/* @container makes child @[...]:utility classes responsive to the
          header's own width rather than the viewport's. The threshold
          (820px) was calibrated to where wordmark + 7 nav buttons + bell +
          avatar fit comfortably. Below that we collapse to a hamburger. */}
      <div className="@container mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-8">
        {/* Hamburger — visible whenever the inline nav doesn't fit. Opens
            the same links as a DropdownMenu (no shadcn/sheet needed). */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open navigation"
            className="rounded-lg p-2 text-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 max-md:hidden @[900px]:hidden"
          >
            <Menu className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {MEMBER_NAV_LINKS.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <Link href={link.href}>{link.label}</Link>
              </DropdownMenuItem>
            ))}
            {isAdmin ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/invite">Admin</Link>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href="/" aria-label="BridgeCircle home">
          <Wordmark />
        </Link>

        {/* Inline nav — visible only when the header is wide enough.  */}
        <MemberNav isAdmin={isAdmin} />

        <div className="ml-auto flex items-center gap-2">
          <NotificationsBell
            initial={notifications}
            initialUnread={unreadCount}
            viewerId={userId}
          />
          {/* Helper preferences moved into the avatar menu — having both a
              cog icon here and the same destination in the dropdown was a
              dual entry point, and the cog showed unconditionally even to
              members who aren't open to helping. */}
          <AccountMenu userId={userId} name={name} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  )
}
