'use client'

import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type ConnectionComposerStatus = 'editing' | 'sending' | 'error'

export function ConnectionComposer({
  open,
  recipient,
  organizationName,
  sharedContext,
  status,
  onOpenChange,
  onSend,
}: {
  open: boolean
  recipient: { userId: string; name: string } | null
  organizationName: string
  sharedContext: readonly string[]
  status: ConnectionComposerStatus
  onOpenChange: (open: boolean) => void
  onSend: (note: string) => void
}) {
  const [mode, setMode] = useState<'quick' | 'ai'>('quick')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(false)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'shaping' | 'fallback' | 'error'>('idle')

  if (!recipient) return null
  const firstName = recipient.name.split(/\s+/).filter(Boolean)[0] || 'them'
  const helloOptions = quickHelloOptions(firstName, organizationName, sharedContext)

  async function shapeNote() {
    const cleanReason = reason.trim()
    if (!cleanReason || draftStatus === 'shaping') return
    setDraftStatus('shaping')
    setNoteError(false)
    try {
      const response = await fetch('/api/people/connection-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ recipientUserId: recipient?.userId, reason: cleanReason }),
      })
      const result = (await response.json()) as {
        status?: 'suggested' | 'fallback' | 'limited'
        text?: string | null
      }
      if (!response.ok || !result.text) throw new Error('connection draft unavailable')
      setNote(result.text)
      setDraftStatus(result.status === 'suggested' ? 'idle' : 'fallback')
    } catch {
      setDraftStatus('error')
    }
  }

  function send() {
    const cleanNote = note.trim()
    if (!cleanNote) {
      setNoteError(true)
      return
    }
    setNoteError(false)
    onSend(cleanNote)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="right-0 left-auto top-0 flex h-dvh max-w-[92vw] translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none p-6 pb-28 sm:w-[440px] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">Connect with {firstName}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Your note lands in {firstName}’s “Waiting on you.” Connecting is mutual, and declines
            stay quiet both ways.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="mt-4 flex gap-1 rounded-full bg-[var(--surface-subtle)] p-1">
          <legend className="sr-only">Connection introduction mode</legend>
          <ModeButton active={mode === 'quick'} onClick={() => setMode('quick')}>
            Quick hello
          </ModeButton>
          <ModeButton active={mode === 'ai'} onClick={() => setMode('ai')}>
            Say why — AI shapes it
          </ModeButton>
        </fieldset>

        {mode === 'quick' ? (
          <div className="mt-4">
            <p className="text-[11px] font-bold tracking-[0.04em] text-[var(--text-secondary)] uppercase">
              For someone you know — one tap
            </p>
            <div className="mt-2 grid gap-2">
              {helloOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="rounded-xl bg-[var(--surface-subtle)] px-3.5 py-3 text-left text-xs leading-relaxed font-semibold text-[var(--text-secondary)] outline-none hover:bg-[var(--hover-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  onClick={() => {
                    setNote(value)
                    setNoteError(false)
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label
              htmlFor="connection-reason"
              className="text-[11px] font-bold tracking-[0.04em] text-[var(--text-secondary)] uppercase"
            >
              For someone new — say why, casually
            </label>
            <textarea
              id="connection-reason"
              value={reason}
              maxLength={800}
              rows={3}
              placeholder="“their path is the move I’m trying to make”"
              className="mt-2 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-white p-3 text-sm leading-relaxed font-medium outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted"
              onChange={(event) => {
                setReason(event.target.value)
                setDraftStatus('idle')
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2 text-[var(--blue-800)]"
              disabled={!reason.trim() || draftStatus === 'shaping'}
              aria-busy={draftStatus === 'shaping'}
              onClick={shapeNote}
            >
              {draftStatus === 'shaping' ? (
                <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
              ) : null}
              Shape my note
            </Button>
            {draftStatus === 'fallback' ? (
              <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                AI wasn’t available, so we used a simple editable starting point.
              </p>
            ) : null}
            {draftStatus === 'error' ? (
              <p role="alert" className="mt-2 text-xs font-semibold text-[var(--state-danger)]">
                We couldn’t shape that right now. Your reason is still here—you can edit the note
                yourself.
              </p>
            ) : null}
          </div>
        )}

        <label
          htmlFor="connection-request-message"
          className="mt-5 text-[11px] font-bold tracking-[0.04em] text-[var(--text-secondary)] uppercase"
        >
          Your request message
        </label>
        <textarea
          id="connection-request-message"
          value={note}
          maxLength={2_000}
          rows={5}
          aria-invalid={noteError || undefined}
          placeholder="Pick a hello above, or write your own…"
          className={cn(
            'mt-2 min-h-32 resize-y rounded-xl border bg-white p-3 text-sm leading-relaxed font-medium outline-none focus-visible:ring-4',
            noteError
              ? 'border-[var(--state-danger)] focus-visible:ring-[rgb(222_49_69_/_0.14)]'
              : 'border-[var(--border-subtle)] focus-visible:border-focus-ring focus-visible:ring-focus-ring-muted',
          )}
          onChange={(event) => {
            setNote(event.target.value)
            setNoteError(false)
          }}
        />
        {noteError ? (
          <p role="alert" className="mt-2 text-xs font-semibold text-[var(--state-danger)]">
            Pick a hello or write a line before sending.
          </p>
        ) : null}
        <p className="mt-2 text-[11px] font-medium text-[var(--text-secondary)]">
          AI-helped — edit anything before it sends.
        </p>
        {status === 'error' ? (
          <p role="alert" className="mt-2 text-xs font-semibold text-[var(--state-danger)]">
            We couldn’t send that yet. Your note is still here—try again.
          </p>
        ) : null}

        <DialogFooter className="absolute inset-x-0 bottom-0 m-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="cta"
            className="flex-1"
            aria-busy={status === 'sending'}
            disabled={status === 'sending'}
            onClick={send}
          >
            {status === 'sending' ? (
              <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
            ) : null}
            Send to {firstName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'min-h-9 flex-1 rounded-full px-2.5 text-xs font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        active
          ? 'bg-white font-bold text-[var(--text-primary)] shadow-[var(--shadow-card)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function quickHelloOptions(
  recipientFirstName: string,
  organizationName: string,
  sharedContext: readonly string[],
): string[] {
  const contextOptions = sharedContext
    .map((context) => context.trim())
    .filter(Boolean)
    .map((context) => `Hi ${recipientFirstName} — great to reconnect through ${context}.`)
  return [
    ...contextOptions,
    `Hi ${recipientFirstName} — great to find you through ${organizationName}.`,
    `Hi ${recipientFirstName} — I’d love to connect and learn more about your work.`,
  ]
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3)
}
