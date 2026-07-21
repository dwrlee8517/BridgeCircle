'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { MessagesWaitingItem } from '@/lib/messages/contracts'
import { cn, getInitials } from '@/lib/utils'
import { useWaitingFoldedPreference } from './use-waiting-preference'

export function WaitingGroup({
  userId,
  items,
  avatarUrls,
  onRemove,
}: {
  userId: string
  items: MessagesWaitingItem[]
  avatarUrls: Record<string, string>
  onRemove(id: string): void
}) {
  const [folded, setFolded] = useWaitingFoldedPreference(userId)
  const router = useRouter()
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const contentId = useId()

  if (items.length === 0) return null

  async function decide(requestId: string, decision: 'accept' | 'decline') {
    if (pendingIds.has(requestId)) return
    setPendingIds((current) => new Set(current).add(requestId))
    setErrors((current) => ({ ...current, [requestId]: '' }))
    try {
      const response = await fetch(`/api/connections/requests/${requestId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
        cache: 'no-store',
      })
      const result = (await response.json()) as {
        status?: string
        conversationId?: string | null
      }
      if (response.status === 404) {
        onRemove(requestId)
        router.refresh()
        return
      }
      if (!response.ok) throw new Error(result.status ?? 'response_unavailable')
      if (result.status === 'accepted' && result.conversationId) {
        onRemove(requestId)
        router.push(`/messages/${result.conversationId}`)
        return
      }
      if (result.status === 'already_decided' && result.conversationId) {
        onRemove(requestId)
        router.push(`/messages/${result.conversationId}`)
        return
      }
      if (result.status === 'declined' || result.status === 'already_decided') {
        onRemove(requestId)
        router.refresh()
        return
      }
      throw new Error('response_unavailable')
    } catch {
      setErrors((current) => ({
        ...current,
        [requestId]: 'That response didn’t go through. Try once more.',
      }))
    } finally {
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(requestId)
        return next
      })
    }
  }

  return (
    <section className="border-b border-border-subtle bg-surface-subtle/55">
      <button
        type="button"
        aria-expanded={!folded}
        aria-controls={contentId}
        onClick={() => setFolded(!folded)}
        className="flex min-h-11 w-full items-center gap-2 px-3.5 text-left hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
      >
        <span className="text-kicker font-extrabold tracking-label text-text-secondary">
          Waiting on you
        </span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-kicker font-bold text-destructive-foreground tabular-nums">
          {items.length > 99 ? '99+' : items.length}
        </span>
        <ChevronRight
          aria-hidden
          className={cn(
            'ml-auto size-4 text-muted-foreground transition-transform',
            !folded && 'rotate-90',
          )}
        />
      </button>

      <ul id={contentId} hidden={folded} className="grid gap-1.5 px-2 pb-2.5">
        {items.map((item) => {
          const id = item.kind === 'direct_ask' ? item.askId : item.requestId
          const avatarUrl = item.counterpart.avatarPath
            ? avatarUrls[item.counterpart.avatarPath]
            : null
          const busy = pendingIds.has(id)
          return (
            <li
              key={`${item.kind}:${id}`}
              className="rounded-[14px] bg-card p-3 shadow-[var(--ring-card)]"
            >
              <div className="flex items-center gap-2.5">
                <Avatar size="sm" aria-hidden>
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="" />
                  ) : (
                    <AvatarFallback seed={item.counterpart.userId}>
                      {getInitials(item.counterpart.displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-caption font-bold text-foreground">
                    {item.counterpart.displayName}
                    {item.counterpart.graduationYear ? (
                      <span className="ml-1 text-kicker font-semibold text-muted-foreground">
                        ’{String(item.counterpart.graduationYear).slice(-2)}
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-kicker font-semibold text-text-secondary">
                    {item.kind === 'direct_ask' ? 'Asked for your help' : 'Wants to connect'}
                  </span>
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-kicker leading-relaxed text-text-secondary">
                {item.kind === 'direct_ask'
                  ? item.requestMessage
                  : (item.introMessage ?? 'Would like to add you to their circle.')}
              </p>
              <div className="mt-2 flex gap-1.5">
                {item.kind === 'direct_ask' ? (
                  <Button asChild variant="secondary" size="xs">
                    <Link href={`/help/asks/${item.askId}`}>View ask</Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      disabled={busy}
                      aria-busy={busy}
                      onClick={() => void decide(item.requestId, 'accept')}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={busy}
                      onClick={() => void decide(item.requestId, 'decline')}
                    >
                      Decline
                    </Button>
                  </>
                )}
              </div>
              {errors[id] ? (
                <p role="alert" className="mt-2 text-kicker text-destructive">
                  {errors[id]}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
