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
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-semibold">
          BridgeCircle
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/search">Search</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/inbox">Inbox</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/messages">Messages</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/friends">Friends</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/events">Events</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/announcements">Announcements</Link>
          </Button>
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
