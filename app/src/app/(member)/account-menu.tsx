'use client'

import { LogOut, Settings, UserRound } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { signOut } from '../(auth)/sign-in/actions'

type Props = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

function getStableBgColor(name: string | null) {
  if (!name) return 'bg-muted-foreground text-background'
  const colors = [
    'bg-accent-rust text-background',
    'bg-accent-sage text-background',
    'bg-accent-plum text-background',
    'bg-accent-ochre text-background',
    'bg-primary text-primary-foreground',
    'bg-muted-foreground text-background',
  ]
  let sum = 0
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i)
  }
  return colors[sum % colors.length]
}

export function AccountMenu({ userId, name, avatarUrl }: Props) {
  const initial = (name ?? '?').slice(0, 1).toUpperCase()
  const fallbackColorClass = getStableBgColor(name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex cursor-pointer items-center rounded-lg p-0.5 text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-8 rounded-lg after:rounded-lg">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name ?? ''} className="rounded-lg" />
          ) : null}
          <AvatarFallback className={cn('font-semibold rounded-lg', fallbackColorClass)}>
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 border border-border bg-popover p-1.5 text-popover-foreground shadow-md rounded-lg"
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar className="size-9 rounded-lg after:rounded-lg">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name ?? ''} className="rounded-lg" />
            ) : null}
            <AvatarFallback className={cn('font-semibold rounded-lg', fallbackColorClass)}>
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name ?? 'Account'}</p>
            <p className="text-xs text-muted-foreground">Member account</p>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          asChild
          className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground focus:bg-secondary focus:text-foreground"
        >
          <Link href={`/profile/${userId}`}>
            <UserRound className="size-4 text-muted-foreground" />
            My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground focus:bg-secondary focus:text-foreground"
        >
          <Link href="/profile/edit">
            <UserRound className="size-4 text-muted-foreground" />
            Edit profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground focus:bg-secondary focus:text-foreground"
        >
          <Link href="/mentorship/settings">
            <Settings className="size-4 text-muted-foreground" />
            Helper preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5" />
        <form action={signOut}>
          <DropdownMenuItem
            asChild
            className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground focus:bg-secondary focus:text-foreground"
          >
            <button type="submit" className="w-full text-left">
              <LogOut className="size-4 text-muted-foreground" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
