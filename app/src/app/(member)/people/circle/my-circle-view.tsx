'use client'

import { LoaderCircle, MessageCircle, UserMinus, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useMemberShellHeader } from '@/app/(member)/member-shell-header-context'
import { ConnectivityNotice } from '@/components/connectivity-notice'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PeopleDirectoryItem } from '@/lib/people/contracts'

export function MyCircleView({
  initialItems,
  avatarUrls,
}: {
  initialItems: PeopleDirectoryItem[]
  avatarUrls: Record<string, string>
}) {
  const [items, setItems] = useState(initialItems)
  const [disconnecting, setDisconnecting] = useState<PeopleDirectoryItem | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useMemberShellHeader({
    title: 'My circle',
    meta: 'People › My circle',
    backHref: '/people',
    backLabel: 'Back to People',
  })

  async function confirmDisconnect() {
    if (!disconnecting || pending) return
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/connections/${disconnecting.userId}/disconnect`, {
        method: 'POST',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('disconnect_unavailable')
      const name = displayName(disconnecting)
      setItems((current) => current.filter((item) => item.userId !== disconnecting.userId))
      setDisconnecting(null)
      setNotice(`You and ${name} are no longer connected. Your messages are still in Messages.`)
    } catch {
      setError('That did not go through. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[760px]">
        <ConnectivityNotice />
        <header>
          <h1 className="text-page-title leading-tight font-extrabold tracking-display">
            My circle
          </h1>
          <p className="mt-1.5 text-body-sm font-medium text-[var(--text-secondary)]">
            {items.length} {items.length === 1 ? 'person' : 'people'}. Connections see your
            circle-only links; disconnecting is mutual and never announced.
          </p>
        </header>

        {notice ? (
          <div
            role="status"
            className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--surface-card)] px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] shadow-[var(--ring-card),var(--shadow-card)]"
          >
            <span className="min-w-0 flex-1">{notice}</span>
            <button
              type="button"
              className="shrink-0 rounded-md px-2 py-1 text-[var(--text-faint)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              onClick={() => setNotice(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {items.length ? (
          <section
            aria-label="People in your circle"
            className="mt-4 grid gap-px overflow-hidden rounded-[var(--radius-card-xl)] bg-[var(--divider-row)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]"
          >
            {items.map((person) => {
              const name = displayName(person)
              const conversationId =
                person.relationship.state === 'connected'
                  ? person.relationship.conversationId
                  : null
              return (
                <article
                  key={person.userId}
                  className="flex flex-col gap-3 bg-[image:var(--surface-card-elevated)] px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                >
                  <Avatar className="size-[42px] shrink-0">
                    {person.avatarPath && avatarUrls[person.avatarPath] ? (
                      <AvatarImage src={avatarUrls[person.avatarPath]} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <Link
                        href={`/profile/${person.userId}`}
                        className="rounded text-sm font-bold hover:text-[var(--blue-600)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        {name}
                      </Link>
                      {person.graduationYear ? (
                        <span className="text-xs font-semibold text-[var(--text-faint)] tabular-nums">
                          ’{String(person.graduationYear).slice(-2)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs font-medium text-[var(--grey-600)]">
                      {roleLine(person) || 'Profile details coming soon'}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:shrink-0">
                    {conversationId ? (
                      <Button asChild variant="secondary" size="sm" className="flex-1 rounded-full">
                        <Link href={`/messages/${conversationId}`}>
                          <MessageCircle aria-hidden /> Message
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={() => {
                        setError(null)
                        setDisconnecting(person)
                      }}
                    >
                      <UserMinus aria-hidden /> Disconnect…
                    </Button>
                  </div>
                </article>
              )
            })}
          </section>
        ) : (
          <section className="mt-4 rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-6 py-11 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-faint)]">
              <Users aria-hidden className="size-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-[var(--text-secondary)]">
              No one in your circle yet — every accepted hello lands here.
            </p>
            <Button asChild variant="cta" className="mt-4">
              <Link href="/people">Find people to connect with</Link>
            </Button>
          </section>
        )}
      </div>

      <Dialog
        open={Boolean(disconnecting)}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setDisconnecting(null)
            setError(null)
          }
        }}
      >
        {disconnecting ? (
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Disconnect from {displayName(disconnecting)}?</DialogTitle>
              <DialogDescription>
                You’ll both leave each other’s circle. Your messages stay, and neither of you is
                notified.
              </DialogDescription>
            </DialogHeader>
            {error ? (
              <p role="alert" className="text-xs font-semibold text-[var(--state-danger)]">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                autoFocus
                variant="outline"
                disabled={pending}
                onClick={() => setDisconnecting(null)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-[var(--red-200)] text-[var(--state-danger)]"
                disabled={pending}
                aria-busy={pending}
                onClick={confirmDisconnect}
              >
                {pending ? (
                  <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
                ) : null}
                Disconnect
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}

function displayName(person: PeopleDirectoryItem): string {
  return person.preferredName || person.displayName
}

function roleLine(person: PeopleDirectoryItem): string {
  return [[person.currentTitle, person.currentEmployer].filter(Boolean).join(' · '), person.city]
    .filter(Boolean)
    .join(' · ')
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}
