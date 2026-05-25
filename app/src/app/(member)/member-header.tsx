import { Menu, Search } from 'lucide-react'
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
            className="rounded-lg p-2 text-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 @[900px]:hidden"
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

        <Link href="/" className="flex items-center gap-2.5" aria-label="BridgeCircle home">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
            <circle cx="11" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="17" cy="14" r="9" fill="none" stroke="var(--primary)" strokeWidth="1.4" />
          </svg>
          <span className="bc-fraunces text-lg font-bold leading-none tracking-[-0.02em] text-foreground">
            BridgeCircle
          </span>
        </Link>

        {/* Inline nav — visible only when the header is wide enough.  */}
        <MemberNav isAdmin={isAdmin} />

        <div className="ml-auto flex items-center gap-2">
          <form
            action="/people"
            className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-foreground transition-all focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/10 @[1080px]:flex"
          >
            <Search className="size-4 text-muted-foreground" />
            {/* suppressHydrationWarning matches the same pattern used on
                <html>/<body> in the root layout. Form-fill / shopping-assistant
                browser extensions (e.g. Honey, Sharkey, Grammarly) inject
                data-* attributes onto inputs *before* React hydrates, which
                causes a benign attribute mismatch warning on every page load.
                The warning is suppressed at the element level — real
                hydration bugs in surrounding code still surface. */}
            <input
              name="q"
              type="search"
              placeholder="Search the circle…"
              className="h-full w-44 border-none bg-transparent p-0 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus:border-none focus:shadow-none focus:ring-0"
              suppressHydrationWarning
            />
          </form>
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
