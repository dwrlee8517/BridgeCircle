import { Shield } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Wordmark } from '@/components/ui/wordmark'
import { MemberNav } from './member-nav'
import { MemberProfileLink } from './member-profile-link'

type Props = {
  name: string | null
  avatarUrl: string | null
  graduationYear: number | null
  isAdmin: boolean
}

export function MemberSidebar({ name, avatarUrl, graduationYear, isAdmin }: Props) {
  const initial = (name?.trim() || '?').slice(0, 1).toUpperCase()

  return (
    <aside className="sticky top-0 hidden h-dvh w-[var(--sidebar-width-rail)] shrink-0 flex-col border-r border-border-subtle bg-card px-2 py-4 md:flex xl:w-[var(--sidebar-width)] xl:px-4 xl:py-6">
      <Link
        href="/"
        aria-label="BridgeCircle home"
        className="flex min-h-12 items-center justify-center rounded-[var(--radius-box)] px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring xl:justify-start"
      >
        <Wordmark textClassName="hidden xl:inline" />
      </Link>

      <MemberNav className="mt-4 xl:mt-3" />

      <div className="mt-auto flex flex-col gap-2">
        {isAdmin ? (
          <nav aria-label="Administration">
            <Link
              href="/admin/invite"
              aria-label="Admin"
              className="flex min-h-10 items-center justify-center gap-3 rounded-[var(--radius-box)] px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-[var(--hover-tint)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring xl:justify-start"
            >
              <Shield aria-hidden className="size-5 shrink-0" strokeWidth={1.9} />
              <span className="hidden xl:inline">Admin</span>
            </Link>
          </nav>
        ) : null}

        <MemberProfileLink label={name ? `Open ${name}'s profile` : 'Open your profile'}>
          <Avatar className="size-9 shrink-0 after:border-white/20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? ''} /> : null}
            <AvatarFallback className="bg-[image:var(--gradient-avatar)] font-bold text-white">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 xl:block">
            <span className="block truncate text-sm font-bold leading-tight">
              {name ?? 'Your profile'}
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-muted-foreground tabular-nums">
              {graduationYear ? `Class of ’${String(graduationYear).slice(-2)}` : 'Member profile'}
            </span>
          </span>
        </MemberProfileLink>
      </div>
    </aside>
  )
}
