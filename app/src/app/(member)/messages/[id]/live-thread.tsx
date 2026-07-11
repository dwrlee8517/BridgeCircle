'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
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
    async (prev, formData) => {
      const result = await sendMessageAction(prev, formData)
      // Append our own send as soon as the server confirms it, unless
      // realtime already delivered it (it usually will, almost immediately —
      // this keeps the UI snappy on flaky networks). Deduped by id both here
      // and in the realtime handler, whichever lands first.
      if (result?.ok) {
        setMessages((cur) => {
          if (cur.some((m) => m.id === result.messageId)) return cur
          return [
            ...cur,
            {
              id: result.messageId,
              senderId: viewerId,
              body: result.body,
              createdAt: result.createdAt,
              readAt: null,
            },
          ]
        })
      }
      return result
    },
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

  // Auto-scroll to the bottom whenever the messages array grows. The body
  // doesn't read messages.length directly, but biome's analyzer can't see
  // that the dependency exists for its trigger value. We want this to fire
  // exactly when a new message is appended.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages.length is the intended trigger
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[400px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-2 space-y-3">
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
          // Re-key on each successful send so the textarea resets. Derived
          // from the last confirmed message id — no effect needed.
          key={state?.ok ? state.messageId : 'initial'}
          action={dispatch}
          className="flex items-end gap-2 border-t pt-3 mt-2"
        >
          <input type="hidden" name="threadId" value={threadId} />
          <textarea
            name="body"
            placeholder="Type a message…"
            rows={2}
            maxLength={4000}
            required
            disabled={pending}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="border-t pt-3 mt-2 text-sm text-muted-foreground text-center">
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
        <div className="text-[10px] text-muted-foreground mb-1 px-1">
          {formatStamp(message.createdAt)}
        </div>
      ) : null}
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
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
