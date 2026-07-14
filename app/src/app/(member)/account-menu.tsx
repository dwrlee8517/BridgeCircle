'use client'

import { Bell, HandHelping, LogOut, Monitor, Moon, Shield, Sun, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  graduationYear: number | null
  isAdmin: boolean
}

export function AccountMenu({ userId, name, avatarUrl, graduationYear, isAdmin }: Props) {
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
          href={`/profile/${userId}`}
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
            <Link href="/profile/edit">
              <UserRound className="text-muted-foreground" />
              Edit profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5">
            <Link href="/help/settings">
              <HandHelping className="text-muted-foreground" />
              Help settings
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
          <ThemeRow />
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

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

function ThemeRow() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between gap-2.5 rounded-lg px-3 py-2">
      <span className="text-sm text-foreground">Theme</span>
      <fieldset
        className="flex rounded-[var(--radius-standard)] bg-surface-panel p-0.5 shadow-[var(--ring-outline)]"
        aria-label="Theme"
      >
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon
          const active = (theme ?? 'system') === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={(event) => {
                event.preventDefault()
                setTheme(option.value)
              }}
              aria-pressed={active}
              aria-label={option.label}
              title={option.label}
              className={cn(
                'flex size-7 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                active
                  ? 'bg-surface-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
            </button>
          )
        })}
      </fieldset>
    </div>
  )
}
