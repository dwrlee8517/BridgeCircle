'use client'

import { Bell, LogOut, Settings, Shield, UserRound, Users } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '../(auth)/sign-in/actions'

type Props = {
  name: string | null
  avatarUrl: string | null
  graduationYear: number | null
  isAdmin: boolean
}

export function AccountMenu({ name, avatarUrl, graduationYear, isAdmin }: Props) {
  const initial = (name ?? '?').slice(0, 1).toUpperCase()
  const cohort = graduationYear ? `Class of ’${String(graduationYear).slice(-2)}` : 'Member account'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex cursor-pointer items-center rounded-full text-foreground transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Avatar className="size-10 after:border-white/20">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? ''} /> : null}
          <AvatarFallback className="bg-[image:var(--gradient-avatar)] font-bold text-white">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[300px] overflow-hidden rounded-[18px] border-0 bg-popover p-0 text-popover-foreground shadow-[var(--ring-card-elevated),0_20px_50px_-14px_rgb(25_31_40_/_0.3)]"
      >
        <Link
          href="/profile/me"
          className="flex items-center gap-3 px-5 pt-4 pb-3.5 transition-colors hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
        >
          <Avatar className="size-[42px] after:border-white/20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? ''} /> : null}
            <AvatarFallback className="bg-[image:var(--gradient-avatar)] font-bold text-white">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{name ?? 'Your profile'}</p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{cohort}</p>
          </div>
        </Link>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5">
            <Link href="/profile/me">
              <UserRound className="text-muted-foreground" />
              Edit profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5">
            <Link href="/people/circle">
              <Users className="text-muted-foreground" />
              My circle
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5">
            <Link href="/settings">
              <Settings className="text-muted-foreground" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5">
            <Link href="/notifications">
              <Bell className="text-muted-foreground" />
              Notifications
            </Link>
          </DropdownMenuItem>
          {isAdmin ? (
            <DropdownMenuItem
              asChild
              className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5 md:hidden"
            >
              <Link href="/admin/invite">
                <Shield className="text-muted-foreground" />
                Admin
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuGroup className="bg-[var(--surface-thread)] p-1.5">
          <form action={signOut}>
            <DropdownMenuItem
              asChild
              className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5 text-foreground"
            >
              <button type="submit" className="flex w-full items-center gap-2.5 text-left">
                <LogOut className="text-muted-foreground" />
                Sign out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
