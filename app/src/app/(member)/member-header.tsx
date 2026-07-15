'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/ui/wordmark'
import type { NotificationRow } from '@/lib/notifications/types'
import { AccountMenu } from './account-menu'
import { MemberPageTitle } from './member-page-title'
import { useMemberShellHeaderState } from './member-shell-header-context'
import { NotificationsBell } from './notifications-bell'

type Props = {
  userId: string
  name: string | null
  avatarUrl: string | null
  graduationYear: number | null
  isAdmin: boolean
  notifications: NotificationRow[]
  unreadCount: number
}

export function MemberHeader({
  userId,
  name,
  avatarUrl,
  graduationYear,
  isAdmin,
  notifications,
  unreadCount,
}: Props) {
  const headerOverride = useMemberShellHeaderState()

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border-subtle bg-card/90 text-foreground backdrop-blur-sm">
      <div className="flex h-[var(--topbar-height)] items-center gap-3 px-4 md:px-6 xl:px-8">
        <Link
          href="/"
          aria-label="BridgeCircle home"
          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:hidden"
        >
          <Wordmark textClassName="hidden" />
        </Link>

        <MemberPageTitle />

        <div className="ml-auto flex items-center gap-2">
          {headerOverride?.hideNotifications ? null : (
            <NotificationsBell
              initial={notifications}
              initialUnread={unreadCount}
              viewerId={userId}
            />
          )}
          <AccountMenu
            userId={userId}
            name={name}
            avatarUrl={avatarUrl}
            graduationYear={graduationYear}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  )
}
