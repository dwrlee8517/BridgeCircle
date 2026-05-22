'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { ArrowLeft, ChevronRight, Inbox as InboxIcon, Search, Smile, X } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/client'
import { unifiedSendMessageAction } from './actions'
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

type TabType = 'all' | 'requests' | 'threads' | 'dms' | 'sent'

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
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [reactionsMap, setReactionsMap] = useState<Record<string, string[]>>({})

  // Load status and reactions from localStorage on mount
  useEffect(() => {
    const storedStatus = localStorage.getItem('bridgecircle_user_status')
    const storedExpiry = localStorage.getItem('bridgecircle_user_status_expiry')
    if (storedStatus && storedExpiry) {
      if (Date.now() < Number(storedExpiry)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStatus(storedStatus)
      } else {
        localStorage.removeItem('bridgecircle_user_status')
        localStorage.removeItem('bridgecircle_user_status_expiry')
      }
    }

    const storedReactions = localStorage.getItem('bridgecircle_reactions')
    if (storedReactions) {
      try {
        setReactionsMap(JSON.parse(storedReactions))
      } catch (e) {
        console.error('Failed to parse reactions from localStorage:', e)
      }
    }
  }, [])

  const handleSetStatus = (newStatus: string | null) => {
    if (newStatus) {
      const expiry = Date.now() + 14 * 24 * 60 * 60 * 1000 // 14 days
      localStorage.setItem('bridgecircle_user_status', newStatus)
      localStorage.setItem('bridgecircle_user_status_expiry', String(expiry))
      setStatus(newStatus)
    } else {
      localStorage.removeItem('bridgecircle_user_status')
      localStorage.removeItem('bridgecircle_user_status_expiry')
      setStatus(null)
    }
  }

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

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === 'requests') {
        if (item.type !== 'incoming_ask' && item.type !== 'friend_request_incoming') return false
      } else if (activeTab === 'threads') {
        if (item.type !== 'active_thread') return false
      } else if (activeTab === 'dms') {
        if (item.type !== 'dm_thread') return false
      } else if (activeTab === 'sent') {
        if (item.type !== 'outgoing_ask' && item.type !== 'friend_request_outgoing') return false
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const titleMatch = item.title.toLowerCase().includes(query)
        const subtitleMatch = item.subtitle.toLowerCase().includes(query)
        return titleMatch || subtitleMatch
      }

      return true
    })
  }, [items, activeTab, searchQuery])

  // Select first item if current selection is no longer in filtered list (e.g. due to search)
  useEffect(() => {
    if (filteredItems.length > 0) {
      const exists = filteredItems.some((i) => i.id === selectedItemId)
      if (!exists) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedItemId(filteredItems[0].id)
      }
    } else {
      setSelectedItemId(null)
    }
  }, [filteredItems, selectedItemId])

  // Get active item details
  const activeItem = useMemo(() => {
    return items.find((item) => item.id === selectedItemId) || null
  }, [items, selectedItemId])

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id)
    setShowDetail(true)
  }

  const handleBackToList = () => {
    setShowDetail(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] bg-card overflow-hidden w-full h-full">
      {/* Left Column: Thread Lists */}
      <div
        className={`flex flex-col border-r border-border bg-secondary/35 ${
          showDetail ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search Input */}
        <div className="p-3 pb-1.5 shrink-0">
          <div className="relative flex items-center">
            <div className="absolute left-2.5 flex items-center pointer-events-none">
              <Search className="size-3.5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search inbox..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 rounded-[6px] border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-0 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer flex items-center p-0"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-1.5 border-b border-border gap-0.5 overflow-x-auto shrink-0 select-none no-scrollbar">
          {(['all', 'requests', 'threads', 'dms', 'sent'] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab)
                  // Find items for this tab to select the first one
                  const tabItems = items.filter((item) => {
                    if (tab === 'requests') {
                      if (item.type !== 'incoming_ask' && item.type !== 'friend_request_incoming')
                        return false
                    } else if (tab === 'threads') {
                      if (item.type !== 'active_thread') return false
                    } else if (tab === 'dms') {
                      if (item.type !== 'dm_thread') return false
                    } else if (tab === 'sent') {
                      if (item.type !== 'outgoing_ask' && item.type !== 'friend_request_outgoing')
                        return false
                    }

                    if (searchQuery.trim() !== '') {
                      const query = searchQuery.toLowerCase()
                      const titleMatch = item.title.toLowerCase().includes(query)
                      const subtitleMatch = item.subtitle.toLowerCase().includes(query)
                      return titleMatch || subtitleMatch
                    }

                    return true
                  })
                  if (tabItems.length > 0) {
                    setSelectedItemId(tabItems[0].id)
                  } else {
                    setSelectedItemId(null)
                  }
                }}
                className={`bg-transparent border-none py-2 px-3 text-[11px] font-sans cursor-pointer whitespace-nowrap transition-all border-b-2 capitalize outline-none ${
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground font-medium hover:text-foreground'
                }`}
              >
                {tab === 'dms' ? 'DMs' : tab}
              </button>
            )
          })}
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <InboxIcon className="size-6 text-muted-foreground/60 mb-2" />
              <p className="text-xs font-semibold text-foreground">No conversations</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = item.id === selectedItemId
              const formattedDate = formatInboxDate(item.date)
              const initials = getInitials(item.title)
              const avatarBg = getAvatarColor(item.title)

              // Status badge colors
              let badgeBg = ''
              let badgeText = ''
              if (item.badgeTone === 'warn') {
                badgeBg = 'bg-accent-ochre/10'
                badgeText = 'text-accent-ochre'
              } else if (item.badgeTone === 'info' || item.badgeTone === 'open') {
                badgeBg = 'bg-primary/10'
                badgeText = 'text-primary'
              } else if (item.badgeTone === 'alert') {
                badgeBg = 'bg-destructive/10'
                badgeText = 'text-destructive'
              } else {
                badgeBg = 'bg-muted/60 dark:bg-muted/30'
                badgeText = 'text-muted-foreground'
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item.id)}
                  className={`w-full text-left p-2.5 rounded-[6px] transition-all flex items-start gap-2.5 cursor-pointer relative ${
                    isSelected
                      ? 'bg-card border border-border shadow-sm'
                      : 'border border-transparent bg-transparent hover:bg-muted/10'
                  }`}
                >
                  {/* Initials Circle Avatar */}
                  <div
                    className="size-8 rounded-full flex shrink-0 items-center justify-center text-background text-[11px] font-bold font-sans relative select-none"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initials}
                    {item.unread && (
                      <div className="absolute top-[-1px] right-[-1px] size-2 rounded-full bg-accent-ochre border-[1.5px] border-background" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs text-foreground truncate ${item.unread || isSelected ? 'font-semibold' : 'font-medium'}`}
                      >
                        {item.title}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground shrink-0">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Badges Row */}
                    <div className="flex gap-1 mt-0.5 mb-1 flex-wrap">
                      <span
                        className={`text-[8.5px] font-mono px-1 py-0.5 rounded-[3px] font-semibold uppercase tracking-wider ${badgeBg} ${badgeText}`}
                      >
                        {item.badge}
                      </span>
                      {item.cohort && (
                        <span className="text-[8.5px] font-mono bg-muted/60 text-muted-foreground px-1 py-0.5 rounded-[3px] font-semibold">
                          Class of &apos;{String(item.cohort).slice(-2)}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-[11.5px] truncate font-sans leading-normal ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="size-3 text-muted-foreground/60 shrink-0 self-center md:hidden" />
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Column: Details Panel */}
      <div className={`flex flex-col bg-card ${showDetail ? 'flex' : 'hidden md:flex'}`}>
        {activeItem ? (
          <div className="flex flex-col h-full">
            {/* Header / Back navigation on mobile */}
            <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4 bg-card shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="md:hidden size-8 -ml-2 shrink-0"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 border border-border/50 rounded-[6px] after:rounded-[6px] shrink-0">
                    {activeItem.avatarUrl ? (
                      <AvatarImage
                        src={activeItem.avatarUrl}
                        alt={activeItem.title}
                        className="rounded-[6px]"
                      />
                    ) : null}
                    <AvatarFallback className="bg-accent font-semibold text-accent-foreground text-sm rounded-[6px]">
                      {activeItem.title.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold text-foreground leading-tight truncate">
                      {activeItem.title}
                    </h2>
                    <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                      {activeItem.subtitle} · {format(new Date(activeItem.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  <StatusBadge tone={activeItem.badgeTone}>{activeItem.badge}</StatusBadge>
                </div>
              </div>
            </div>

            {/* Content Details */}
            {activeItem.type === 'dm_thread' ? (
              <InlineConversation
                threadId={activeItem.id}
                threadType="direct"
                title={activeItem.title}
                avatarUrl={activeItem.avatarUrl}
                viewerId={currentUser.userId}
                viewerName={currentUser.name}
                viewerAvatarUrl={currentUser.avatarUrl}
                composerEnabled={(activeItem.originalData as DmData).isStillFriends}
                reactionsMap={reactionsMap}
                toggleReaction={toggleReaction}
              />
            ) : activeItem.type === 'active_thread' ? (
              <InlineConversation
                threadId={activeItem.id}
                threadType="ask"
                title={activeItem.title}
                avatarUrl={activeItem.avatarUrl}
                viewerId={currentUser.userId}
                viewerName={currentUser.name}
                viewerAvatarUrl={currentUser.avatarUrl}
                composerEnabled={(activeItem.originalData as ThreadData).status === 'active'}
                reactionsMap={reactionsMap}
                toggleReaction={toggleReaction}
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeItem.type === 'incoming_ask' && (
                  <AskDetail ask={activeItem.originalData as AskData} />
                )}
                {activeItem.type === 'outgoing_ask' && (
                  <AskDetail ask={activeItem.originalData as AskData} isOutgoing />
                )}
                {activeItem.type === 'friend_request_incoming' && (
                  <FriendRequestDetail request={activeItem.originalData as FriendRequestData} />
                )}
                {activeItem.type === 'friend_request_outgoing' && (
                  <FriendRequestDetail
                    request={activeItem.originalData as FriendRequestData}
                    isOutgoing
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto h-full items-start">
              <StatusSetter
                currentUser={currentUser}
                status={status}
                onSetStatus={handleSetStatus}
              />
              <ReactionShowcase />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* Detail Renderers */

function AskDetail({ ask, isOutgoing = false }: { ask: AskData; isOutgoing?: boolean }) {
  const summary = ask.reason ?? ask.help_needed ?? ''
  const typeLabel = ask.ask_type === 'advice' ? 'Advice Request' : 'Mentorship Request'

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h4 className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {isOutgoing ? 'Request Sent' : 'Request Received'}
        </h4>
        <h3 className="font-heading text-lg font-semibold text-foreground">{typeLabel}</h3>
      </div>

      <div className="bc-pull-quote text-sm text-foreground/90 italic p-4 bg-muted/10 rounded-[6px] border-l-[3px] border-l-primary">
        &ldquo;{summary}&rdquo;
      </div>

      {ask.help_needed && ask.reason && (
        <div className="space-y-3 pt-2">
          <h5 className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Help Needed Details
          </h5>
          <p className="text-xs text-muted-foreground leading-relaxed">{ask.help_needed}</p>
        </div>
      )}

      <div className="pt-4 border-t border-border/60">
        <Button
          asChild
          className="rounded-[6px] text-xs h-9 px-4 bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Link href={`/ask/${ask.id}`}>{isOutgoing ? 'View Status' : 'Reply & Accept'}</Link>
        </Button>
      </div>
    </div>
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
        <h4 className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {isOutgoing ? 'Sent Connection Request' : 'Incoming Connection Request'}
        </h4>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {isOutgoing ? 'Waiting for Response' : 'Wants to Connect'}
        </h3>
      </div>

      <div className="space-y-3.5 bg-muted/10 p-4 rounded-[6px] border border-border/50 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Member</span>
          <Link
            href={`/profile/${request.otherUserId}`}
            className="font-semibold text-foreground hover:text-primary hover:underline"
          >
            {request.name}
          </Link>
        </div>
        {[request.currentTitle, request.currentEmployer].filter(Boolean).length > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Title</span>
            <span className="font-medium text-foreground">
              {[request.currentTitle, request.currentEmployer].filter(Boolean).join(' at ')}
            </span>
          </div>
        )}
      </div>

      {request.message && (
        <div className="space-y-2">
          <h5 className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Personal Note
          </h5>
          <p className="text-xs italic text-muted-foreground leading-relaxed border-l-2 pl-3">
            &ldquo;{request.message}&rdquo;
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border/60">
        {isOutgoing ? (
          <Button asChild variant="outline" className="rounded-[6px] text-xs h-9 px-4">
            <Link href={`/profile/${request.otherUserId}`}>View Profile</Link>
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground mb-1">Respond to connection:</p>
            <FriendRequestActions requestId={request.requestId} />
          </div>
        )}
      </div>
    </div>
  )
}

/* Status & Reaction Components */

function StatusSetter({
  currentUser,
  status,
  onSetStatus,
}: {
  currentUser: CurrentUser
  status: string | null
  onSetStatus: (status: string | null) => void
}) {
  const [draft, setDraft] = useState('')
  const presets = [
    'Open to coffee in Brooklyn',
    'Heads down on a launch',
    'Looking to advise climate founders',
    'Hiring on my product team',
    'Quiet until next week',
  ]

  return (
    <div className="bg-card border border-border rounded-[18px] p-[22px_24px] shadow-sm flex flex-col">
      <div className="flex items-center gap-3.5 mb-[18px]">
        <Avatar className="size-12 border border-border/50 rounded-[6px] after:rounded-[6px]">
          {currentUser.avatarUrl ? (
            <AvatarImage
              src={currentUser.avatarUrl}
              alt={currentUser.name ?? ''}
              className="rounded-[6px]"
            />
          ) : null}
          <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-sm rounded-[6px]">
            {(currentUser.name ?? '?').slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold text-foreground truncate">
            {currentUser.name ?? 'Member'}
          </div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
            {status ? (
              <>
                <span className="size-2 rounded-full bg-primary shrink-0" />
                <span className="text-foreground font-medium truncate max-w-[200px]">{status}</span>
                <button
                  type="button"
                  onClick={() => onSetStatus(null)}
                  className="text-muted-foreground hover:text-foreground text-[14px] leading-none ml-1 cursor-pointer font-mono"
                  title="Clear status"
                >
                  ×
                </button>
              </>
            ) : (
              'No status'
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <p className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2.5">
          Set a status
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {presets.map((p) => {
            const active = status === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => onSetStatus(active ? null : p)}
                className={`text-[12.5px] font-semibold px-3 py-[6px] rounded-[6px] border transition-all cursor-pointer ${
                  active
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm font-semibold'
                    : 'bg-muted/30 hover:bg-muted/50 border-border text-foreground'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                onSetStatus(draft)
                setDraft('')
              }
            }}
            placeholder="…or write your own (Enter to set)"
            className="flex-1 text-[13px] px-4 py-[9px] bg-muted/30 border border-border rounded-[6px] focus-visible:outline-none focus-visible:border-primary text-foreground"
          />
          <Button
            size="sm"
            disabled={!draft.trim()}
            onClick={() => {
              if (draft.trim()) {
                onSetStatus(draft)
                setDraft('')
              }
            }}
            className="rounded-[6px] text-xs h-[38px] px-4 bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            Set
          </Button>
        </div>
      </div>

      <p className="text-[12.5px] text-muted-foreground leading-[1.55] mt-4 font-sans">
        Status auto-expires after 14 days. Surfaces alongside your name in the directory and member
        cards — a gentle signal of what you&apos;re open to right now.
      </p>
    </div>
  )
}

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
  const iconSize = mini ? 11 : 13
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-colors font-sans font-semibold leading-none ${
        mini ? 'py-[3px] px-2 text-[10.5px] gap-1' : 'py-[5px] px-2.5 text-[11.5px] gap-[6px]'
      }`}
    >
      <ReactionIcon kind={kind} width={iconSize} height={iconSize} />
      {label && <span>{label}</span>}
    </button>
  )
}

function ReactionShowcase() {
  const reactions = [
    { kind: 'wave', label: 'Wave back', desc: 'Acknowledge without writing yet.' },
    { kind: 'read', label: 'Mark read', desc: 'No reply expected — read receipt.' },
    { kind: 'mutual', label: 'Mutual', desc: "You're aligned. Move forward." },
    { kind: 'thanks', label: 'Appreciate', desc: 'Thanks the sender quietly.' },
    { kind: 'later', label: 'Bookmark', desc: 'Reply later — pin to your desk.' },
  ]

  return (
    <div className="bg-card border border-border rounded-[18px] p-[20px_22px_22px] shadow-sm flex flex-col">
      <p className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">
        Warm reactions — no emoji, just intent
      </p>

      <div className="space-y-3.5 flex-1">
        {reactions.map((r) => (
          <div key={r.kind} className="flex items-center gap-3">
            <div className="shrink-0">
              <ReactionPill kind={r.kind} label={r.label} />
            </div>
            <p className="text-[12.5px] text-muted-foreground leading-[1.4] font-sans flex-1">
              {r.desc}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-[18px] p-[12px_14px] bg-muted/30 dark:bg-muted/10 rounded-[12px] text-xs text-muted-foreground leading-[1.5] font-sans">
        Reactions don&apos;t ping. They settle next to a message and persist; the recipient sees
        them on next visit.
      </p>
    </div>
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
  reactionsMap: Record<string, string[]>
  toggleReaction: (messageId: string, reaction: string) => void
}) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [loading, setLoading] = useState(false)
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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable conversation pane */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-muted/5">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 space-y-3">
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
            <p className="text-[11px] font-mono tracking-wider uppercase">Loading conversation…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60">
            <p className="text-xs font-semibold text-foreground">No messages yet</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Say hello to start the discussion.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === viewerId
            const msgReactions = getReactions(m.id, idx)
            const showTimestamp = idx === 0 || gapMinutes(messages[idx - 1], m) > 15

            return (
              <div key={m.id} className="w-full">
                {showTimestamp && (
                  <div className="w-full flex justify-center my-3">
                    <span className="font-mono text-[9.5px] font-bold text-muted-foreground/60 tracking-wider uppercase bg-muted/20 px-2 py-0.5 rounded">
                      {formatGroupedDate(m.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-end gap-2 max-w-[78%] group relative my-3.5 ${isMe ? 'ml-auto' : 'mr-auto'}`}
                >
                  {!isMe && (
                    <Avatar className="size-6 border border-border/50 rounded-[6px] after:rounded-[6px] shrink-0">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={title} className="rounded-[6px]" />
                      ) : null}
                      <AvatarFallback className="bg-accent font-bold text-[9px] text-accent-foreground rounded-[6px]">
                        {title.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Message Bubble */}
                    <div
                      className={`px-[14px] py-[10px] text-[13.5px] whitespace-pre-wrap break-words leading-[1.45] ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-[16px_16px_4px_16px] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                          : 'bg-muted/50 dark:bg-muted/20 border border-border/40 text-foreground rounded-[16px_16px_16px_4px]'
                      }`}
                    >
                      {m.body}
                    </div>

                    {/* Individual Timestamp below bubble */}
                    <div
                      className={`font-mono text-[9.5px] text-muted-foreground/80 mt-1 tracking-wider ${isMe ? 'text-right' : 'text-left'}`}
                    >
                      {format(new Date(m.createdAt), 'h:mm a')}
                    </div>

                    {/* Reaction Pills Under Bubble */}
                    {msgReactions.length > 0 && (
                      <div
                        className={`flex flex-wrap gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
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
                    <Avatar className="size-6 border border-border/50 rounded-[6px] after:rounded-[6px] shrink-0">
                      {viewerAvatarUrl ? (
                        <AvatarImage
                          src={viewerAvatarUrl}
                          alt={viewerName ?? 'You'}
                          className="rounded-[6px]"
                        />
                      ) : null}
                      <AvatarFallback className="bg-accent font-bold text-[9px] text-accent-foreground rounded-[6px]">
                        {(viewerName ?? 'You').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Hover Reaction trigger button */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10`}
                  >
                    <button
                      type="button"
                      onClick={() => handleTogglePicker(m.id)}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full bg-card border border-border shadow-sm transition-colors cursor-pointer"
                      title="Add reaction"
                    >
                      <Smile className="size-3.5" />
                    </button>
                  </div>

                  {/* Reaction Overlay Picker */}
                  {activePickerId === m.id && (
                    <div
                      className={`absolute bottom-full mb-2 ${
                        isMe ? 'right-0' : 'left-0'
                      } flex items-center bg-card border border-border shadow-md rounded-full p-1 z-20 gap-1.5 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-100`}
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
                            className={`p-1 hover:bg-muted rounded-full transition-colors cursor-pointer ${
                              active
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-primary'
                            }`}
                            title={opt.label}
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

      {/* Composer Input Area */}
      <div className="border-t border-border/40 px-4 py-3 bg-card shrink-0">
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
            <textarea
              name="body"
              placeholder="Write a reply…"
              rows={1}
              maxLength={4000}
              required
              disabled={pending}
              className="flex-1 resize-none rounded-[6px] border border-border bg-muted/30 px-3 py-2 text-[13px] focus-visible:outline-none focus-visible:border-primary text-foreground min-h-[38px] max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <Button
              type="submit"
              disabled={pending}
              className="h-[38px] rounded-[6px] px-4 bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center shrink-0 font-medium text-xs"
            >
              {pending ? (
                <span className="size-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send →'
              )}
            </Button>
          </form>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2 italic">
            You cannot send messages to this thread right now.
          </div>
        )}
        {state && !state.ok && (
          <p className="mt-1.5 text-[10px] text-destructive text-left">{state.error}</p>
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

function getAvatarColor(name: string): string {
  const normalized = name.toLowerCase().trim()
  if (normalized.includes('alexander')) return 'var(--accent-ochre)'
  if (normalized.includes('iris')) return 'var(--accent-sage)'
  if (normalized.includes('dev')) return 'var(--primary)'
  if (normalized.includes('sarah')) return 'var(--accent-rust)'
  if (normalized.includes('jessica')) return 'var(--accent-plum)'
  if (normalized.includes('richard')) return 'var(--primary)'

  // Deterministic fallback color based on hash
  const colors = [
    'var(--primary)',
    'var(--accent-sage)',
    'var(--accent-ochre)',
    'var(--accent-rust)',
    'var(--accent-plum)',
    'var(--destructive)',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
