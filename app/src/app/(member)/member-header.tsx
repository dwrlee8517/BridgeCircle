import { Menu, Search, Settings } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NotificationRow } from '@/lib/notifications/types'
import { AccountMenu } from './account-menu'
import { MemberNav } from './member-nav'
import { NotificationsBell } from './notifications-bell'

type Props = {
  userId: string
  name: string | null
  avatarUrl: string | null
  isAdmin: boolean
  notifications: NotificationRow[]
  unreadCount: number
}

const NAV_LINKS = [
  { href: '/search', label: 'Search' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/messages', label: 'Messages' },
  { href: '/friends', label: 'Friends' },
  { href: '/events', label: 'Events' },
  { href: '/announcements', label: 'Announcements' },
] as const

export function MemberHeader({
  userId,
  name,
  avatarUrl,
  isAdmin,
  notifications,
  unreadCount,
}: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1e293b] bg-[#0b1220] text-slate-300">
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
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 @[900px]:hidden"
          >
            <Menu className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {NAV_LINKS.map((link) => (
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

        <Link href="/" className="flex items-center gap-2" aria-label="BridgeCircle home">
          <Image
            src="/brand/mark-light.svg"
            alt=""
            width={30}
            height={30}
            className="rounded-md"
            priority
          />
          <span
            className="bc-fraunces text-[22px] font-bold leading-none tracking-[-0.025em]"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
          >
            <span className="text-white">Bridge</span>
            <span className="text-[#b4c5ff]">Circle</span>
          </span>
        </Link>

        {/* Inline nav — visible only when the header is wide enough.  */}
        <MemberNav isAdmin={isAdmin} />

        <div className="ml-auto flex items-center gap-2">
          <form
            action="/search"
            className="hidden h-9 items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 text-slate-300 @[1080px]:flex"
          >
            <Search className="size-4 text-slate-500" />
            <input
              name="q"
              type="search"
              placeholder="Search the circle..."
              className="w-44 bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </form>
          <NotificationsBell
            initial={notifications}
            initialUnread={unreadCount}
            viewerId={userId}
          />
          <Link
            href="/mentorship/settings"
            aria-label="Mentor settings"
            className="hidden size-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:inline-flex"
          >
            <Settings className="size-4" />
          </Link>
          <AccountMenu userId={userId} name={name} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  )
}
