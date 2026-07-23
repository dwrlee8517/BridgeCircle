'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { MessagesWaitingItem } from '@/lib/messages/contracts'
import { cn, getInitials } from '@/lib/utils'
import { useWaitingFoldedPreference } from './messages/use-waiting-preference'

export function HomeWaiting({
  userId,
  initialItems,
  avatarUrls,
}: {
  userId: string
  initialItems: MessagesWaitingItem[]
  avatarUrls: Record<string, string>
}) {
  const router = useRouter()
  const [folded, setFolded] = useWaitingFoldedPreference(userId)
  const [items, setItems] = useState(initialItems)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [acceptedConversationId, setAcceptedConversationId] = useState<string | null>(null)
  const contentId = useId()

  if (items.length === 0 && !acceptedConversationId) return null

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
        setItems((current) => current.filter((item) => waitingId(item) !== requestId))
        router.refresh()
        return
      }
      if (!response.ok) throw new Error(result.status ?? 'response_unavailable')
      if (result.status === 'accepted' || result.status === 'already_decided') {
        setItems((current) => current.filter((item) => waitingId(item) !== requestId))
        if (result.conversationId) setAcceptedConversationId(result.conversationId)
        router.refresh()
        return
      }
      if (result.status === 'declined') {
        setItems((current) => current.filter((item) => waitingId(item) !== requestId))
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
    <section className="overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
      <button
        type="button"
        aria-expanded={!folded}
        aria-controls={contentId}
        onClick={() => setFolded(!folded)}
        className="flex min-h-13 w-full items-center gap-2 px-5 text-left hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
      >
        <span className="text-body-sm font-bold tracking-tight text-foreground">
          Waiting on you
        </span>
        {items.length > 0 ? (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1.5 text-kicker font-bold text-destructive-foreground tabular-nums">
            {items.length > 99 ? '99+' : items.length}
          </span>
        ) : null}
        <span className="text-xs font-semibold text-muted-foreground">also in Messages</span>
        <ChevronRight
          aria-hidden
          className={cn(
            'ml-auto size-4 text-muted-foreground transition-transform',
            !folded && 'rotate-90',
          )}
        />
      </button>

      <div
        id={contentId}
        hidden={folded}
        className="min-w-0 divide-y divide-[var(--divider-row)] border-t border-[var(--divider-row)]"
      >
        {acceptedConversationId ? (
          <div
            role="status"
            className="bg-[var(--give-tint)] px-5 py-3 text-xs font-semibold text-[var(--action-give-text)]"
          >
            You’re connected.{' '}
            <Link href={`/messages/${acceptedConversationId}`} className="font-bold underline">
              Open the conversation
            </Link>
            .
          </div>
        ) : null}
        {items.map((item) => {
          const id = waitingId(item)
          const avatarUrl = item.counterpart.avatarPath
            ? avatarUrls[item.counterpart.avatarPath]
            : null
          const busy = pendingIds.has(id)
          return (
            <article key={`${item.kind}:${id}`} className="px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <Avatar size="sm" aria-hidden>
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                  <AvatarFallback seed={item.counterpart.userId}>
                    {getInitials(item.counterpart.displayName)}
                  </AvatarFallback>
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
                    {item.kind === 'direct_ask' ? 'Asked you directly' : 'Wants to connect'}
                  </span>
                </span>
                <time className="shrink-0 text-kicker font-semibold text-muted-foreground">
                  {formatWhen(item.createdAt)}
                </time>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed font-medium text-text-secondary">
                {item.kind === 'direct_ask'
                  ? item.requestMessage
                  : (item.introMessage ?? 'Would like to add you to their circle.')}
              </p>
              <div className="mt-2.5 flex gap-2">
                {item.kind === 'direct_ask' ? (
                  <Link
                    href={`/help/asks/${item.askId}`}
                    className="inline-flex min-h-10 items-center rounded-full bg-[var(--action-weak)] px-3.5 text-xs font-bold text-[var(--action-weak-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    View ask
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void decide(item.requestId, 'accept')}
                      className="min-h-10 rounded-full bg-[var(--action-weak)] px-3.5 text-xs font-bold text-[var(--action-weak-text)] disabled:opacity-55"
                    >
                      {busy ? 'Working…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void decide(item.requestId, 'decline')}
                      className="min-h-10 rounded-full bg-card px-3.5 text-xs font-semibold text-text-secondary shadow-[var(--ring-outline)] disabled:opacity-55"
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
              {errors[id] ? (
                <p role="alert" className="mt-2 text-kicker font-semibold text-destructive">
                  {errors[id]}
                </p>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function waitingId(item: MessagesWaitingItem) {
  return item.kind === 'direct_ask' ? item.askId : item.requestId
}

function formatWhen(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - Date.parse(value)) / 60_000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
