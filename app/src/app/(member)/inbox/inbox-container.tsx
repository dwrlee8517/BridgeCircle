'use client'

import { format, isToday, isYesterday } from 'date-fns'
import {
  Archive,
  ArrowLeft,
  ChevronRight,
  Inbox as InboxIcon,
  MessageSquare,
  Send,
  Smile,
} from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/db/client'
import { avatarColorClasses, getInitials } from '@/lib/utils'
import {
  acceptAskFromInboxAction,
  declineAskFromInboxAction,
  unifiedSendMessageAction,
} from './actions'
import { FriendRequestActions } from './friend-request-actions'

export type AskData = {
  id: string
  asker_id?: string
  helper_id?: string
  status: string
  ask_type: string
  reason: string | null
  help_needed: string | null
  created_at: string
  background?: string | null
}

export type FriendRequestData = {
  requestId: string
  name: string | null
  avatarUrl: string | null
  currentTitle: string | null
  currentEmployer: string | null
  message: string | null
  createdAt: string
  otherUserId: string
}

export type DmData = {
  threadId: string
  otherUserId: string
  otherName: string | null
  otherAvatarUrl: string | null
  otherHeadline: string | null
  isStillFriends: boolean
  unreadCount: number
  lastMessageBody: string | null
  lastMessageFromViewer: boolean
  lastMessageAt: string | null
}

export type ThreadData = {
  id: string
  status: string
  helper_id: string
  asker_id: string
  last_message_at: string | null
  created_at: string
  viewerUserId: string
  asks: {
    ask_type: string
  } | null
}

export type InboxItem = {
  id: string
  type:
    | 'incoming_ask'
    | 'outgoing_ask'
    | 'active_thread'
    | 'friend_request_incoming'
    | 'friend_request_outgoing'
    | 'dm_thread'
  title: string
  avatarUrl: string | null
  badge: string
  badgeTone: 'info' | 'warn' | 'open' | 'alert' | 'muted'
  subtitle: string
  date: string
  unread?: boolean
  cohort?: number | null
  originalData: unknown
}

type InboxArea = 'conversations' | 'requests' | 'history'
type ConversationView = 'needs_response' | 'helping' | 'getting_help' | 'direct'
type RequestView = 'received' | 'sent'
type HistoryView = 'archived'
type InboxView = ConversationView | RequestView | HistoryView
type InboxSection = 'advice' | 'mentorship' | 'connections'

const PRIMARY_AREAS = [
  {
    id: 'conversations',
    label: 'Conversations',
    description: 'Accepted help and direct messages',
  },
  {
    id: 'requests',
    label: 'Requests',
    description: 'Accept, decline, or check sent status',
  },
  {
    id: 'history',
    label: 'History',
    description: 'Closed and archived threads',
  },
] as const satisfies ReadonlyArray<{
  id: InboxArea
  label: string
  description: string
}>

const CONVERSATION_VIEWS = [
  {
    id: 'needs_response',
    label: 'Needs response',
    description: 'Unread active threads',
    tone: 'warn',
  },
  {
    id: 'helping',
    label: 'Helping others',
    description: 'Asks you said yes to',
    tone: 'open',
  },
  {
    id: 'getting_help',
    label: 'Getting help',
    description: 'Your asks to other members',
    tone: 'info',
  },
  {
    id: 'direct',
    label: 'Direct messages',
    description: 'Conversations with your connections',
    tone: 'muted',
  },
] as const satisfies ReadonlyArray<{
  id: ConversationView
  label: string
  description: string
  tone: 'warn' | 'open' | 'info' | 'muted'
}>

const REQUEST_VIEWS = [
  {
    id: 'received',
    label: 'Received',
    description: 'Requests that need accept or decline',
    tone: 'warn',
  },
  {
    id: 'sent',
    label: 'Sent',
    description: 'Pending and declined requests you sent',
    tone: 'muted',
  },
] as const satisfies ReadonlyArray<{
  id: RequestView
  label: string
  description: string
  tone: 'warn' | 'muted'
}>

const HISTORY_VIEWS = [
  { id: 'archived', label: 'Archived', description: 'Closed help relationships', tone: 'muted' },
] as const satisfies ReadonlyArray<{
  id: HistoryView
  label: string
  description: string
  tone: 'muted'
}>

interface CurrentUser {
  name: string | null
  avatarUrl: string | null
  userId: string
}

export function InboxContainer({
  items,
  currentUser,
}: {
  items: InboxItem[]
  currentUser: CurrentUser
}) {
  const [activeArea, setActiveArea] = useState<InboxArea>('conversations')
  const [conversationView, setConversationView] = useState<ConversationView>(() =>
    initialConversationView(items, currentUser.userId),
  )
  const [requestView, setRequestView] = useState<RequestView>('received')
  const [historyView, setHistoryView] = useState<HistoryView>('archived')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [reactionsMap, setReactionsMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedReactions = localStorage.getItem('bridgecircle_reactions')
      if (storedReactions) {
        try {
          setReactionsMap(JSON.parse(storedReactions))
        } catch (e) {
          console.error('Failed to parse reactions from localStorage:', e)
        }
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const toggleReaction = (messageId: string, reaction: string) => {
    setReactionsMap((prev) => {
      const current = prev[messageId] || []
      const next = current.includes(reaction)
        ? current.filter((r) => r !== reaction)
        : [...current, reaction]
      const updated = { ...prev, [messageId]: next }
      localStorage.setItem('bridgecircle_reactions', JSON.stringify(updated))
      return updated
    })
  }

  const primaryCounts = useMemo(
    () => ({
      conversations: items.filter(isConversationItem).length,
      requests: items.filter(isRequestItem).length,
      history: items.filter(isHistoryItem).length,
    }),
    [items],
  )

  const conversationCounts = useMemo(
    () => ({
      needs_response: items.filter(isConversationNeedsResponseItem).length,
      helping: items.filter(
        (item) => isActiveAskThread(item) && isHelpingItem(item, currentUser.userId),
      ).length,
      getting_help: items.filter(
        (item) => isActiveAskThread(item) && !isHelpingItem(item, currentUser.userId),
      ).length,
      direct: items.filter((item) => item.type === 'dm_thread').length,
    }),
    [items, currentUser.userId],
  )

  const requestCounts = useMemo(
    () => ({
      received: items.filter(isReceivedRequestItem).length,
      sent: items.filter(isSentRequestItem).length,
    }),
    [items],
  )

  const historyCounts = useMemo(
    () => ({
      archived: items.filter(isHistoryItem).length,
    }),
    [items],
  )

  const activeView = activeInboxView(activeArea, conversationView, requestView, historyView)
  const activeViewMeta = viewMeta(activeArea, activeView)

  const filteredItems = useMemo(
    () => filterItemsForView(items, activeArea, activeView, currentUser.userId),
    [items, activeArea, activeView, currentUser.userId],
  )

  const activeItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null
  }, [filteredItems, selectedItemId])

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id)
    setShowDetail(true)
  }

  const handleBackToList = () => {
    setShowDetail(false)
  }

  const handleAreaChange = (area: InboxArea) => {
    setActiveArea(area)
    setSelectedItemId(null)
    setShowDetail(false)
  }

  const handleViewChange = (view: InboxView) => {
    if (activeArea === 'conversations') {
      setConversationView(view as ConversationView)
    } else if (activeArea === 'requests') {
      setRequestView(view as RequestView)
    } else {
      setHistoryView(view as HistoryView)
    }
    setSelectedItemId(null)
    setShowDetail(false)
  }

  return (
    <div className="flex min-h-full flex-col bg-background md:h-full md:min-h-0 md:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-card px-4 md:px-6">
        <div className="flex min-h-16 flex-col justify-center py-3 md:py-0">
          <div>
            <h1 className="font-heading text-h1 font-semibold leading-tight text-foreground">
              Inbox
            </h1>
            <p className="mt-0.5 text-sm leading-tight text-muted-foreground">
              Your conversations and requests, in one place.
            </p>
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 md:min-h-0 md:overflow-hidden md:grid-cols-[272px_360px_minmax(0,1fr)]">
        <InboxSidebar
          activeArea={activeArea}
          activeView={activeView}
          primaryCounts={primaryCounts}
          conversationCounts={conversationCounts}
          requestCounts={requestCounts}
          historyCounts={historyCounts}
          onAreaChange={handleAreaChange}
          onViewChange={handleViewChange}
        />

        <section
          className={`min-h-0 flex-col border-r border-border bg-card ${
            showDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          <MobileInboxNav
            activeArea={activeArea}
            activeView={activeView}
            primaryCounts={primaryCounts}
            conversationCounts={conversationCounts}
            requestCounts={requestCounts}
            historyCounts={historyCounts}
            onAreaChange={handleAreaChange}
            onViewChange={handleViewChange}
          />
          <InboxListHeader
            activeArea={activeArea}
            activeView={activeView}
            activeViewMeta={activeViewMeta}
            count={filteredItems.length}
          />

          <div className="flex-1 p-1.5 md:min-h-0 md:overflow-y-auto">
            {filteredItems.length === 0 ? (
              <InboxListEmpty
                area={activeArea}
                view={activeView}
                conversationCounts={conversationCounts}
                onViewChange={handleViewChange}
              />
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredItems.map((item) => (
                  <InboxRow
                    key={item.id}
                    item={item}
                    viewerId={currentUser.userId}
                    isSelected={item.id === activeItem?.id}
                    onClick={() => handleSelectItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={`min-h-0 flex-col bg-card ${showDetail ? 'flex' : 'hidden md:flex'}`}>
          {activeItem ? (
            // Master-detail pane swap recipe (states-and-motion.md): keyed on
            // the selection so reveal + selection change both animate — slide
            // on mobile, pure fade on desktop.
            <div
              key={activeItem.id}
              className="flex min-h-0 flex-1 flex-col animate-in fade-in slide-in-from-right-2 duration-medium ease-emphasized md:slide-in-from-right-0 md:duration-fast"
            >
              <InboxDetailPane
                item={activeItem}
                currentUser={currentUser}
                onBack={handleBackToList}
                backLabel={
                  activeArea === 'requests'
                    ? 'Requests'
                    : activeArea === 'history'
                      ? 'History'
                      : 'Conversations'
                }
                reactionsMap={reactionsMap}
                toggleReaction={toggleReaction}
              />
            </div>
          ) : (
            <EmptyDetail />
          )}
        </section>
      </div>
    </div>
  )
}

function InboxSidebar({
  activeArea,
  activeView,
  primaryCounts,
  conversationCounts,
  requestCounts,
  historyCounts,
  onAreaChange,
  onViewChange,
}: {
  activeArea: InboxArea
  activeView: InboxView
  primaryCounts: Record<InboxArea, number>
  conversationCounts: Record<ConversationView, number>
  requestCounts: Record<RequestView, number>
  historyCounts: Record<HistoryView, number>
  onAreaChange: (area: InboxArea) => void
  onViewChange: (view: InboxView) => void
}) {
  return (
    <aside className="hidden min-h-0 flex-col border-r border-border bg-surface-panel/45 md:flex">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Inbox sections">
        {PRIMARY_AREAS.map((area) => {
          const isActive = activeArea === area.id

          return (
            <div key={area.id}>
              <button
                type="button"
                onClick={() => onAreaChange(area.id)}
                className={`bc-motion-control flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left ${
                  isActive
                    ? 'border-primary/25 bg-primary-tint text-foreground shadow-card'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground'
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border ${
                    isActive
                      ? 'border-primary/25 bg-card text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                  aria-hidden
                >
                  <AreaIcon area={area.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-heading text-sm font-semibold leading-tight">
                      {area.label}
                    </span>
                    <CountPill count={primaryCounts[area.id]} active={isActive} />
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                    {area.description}
                  </span>
                </span>
              </button>

              {isActive ? (
                <div className="ml-11 mt-1 flex flex-col gap-1">
                  {viewsForArea(area.id).map((view) => {
                    const viewActive = activeView === view.id
                    return (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => onViewChange(view.id)}
                        className={`bc-motion-control flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-xs font-semibold ${
                          viewActive
                            ? viewActiveClass(view.tone)
                            : 'text-muted-foreground hover:bg-card hover:text-foreground'
                        }`}
                        aria-pressed={viewActive}
                      >
                        <span className="min-w-0 truncate">{view.label}</span>
                        <span className="font-mono text-xs">
                          {countForView(view.id, conversationCounts, requestCounts, historyCounts)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function MobileInboxNav({
  activeArea,
  activeView,
  primaryCounts,
  conversationCounts,
  requestCounts,
  historyCounts,
  onAreaChange,
  onViewChange,
}: {
  activeArea: InboxArea
  activeView: InboxView
  primaryCounts: Record<InboxArea, number>
  conversationCounts: Record<ConversationView, number>
  requestCounts: Record<RequestView, number>
  historyCounts: Record<HistoryView, number>
  onAreaChange: (area: InboxArea) => void
  onViewChange: (view: InboxView) => void
}) {
  return (
    <div className="shrink-0 border-b border-border bg-surface-panel/45 p-3 md:hidden">
      <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-card p-1">
        {PRIMARY_AREAS.map((area) => {
          const isActive = activeArea === area.id
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => onAreaChange(area.id)}
              className={`bc-motion-control inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-sm px-1.5 text-xs font-semibold ${
                isActive
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
              }`}
              aria-pressed={isActive}
            >
              <span className="min-w-0 truncate">{area.label}</span>
              {primaryCounts[area.id] > 0 ? (
                <span
                  className={`font-mono text-xs ${
                    isActive ? 'text-background/75' : 'text-muted-foreground'
                  }`}
                >
                  {primaryCounts[area.id]}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5">
        {viewsForArea(activeArea).map((view) => {
          const isActive = activeView === view.id
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
              className={`bc-motion-control inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border px-2.5 text-xs font-semibold ${
                isActive
                  ? `${viewActiveClass(view.tone)} border-transparent`
                  : 'border-border bg-card text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
              }`}
              aria-pressed={isActive}
            >
              <span>{view.label}</span>
              <span className="font-mono text-xs">
                {countForView(view.id, conversationCounts, requestCounts, historyCounts)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InboxListHeader({
  activeArea,
  activeView,
  activeViewMeta,
  count,
}: {
  activeArea: InboxArea
  activeView: InboxView
  activeViewMeta: InboxViewMeta
  count: number
}) {
  return (
    <div className="shrink-0 border-b border-border bg-card p-3">
      <p className="bc-section-kicker">{areaLabel(activeArea)}</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold leading-tight text-foreground">
            {activeViewMeta.label}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {activeViewMeta.description}
          </p>
        </div>
        <p className="shrink-0 whitespace-nowrap font-mono text-xs font-medium uppercase tracking-label text-muted-foreground">
          {listCountLabel(activeArea, activeView, count)}
        </p>
      </div>
    </div>
  )
}

function InboxRow({
  item,
  viewerId,
  isSelected,
  onClick,
}: {
  item: InboxItem
  viewerId: string
  isSelected: boolean
  onClick: () => void
}) {
  const section = getItemSection(item)
  const sectionLabel = rowContextLabel(item, viewerId)
  const color = sectionColor(section)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`bc-motion-surface w-full rounded-md border px-3 py-2.5 text-left ${
        isSelected
          ? 'border-state-info/25 bg-primary-tint shadow-card'
          : 'border-transparent bg-transparent hover:bg-surface-subtle/70'
      }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar className="size-[34px]">
            {item.avatarUrl ? <AvatarImage src={item.avatarUrl} alt={item.title} /> : null}
            <AvatarFallback
              className={`font-heading text-xs font-semibold ${avatarColorClasses(item.title)}`}
            >
              {getInitials(item.title)}
            </AvatarFallback>
          </Avatar>
          {item.unread ? (
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-[1.5px] border-background bg-request-attention" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`truncate text-caption text-foreground ${
                item.unread || isSelected ? 'font-semibold' : 'font-medium'
              }`}
            >
              {item.title}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {formatInboxDate(item.date)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span
              className="font-sans text-xs font-semibold uppercase tracking-label"
              style={{ color }}
            >
              {sectionLabel}
            </span>
            {item.cohort ? (
              <span className="font-mono text-xs text-muted-foreground">
                &apos;{String(item.cohort).slice(-2)}
              </span>
            ) : null}
          </div>

          <p
            className={`mt-1 truncate text-xs leading-normal ${
              isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            {item.subtitle}
          </p>
        </div>
        <ChevronRight className="mt-3 size-3.5 shrink-0 text-muted-foreground/60 md:hidden" />
      </div>
    </button>
  )
}

function InboxListEmpty({
  area,
  view,
  conversationCounts,
  onViewChange,
}: {
  area: InboxArea
  view: InboxView
  conversationCounts: Record<ConversationView, number>
  onViewChange: (view: InboxView) => void
}) {
  const suggestedView =
    area === 'conversations' && view === 'needs_response'
      ? firstNonEmptyConversationView(conversationCounts, false)
      : null

  return (
    <div className="m-2 flex min-h-[260px] flex-col justify-center rounded-md border border-dashed border-border bg-card p-8 text-center">
      <InboxIcon className="mx-auto mb-3 size-7 text-muted-foreground/60" />
      <p className="font-heading text-lg font-semibold leading-tight text-foreground">
        {emptyTitle(area, view)}
      </p>
      <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
        {emptyBody(area, view)}
      </p>
      {suggestedView ? (
        <button
          type="button"
          onClick={() => onViewChange(suggestedView)}
          className="mx-auto mt-4 text-sm font-semibold text-link hover:text-link-hover"
        >
          View {viewMeta('conversations', suggestedView).label.toLowerCase()}
        </button>
      ) : (
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/people" className="text-sm font-semibold text-link hover:text-link-hover">
            Find people
          </Link>
          <Link
            href="/help/settings"
            className="text-sm font-semibold text-link hover:text-link-hover"
          >
            Availability
          </Link>
        </div>
      )}
    </div>
  )
}

function EmptyDetail() {
  return (
    <div className="flex flex-1 items-center justify-center bg-card p-8 text-center">
      <div>
        <p className="font-heading text-lg font-semibold text-foreground">Select a thread.</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Choose a conversation or request to see the details.
        </p>
      </div>
    </div>
  )
}

function InboxDetailPane({
  item,
  currentUser,
  onBack,
  backLabel,
  reactionsMap,
  toggleReaction,
}: {
  item: InboxItem
  currentUser: CurrentUser
  onBack: () => void
  backLabel: string
  reactionsMap: Record<string, string[]>
  toggleReaction: (messageId: string, reaction: string) => void
}) {
  const isConversation = item.type === 'dm_thread' || item.type === 'active_thread'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MobileDetailBack onBack={onBack} label={backLabel} />

      {isConversation ? (
        <>
          <DetailSummary item={item} currentUser={currentUser} compact />
          <InlineConversation
            threadId={item.id}
            threadType={item.type === 'dm_thread' ? 'direct' : 'ask'}
            title={item.title}
            avatarUrl={item.avatarUrl}
            viewerId={currentUser.userId}
            viewerName={currentUser.name}
            viewerAvatarUrl={currentUser.avatarUrl}
            composerEnabled={
              item.type === 'dm_thread'
                ? (item.originalData as DmData).isStillFriends
                : (item.originalData as ThreadData).status === 'active'
            }
            composerLockedReason={composerLockedReason(item)}
            reactionsMap={reactionsMap}
            toggleReaction={toggleReaction}
          />
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <DetailSummary item={item} currentUser={currentUser} />
            <DetailActionSummary item={item} currentUser={currentUser} />
            {item.type === 'incoming_ask' ? (
              <AskDetail ask={item.originalData as AskData} cohort={item.cohort} />
            ) : null}
            {item.type === 'outgoing_ask' ? (
              <AskDetail ask={item.originalData as AskData} cohort={item.cohort} isOutgoing />
            ) : null}
            {item.type === 'friend_request_incoming' ? (
              <FriendRequestDetail request={item.originalData as FriendRequestData} />
            ) : null}
            {item.type === 'friend_request_outgoing' ? (
              <FriendRequestDetail request={item.originalData as FriendRequestData} isOutgoing />
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Why the composer is locked, in the coordinator's voice. Shown in place of
 * the composer; explains the gate instead of just refusing.
 */
function composerLockedReason(item: InboxItem): string {
  const first = item.title.split(' ')[0] || item.title
  if (item.type === 'dm_thread') {
    return `You and ${first} aren't connected yet. Messages open once you're friends.`
  }
  const status = (item.originalData as ThreadData).status
  if (status === 'pending') {
    return `This thread opens when ${first} accepts your request.`
  }
  return 'This thread has ended — it stays here for reference.'
}

function DetailActionSummary({ item, currentUser }: { item: InboxItem; currentUser: CurrentUser }) {
  const summary = detailActionCopy(item, currentUser.userId)
  const section = getItemSection(item)

  return (
    <section
      className="rounded-md border border-border bg-surface-panel/55 p-4"
      style={{
        borderLeftColor: sectionColor(section),
        borderLeftWidth: 3,
      }}
    >
      <p className="bc-card-label">{summary.kicker}</p>
      <h3 className="mt-2 font-heading text-xl font-semibold leading-tight tracking-normal text-foreground">
        {summary.title}
      </h3>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {summary.body}
      </p>
    </section>
  )
}

function MobileDetailBack({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="flex items-center border-b border-border bg-card px-2 py-2 md:hidden">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="size-4" />
        {label}
      </Button>
    </div>
  )
}

function DetailSummary({
  item,
  currentUser,
  compact = false,
}: {
  item: InboxItem
  currentUser: CurrentUser
  compact?: boolean
}) {
  const square = item.type === 'incoming_ask' || item.type === 'outgoing_ask'

  return (
    <div
      className={`flex shrink-0 items-start gap-3 border-b border-border/60 bg-card ${
        compact ? 'px-5 py-3.5' : 'border-b-0 px-0 py-0'
      }`}
    >
      <Avatar
        className={`${compact ? 'size-9' : 'size-12'} ${
          square ? 'rounded-md after:rounded-md' : ''
        }`}
      >
        {item.avatarUrl ? (
          <AvatarImage
            src={item.avatarUrl}
            alt={item.title}
            className={square ? 'rounded-md' : ''}
          />
        ) : null}
        <AvatarFallback
          className={`font-heading font-semibold ${avatarColorClasses(item.title)} ${
            square ? 'rounded-md' : ''
          }`}
        >
          {getInitials(item.title)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={`font-heading font-semibold leading-tight text-foreground ${
              compact ? 'text-base' : 'text-lg'
            }`}
          >
            {item.title}
          </h2>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {detailMeta(item, currentUser.userId)}
        </p>
      </div>
    </div>
  )
}

type InboxViewMeta = {
  id: InboxView
  label: string
  description: string
  tone: 'warn' | 'open' | 'info' | 'muted'
}

function AreaIcon({ area }: { area: InboxArea }) {
  if (area === 'conversations') return <MessageSquare className="size-4" />
  if (area === 'requests') return <Send className="size-4" />
  return <Archive className="size-4" />
}

function CountPill({ count, active }: { count: number; active: boolean }) {
  if (count <= 0) return null

  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-xs font-semibold ${
        active ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
      }`}
    >
      {count}
    </span>
  )
}

function viewsForArea(area: InboxArea): readonly InboxViewMeta[] {
  if (area === 'conversations') return CONVERSATION_VIEWS
  if (area === 'requests') return REQUEST_VIEWS
  return HISTORY_VIEWS
}

function initialConversationView(items: InboxItem[], viewerId: string): ConversationView {
  const counts = conversationCountsForItems(items, viewerId)
  return firstNonEmptyConversationView(counts, true) ?? 'needs_response'
}

function conversationCountsForItems(
  items: InboxItem[],
  viewerId: string,
): Record<ConversationView, number> {
  return {
    needs_response: items.filter(isConversationNeedsResponseItem).length,
    helping: items.filter((item) => isActiveAskThread(item) && isHelpingItem(item, viewerId))
      .length,
    getting_help: items.filter((item) => isActiveAskThread(item) && !isHelpingItem(item, viewerId))
      .length,
    direct: items.filter((item) => item.type === 'dm_thread').length,
  }
}

function firstNonEmptyConversationView(
  counts: Record<ConversationView, number>,
  includeNeedsResponse: boolean,
): ConversationView | null {
  const order: ConversationView[] = includeNeedsResponse
    ? ['needs_response', 'helping', 'getting_help', 'direct']
    : ['helping', 'getting_help', 'direct', 'needs_response']

  return order.find((view) => counts[view] > 0) ?? null
}

function activeInboxView(
  area: InboxArea,
  conversationView: ConversationView,
  requestView: RequestView,
  historyView: HistoryView,
): InboxView {
  if (area === 'conversations') return conversationView
  if (area === 'requests') return requestView
  return historyView
}

function viewMeta(area: InboxArea, view: InboxView): InboxViewMeta {
  return viewsForArea(area).find((option) => option.id === view) ?? viewsForArea(area)[0]
}

function countForView(
  view: InboxView,
  conversationCounts: Record<ConversationView, number>,
  requestCounts: Record<RequestView, number>,
  historyCounts: Record<HistoryView, number>,
) {
  if (
    view === 'needs_response' ||
    view === 'helping' ||
    view === 'getting_help' ||
    view === 'direct'
  ) {
    return conversationCounts[view]
  }
  if (view === 'received' || view === 'sent') {
    return requestCounts[view]
  }
  return historyCounts[view]
}

function viewActiveClass(tone: InboxViewMeta['tone']) {
  if (tone === 'warn') return 'bg-warning-tint text-state-warning-foreground'
  if (tone === 'open') return 'bg-success-tint text-action-offer'
  if (tone === 'info') return 'bg-primary-tint text-primary'
  return 'bg-surface-subtle text-foreground'
}

function areaLabel(area: InboxArea) {
  if (area === 'conversations') return 'Conversations'
  if (area === 'requests') return 'Requests'
  return 'History'
}

function emptyTitle(area: InboxArea, view: InboxView) {
  if (area === 'conversations' && view === 'needs_response')
    return 'No conversations need a response.'
  if (area === 'conversations') return 'No conversations here yet.'
  if (area === 'requests' && view === 'received') return 'No received requests.'
  if (area === 'requests') return 'No sent requests to track.'
  return 'Nothing archived yet.'
}

function emptyBody(area: InboxArea, view: InboxView) {
  if (area === 'conversations' && view === 'needs_response') {
    return 'Nothing urgent needs a reply. Active asks and direct conversations are still available in the other conversation views.'
  }
  if (area === 'conversations') return 'Accepted asks and direct messages collect here.'
  if (area === 'requests' && view === 'received') {
    return 'Asks and connection requests you receive will appear here.'
  }
  if (area === 'requests') return 'Pending and declined requests you sent will appear here.'
  return 'Closed threads will appear here once archiving is available.'
}

function listCountLabel(area: InboxArea, view: InboxView, count: number) {
  if (area === 'requests' && view === 'received') {
    return `${count} ${count === 1 ? 'request' : 'requests'}`
  }
  if (area === 'requests' && view === 'sent') return `${count} sent`
  if (area === 'history') return `${count} archived`
  return `${count} ${count === 1 ? 'thread' : 'threads'}`
}

function filterItemsForView(
  items: InboxItem[],
  area: InboxArea,
  view: InboxView,
  viewerId: string,
) {
  if (area === 'conversations') {
    if (view === 'needs_response') return items.filter(isConversationNeedsResponseItem)
    if (view === 'helping') {
      return items.filter((item) => isActiveAskThread(item) && isHelpingItem(item, viewerId))
    }
    if (view === 'getting_help') {
      return items.filter((item) => isActiveAskThread(item) && !isHelpingItem(item, viewerId))
    }
    return items.filter((item) => item.type === 'dm_thread')
  }

  if (area === 'requests') {
    if (view === 'received') return items.filter(isReceivedRequestItem)
    return items.filter(isSentRequestItem)
  }

  return items.filter(isHistoryItem)
}

function isRequestItem(item: InboxItem) {
  return isReceivedRequestItem(item) || isSentRequestItem(item)
}

function isReceivedRequestItem(item: InboxItem) {
  return item.type === 'incoming_ask' || item.type === 'friend_request_incoming'
}

function isSentRequestItem(item: InboxItem) {
  if (item.type === 'outgoing_ask') {
    return (item.originalData as AskData).status !== 'accepted'
  }
  return item.type === 'friend_request_outgoing'
}

function isHistoryItem(item: InboxItem) {
  if (item.type === 'active_thread') {
    return (item.originalData as ThreadData).status !== 'active'
  }
  return false
}

function isActiveAskThread(item: InboxItem) {
  return item.type === 'active_thread' && (item.originalData as ThreadData).status === 'active'
}

function isConversationNeedsResponseItem(item: InboxItem) {
  return isConversationItem(item) && item.unread === true
}

function isConversationItem(item: InboxItem) {
  return item.type === 'active_thread' || item.type === 'dm_thread'
}

function getItemSection(item: InboxItem): InboxSection {
  if (
    item.type === 'dm_thread' ||
    item.type === 'friend_request_incoming' ||
    item.type === 'friend_request_outgoing'
  ) {
    return 'connections'
  }

  if (item.type === 'active_thread') {
    const askType = (item.originalData as ThreadData).asks?.ask_type
    return askType === 'mentorship' ? 'mentorship' : 'advice'
  }

  const ask = item.originalData as AskData
  return ask.ask_type === 'mentorship' ? 'mentorship' : 'advice'
}

function sectionColor(section: InboxSection) {
  if (section === 'mentorship') return 'var(--action-offer)'
  if (section === 'connections') return 'var(--accent-plum)'
  return 'var(--primary)'
}

function detailMeta(item: InboxItem, viewerId: string) {
  const cohort = item.cohort ? `Class of '${String(item.cohort).slice(-2)}` : null
  const date = format(new Date(item.date), 'MMM d, yyyy')
  if (item.type === 'dm_thread') {
    return [roleHeader(item, viewerId), cohort, date].filter(Boolean).join(' · ')
  }
  if (item.type === 'friend_request_incoming' || item.type === 'friend_request_outgoing') {
    const request = item.originalData as FriendRequestData
    const role = [request.currentTitle, request.currentEmployer].filter(Boolean).join(' at ')
    return [role || roleHeader(item, viewerId), cohort, date].filter(Boolean).join(' · ')
  }
  return [roleHeader(item, viewerId), cohort, date].filter(Boolean).join(' · ')
}

function detailActionCopy(item: InboxItem, viewerId: string) {
  if (item.type === 'incoming_ask') {
    return {
      kicker: 'Needs your reply',
      title: `${item.title} asked for your help`,
      body: 'Accept with a short reply to open the thread, or decline if you are not the right fit.',
    }
  }

  if (item.type === 'friend_request_incoming') {
    return {
      kicker: 'Needs your response',
      title: `${item.title} wants to connect`,
      body: "Accepting opens messages between you. Not ready? That's fine — declining is private.",
    }
  }

  if (item.type === 'outgoing_ask') {
    return {
      kicker: 'Waiting on them',
      title: `${item.title} has your ask`,
      body: 'This is the request you sent. Keep it here until they respond or the ask expires.',
    }
  }

  if (item.type === 'friend_request_outgoing') {
    return {
      kicker: 'Waiting on them',
      title: `${item.title} has your connection request`,
      body: 'You have already reached out. This will move to conversations when they accept.',
    }
  }

  if (item.type === 'active_thread') {
    return {
      kicker: isHelpingItem(item, viewerId) ? 'You are helping' : 'You are getting help',
      title: `Active thread with ${item.title}`,
      body: 'Keep the conversation moving with a focused reply when there is a useful next step.',
    }
  }

  return {
    kicker: 'Conversation',
    title: `Direct thread with ${item.title}`,
    body: 'This is a warm network conversation. Reply when the relationship needs a next step.',
  }
}

function isHelpingItem(item: InboxItem, viewerId: string) {
  if (item.type === 'incoming_ask') return true
  if (item.type !== 'active_thread') return false
  const thread = item.originalData as ThreadData
  return thread.helper_id === viewerId
}

function roleHeader(item: InboxItem, viewerId: string) {
  if (item.type === 'incoming_ask') return `You're helping ${item.title}`
  if (item.type === 'outgoing_ask') return `${item.title} is helping you`
  if (item.type === 'active_thread') {
    return isHelpingItem(item, viewerId)
      ? `You're helping ${item.title}`
      : `${item.title} is helping you`
  }
  if (item.type === 'dm_thread') return `Connection with ${item.title}`
  if (item.type === 'friend_request_incoming') return `${item.title} wants to connect`
  return `You asked ${item.title} to connect`
}

function rowContextLabel(item: InboxItem, viewerId: string) {
  if (item.type === 'active_thread') {
    return isHelpingItem(item, viewerId) ? 'Ask · helping' : 'Ask · getting help'
  }

  if (item.type === 'dm_thread') return 'Direct message'
  if (item.type === 'incoming_ask') return 'New ask'
  if (item.type === 'outgoing_ask') return 'Ask sent'
  if (item.type === 'friend_request_incoming') return 'Connection request'
  return 'Connection sent'
}

/* Detail Renderers */

function AskDetail({
  ask,
  cohort,
  isOutgoing = false,
}: {
  ask: AskData
  cohort?: number | null
  isOutgoing?: boolean
}) {
  const primaryAsk = ask.reason ?? ask.help_needed ?? ''
  const detail = ask.help_needed && ask.help_needed !== primaryAsk ? ask.help_needed : null
  const typeLabel = 'Ask'
  const acceptFormId = `accept-ask-${ask.id}`

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-label text-muted-foreground">
          {isOutgoing ? 'Your ask' : 'Their ask'}
        </p>
        <div className="border-l-[3px] border-l-primary pl-3 text-sm italic leading-relaxed text-foreground">
          &ldquo;{primaryAsk || typeLabel}&rdquo;
        </div>
      </section>

      {detail ? (
        <section className="space-y-1.5">
          <p className="font-sans text-xs font-semibold uppercase tracking-label text-muted-foreground">
            What they need
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
        </section>
      ) : null}

      {isOutgoing ? (
        <div className="border-t border-border pt-4">
          <Button asChild variant="outline">
            <Link href={`/ask/${ask.id}`}>View status</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3 border-t border-border pt-4">
          <AskReplyContext cohort={cohort} primaryAsk={primaryAsk || typeLabel} />
          <form id={acceptFormId} action={acceptAskFromInboxAction} className="space-y-3">
            <input type="hidden" name="requestId" value={ask.id} />
            <div className="space-y-2">
              <label
                htmlFor={`ask-reply-${ask.id}`}
                className="text-sm font-semibold text-foreground"
              >
                Reply (optional)
              </label>
              <Textarea
                id={`ask-reply-${ask.id}`}
                name="body"
                rows={4}
                placeholder="A few sentences is plenty..."
                className="min-h-[108px] resize-none"
              />
            </div>
          </form>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" form={acceptFormId} variant="offer">
              Accept & reply
            </Button>
            <AskDeclineButton requestId={ask.id} />
          </div>
        </div>
      )}
    </div>
  )
}

function AskReplyContext({ cohort, primaryAsk }: { cohort?: number | null; primaryAsk: string }) {
  const cohortLabel = cohort ? `Class of '${String(cohort).slice(-2)}` : null

  return (
    <div className="rounded-md border border-border bg-surface-panel/55 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge tone="info" size="sm">
          Ask
        </StatusBadge>
        {cohortLabel ? (
          <span className="rounded-sm border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {cohortLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Accepting will open the conversation. Reply to the ask they sent:
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-foreground">
        &ldquo;{primaryAsk}&rdquo;
      </p>
    </div>
  )
}

function AskDeclineButton({ requestId }: { requestId: string }) {
  return (
    <form action={declineAskFromInboxAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" variant="outline">
        Decline
      </Button>
    </form>
  )
}

function FriendRequestDetail({
  request,
  isOutgoing = false,
}: {
  request: FriendRequestData
  isOutgoing?: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h4 className="font-sans text-xs font-semibold uppercase tracking-label text-muted-foreground">
          {isOutgoing ? 'Sent connection request' : 'Incoming connection request'}
        </h4>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {isOutgoing ? 'Waiting for response' : 'Wants to connect'}
        </h3>
      </div>

      {request.message && (
        <div className="space-y-2">
          <h5 className="font-sans text-xs font-semibold uppercase tracking-label text-muted-foreground">
            Personal note
          </h5>
          <p className="border-l-[3px] border-l-primary pl-3 text-sm italic leading-relaxed text-foreground">
            &ldquo;{request.message}&rdquo;
          </p>
        </div>
      )}

      <div className="border-t border-border pt-4">
        {isOutgoing ? (
          <Button asChild variant="outline">
            <Link href={`/profile/${request.otherUserId}`}>View profile</Link>
          </Button>
        ) : (
          <div className="space-y-2">
            <FriendRequestActions
              requestId={request.requestId}
              requesterFirstName={request.name?.split(' ')[0] ?? null}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* Reaction Components */

function ReactionIcon({
  kind,
  width,
  height,
  className,
}: {
  kind: string
  width: number
  height: number
  className?: string
}) {
  const icons: Record<string, React.ReactNode> = {
    wave: (
      <svg
        width={width}
        height={height}
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Wave</title>
        <path d="M5 12V7a2 2 0 1 1 4 0v4M9 11V5a2 2 0 1 1 4 0v6M13 12V6a2 2 0 1 1 4 0v8M17 12V9a2 2 0 1 1 4 0v6a7 7 0 0 1-14 0" />
      </svg>
    ),
    read: (
      <svg
        width={width}
        height={height}
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <title>Read</title>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    mutual: (
      <svg
        width={width}
        height={height}
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Mutual</title>
        <path d="M7 11l3-3 5 5 4-4" />
        <path d="M14 8h5v5" />
      </svg>
    ),
    thanks: (
      <svg
        width={width}
        height={height}
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Appreciate</title>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.5l8.8-9.1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    ),
    later: (
      <svg
        width={width}
        height={height}
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Bookmark</title>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    ),
  }
  return icons[kind] || null
}

function ReactionPill({
  kind,
  label,
  mini,
  onClick,
}: {
  kind: string
  label?: string
  mini?: boolean
  onClick?: () => void
}) {
  const iconSize = mini ? 12 : 14
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center rounded-full border border-primary/20 bg-primary/10 font-sans font-semibold leading-none text-primary transition-colors hover:bg-primary/15 ${
        mini ? 'gap-1 px-2 py-1 text-xs' : 'gap-1.5 px-2.5 py-1.5 text-xs'
      }`}
    >
      <ReactionIcon kind={kind} width={iconSize} height={iconSize} />
      {label && <span>{label}</span>}
    </button>
  )
}

/* Inline Conversation Component */

interface MessageType {
  id: string
  senderId: string
  body: string
  createdAt: string
  readAt: string | null
}

function InlineConversation({
  threadId,
  threadType,
  title,
  avatarUrl,
  viewerId,
  viewerName,
  viewerAvatarUrl,
  composerEnabled,
  composerLockedReason,
  reactionsMap,
  toggleReaction,
}: {
  threadId: string
  threadType: 'direct' | 'ask'
  title: string
  avatarUrl: string | null
  viewerId: string
  viewerName?: string | null
  viewerAvatarUrl?: string | null
  composerEnabled: boolean
  composerLockedReason?: string
  reactionsMap: Record<string, string[]>
  toggleReaction: (messageId: string, reaction: string) => void
}) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [activePickerId, setActivePickerId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [formKey, setFormKey] = useState(0)
  const lastBody = useRef('')

  const [state, dispatch, pending] = useActionState(unifiedSendMessageAction, null)

  // Fetch messages and handle Realtime client-side
  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function loadMessages() {
      setLoading(true)
      setLoadError(false)
      const expectedType = threadType === 'direct' ? 'direct' : 'ask'
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at, read_at')
        .eq('thread_id', threadId)
        .eq('thread_type', expectedType)
        .order('created_at', { ascending: true })

      if (active) {
        setLoading(false)
        if (!error && data) {
          setMessages(
            data.map((m) => ({
              id: m.id,
              senderId: m.sender_id,
              body: m.body,
              createdAt: m.created_at,
              readAt: m.read_at,
            })),
          )
        } else if (error) {
          // Never render "No messages yet" over a fetch failure — that lies
          // to the member about the state of the conversation.
          setLoadError(true)
        }
      }
    }

    loadMessages()

    const channel = supabase
      .channel(`inbox_chat:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string
            sender_id: string
            body: string
            created_at: string
            read_at: string | null
            thread_type: string
          }
          const expectedType = threadType === 'direct' ? 'direct' : 'ask'
          if (row.thread_type !== expectedType) return
          if (!active) return

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [
              ...prev,
              {
                id: row.id,
                senderId: row.sender_id,
                body: row.body,
                createdAt: row.created_at,
                readAt: row.read_at,
              },
            ]
          })
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [threadId, threadType])

  // Handle Optimistic sends
  useEffect(() => {
    if (state?.ok) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === state.messageId)) return prev
        return [
          ...prev,
          {
            id: state.messageId,
            senderId: viewerId,
            body: lastBody.current,
            createdAt: state.createdAt,
            readAt: null,
          },
        ]
      })
      setFormKey((prev) => prev + 1)
    }
  }, [state, viewerId])

  // Scroll to bottom when thread changes or new message is added
  // biome-ignore lint/correctness/useExhaustiveDependencies: Scroll should trigger on new messages or thread change
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, threadId])

  // Seed default demo reactions on mount/first view of a message if no state in reactionsMap exists yet.
  const getReactions = (mId: string, idx: number): string[] => {
    if (reactionsMap[mId] !== undefined) return reactionsMap[mId]
    // Mock reaction seeds:
    if (idx === 0) return ['wave']
    if (idx === 2) return ['mutual']
    return []
  }

  const handleTogglePicker = (mId: string) => {
    setActivePickerId((prev) => (prev === mId ? null : mId))
  }

  const reactionOptions = [
    { kind: 'wave', label: 'Wave' },
    { kind: 'read', label: 'Read' },
    { kind: 'mutual', label: 'Mutual' },
    { kind: 'thanks', label: 'Appreciate' },
    { kind: 'later', label: 'Bookmark' },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-background/55 px-4 py-4">
        {loading && messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-muted-foreground/60">
            <svg
              aria-hidden="true"
              width="80"
              height="80"
              viewBox="0 0 200 130"
              className="opacity-40 stroke-primary"
            >
              <circle cx="75" cy="65" r="55" fill="none" strokeWidth="1.8" />
              <circle cx="125" cy="65" r="55" fill="none" strokeWidth="1.8" />
            </svg>
            <p className="font-mono text-xs uppercase tracking-label">Loading conversation...</p>
          </div>
        ) : loadError ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground/60">
            <p className="text-xs font-semibold text-foreground">
              We couldn&apos;t load this conversation
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Refresh the page to try again.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground/60">
            <p className="text-xs font-semibold text-foreground">No messages yet</p>
            {composerEnabled ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Say hello to start the discussion.
              </p>
            ) : null}
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === viewerId
            const msgReactions = getReactions(m.id, idx)
            const showTimestamp = idx === 0 || gapMinutes(messages[idx - 1], m) > 15

            return (
              <div key={m.id} className="w-full">
                {showTimestamp && (
                  <div className="my-3 flex w-full justify-center">
                    <span className="rounded-sm bg-surface-subtle/60 px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-label text-muted-foreground">
                      {formatGroupedDate(m.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`group relative my-3.5 flex max-w-[78%] items-end gap-2 ${isMe ? 'ml-auto' : 'mr-auto'}`}
                >
                  {!isMe && (
                    <Avatar className="size-7 shrink-0">
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={title} /> : null}
                      <AvatarFallback
                        className={`font-heading text-xs font-semibold ${avatarColorClasses(title)}`}
                      >
                        {title.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div
                      className={`whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed ${
                        isMe
                          ? 'rounded-[12px_12px_4px_12px] bg-primary text-primary-foreground'
                          : 'rounded-[12px_12px_12px_4px] border border-border/60 bg-card text-foreground'
                      }`}
                    >
                      {m.body}
                    </div>

                    <div
                      className={`mt-1 font-mono text-xs text-muted-foreground/80 ${isMe ? 'text-right' : 'text-left'}`}
                    >
                      {format(new Date(m.createdAt), 'h:mm a')}
                    </div>

                    {msgReactions.length > 0 && (
                      <div
                        className={`mt-1.5 flex flex-wrap gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {msgReactions.map((r) => (
                          <ReactionPill
                            key={r}
                            kind={r}
                            mini
                            onClick={() => toggleReaction(m.id, r)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {isMe && (
                    <Avatar className="size-7 shrink-0">
                      {viewerAvatarUrl ? (
                        <AvatarImage src={viewerAvatarUrl} alt={viewerName ?? 'You'} />
                      ) : null}
                      <AvatarFallback
                        className={`font-heading text-xs font-semibold ${avatarColorClasses(
                          viewerName ?? 'You',
                        )}`}
                      >
                        {(viewerName ?? 'You').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleTogglePicker(m.id)}
                      className="cursor-pointer rounded-full border border-border bg-card p-1.5 text-muted-foreground shadow-card transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted"
                      aria-label="Add reaction"
                    >
                      <Smile className="size-3.5" />
                    </button>
                  </div>

                  {activePickerId === m.id && (
                    <div
                      role="toolbar"
                      aria-label="Message reactions"
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setActivePickerId(null)
                        }
                      }}
                      className={`absolute bottom-full mb-2 ${
                        isMe ? 'right-0' : 'left-0'
                      } z-20 flex animate-in items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card p-1 shadow-card-hover fade-in slide-in-from-bottom-2 duration-medium ease-emphasized`}
                    >
                      {reactionOptions.map((opt) => {
                        const active = msgReactions.includes(opt.kind)
                        return (
                          <button
                            key={opt.kind}
                            type="button"
                            onClick={() => {
                              toggleReaction(m.id, opt.kind)
                              setActivePickerId(null)
                            }}
                            className={`cursor-pointer rounded-full p-1 transition-colors hover:bg-surface-subtle ${
                              active
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-primary'
                            }`}
                            aria-label={
                              active ? `Remove ${opt.label} reaction` : `Add ${opt.label} reaction`
                            }
                          >
                            <ReactionIcon
                              kind={opt.kind}
                              width={16}
                              height={16}
                              className="size-4"
                            />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-card px-4 py-3">
        {composerEnabled ? (
          <form
            key={formKey}
            action={(fd) => {
              const body = (fd.get('body') as string | null)?.trim() ?? ''
              if (!body) return
              lastBody.current = body
              dispatch(fd)
            }}
            className="flex items-end gap-2"
          >
            <input type="hidden" name="threadId" value={threadId} />
            <input type="hidden" name="threadType" value={threadType} />
            <Textarea
              name="body"
              placeholder="Write a reply..."
              rows={1}
              maxLength={4000}
              required
              disabled={pending}
              className="max-h-[120px] min-h-10 flex-1 resize-none bg-card text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <Button type="submit" disabled={pending} size="default" className="shrink-0">
              {pending ? (
                <>
                  <span
                    className="size-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"
                    aria-hidden
                  />
                  <span className="sr-only">Sending</span>
                </>
              ) : (
                'Send'
              )}
            </Button>
          </form>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">
            {composerLockedReason ?? 'This thread is read-only right now.'}
          </div>
        )}
        {state && !state.ok && (
          <p className="mt-1.5 text-left text-xs text-destructive">{state.error}</p>
        )}
      </div>
    </div>
  )
}

function gapMinutes(prev: MessageType | undefined, curr: MessageType): number {
  if (!prev) return 0
  return (new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()) / 60000
}

function formatGroupedDate(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

function formatInboxDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) {
      return `${Math.max(1, diffMins)}m ago`
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`
    }
    if (isYesterday(d)) {
      return 'Yesterday'
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`
    }
    return format(d, 'MMM d')
  } catch (_e) {
    return ''
  }
}
