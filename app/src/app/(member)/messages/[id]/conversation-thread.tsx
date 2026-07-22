'use client'

import { format, isToday, isYesterday } from 'date-fns'
import {
  Check,
  CheckCheck,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Info,
  PanelRightClose,
  PanelRightOpen,
  Send,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SafetyReportDialog } from '@/components/safety-report-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { ConversationDetail, ConversationMessage } from '@/lib/conversations/contracts'
import {
  beginSendAttempt,
  confirmSendAttempt,
  discardSendAttempt,
  markSendUncertain,
  newestOutgoingReceiptId,
  readCandidate,
  rejectSendAttempt,
} from '@/lib/messages/thread-state'
import { cn, getInitials } from '@/lib/utils'
import { useUserControl } from '../../user-control-provider'
import { useBooleanPreference } from '../use-boolean-preference'
import { ConversationContext } from './conversation-context'
import { useConversationRealtime } from './use-conversation-realtime'
import { useThreadComposer } from './use-thread-composer'

type MessageListResponse = { messages?: ConversationMessage[]; error?: string }
type SendResponse = {
  status?: string
  messageId?: number
  createdAt?: string
  error?: string
}
type ReadResponse = { status?: string; lastReadMessageId?: number }

export function ConversationThread({
  conversation,
  initialMessages,
  avatarUrl,
  viewerUserId,
  hasEarlier: initialHasEarlier,
}: {
  conversation: ConversationDetail
  initialMessages: ConversationMessage[]
  avatarUrl: string | null
  viewerUserId: string
  hasEarlier: boolean
}) {
  const router = useRouter()
  const { conversationControl } = useUserControl()
  const [messages, setMessages] = useState(initialMessages)
  const storageKey = `bridgecircle:messages:v1:${viewerUserId}:${conversation.id}:draft`
  const [composer, setComposer] = useThreadComposer(storageKey)
  const [sending, setSending] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [hasEarlier, setHasEarlier] = useState(initialHasEarlier)
  const [error, setError] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const [counterpartReadId, setCounterpartReadId] = useState(
    conversation.counterpartLastReadMessageId,
  )
  const [viewerReadId, setViewerReadId] = useState(conversation.viewerLastReadMessageId)
  const [resolvedOverride, setResolved] = useState<boolean | null>(null)
  const resolved = resolvedOverride ?? conversation.askContext?.status === 'resolved'
  const [outcomeSharingOverride, setOutcomeSharing] = useState<
    NonNullable<ConversationDetail['askContext']>['outcomeSharing'] | undefined
  >()
  const outcomeSharing = outcomeSharingOverride ?? conversation.askContext?.outcomeSharing ?? null
  const [disconnected, setDisconnected] = useState(false)
  const [reportMessageId, setReportMessageId] = useState<number | null>(null)
  const [contextSheetOpen, setContextSheetOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveNote, setResolveNote] = useState('')
  const [confirmAction, setConfirmAction] = useState<'disconnect' | 'block' | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [connectionRequestState, setConnectionRequestState] = useState<'idle' | 'pending' | 'sent'>(
    conversation.connectionState === 'outgoing_pending' ? 'sent' : 'idle',
  )
  const [contextVisible, setContextVisible] = useBooleanPreference(
    `bridgecircle:messages:v1:${viewerUserId}:context-visible`,
    true,
  )
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const latestIdRef = useRef(initialMessages.at(-1)?.id ?? null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingPublishedRef = useRef(false)
  const gapControllerRef = useRef<AbortController | null>(null)
  const previousScrollHeightRef = useRef<number | null>(null)
  const endVisibleRef = useRef(false)
  const pendingReadIdRef = useRef<number | null>(null)
  const connectionRequestIdRef = useRef<string | null>(null)
  const detailsButtonRef = useRef<HTMLButtonElement | null>(null)
  const effectiveCanSend = conversation.canSend && !disconnected

  useEffect(() => {
    if (!conversationControl || conversationControl.conversationId !== conversation.id) return
    if (conversationControl.type === 'conversation.revoked') window.location.replace('/messages')
    else router.refresh()
  }, [conversation.id, conversationControl, router])

  useEffect(() => {
    latestIdRef.current = messages.at(-1)?.id ?? null
  }, [messages])

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [])

  useLayoutEffect(() => {
    if (messages.length === 0) return
    const previousHeight = previousScrollHeightRef.current
    const element = scrollRef.current
    if (previousHeight === null || !element) return
    element.scrollTop += element.scrollHeight - previousHeight
    previousScrollHeightRef.current = null
  }, [messages.length])

  const fetchAfterLatest = useCallback(async () => {
    const after = latestIdRef.current
    const query = after ? `?after=${after}&limit=100` : '?limit=100'
    gapControllerRef.current?.abort()
    const controller = new AbortController()
    gapControllerRef.current = controller
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages${query}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) return false
      const payload = (await response.json()) as MessageListResponse
      const incoming = payload.messages ?? []
      if (incoming.length > 0) setMessages((current) => mergeMessages(current, incoming))
      return true
    } catch (refreshError) {
      if (refreshError instanceof DOMException && refreshError.name === 'AbortError') return false
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

  const realtimeCallbacks = useMemo(
    () => ({
      recoverAfterCursor: fetchAfterLatest,
      onReadAdvanced(_readerUserId: string, messageId: number) {
        setCounterpartReadId((current) => Math.max(current ?? 0, messageId))
      },
      onTypingChanged(_actorUserId: string, isTyping: boolean) {
        setTyping(isTyping)
      },
    }),
    [fetchAfterLatest],
  )
  const { paused: realtimePaused } = useConversationRealtime({
    conversationId: conversation.id,
    viewerUserId,
    callbacks: realtimeCallbacks,
  })

  const attemptReadAdvance = useCallback(async () => {
    const candidate = readCandidate({
      messages,
      viewerUserId,
      currentReadMessageId: viewerReadId,
      documentVisible: document.visibilityState === 'visible',
      endVisible: endVisibleRef.current,
    })
    if (!candidate || candidate <= (pendingReadIdRef.current ?? 0)) return
    pendingReadIdRef.current = candidate
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: candidate }),
        cache: 'no-store',
      })
      const payload = (await response.json()) as ReadResponse
      if (response.ok && (payload.status === 'advanced' || payload.status === 'unchanged')) {
        setViewerReadId(Math.max(viewerReadId ?? 0, payload.lastReadMessageId ?? candidate))
      }
    } catch {
      // Monotonic read state retries on focus, reconnect, or the next message.
    } finally {
      if (pendingReadIdRef.current === candidate) pendingReadIdRef.current = null
    }
  }, [conversation.id, messages, viewerReadId, viewerUserId])

  useEffect(() => {
    const root = scrollRef.current
    const end = endRef.current
    if (!root || !end) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        endVisibleRef.current = Boolean(entry?.isIntersecting)
        if (entry?.isIntersecting) void attemptReadAdvance()
      },
      { root, threshold: 0.9 },
    )
    observer.observe(end)
    return () => observer.disconnect()
  }, [attemptReadAdvance])

  useEffect(() => {
    const retry = () => {
      if (document.visibilityState === 'visible') void attemptReadAdvance()
    }
    window.addEventListener('focus', retry)
    document.addEventListener('visibilitychange', retry)
    const frame = requestAnimationFrame(retry)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('focus', retry)
      document.removeEventListener('visibilitychange', retry)
    }
  }, [attemptReadAdvance])

  useEffect(
    () => () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      gapControllerRef.current?.abort()
      if (typingPublishedRef.current) void publishTypingState(false)
    },
    [publishTypingState],
  )

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
      previousScrollHeightRef.current = scrollRef.current?.scrollHeight ?? null
      setMessages((current) => mergeMessages(older, current))
      setHasEarlier(older.length === 50)
    } catch {
      setError('Couldn’t load earlier messages. Try again in a moment.')
    } finally {
      setLoadingEarlier(false)
    }
  }

  async function sendMessage() {
    if (sending || !effectiveCanSend) return
    const started = beginSendAttempt(composer, () => crypto.randomUUID())
    if (!started) return
    setComposer(started.state)
    setSending(true)
    setError(null)
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: started.attempt.body, clientNonce: started.attempt.nonce }),
        cache: 'no-store',
      })
      const result = (await response.json()) as SendResponse
      if (response.status >= 500) throw new Error('send_uncertain')
      if (
        !response.ok ||
        (result.status !== 'sent' && result.status !== 'duplicate') ||
        !result.messageId ||
        !result.createdAt
      ) {
        setComposer((current) => rejectSendAttempt(current))
        setError('This conversation is no longer available for sending. Your draft is still here.')
        return
      }
      setMessages((current) =>
        mergeMessages(current, [
          {
            id: result.messageId as number,
            conversationId: conversation.id,
            kind: 'user',
            senderUserId: viewerUserId,
            body: started.attempt.body,
            createdAt: result.createdAt as string,
          },
        ]),
      )
      setComposer(confirmSendAttempt())
      await publishTypingState(false)
      requestAnimationFrame(() => {
        const element = scrollRef.current
        if (element) element.scrollTop = element.scrollHeight
      })
    } catch {
      setComposer((current) => markSendUncertain(current))
      setError(null)
    } finally {
      setSending(false)
    }
  }

  function handleDraftChange(value: string) {
    if (composer.pending) return
    setComposer({ draft: value, pending: null })
    setError(null)
    if (!value.trim()) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
      if (typingPublishedRef.current) void publishTypingState(false)
      return
    }
    if (!typingPublishedRef.current) void publishTypingState(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => void publishTypingState(false), 2_000)
  }

  async function resolveAsk() {
    if (!conversation.askId || !conversation.askContext || actionPending) return
    setActionPending(true)
    setActionError(null)
    try {
      const response = await fetch(`/api/help/asks/${conversation.askId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeNote: resolveNote.trim() || null }),
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('resolve_failed')
      setResolved(true)
      setResolveOpen(false)
      await fetchAfterLatest()
      router.refresh()
    } catch {
      setActionError('Couldn’t resolve the ask. The conversation is unchanged — try again.')
    } finally {
      setActionPending(false)
    }
  }

  async function requestConnection() {
    if (!conversation.organizationId || connectionRequestState !== 'idle' || actionPending) return
    const clientRequestId = connectionRequestIdRef.current ?? crypto.randomUUID()
    connectionRequestIdRef.current = clientRequestId
    setConnectionRequestState('pending')
    setActionError(null)
    try {
      const response = await fetch('/api/connections/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: conversation.counterpart.userId,
          originOrganizationId: conversation.organizationId,
          introMessage: null,
          clientRequestId,
        }),
        cache: 'no-store',
      })
      const result = (await response.json()) as { status?: string }
      if (!response.ok) throw new Error(result.status ?? 'request_failed')
      if (result.status === 'created' || result.status === 'existing') {
        setConnectionRequestState('sent')
        router.refresh()
        return
      }
      if (result.status === 'already_connected') {
        setConnectionRequestState('sent')
        router.refresh()
        return
      }
      if (result.status === 'incoming_pending') {
        setConnectionRequestState('idle')
        setActionError('They already sent you a request. You can respond from Waiting on you.')
        return
      }
      throw new Error('request_failed')
    } catch {
      setConnectionRequestState('idle')
      setActionError('Couldn’t send the Connection request. Try once more.')
    }
  }

  async function updateOutcomeSharing(shareStory: boolean, shareIdentity: boolean) {
    if (!conversation.askId || !outcomeSharing || actionPending) return
    const previous = outcomeSharing
    setActionPending(true)
    setActionError(null)
    setOutcomeSharing({
      ...previous,
      viewerShareStory: shareStory,
      viewerShareIdentity: shareIdentity,
    })
    try {
      const response = await fetch(`/api/help/asks/${conversation.askId}/outcome-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareStory, shareIdentity }),
        cache: 'no-store',
      })
      const result = (await response.json()) as {
        status?: string
        shareStory?: boolean
        shareIdentity?: boolean
      }
      if (!response.ok || result.status !== 'saved') throw new Error('share_failed')
      setOutcomeSharing({
        ...previous,
        viewerShareStory: Boolean(result.shareStory),
        viewerShareIdentity: Boolean(result.shareIdentity),
      })
      router.refresh()
    } catch {
      setOutcomeSharing(previous)
      setActionError('Couldn’t update sharing. Nothing changed — try again.')
    } finally {
      setActionPending(false)
    }
  }

  async function completeSafetyAction() {
    if (!confirmAction || actionPending) return
    setActionPending(true)
    setActionError(null)
    try {
      const endpoint =
        confirmAction === 'block'
          ? `/api/members/${conversation.counterpart.userId}/block`
          : `/api/connections/${conversation.counterpart.userId}/disconnect`
      const response = await fetch(endpoint, { method: 'POST', cache: 'no-store' })
      if (!response.ok) throw new Error('action_failed')
      if (confirmAction === 'block') {
        window.location.replace('/messages')
        return
      }
      setDisconnected(true)
      setConfirmAction(null)
      router.refresh()
    } catch {
      setConfirmAction(null)
      setActionError(
        confirmAction === 'block'
          ? 'Couldn’t block this member. Nothing changed — try again.'
          : 'Couldn’t disconnect. Nothing changed — try again.',
      )
    } finally {
      setActionPending(false)
    }
  }

  const newestReceiptId = newestOutgoingReceiptId(messages, viewerUserId)
  const context = (
    <ConversationContext
      conversation={conversation}
      avatarUrl={avatarUrl}
      resolved={resolved}
      outcomeSharing={outcomeSharing}
      disconnected={disconnected}
      connectionRequestState={connectionRequestState}
      actionPending={actionPending}
      actionError={actionError}
      onResolve={() => setResolveOpen(true)}
      onOutcomeSharingChange={(shareStory, shareIdentity) =>
        void updateOutcomeSharing(shareStory, shareIdentity)
      }
      onRequestConnection={() => void requestConnection()}
      onDisconnect={() => setConfirmAction('disconnect')}
      onBlock={() => setConfirmAction('block')}
    />
  )

  return (
    <div
      className={cn(
        'grid h-full min-h-0 w-full min-w-0 overflow-hidden bg-surface-thread',
        contextVisible ? 'xl:grid-cols-[minmax(0,1fr)_300px]' : 'grid-cols-1',
      )}
    >
      <section
        aria-labelledby="conversation-heading"
        className="flex min-h-0 min-w-0 flex-col bg-card"
      >
        <div className="flex min-h-[68px] shrink-0 items-center gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
          <Link
            href="/messages"
            aria-label="Back to messages"
            className="inline-flex size-10 items-center justify-center rounded-full bg-surface-subtle text-text-secondary hover:bg-primary-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </Link>
          <Avatar className="size-10 shadow-[var(--ring-avatar)]">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback seed={conversation.counterpart.userId}>
              {getInitials(conversation.counterpart.displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <h1
              id="conversation-heading"
              className="block truncate text-body-sm font-bold text-foreground"
            >
              {conversation.counterpart.displayName}
            </h1>
            <span className="block text-xs font-medium text-muted-foreground">
              {conversation.counterpart.graduationYear
                ? `Class of ’${String(conversation.counterpart.graduationYear).slice(-2)}`
                : conversation.kind === 'ask'
                  ? 'Connected through an ask'
                  : 'Direct conversation'}
            </span>
          </span>
          <button
            ref={detailsButtonRef}
            type="button"
            onClick={() => setContextSheetOpen(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface-subtle px-3 text-xs font-bold text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring xl:hidden"
          >
            <Info aria-hidden className="size-4" /> Details
          </button>
          <button
            type="button"
            aria-pressed={contextVisible}
            aria-label={contextVisible ? 'Hide conversation details' : 'Show conversation details'}
            onClick={() => setContextVisible(!contextVisible)}
            className="hidden size-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring xl:inline-flex"
          >
            {contextVisible ? (
              <PanelRightClose aria-hidden className="size-4" />
            ) : (
              <PanelRightOpen aria-hidden className="size-4" />
            )}
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
        >
          {hasEarlier ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => void loadEarlier()}
                disabled={loadingEarlier}
                className="min-h-9 rounded-full bg-surface-subtle px-3 text-xs font-semibold text-text-secondary disabled:opacity-50"
              >
                {loadingEarlier ? 'Loading…' : 'Load earlier messages'}
              </button>
            </div>
          ) : null}
          {messages.length === 0 ? (
            <p className="py-12 text-center text-body-sm font-medium text-muted-foreground">
              {effectiveCanSend ? 'Start with a quick hello.' : 'No messages in this conversation.'}
            </p>
          ) : (
            messages.map((message, index) => (
              <MessageRow
                key={message.id}
                message={message}
                viewerUserId={viewerUserId}
                counterpartName={conversation.counterpart.displayName}
                showTime={index === 0 || gapMinutes(messages[index - 1], message) > 15}
                showReceipt={message.id === newestReceiptId}
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
            <div
              role="status"
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
            >
              <span className="inline-flex gap-1 rounded-full bg-surface-subtle px-3 py-2">
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
          <div ref={endRef} aria-hidden className="h-px" />
        </div>

        <div className="shrink-0 border-t border-border-subtle px-4 py-3 sm:px-5">
          {realtimePaused ? (
            <p className="mb-2 flex items-start gap-2 text-xs font-semibold text-[var(--warning)]">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> Live updates paused.
              Sending still works; this page is reconnecting.
            </p>
          ) : null}
          {composer.pending?.status === 'uncertain' && !sending ? (
            <div role="alert" className="mb-2 rounded-xl bg-surface-inset p-3 text-xs">
              <p className="font-bold text-foreground">Delivery could not be confirmed.</p>
              <p className="mt-1 text-text-secondary">
                Retry checks the same message instead of creating another copy.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={sending}
                  className="min-h-9 rounded-lg bg-primary-tint-strong px-3 font-bold text-primary"
                >
                  Retry send
                </button>
                <button
                  type="button"
                  onClick={() => setComposer((current) => discardSendAttempt(current))}
                  disabled={sending}
                  className="min-h-9 rounded-lg px-3 font-semibold text-text-secondary hover:bg-muted"
                >
                  Edit draft
                </button>
              </div>
            </div>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="mb-2 flex items-start gap-2 text-xs font-semibold text-destructive"
            >
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> {error}
            </p>
          ) : null}
          {effectiveCanSend ? (
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
                value={composer.draft}
                onChange={(event) => handleDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage()
                  }
                }}
                disabled={Boolean(composer.pending)}
                maxLength={10_000}
                rows={1}
                placeholder={`Message ${conversation.counterpart.displayName.split(/\s+/)[0]}…`}
                className="max-h-36 min-h-11 min-w-0 flex-1 resize-none rounded-xl border-0 bg-card px-4 py-3 text-body-sm font-medium shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)] disabled:bg-surface-inset"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={sending || !composer.draft.trim() || Boolean(composer.pending)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
              >
                <Send aria-hidden className="size-[17px]" />
              </button>
            </form>
          ) : (
            <p className="rounded-xl bg-surface-inset px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
              This conversation is read-only.
            </p>
          )}
        </div>
      </section>

      {contextVisible ? (
        <aside
          aria-label="Conversation details"
          className="hidden min-h-0 overflow-y-auto border-l border-border-subtle bg-card xl:block"
        >
          {context}
        </aside>
      ) : null}

      <Dialog open={contextSheetOpen} onOpenChange={setContextSheetOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            detailsButtonRef.current?.focus()
          }}
          className="top-0 right-0 left-auto h-dvh w-[min(360px,calc(100%-1rem))] max-w-none content-start gap-0 overflow-y-auto rounded-none border-l border-border-subtle p-0 translate-x-0 translate-y-0"
        >
          <DialogTitle className="sr-only">Conversation details</DialogTitle>
          <DialogDescription className="sr-only">
            Profile, Ask context, Connection state, and safety actions.
          </DialogDescription>
          {context}
        </DialogContent>
      </Dialog>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogTitle className="text-body-lg font-bold tracking-tight">
            Mark this ask resolved?
          </DialogTitle>
          <DialogDescription className="text-body-sm leading-relaxed font-medium">
            The conversation stays available for both of you. Only the ask closes.
          </DialogDescription>
          <label htmlFor="resolve-note" className="text-xs font-bold text-text-secondary">
            What helped? <span className="font-medium text-muted-foreground">Optional</span>
          </label>
          <textarea
            id="resolve-note"
            value={resolveNote}
            onChange={(event) => setResolveNote(event.target.value)}
            maxLength={2_000}
            rows={3}
            className="w-full resize-none rounded-xl border-0 bg-card px-3.5 py-3 text-body-sm shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
          />
          <button
            type="button"
            onClick={() => void resolveAsk()}
            disabled={actionPending}
            className="min-h-11 rounded-xl bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] disabled:opacity-55"
          >
            {actionPending ? 'Closing…' : 'Mark resolved'}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogTitle className="text-body-lg font-bold tracking-tight">
            {confirmAction === 'block'
              ? `Block ${conversation.counterpart.displayName}?`
              : `Disconnect from ${conversation.counterpart.displayName}?`}
          </DialogTitle>
          <DialogDescription className="text-body-sm leading-relaxed font-medium">
            {confirmAction === 'block'
              ? 'You will no longer see each other across BridgeCircle, and this conversation will be hidden.'
              : 'Your message history stays available, but this direct conversation becomes read-only.'}
          </DialogDescription>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              disabled={actionPending}
              className="min-h-11 rounded-xl px-4 text-body-sm font-bold text-text-secondary hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void completeSafetyAction()}
              disabled={actionPending}
              className="min-h-11 rounded-xl bg-destructive px-4 text-body-sm font-bold text-destructive-foreground disabled:opacity-55"
            >
              {actionPending
                ? 'Working…'
                : confirmAction === 'block'
                  ? 'Block member'
                  : 'Disconnect'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {reportMessageId ? (
        <SafetyReportDialog
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
  showTime,
  showReceipt,
  read,
  onReport,
}: {
  message: ConversationMessage
  viewerUserId: string
  counterpartName: string
  showTime: boolean
  showReceipt: boolean
  read: boolean
  onReport?: () => void
}) {
  if (message.kind === 'system') {
    const Icon = message.eventType === 'ask_resolved' ? CircleCheck : Check
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-muted-foreground">
        <Icon aria-hidden className="size-3.5" />
        {systemMessageCopy(message, viewerUserId, counterpartName)} ·{' '}
        {formatStamp(message.createdAt)}
      </div>
    )
  }

  const mine = message.senderUserId === viewerUserId
  return (
    <div className={cn('group flex flex-col', mine ? 'items-end' : 'items-start')}>
      {showTime ? (
        <span className="mb-1 px-1 text-kicker font-medium text-muted-foreground">
          {formatStamp(message.createdAt)}
        </span>
      ) : null}
      <div className="flex max-w-[82%] items-end gap-2 sm:max-w-[72%]">
        {!mine && onReport ? (
          <button
            type="button"
            onClick={onReport}
            className="order-2 min-h-8 rounded-lg px-2 text-kicker font-semibold text-muted-foreground opacity-100 hover:bg-surface-subtle focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            Report
          </button>
        ) : null}
        <div
          className={cn(
            'whitespace-pre-wrap break-words rounded-[14px] px-4 py-2.5 text-body-sm leading-relaxed font-medium',
            mine
              ? 'bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)]'
              : 'bg-surface-subtle text-foreground',
          )}
        >
          {message.body}
        </div>
      </div>
      {mine && showReceipt ? (
        <span className="mt-1 inline-flex items-center gap-1 px-1 text-kicker font-medium text-muted-foreground">
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
) {
  const counterpartFirst = counterpartName.split(/\s+/)[0]
  const viewerWasActor = message.actorUserId === viewerUserId
  if (message.eventType === 'ask_accepted') {
    return viewerWasActor
      ? 'You accepted and opened this conversation'
      : `${counterpartFirst} accepted and opened this conversation`
  }
  if (message.eventType === 'ask_resolved') {
    return viewerWasActor
      ? 'You marked this ask resolved'
      : `${counterpartFirst} marked this ask resolved`
  }
  return 'You connected'
}
