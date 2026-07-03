'use client'

import { LogOut, Monitor, Moon, Settings, Sun, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { avatarColorClasses, cn } from '@/lib/utils'
import { signOut } from '../(auth)/sign-in/actions'

type Props = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

export function AccountMenu({ userId, name, avatarUrl }: Props) {
  const initial = (name ?? '?').slice(0, 1).toUpperCase()
  // Seeded on userId so the viewer's color matches their avatar everywhere.
  const fallbackColorClass = avatarColorClasses(userId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex cursor-pointer items-center rounded-md p-0.5 text-foreground transition-colors hover:bg-secondary focus-visible:border-focus-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring-muted"
      >
        <Avatar className="size-8 rounded-md after:rounded-md">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name ?? ''} className="rounded-md" />
          ) : null}
          <AvatarFallback className={cn('rounded-md font-semibold', fallbackColorClass)}>
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 rounded-md border border-border bg-popover p-1.5 text-popover-foreground shadow-card-hover"
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar className="size-9 rounded-md after:rounded-md">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name ?? ''} className="rounded-md" />
            ) : null}
            <AvatarFallback className={cn('rounded-md font-semibold', fallbackColorClass)}>
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
          <Link href="/help/settings">
            <Settings className="size-4 text-muted-foreground" />
            Help settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5" />
        <ThemeRow />
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

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

/**
 * Light / Dark / System segmented row. Follows the OS by default
 * (defaultTheme="system" in the root ThemeProvider); this is the manual
 * override. Plain buttons with onSelect-preventDefault so picking a theme
 * doesn't close the menu.
 */
function ThemeRow() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between gap-2.5 px-3 py-2">
      <span className="text-sm text-foreground">Theme</span>
      <fieldset
        className="flex rounded-md border border-border bg-secondary p-0.5"
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
                'flex size-7 items-center justify-center rounded-sm transition-colors',
                active
                  ? 'bg-card text-foreground shadow-card'
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
