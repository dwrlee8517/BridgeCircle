'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { MessageConversationSummary, MessagesFilter } from '@/lib/messages/contracts'
import { cn, getInitials } from '@/lib/utils'

export function ConversationList({
  items,
  selectedId,
  filter,
  query,
  avatarUrls,
  error,
  hasMore,
  loadingMore,
  onRetry,
  onLoadMore,
}: {
  items: MessageConversationSummary[]
  selectedId: string | null
  filter: MessagesFilter
  query: string
  avatarUrls: Record<string, string>
  error: boolean
  hasMore: boolean
  loadingMore: boolean
  onRetry(): void
  onLoadMore(): void
}) {
  if (items.length === 0) {
    const filtered = filter !== 'all' || Boolean(query.trim())
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-caption font-bold text-foreground">
          {filtered ? 'Nothing here matches' : 'No conversations yet'}
        </p>
        <p className="mt-1.5 text-kicker leading-relaxed text-muted-foreground">
          {filtered
            ? 'Try another filter or a shorter search.'
            : 'Accepted asks and connections will stay together here.'}
        </p>
        {!filtered ? (
          <Button asChild variant="link" size="sm" className="mt-2">
            <Link href="/help">Find someone who can help</Link>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <ul aria-label="Conversations">
        {items.map((item) => {
          const selected = item.conversationId === selectedId
          const unread = item.unreadCount > 0
          const avatarUrl = item.counterpart.avatarPath
            ? avatarUrls[item.counterpart.avatarPath]
            : null
          return (
            <li key={item.conversationId}>
              <Link
                href={`/messages/${item.conversationId}`}
                aria-current={selected ? 'page' : undefined}
                aria-label={`${item.counterpart.displayName}${unread ? `, ${item.unreadCount} unread` : ''}`}
                className={cn(
                  'relative flex min-h-[68px] items-center gap-2.5 px-3.5 py-3 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring',
                  selected
                    ? 'bg-primary-tint-strong shadow-[inset_3px_0_0_var(--action-primary)]'
                    : 'hover:bg-[var(--row-hover)]',
                )}
              >
                <Avatar className="size-[42px]" aria-hidden>
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="" />
                  ) : (
                    <AvatarFallback>{getInitials(item.counterpart.displayName)}</AvatarFallback>
                  )}
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        'truncate text-caption text-foreground',
                        unread ? 'font-extrabold' : 'font-bold',
                      )}
                    >
                      {item.counterpart.preferredName ?? item.counterpart.displayName}
                    </span>
                    {item.counterpart.graduationYear ? (
                      <span
                        className={cn(
                          'shrink-0 text-kicker font-semibold',
                          selected ? 'text-text-secondary' : 'text-muted-foreground',
                        )}
                      >
                        ’{String(item.counterpart.graduationYear).slice(-2)}
                      </span>
                    ) : null}
                    <time
                      dateTime={item.activityAt}
                      className={cn(
                        'ml-auto shrink-0 text-kicker font-bold tabular-nums',
                        unread
                          ? 'text-[var(--blue-800)]'
                          : selected
                            ? 'text-text-secondary'
                            : 'text-muted-foreground',
                      )}
                    >
                      {format(new Date(item.activityAt), 'MMM d')}
                    </time>
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block truncate text-caption',
                      unread ? 'font-bold text-foreground' : 'font-medium text-text-secondary',
                    )}
                  >
                    {item.latestMessage?.body ?? item.askQuestion ?? 'Conversation started'}
                  </span>
                  {item.kind === 'ask' && item.askQuestion ? (
                    <span
                      className={cn(
                        'mt-0.5 block truncate text-kicker',
                        selected ? 'text-text-secondary' : 'text-muted-foreground',
                      )}
                    >
                      Ask · {item.askQuestion}
                    </span>
                  ) : null}
                </span>
                {unread ? (
                  <span aria-hidden className="size-2 shrink-0 rounded-full bg-action-primary" />
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>

      {error ? (
        <div className="mx-3 my-2 rounded-[var(--radius-comfortable)] bg-warning-tint p-3 text-kicker text-text-secondary">
          Couldn’t refresh the list.{' '}
          <button type="button" onClick={onRetry} className="font-bold text-link hover:underline">
            Try again
          </button>
        </div>
      ) : null}
      {hasMore ? (
        <div className="p-3 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-busy={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
