import { Menu } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NotificationRow } from '@/lib/notifications/types'
import { signOut } from '../(auth)/sign-in/actions'
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
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        {/* Mobile hamburger — visible only at <md, opens nav as a dropdown.
            We avoid pulling in shadcn/sheet just for this; DropdownMenu is
            already in the app and gives us the right semantics. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open navigation"
            className="rounded-md p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
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

        <Link href="/" className="font-semibold">
          BridgeCircle
        </Link>

        {/* Inline nav — visible only at md+. Same links as the dropdown.  */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {isAdmin ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/invite">Admin</Link>
            </Button>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <NotificationsBell
            initial={notifications}
            initialUnread={unreadCount}
            viewerId={userId}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-8">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? ''} /> : null}
                <AvatarFallback>{(name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/profile/${userId}`}>My profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/mentorship/settings">Mentor settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="w-full text-left">
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
