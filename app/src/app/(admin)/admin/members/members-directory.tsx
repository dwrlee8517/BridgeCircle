'use client'

import { ChevronLeft, ChevronRight, Search, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { QuietNote } from '@/components/ui/quiet-note'
import { StatusBadge } from '@/components/ui/status-badge'
import type {
  AdminMember,
  AdminMemberFilters,
  AdminMemberListResult,
  GrantableAdminRole,
} from '@/lib/admin/contracts'
import { cn, getInitials } from '@/lib/utils'
import { changeRoleAction, type RoleChangeActionState } from './actions'

const STATUS_TONES = {
  active: { tone: 'open', label: 'Active' },
  pending: { tone: 'info', label: 'Awaiting approval' },
  rejected: { tone: 'muted', label: 'Rejected' },
  revoked: { tone: 'muted', label: 'Revoked' },
} as const

const MANAGED_ROLES: Array<{ role: GrantableAdminRole; label: string; hint: string }> = [
  {
    role: 'admin',
    label: 'Admin',
    hint: 'Full console access. Super admins only can change this.',
  },
  { role: 'event_moderator', label: 'Event moderator', hint: 'Creates and edits school events.' },
  { role: 'ambassador', label: 'Ambassador', hint: 'Recognized class-year point of contact.' },
]

export function MembersDirectory({
  result,
  filters,
  page,
  pageSize,
  viewerMembershipId,
  viewerIsSuperAdmin,
}: {
  result: AdminMemberListResult
  filters: AdminMemberFilters
  page: number
  pageSize: number
  viewerMembershipId: string
  viewerIsSuperAdmin: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Track only the id — the drawer re-derives the member from fresh page data,
  // so a role change shows up the moment the server action revalidates.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected =
    (result.ok ? result.items.find((item) => item.membershipId === selectedId) : null) ?? null

  function applyFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    router.push(`/admin/members?${next.toString()}`)
  }

  if (!result.ok) {
    return (
      <p className="rounded-[var(--radius-large)] bg-card px-5 py-8 text-center text-sm font-medium text-[var(--text-muted)] shadow-[var(--ring-card),var(--shadow-card)]">
        The member list couldn’t load. Adjust the filters or refresh.
      </p>
    )
  }
  const pageCount = Math.max(1, Math.ceil(result.total / pageSize))

  return (
    <div className="space-y-3">
      <form
        action="/admin/members"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const query = data.get('q')
          const year = data.get('year')
          const next = new URLSearchParams(searchParams)
          for (const [key, raw] of [
            ['q', query],
            ['year', year],
          ] as const) {
            const value = typeof raw === 'string' ? raw.trim() : ''
            if (value) next.set(key, value)
            else next.delete(key)
          }
          next.delete('page')
          router.push(`/admin/members?${next.toString()}`)
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--icon-muted)]"
          />
          <Input
            name="q"
            defaultValue={filters.search ?? ''}
            placeholder="Search members by name…"
            className="pl-9"
            aria-label="Search members"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            name="year"
            type="number"
            inputMode="numeric"
            defaultValue={filters.classYear ?? ''}
            placeholder="Class year"
            aria-label="Class year"
            className="w-28"
          />
          <FilterSelect
            label="Status"
            value={filters.status ?? ''}
            onChange={(value) => applyFilter('status', value)}
            options={[
              ['', 'Any status'],
              ['active', 'Active'],
              ['pending', 'Awaiting approval'],
              ['rejected', 'Rejected'],
              ['revoked', 'Revoked'],
            ]}
          />
          <FilterSelect
            label="Open to help"
            value={filters.openToHelp == null ? '' : filters.openToHelp ? '1' : '0'}
            onChange={(value) => applyFilter('help', value)}
            options={[
              ['', 'Any availability'],
              ['1', 'Open to help'],
              ['0', 'Not open'],
            ]}
          />
          <FilterSelect
            label="Activity"
            value={filters.inactiveDays ? String(filters.inactiveDays) : ''}
            onChange={(value) => applyFilter('inactive', value)}
            options={[
              ['', 'Any activity'],
              ['30', 'Quiet 30+ days'],
              ['90', 'Quiet 90+ days'],
            ]}
          />
        </div>
      </form>

      <div className="overflow-hidden rounded-[var(--radius-card-xl)] bg-card shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--divider-row)] px-4 py-2.5 sm:px-5">
          <span className="text-xs font-bold text-[var(--text-secondary)] tabular-nums">
            {result.total} {result.total === 1 ? 'member' : 'members'}
          </span>
          {pageCount > 1 ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] tabular-nums">
              <PageLink
                page={page - 1}
                disabled={page <= 1}
                icon={ChevronLeft}
                label="Previous page"
              />
              {page} / {pageCount}
              <PageLink
                page={page + 1}
                disabled={page >= pageCount}
                icon={ChevronRight}
                label="Next page"
              />
            </span>
          ) : null}
        </div>
        {result.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm font-medium text-[var(--text-muted)]">
            No members match these filters.
          </p>
        ) : (
          result.items.map((member) => (
            <button
              key={member.membershipId}
              type="button"
              onClick={() => setSelectedId(member.membershipId)}
              className="flex w-full items-center gap-3 border-t border-[var(--divider-row)] px-4 py-3 text-left first:border-t-0 hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring sm:px-5"
            >
              <Avatar size="sm" aria-hidden>
                <AvatarFallback seed={member.userId}>
                  {getInitials(member.displayName ?? '?')}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-bold text-[var(--text-primary)]">
                    {member.displayName ?? 'Unnamed member'}
                  </span>
                  {member.graduationYear ? (
                    <span className="shrink-0 text-xs font-semibold text-[var(--text-muted)] tabular-nums">
                      ’{String(member.graduationYear).slice(-2)}
                    </span>
                  ) : null}
                  {member.roles.length > 0 ? (
                    <ShieldCheck
                      aria-hidden
                      className="size-3.5 shrink-0 text-[var(--action-weak-text)]"
                    />
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs font-medium text-[var(--text-muted)]">
                  {[member.title, member.employer, member.city].filter(Boolean).join(' · ') ||
                    'No profile details yet'}
                </span>
              </span>
              {member.openToHelp ? (
                <span className="hidden shrink-0 text-xs font-semibold text-[var(--action-give-text)] md:inline">
                  Open to help
                </span>
              ) : null}
              <StatusBadge
                size="sm"
                tone={STATUS_TONES[member.status].tone}
                dot={member.status === 'active'}
              >
                {STATUS_TONES[member.status].label}
              </StatusBadge>
            </button>
          ))
        )}
      </div>

      <MemberDrawer
        member={selected}
        onClose={() => setSelectedId(null)}
        viewerMembershipId={viewerMembershipId}
        viewerIsSuperAdmin={viewerIsSuperAdmin}
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<[string, string]>
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-10 rounded-[var(--radius-box)] bg-card px-3 text-xs font-semibold text-[var(--text-secondary)] shadow-[var(--ring-outline)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue || 'any'} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  )
}

function PageLink({
  page,
  disabled,
  icon: Icon,
  label,
}: {
  page: number
  disabled: boolean
  icon: typeof ChevronLeft
  label: string
}) {
  const searchParams = useSearchParams()
  const next = new URLSearchParams(searchParams)
  next.set('page', String(page))
  if (disabled) {
    return <Icon aria-hidden className="size-4 text-[var(--icon-muted)]" />
  }
  return (
    <Link
      href={`/admin/members?${next.toString()}`}
      aria-label={label}
      className="rounded p-0.5 hover:bg-[var(--hover-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <Icon aria-hidden className="size-4" />
    </Link>
  )
}

function MemberDrawer({
  member,
  onClose,
  viewerMembershipId,
  viewerIsSuperAdmin,
}: {
  member: AdminMember | null
  onClose: () => void
  viewerMembershipId: string
  viewerIsSuperAdmin: boolean
}) {
  const [state, formAction, pending] = useActionState<RoleChangeActionState, FormData>(
    changeRoleAction,
    { error: null },
  )
  const isSelf = member?.membershipId === viewerMembershipId

  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {member ? (
          <>
            <DialogTitle className="flex items-center gap-2.5">
              <Avatar size="sm" aria-hidden>
                <AvatarFallback seed={member.userId}>
                  {getInitials(member.displayName ?? '?')}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate">{member.displayName ?? 'Unnamed member'}</span>
                <span className="block text-xs font-semibold text-[var(--text-muted)]">
                  {member.graduationYear
                    ? `Class of ’${String(member.graduationYear).slice(-2)} · `
                    : ''}
                  {STATUS_TONES[member.status].label}
                </span>
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Membership details and console roles.
            </DialogDescription>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <DrawerFact label="Joined" value={formatDate(member.joinedAt)} />
              <DrawerFact label="Last seen" value={formatDate(member.lastSeenAt) ?? 'Not yet'} />
              <DrawerFact label="Helping" value={member.openToHelp ? 'Open to help' : 'Not open'} />
              <DrawerFact
                label="Account"
                value={member.accountState === 'active' ? 'Active' : 'Deletion scheduled'}
              />
            </dl>

            <div className="border-t border-[var(--divider-row)] pt-3">
              <p className="text-xs font-bold tracking-[0.08em] text-[var(--text-faint)] uppercase">
                Console roles
              </p>
              {member.roles.includes('super_admin') ? (
                <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
                  Super admin — managed outside the console.
                </p>
              ) : null}
              <div className="mt-2 space-y-2">
                {MANAGED_ROLES.map(({ role, label, hint }) => {
                  const held = member.roles.includes(role)
                  const locked = isSelf || (role === 'admin' && !viewerIsSuperAdmin)
                  return (
                    <form key={role} action={formAction} className="flex items-center gap-3">
                      <input type="hidden" name="targetMembershipId" value={member.membershipId} />
                      <input type="hidden" name="role" value={role} />
                      <input type="hidden" name="action" value={held ? 'revoke' : 'grant'} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">
                          {label}
                        </span>
                        <span className="block text-xs font-medium text-[var(--text-muted)]">
                          {hint}
                        </span>
                      </span>
                      <Button
                        type="submit"
                        size="sm"
                        variant={held ? 'outline' : 'secondary'}
                        disabled={pending || locked}
                      >
                        {held ? 'Revoke' : 'Grant'}
                      </Button>
                    </form>
                  )
                })}
              </div>
              {isSelf ? (
                <QuietNote className="mt-3">Your own roles are managed by another admin.</QuietNote>
              ) : null}
              {state.error ? (
                <p
                  role="alert"
                  className="mt-3 text-xs font-semibold text-[var(--state-danger-text)]"
                >
                  {state.error}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DrawerFact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={cn(!value && 'opacity-60')}>
      <dt className="font-bold tracking-[0.08em] text-[var(--text-faint)] uppercase">{label}</dt>
      <dd className="mt-0.5 font-medium text-[var(--text-secondary)]">{value ?? '—'}</dd>
    </div>
  )
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
