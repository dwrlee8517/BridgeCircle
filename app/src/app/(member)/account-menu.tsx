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
import { signOut } from '../(auth)/sign-in/actions'

type Props = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

export function AccountMenu({ userId, name, avatarUrl }: Props) {
  const initial = (name ?? '?').slice(0, 1).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex cursor-pointer items-center rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      >
        <Avatar className="size-8 after:border-slate-700">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? ''} /> : null}
          <AvatarFallback className="bg-[#316bf3] font-semibold text-white">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 border-[rgba(180,197,255,.22)] bg-[#0b1220] p-1.5 text-slate-200 shadow-2xl ring-0"
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="size-9 after:border-slate-700">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? ''} /> : null}
            <AvatarFallback className="bg-[#316bf3] font-semibold text-white">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{name ?? 'Account'}</p>
            <p className="text-xs text-[#94a3b8]">Member account</p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          asChild
          className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 focus:bg-white/10 focus:text-white"
        >
          <Link href={`/profile/${userId}`}>
            <UserRound className="size-4 text-[#94a3b8]" />
            My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 focus:bg-white/10 focus:text-white"
        >
          <Link href="/profile/edit">
            <UserRound className="size-4 text-[#94a3b8]" />
            Edit profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 focus:bg-white/10 focus:text-white"
        >
          <Link href="/mentorship/settings">
            <Settings className="size-4 text-[#94a3b8]" />
            Helper preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <form action={signOut}>
          <DropdownMenuItem
            asChild
            className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 focus:bg-white/10 focus:text-white"
          >
            <button type="submit" className="w-full text-left">
              <LogOut className="size-4 text-[#94a3b8]" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
