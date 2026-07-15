'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type {
  MessageConversationPage,
  MessagesCounts,
  MessagesCursor,
  MessagesFilter,
  MessagesWaitingItem,
} from '@/lib/messages/contracts'
import { mergeConversationPages } from '@/lib/messages/operations'
import { cn } from '@/lib/utils'
import { useUserControl } from '../user-control-provider'
import { ConversationList } from './conversation-list'
import { MessagesListError, MessagesListSkeleton } from './messages-list-states'
import { WaitingGroup } from './waiting-group'

type PageResponse = MessageConversationPage & {
  avatarUrls?: Record<string, string>
  error?: string
}

const FILTERS: Array<{ value: MessagesFilter; label: string; count: keyof MessagesCounts }> = [
  { value: 'all', label: 'All', count: 'all' },
  { value: 'unread', label: 'Unread', count: 'unread' },
  { value: 'my_circle', label: 'My circle', count: 'myCircle' },
  { value: 'open_asks', label: 'Open asks', count: 'openAsks' },
]

function selectedConversationId(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  return parts[0] === 'messages' && parts.length > 1 ? (parts[1] ?? null) : null
}

function pageUrl(filter: MessagesFilter, query: string, cursor: MessagesCursor | null): string {
  const params = new URLSearchParams({ filter, limit: '30' })
  const normalizedQuery = query.trim()
  if (normalizedQuery) params.set('query', normalizedQuery)
  if (cursor) {
    params.set('beforePriority', String(cursor.priority))
    params.set('beforeActivityAt', cursor.activityAt)
    params.set('beforeConversationId', cursor.conversationId)
  }
  return `/api/messages/conversations?${params.toString()}`
}

export function MessagesWorkspace({
  userId,
  initialPage,
  initialWaiting,
  initialCounts,
  initialAvatarUrls,
  initialLoadError,
  children,
}: {
  userId: string
  initialPage: MessageConversationPage
  initialWaiting: MessagesWaitingItem[]
  initialCounts: MessagesCounts
  initialAvatarUrls: Record<string, string>
  initialLoadError: boolean
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const selectedId = selectedConversationId(pathname)
  const { messagesRevision } = useUserControl()
  const [filter, setFilter] = useState<MessagesFilter>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(initialPage)
  const [avatarUrls, setAvatarUrls] = useState(initialAvatarUrls)
  const [error, setError] = useState(initialLoadError)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [removedWaitingIds, setRemovedWaitingIds] = useState<Set<string>>(() => new Set())
  const [isRefreshing, startRefresh] = useTransition()
  const requestSequence = useRef(0)
  const requestController = useRef<AbortController | null>(null)
  const firstQueryEffect = useRef(true)
  const lastMessagesRevision = useRef(messagesRevision)
  const waiting = initialWaiting.filter((item) => {
    const id = item.kind === 'direct_ask' ? item.askId : item.requestId
    return !removedWaitingIds.has(id)
  })

  const fetchPage = useCallback(
    async (cursor: MessagesCursor | null, mode: 'replace' | 'append') => {
      const sequence = ++requestSequence.current
      requestController.current?.abort()
      const controller = new AbortController()
      requestController.current = controller
      if (mode === 'replace') setLoading(true)
      else setLoadingMore(true)
      setError(false)
      try {
        const response = await fetch(pageUrl(filter, query, cursor), {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = (await response.json()) as PageResponse
        if (!response.ok) throw new Error(payload.error ?? 'messages_unavailable')
        if (sequence !== requestSequence.current) return
        setPage((current) => ({
          items:
            mode === 'replace'
              ? payload.items
              : mergeConversationPages(current.items, payload.items),
          nextCursor: payload.nextCursor,
        }))
        if (payload.avatarUrls) {
          setAvatarUrls((current) => ({ ...current, ...payload.avatarUrls }))
        }
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        if (sequence === requestSequence.current) setError(true)
      } finally {
        if (sequence === requestSequence.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [filter, query],
  )

  useEffect(() => {
    if (firstQueryEffect.current) {
      firstQueryEffect.current = false
      return
    }
    requestSequence.current += 1
    requestController.current?.abort()
    const timer = setTimeout(() => void fetchPage(null, 'replace'), 250)
    return () => clearTimeout(timer)
  }, [fetchPage])

  useEffect(() => {
    if (lastMessagesRevision.current === messagesRevision) return
    lastMessagesRevision.current = messagesRevision
    const timer = setTimeout(() => {
      void fetchPage(null, 'replace')
      startRefresh(() => router.refresh())
    }, 120)
    return () => clearTimeout(timer)
  }, [fetchPage, messagesRevision, router])

  useEffect(
    () => () => {
      requestController.current?.abort()
    },
    [],
  )

  function removeWaitingItem(id: string) {
    setRemovedWaitingIds((current) => new Set(current).add(id))
  }

  return (
    <div className="flex h-[calc(100dvh_-_var(--topbar-height)_-_60px_-_env(safe-area-inset-bottom))] min-h-0 w-full overflow-hidden bg-[var(--surface-thread)] md:h-[calc(100dvh-var(--topbar-height))]">
      <aside
        aria-label="Messages list"
        className={cn(
          'min-h-0 w-full shrink-0 flex-col border-r border-border-subtle bg-card md:w-[300px]',
          selectedId ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="grid shrink-0 gap-2.5 p-3.5 pb-2.5">
          <div className="flex h-10 items-center gap-2 rounded-[11px] bg-surface-subtle px-3 text-muted-foreground focus-within:outline-2 focus-within:outline-focus-ring">
            <Search aria-hidden className="size-4 shrink-0" />
            <label htmlFor="message-search" className="sr-only">
              Search messages
            </label>
            <input
              id="message-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={100}
              placeholder="Search messages…"
              className="min-w-0 flex-1 border-0 bg-transparent text-caption font-medium text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear message search"
                onClick={() => setQuery('')}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            ) : null}
          </div>
          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="sr-only">Message filters</legend>
            {FILTERS.map((option) => {
              const active = filter === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    'min-h-8 rounded-full px-3 text-kicker font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                    active
                      ? 'bg-primary-tint-strong font-bold text-[var(--blue-800)]'
                      : 'bg-surface-subtle text-text-secondary hover:bg-muted',
                  )}
                >
                  {option.label} {initialCounts[option.count]}
                </button>
              )
            })}
          </fieldset>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <WaitingGroup
            userId={userId}
            items={waiting}
            avatarUrls={{ ...initialAvatarUrls, ...avatarUrls }}
            onRemove={removeWaitingItem}
          />
          {loading ? (
            <MessagesListSkeleton />
          ) : error && page.items.length === 0 ? (
            <MessagesListError onRetry={() => void fetchPage(null, 'replace')} />
          ) : (
            <ConversationList
              items={page.items}
              selectedId={selectedId}
              filter={filter}
              query={query}
              avatarUrls={{ ...initialAvatarUrls, ...avatarUrls }}
              error={error}
              hasMore={Boolean(page.nextCursor)}
              loadingMore={loadingMore}
              onRetry={() => void fetchPage(null, 'replace')}
              onLoadMore={() => {
                if (page.nextCursor) void fetchPage(page.nextCursor, 'append')
              }}
            />
          )}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {loading
              ? 'Searching messages.'
              : `${page.items.length} conversation${page.items.length === 1 ? '' : 's'} shown.`}
          </p>
          {isRefreshing ? <span className="sr-only">Refreshing messages</span> : null}
        </div>
      </aside>

      <section
        aria-label={selectedId ? 'Conversation' : 'Messages welcome'}
        className={cn('min-h-0 min-w-0 flex-1', selectedId ? 'flex' : 'hidden md:flex')}
      >
        {children}
      </section>
    </div>
  )
}
