'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/db/client'
import type { ThreadMessage } from '@/lib/dm/getThread'
import { type SendMessageState, sendMessageAction } from './actions'

/**
 * The thread page is a hybrid: server-rendered initial messages (fast first
 * paint) hydrated by this client component which:
 *   1. Subscribes to Supabase Realtime postgres_changes on the messages
 *      table, filtered to thread_id=eq.<id>. New messages get appended.
 *   2. Renders the composer (form + useActionState), which appends locally
 *      on success so the sender sees their message instantly. Realtime
 *      broadcast for the same row is deduped by id.
 *
 * RLS still applies to realtime: the Supabase client uses the user's
 * session, so the channel only delivers rows the viewer can SELECT.
 */
export function LiveThread({
  threadId,
  viewerId,
  initialMessages,
  composerEnabled,
}: {
  threadId: string
  viewerId: string
  initialMessages: ThreadMessage[]
  composerEnabled: boolean
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [state, dispatch, pending] = useActionState<SendMessageState, FormData>(
    sendMessageAction,
    null,
  )

  // Realtime subscription. Re-runs only when the threadId changes (which
  // happens on navigation, at which point the client component remounts).
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`dm:${threadId}`)
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
          if (row.thread_type !== 'direct') return
          setMessages((prev) => {
            // Dedupe — if the sender already appended optimistically by id,
            // skip the broadcast.
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
      supabase.removeChannel(channel)
    }
  }, [threadId])

  // Derive the form key from the most recent successful messageId so each
  // send remounts the textarea (clearing it). Deriving directly avoids the
  // "setState inside useEffect" anti-pattern — the key is just a function
  // of state we already have.
  const formKey = state?.ok ? state.messageId : 'composer'

  // Track when our own send completes and add the message to local state if
  // realtime hasn't already delivered it (it usually will, almost immediately,
  // but the optimistic path keeps the UI snappy on flaky networks).
  useEffect(() => {
    if (state?.ok) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === state.messageId)) return prev
        return [
          ...prev,
          {
            id: state.messageId,
            senderId: viewerId,
            body: lastSubmittedBody.current,
            createdAt: state.createdAt,
            readAt: null,
          },
        ]
      })
    }
  }, [state, viewerId])

  // Auto-scroll to the bottom whenever the messages array grows. The body
  // doesn't read messages.length directly, but biome's analyzer can't see
  // that the dependency exists for its trigger value. We want this to fire
  // exactly when a new message is appended.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages.length is the intended trigger
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  // Capture the body before it clears (so we can append optimistically).
  const lastSubmittedBody = useRef('')

  return (
    <div className="flex min-h-[400px] flex-col md:h-[calc(100vh-12rem)]">
      <div ref={scrollRef} className="space-y-3 px-1 py-2 md:min-h-0 md:flex-1 md:overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hi!</p>
        ) : (
          messages.map((m, idx) => (
            <MessageBubble
              key={m.id}
              message={m}
              isViewer={m.senderId === viewerId}
              showTimestamp={idx === 0 || gapMinutes(messages[idx - 1], m) > 15}
            />
          ))
        )}
      </div>

      {composerEnabled ? (
        <form
          key={formKey}
          action={(fd) => {
            const body = (fd.get('body') as string | null)?.trim() ?? ''
            // Side-channel: capture the body in a ref so the post-action
            // useEffect can append it optimistically. Mutating a ref outside
            // its read effect is what triggers the lint rule, but the
            // sequencing is intentional — action runs at click time, then
            // state changes, then the effect reads the latest ref.
            // eslint-disable-next-line react-hooks/immutability -- intentional pre-effect capture
            lastSubmittedBody.current = body
            dispatch(fd)
          }}
          className="mt-2 flex items-end gap-2 border-t pt-3"
        >
          <input type="hidden" name="threadId" value={threadId} />
          <Textarea
            name="body"
            placeholder="Type a message…"
            rows={2}
            maxLength={4000}
            required
            disabled={pending}
            className="min-h-10 flex-1 resize-none bg-card text-sm"
            onKeyDown={(e) => {
              // Cmd/Ctrl+Enter submits.
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <Button type="submit" disabled={pending}>
            {pending ? 'Sending…' : 'Send'}
          </Button>
        </form>
      ) : (
        <div className="mt-2 border-t pt-3 text-center text-sm text-muted-foreground">
          You can&apos;t send messages to this person right now.
        </div>
      )}

      {state && !state.ok ? <p className="mt-2 text-xs text-destructive">{state.message}</p> : null}
    </div>
  )
}

function MessageBubble({
  message,
  isViewer,
  showTimestamp,
}: {
  message: ThreadMessage
  isViewer: boolean
  showTimestamp: boolean
}) {
  return (
    <div className={`flex flex-col ${isViewer ? 'items-end' : 'items-start'}`}>
      {showTimestamp ? (
        <div className="mb-1 px-1 font-mono text-xs text-muted-foreground">
          {formatStamp(message.createdAt)}
        </div>
      ) : null}
      <div
        className={`max-w-[72%] rounded-md px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
          isViewer
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {message.body}
      </div>
    </div>
  )
}

function gapMinutes(prev: ThreadMessage | undefined, curr: ThreadMessage): number {
  if (!prev) return 0
  return (new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()) / 60000
}

function formatStamp(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
  return format(d, 'MMM d, h:mm a')
}
