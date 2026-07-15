'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { Check, CheckCheck, ChevronLeft, CircleAlert, CircleCheck, Info, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/db/client'
import { openConversationRealtime } from '@/db/realtime/conversation-channel'
import type { ConversationDetail, ConversationMessage } from '@/lib/conversations/contracts'
import type { HelpAskDetail } from '@/lib/help/contracts'
import { cn, getInitials } from '@/lib/utils'
import { HelpReportDialog } from '../../help/help-report-dialog'
import { useMemberShellHeader } from '../../member-shell-header-context'
import { useUserControl } from '../../user-control-provider'

type MessageListResponse = { messages?: ConversationMessage[]; error?: string }
type SendResponse = { status?: string; messageId?: number; createdAt?: string; error?: string }

export function ConversationThread({
  conversation,
  initialMessages,
  askDetail,
  avatarUrl,
  viewerUserId,
  hasEarlier: initialHasEarlier,
}: {
  conversation: ConversationDetail
  initialMessages: ConversationMessage[]
  askDetail: HelpAskDetail | null
  avatarUrl: string | null
  viewerUserId: string
  hasEarlier: boolean
}) {
  const router = useRouter()
  const { conversationControl } = useUserControl()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [hasEarlier, setHasEarlier] = useState(initialHasEarlier)
  const [error, setError] = useState<string | null>(null)
  const [realtimePaused, setRealtimePaused] = useState(false)
  const [typing, setTyping] = useState(false)
  const [counterpartReadId, setCounterpartReadId] = useState(
    conversation.counterpartLastReadMessageId,
  )
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState(askDetail?.status === 'resolved')
  const [reportMessageId, setReportMessageId] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const latestIdRef = useRef(initialMessages.at(-1)?.id ?? null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingPublishedRef = useRef(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useMemberShellHeader({
    title: conversation.counterpart.displayName,
    backHref: '/messages',
    backLabel: 'Back',
    hideNotifications: true,
  })

  useEffect(() => {
    if (!conversationControl || conversationControl.conversationId !== conversation.id) return
    if (conversationControl.type === 'conversation.revoked') {
      router.replace('/messages')
    } else {
      router.refresh()
    }
  }, [conversation.id, conversationControl, router])

  useEffect(() => {
    latestIdRef.current = messages.at(-1)?.id ?? null
  }, [messages])

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [])

  useEffect(() => {
    const latestMessage = messages.at(-1)
    if (!latestMessage) return
    void fetch(`/api/conversations/${conversation.id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: latestMessage.id }),
      cache: 'no-store',
    })
  }, [conversation.id, messages])

  const fetchAfterLatest = useCallback(async () => {
    const after = latestIdRef.current
    const query = after ? `?after=${after}&limit=100` : '?limit=100'
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages${query}`, {
        cache: 'no-store',
      })
      if (!response.ok) return false
      const payload = (await response.json()) as MessageListResponse
      const incoming = payload.messages ?? []
      if (incoming.length > 0) setMessages((current) => mergeMessages(current, incoming))
      return true
    } catch {
      setError('Couldn’t refresh the thread. Your current messages are still here.')
      return false
    }
  }, [conversation.id])

  const publishTypingState = useCallback(
    async (isTyping: boolean) => {
      typingPublishedRef.current = isTyping
      try {
        await fetch(`/api/conversations/${conversation.id}/typing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isTyping }),
          cache: 'no-store',
        })
      } catch {
        // Typing is ephemeral and must never block durable messaging.
      }
    },
    [conversation.id],
  )

  useEffect(() => {
    let active = true
    let handle: Awaited<ReturnType<typeof openConversationRealtime>> | null = null
    const client = createClient()

    async function connect() {
      try {
        const { data } = await client.auth.getSession()
        const accessToken = data.session?.access_token
        if (!accessToken || !active) return
        handle = await openConversationRealtime({
          client,
          accessToken,
          conversationId: conversation.id,
          callbacks: {
            async onRefetchAfterCursor() {
              if (await fetchAfterLatest()) setRealtimePaused(false)
            },
            async onMessageCreated() {
              if (await fetchAfterLatest()) setRealtimePaused(false)
            },
            onReadAdvanced(event) {
              if (event.readerUserId !== viewerUserId) setCounterpartReadId(event.messageId)
            },
            onTypingChanged(event) {
              if (event.actorUserId !== viewerUserId) setTyping(event.isTyping)
            },
            onMalformedEvent() {},
            onChannelError() {
              setRealtimePaused(true)
            },
          },
        })
      } catch {
        if (!active) return
        setRealtimePaused(true)
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null
          void connect()
        }, 5_000)
      }
    }

    void connect()
    return () => {
      active = false
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (typingPublishedRef.current) {
        void publishTypingState(false)
      }
      void handle?.close()
    }
  }, [conversation.id, fetchAfterLatest, publishTypingState, viewerUserId])

  async function loadEarlier() {
    const firstId = messages[0]?.id
    if (!firstId || loadingEarlier) return
    setLoadingEarlier(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages?before=${firstId}&limit=50`,
        { cache: 'no-store' },
      )
      const payload = (await response.json()) as MessageListResponse
      if (!response.ok) throw new Error(payload.error ?? 'history_failed')
      const older = [...(payload.messages ?? [])].reverse()
      setMessages((current) => mergeMessages(older, current))
      setHasEarlier(older.length === 50)
    } catch {
      setError('Couldn’t load earlier messages. Try again in a moment.')
    } finally {
      setLoadingEarlier(false)
    }
  }

  async function sendMessage() {
    const body = draft.trim()
    if (!body || sending || !conversation.canSend) return
    setSending(true)
    setError(null)
    const clientNonce = crypto.randomUUID()
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, clientNonce }),
        cache: 'no-store',
      })
      const result = (await response.json()) as SendResponse
      if (!response.ok || !result.messageId || !result.createdAt) {
        throw new Error(result.error ?? 'send_failed')
      }
      setMessages((current) =>
        mergeMessages(current, [
          {
            id: result.messageId as number,
            conversationId: conversation.id,
            kind: 'user',
            senderUserId: viewerUserId,
            body,
            createdAt: result.createdAt as string,
          },
        ]),
      )
      setDraft('')
      await publishTypingState(false)
      window.setTimeout(() => {
        const element = scrollRef.current
        if (element) element.scrollTop = element.scrollHeight
      }, 0)
    } catch {
      setError('Couldn’t send that. Your message is still in the box — try again.')
    } finally {
      setSending(false)
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value)
    setError(null)
    if (!typingPublishedRef.current) void publishTypingState(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => void publishTypingState(false), 2_000)
  }

  async function resolveAsk() {
    if (!askDetail || resolving) return
    setResolving(true)
    setError(null)
    try {
      const response = await fetch(`/api/help/asks/${askDetail.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeNote: resolveNote.trim() || null }),
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('resolve_failed')
      setResolved(true)
      setResolveOpen(false)
      await fetchAfterLatest()
    } catch {
      setError('Couldn’t close the ask. The conversation is unchanged — try again.')
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="min-h-full bg-[image:var(--wash-page)] lg:h-[calc(100dvh-var(--topbar-height)_-_1px)] lg:overflow-hidden">
      <div className="mx-auto grid h-full max-w-[1220px] lg:grid-cols-[minmax(0,1fr)_310px]">
        <main className="flex min-h-[calc(100dvh-var(--topbar-height))] min-w-0 flex-col bg-card lg:min-h-0">
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5 sm:px-5">
            <Link
              href="/help"
              aria-label="Back"
              className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring lg:hidden"
            >
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
            <Avatar className="size-10 shadow-[var(--ring-avatar)]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback>{getInitials(conversation.counterpart.displayName)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm font-bold text-[var(--text-primary)]">
                {conversation.counterpart.displayName}
              </span>
              <span className="block text-xs font-medium text-[var(--text-faint)]">
                {conversation.counterpart.graduationYear
                  ? `Class of ’${String(conversation.counterpart.graduationYear).slice(-2)}`
                  : conversation.kind === 'ask'
                    ? 'Connected through an ask'
                    : 'Direct conversation'}
              </span>
            </span>
            <a
              href="#conversation-context"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--surface-subtle)] px-3 text-xs font-bold text-[var(--text-secondary)] lg:hidden"
            >
              <Info aria-hidden className="size-4" /> Details
            </a>
          </div>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5"
          >
            {hasEarlier ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => void loadEarlier()}
                  disabled={loadingEarlier}
                  className="min-h-9 rounded-full bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text-secondary)] disabled:opacity-50"
                >
                  {loadingEarlier ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            ) : null}
            {messages.length === 0 ? (
              <p className="py-12 text-center text-body-sm font-medium text-[var(--text-faint)]">
                {conversation.canSend
                  ? 'Start with a quick hello.'
                  : 'No messages in this conversation.'}
              </p>
            ) : (
              messages.map((message, index) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  viewerUserId={viewerUserId}
                  counterpartName={conversation.counterpart.displayName}
                  viewerOwnsAsk={
                    askDetail?.asker.identity === 'identified' &&
                    askDetail.asker.userId === viewerUserId
                  }
                  showTime={index === 0 || gapMinutes(messages[index - 1], message) > 15}
                  read={counterpartReadId !== null && message.id <= counterpartReadId}
                  onReport={
                    message.kind === 'user' && message.senderUserId !== viewerUserId
                      ? () => setReportMessageId(message.id)
                      : undefined
                  }
                />
              ))
            )}
            {typing ? (
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-faint)]">
                <span className="inline-flex gap-1 rounded-full bg-[var(--surface-subtle)] px-3 py-2">
                  {[0, 1, 2].map((dot) => (
                    <i
                      key={dot}
                      className="size-1.5 animate-pulse rounded-full bg-[var(--grey-400)] motion-reduce:animate-none"
                    />
                  ))}
                </span>
                {conversation.counterpart.displayName.split(/\s+/)[0]} is typing…
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--border-subtle)] px-4 py-3 sm:px-5">
            {realtimePaused ? (
              <p className="mb-2 flex items-start gap-2 text-xs font-semibold text-[var(--warning)]">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> Live updates paused.
                Sending still works; this page will keep retrying.
              </p>
            ) : null}
            {error ? (
              <p
                role="alert"
                className="mb-2 flex items-start gap-2 text-xs font-semibold text-[var(--error)]"
              >
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            ) : null}
            {conversation.canSend ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void sendMessage()
                }}
                className="flex items-end gap-2"
              >
                <label htmlFor="message-draft" className="sr-only">
                  Message
                </label>
                <textarea
                  id="message-draft"
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void sendMessage()
                    }
                  }}
                  maxLength={10_000}
                  rows={1}
                  placeholder={`Message ${conversation.counterpart.displayName.split(/\s+/)[0]}…`}
                  className="max-h-36 min-h-11 flex-1 resize-y rounded-xl border-0 bg-card px-4 py-3 text-body-sm font-medium shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={sending || !draft.trim()}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
                >
                  <Send aria-hidden className="size-[17px]" />
                </button>
              </form>
            ) : (
              <p className="rounded-xl bg-[var(--surface-inset)] px-4 py-3 text-center text-xs font-semibold text-[var(--text-faint)]">
                This conversation is read-only.
              </p>
            )}
          </div>
        </main>

        <aside
          id="conversation-context"
          className="border-l border-[var(--border-subtle)] bg-card px-5 py-6 lg:overflow-y-auto"
        >
          <div className="text-center">
            <Avatar className="mx-auto size-16 shadow-[var(--ring-avatar)]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-body-lg">
                {getInitials(conversation.counterpart.displayName)}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/profile/${conversation.counterpart.userId}`}
              className="mt-3 block text-body-md font-extrabold text-[var(--text-primary)] hover:text-[var(--blue-600)] hover:underline"
            >
              {conversation.counterpart.displayName}
            </Link>
            {conversation.counterpart.graduationYear ? (
              <p className="mt-1 text-xs font-semibold text-[var(--text-faint)]">
                Class of ’{String(conversation.counterpart.graduationYear).slice(-2)}
              </p>
            ) : null}
          </div>

          {askDetail ? (
            <section className="mt-6 rounded-[14px] bg-[var(--surface-inset)] p-4">
              <p className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase">
                About this conversation
              </p>
              <Link
                href={`/help/asks/${askDetail.id}`}
                className="mt-2 block text-body-sm leading-snug font-bold text-[var(--text-primary)] hover:text-[var(--blue-600)]"
              >
                Ask · {askDetail.question}
              </Link>
              <span
                className={cn(
                  'mt-2 inline-flex rounded-full px-2 py-0.5 text-kicker font-bold',
                  resolved
                    ? 'bg-[var(--state-success-bg)] text-[var(--state-success-fg)]'
                    : 'bg-[var(--action-weak)] text-[var(--blue-600)]',
                )}
              >
                {resolved ? 'Resolved' : 'Open'}
              </span>
            </section>
          ) : null}

          {askDetail && !resolved ? (
            <button
              type="button"
              onClick={() => setResolveOpen(true)}
              className="mt-4 min-h-11 w-full rounded-xl bg-card px-4 text-xs font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Mark ask resolved
            </button>
          ) : null}

          <p className="mt-6 text-center text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
            Accepted asks do not expire. Resolving closes the ask, not this conversation.
          </p>
        </aside>
      </div>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogTitle className="text-body-lg font-extrabold tracking-tight">
            Mark this ask resolved?
          </DialogTitle>
          <DialogDescription className="text-body-sm leading-relaxed font-medium">
            The conversation stays available for both of you. Only the ask closes.
          </DialogDescription>
          <label htmlFor="resolve-note" className="text-xs font-bold text-[var(--text-secondary)]">
            What helped? <span className="font-medium text-[var(--text-faint)]">Optional</span>
          </label>
          <textarea
            id="resolve-note"
            value={resolveNote}
            onChange={(event) => setResolveNote(event.target.value)}
            maxLength={2_000}
            rows={3}
            className="w-full resize-y rounded-xl border-0 bg-card px-3.5 py-3 text-body-sm shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
          />
          <button
            type="button"
            onClick={() => void resolveAsk()}
            disabled={resolving}
            className="min-h-11 rounded-xl bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] disabled:opacity-55"
          >
            {resolving ? 'Closing…' : 'Mark resolved'}
          </button>
        </DialogContent>
      </Dialog>

      {reportMessageId ? (
        <HelpReportDialog
          open
          onOpenChange={(open) => {
            if (!open) setReportMessageId(null)
          }}
          endpoint={`/api/conversations/${conversation.id}/messages/${reportMessageId}/report`}
          subject="message"
        />
      ) : null}
    </div>
  )
}

function MessageRow({
  message,
  viewerUserId,
  counterpartName,
  viewerOwnsAsk,
  showTime,
  read,
  onReport,
}: {
  message: ConversationMessage
  viewerUserId: string
  counterpartName: string
  viewerOwnsAsk: boolean
  showTime: boolean
  read: boolean
  onReport?: () => void
}) {
  if (message.kind === 'system') {
    const icon = message.eventType === 'ask_resolved' ? CircleCheck : Check
    const Icon = icon
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[var(--text-faint)]">
        <Icon aria-hidden className="size-3.5" />
        {systemMessageCopy(message, viewerUserId, counterpartName, viewerOwnsAsk)} ·{' '}
        {formatStamp(message.createdAt)}
      </div>
    )
  }

  const mine = message.senderUserId === viewerUserId
  return (
    <div className={cn('group flex flex-col', mine ? 'items-end' : 'items-start')}>
      {showTime ? (
        <span className="mb-1 px-1 text-kicker font-medium text-[var(--text-faint)]">
          {formatStamp(message.createdAt)}
        </span>
      ) : null}
      <div className="flex max-w-[82%] items-end gap-2 sm:max-w-[72%]">
        {!mine && onReport ? (
          <button
            type="button"
            onClick={onReport}
            className="order-2 min-h-8 rounded-lg px-2 text-kicker font-semibold text-[var(--text-faint)] opacity-100 hover:bg-[var(--surface-subtle)] focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            Report
          </button>
        ) : null}
        <div
          className={cn(
            'whitespace-pre-wrap break-words rounded-[14px] px-4 py-2.5 text-body-sm leading-relaxed font-medium',
            mine
              ? 'bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)]'
              : 'bg-[var(--surface-subtle)] text-[var(--text-primary)]',
          )}
        >
          {message.body}
        </div>
      </div>
      {mine ? (
        <span className="mt-1 inline-flex items-center gap-1 px-1 text-kicker font-medium text-[var(--text-faint)]">
          {read ? (
            <CheckCheck aria-hidden className="size-3" />
          ) : (
            <Check aria-hidden className="size-3" />
          )}
          {read ? 'Read' : 'Sent'}
        </span>
      ) : null}
    </div>
  )
}

function mergeMessages(current: ConversationMessage[], incoming: ConversationMessage[]) {
  const byId = new Map<number, ConversationMessage>()
  for (const message of [...current, ...incoming]) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

function gapMinutes(previous: ConversationMessage | undefined, current: ConversationMessage) {
  if (!previous) return 0
  return (new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime()) / 60_000
}

function formatStamp(iso: string) {
  const date = new Date(iso)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

function systemMessageCopy(
  message: Extract<ConversationMessage, { kind: 'system' }>,
  viewerUserId: string,
  counterpartName: string,
  viewerOwnsAsk: boolean,
) {
  const counterpartFirst = counterpartName.split(/\s+/)[0]
  const viewerWasActor = message.actorUserId === viewerUserId
  if (message.eventType === 'ask_accepted') {
    if (viewerWasActor) {
      return viewerOwnsAsk
        ? `You accepted ${counterpartFirst}’s offer`
        : `You accepted ${counterpartFirst}’s ask`
    }
    return viewerOwnsAsk
      ? `${counterpartFirst} accepted your ask`
      : `${counterpartFirst} accepted your offer`
  }
  if (message.eventType === 'ask_resolved') {
    return viewerWasActor
      ? 'You marked this ask resolved'
      : `${counterpartFirst} marked this ask resolved`
  }
  return 'You connected'
}
