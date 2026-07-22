'use client'

import { formatDistanceToNow } from 'date-fns'
import { Check, CircleAlert } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { HelpAskDetail } from '@/lib/help/contracts'
import { cn, getInitials } from '@/lib/utils'
import { useMemberShellHeader } from '../../../member-shell-header-context'
import { requestHelpAssistance } from '../../help-assistance-client'
import { HelpReportDialog } from '../../help-report-dialog'
import {
  buildDirectOpeningDraft,
  firstName,
  reviseHelperReplyFallback,
} from '../../helper-response-draft'

type DirectResponse = {
  status?: 'accepted' | 'declined' | 'already_decided' | 'invalid_input' | 'not_available'
  conversationId?: string | null
  error?: string
}

const DECLINE_COPY = {
  unavailable:
    'I’m at capacity right now and couldn’t give this the attention it deserves. I’m glad you reached out.',
  outside_expertise:
    'I don’t think I’m the right person for this one, and I don’t want to point you in the wrong direction.',
  other: '',
} as const

export function GiveDirectView({
  detail,
  avatarUrl,
}: {
  detail: HelpAskDetail
  avatarUrl: string | null
}) {
  const asker = detail.asker.identity === 'identified' ? detail.asker : null
  const name = asker?.displayName ?? 'A member'
  const initialDraft = buildDirectOpeningDraft(name, detail.question)
  const [mode, setMode] = useState<'accept' | 'decline'>('accept')
  const [reply, setReply] = useState(initialDraft)
  const [declineReason, setDeclineReason] = useState<keyof typeof DECLINE_COPY>('unavailable')
  const [declineNote, setDeclineNote] = useState<string>(DECLINE_COPY.unavailable)
  const [pending, setPending] = useState(false)
  const [assisting, setAssisting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reported, setReported] = useState(false)
  const nonceRef = useRef<string | null>(null)

  useMemberShellHeader({
    title: `${firstName(name)} asked you`,
    backHref: '/help?mode=give',
    backLabel: 'Back to Give help',
    hideNotifications: true,
  })

  async function reviseReply(instruction: string) {
    if (assisting || !reply.trim()) return
    const fallback = reviseHelperReplyFallback(reply, instruction, initialDraft)
    if (/^(start over|reset)$/i.test(instruction)) {
      setReply(fallback)
      return
    }
    setAssisting(true)
    setError(null)
    const controller = new AbortController()
    const result = await requestHelpAssistance({
      task: 'offer_note',
      currentText: reply,
      context: [detail.question, `Requested revision: ${instruction}`],
      fallbackText: fallback,
      signal: controller.signal,
    })
    if (result.text) setReply(result.text)
    else setError('The writing assistant is unavailable. Your reply is still safe and editable.')
    setAssisting(false)
  }

  async function polishDecline() {
    if (assisting || !declineNote.trim()) return
    setAssisting(true)
    setError(null)
    const controller = new AbortController()
    const result = await requestHelpAssistance({
      task: 'decline_note',
      currentText: declineNote,
      context: [detail.question, 'Keep the decline kind, direct, and free of new promises.'],
      fallbackText: declineNote.trim(),
      signal: controller.signal,
    })
    if (result.text) setDeclineNote(result.text)
    else setError('The writing assistant is unavailable. Your note is still safe and editable.')
    setAssisting(false)
  }

  async function submitAccept() {
    if (!reply.trim() || pending) {
      if (!reply.trim()) setError('Write a first line so the conversation doesn’t start cold.')
      return
    }
    setPending(true)
    setError(null)
    nonceRef.current ??= crypto.randomUUID()
    try {
      const response = await fetch(`/api/help/asks/${detail.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'accept',
          openingMessage: reply.trim(),
          clientNonce: nonceRef.current,
        }),
        cache: 'no-store',
      })
      const result = (await response.json()) as DirectResponse
      if (!response.ok) throw new Error(result.error ?? 'response_failed')
      if (result.status === 'accepted' && result.conversationId) {
        window.location.assign(`/messages/${result.conversationId}`)
        return
      }
      if (result.status === 'already_decided') window.location.reload()
      else setError('This ask is no longer available to accept.')
    } catch {
      setError('Couldn’t send your reply. Check your connection — the draft is still here.')
    } finally {
      setPending(false)
    }
  }

  async function submitDecline() {
    if (!declineNote.trim() || pending) {
      if (!declineNote.trim()) setError('A few kind words are required before declining.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/help/asks/${detail.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'decline',
          declineReasonCode: declineReason,
          declineNote: declineNote.trim(),
        }),
        cache: 'no-store',
      })
      const result = (await response.json()) as DirectResponse
      if (!response.ok) throw new Error(result.error ?? 'response_failed')
      if (result.status === 'declined') {
        window.location.assign('/help?mode=give')
        return
      }
      if (result.status === 'already_decided') window.location.reload()
      else setError('This ask is no longer available to decline.')
    } catch {
      setError('Couldn’t send your note. Check your connection — the note is still here.')
    } finally {
      setPending(false)
    }
  }

  if (!asker) return null

  const terminal = detail.status !== 'waiting'
  return (
    <div className="min-h-full bg-[image:var(--wash-page)]">
      <section className="bg-[image:var(--wash-give)] px-4 py-6 sm:px-8 sm:py-7">
        <div className="mx-auto max-w-[860px]">
          <span className="inline-flex rounded-full bg-[var(--blue-50)] px-2.5 py-1 text-kicker font-bold text-[var(--blue-600)]">
            Asked you by name
          </span>
          <h1 className="mt-3 max-w-[740px] text-page-title leading-tight font-bold tracking-display text-[var(--text-primary)]">
            “{detail.question}”
          </h1>
          <div className="mt-4 flex items-center gap-2.5">
            <Avatar className="size-10 shadow-[var(--ring-avatar)]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback seed={asker.userId}>{getInitials(asker.displayName)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="flex flex-wrap items-baseline gap-2">
                <Link
                  href={`/profile/${asker.userId}`}
                  className="text-body-sm font-bold text-[var(--text-primary)] hover:text-[var(--blue-600)] hover:underline"
                >
                  {asker.displayName}
                </Link>
                {asker.graduationYear ? (
                  <span className="text-xs font-semibold text-[var(--text-faint)]">
                    Class of ’{String(asker.graduationYear).slice(-2)}
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-[var(--text-faint)]">
                Asked {formatDistanceToNow(new Date(detail.createdAt), { addSuffix: true })}
                {detail.status === 'waiting' ? ' · waiting on you' : ''}
              </span>
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[860px] px-4 py-6 sm:px-8 sm:py-7">
        <section className="rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-6">
          <p className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase">
            The full ask
          </p>
          {(detail.requestMessage ?? detail.question)
            .split(/\n\s*\n/)
            .filter(Boolean)
            .map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 text-body-md leading-[1.7] font-medium text-[var(--text-primary)]"
              >
                {paragraph}
              </p>
            ))}
        </section>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setReported(true)}
            className="min-h-9 rounded-lg px-2 text-xs font-semibold text-[var(--text-faint)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Report this ask
          </button>
        </div>

        {terminal ? (
          <TerminalDirectState detail={detail} />
        ) : mode === 'accept' ? (
          <section className="mt-3 rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-6">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-body-lg font-bold text-[var(--text-primary)]">Accept & reply</h2>
              <span className="text-xs font-semibold text-[var(--text-faint)]">
                the thread never starts cold
              </span>
            </div>
            <textarea
              value={reply}
              onChange={(event) => {
                setReply(event.target.value)
                setError(null)
                nonceRef.current = null
              }}
              maxLength={10_000}
              rows={4}
              aria-label="Your opening message"
              className="mt-3 w-full resize-none rounded-xl border-0 bg-card px-3.5 py-3 text-body-sm leading-[1.6] font-medium shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
            />
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-kicker font-semibold text-[var(--text-faint)]">
                Quick AI fixes:
              </span>
              {['Warmer', 'Shorter', 'Start over'].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled={assisting}
                  onClick={() => void reviseReply(label)}
                  className="min-h-9 rounded-full bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--grey-200)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
              Drafted from the ask — edit it directly, or tap a fix and it updates in place.
            </p>
            {error ? <InlineError>{error}</InlineError> : null}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  setMode('decline')
                  setError(null)
                }}
                className="min-h-11 rounded-xl px-3 text-xs font-semibold text-[var(--text-faint)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Decline — always with a note
              </button>
              <button
                type="button"
                onClick={() => void submitAccept()}
                disabled={pending || assisting}
                className="min-h-11 rounded-xl bg-[var(--action-give)] px-6 text-body-sm font-bold text-white shadow-[0_4px_12px_rgb(11_138_87_/_0.25)] hover:bg-[var(--action-give-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-55 sm:ml-auto"
              >
                {pending ? 'Sending…' : 'Accept & send'}
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-3 rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-6">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-body-lg font-bold text-[var(--text-primary)]">Say no, kindly</h2>
              <span className="text-xs font-semibold text-[var(--text-faint)]">
                {firstName(name)} gets a note, never a bare no
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('accept')
                  setError(null)
                }}
                className="ml-auto min-h-9 rounded-lg px-2 text-xs font-bold text-[var(--action-primary)] hover:bg-[var(--blue-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Back
              </button>
            </div>
            <div className="mt-4 rounded-[14px] bg-[var(--surface-inset)] p-4">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                Pick the closest reason
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ['unavailable', 'I can’t right now'],
                    ['outside_expertise', 'Outside my experience'],
                    ['other', 'Something else'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setDeclineReason(value)
                      setDeclineNote(DECLINE_COPY[value])
                      setError(null)
                    }}
                    className={cn(
                      'min-h-10 rounded-full px-3.5 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                      declineReason === value
                        ? 'bg-[var(--action-weak)] text-[var(--blue-600)] shadow-[inset_0_0_0_1px_var(--action-primary)]'
                        : 'bg-card text-[var(--text-secondary)] shadow-[var(--ring-outline)]',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label
              htmlFor="decline-note"
              className="mt-4 block text-xs font-bold text-[var(--text-primary)]"
            >
              Your note to {firstName(name)}
            </label>
            <textarea
              id="decline-note"
              value={declineNote}
              onChange={(event) => {
                setDeclineNote(event.target.value)
                setError(null)
              }}
              maxLength={2_000}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border-0 bg-card px-3.5 py-3 text-body-sm leading-[1.6] font-medium shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
            />
            <button
              type="button"
              disabled={assisting || !declineNote.trim()}
              onClick={() => void polishDecline()}
              className="mt-2 min-h-9 rounded-full bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--grey-200)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
            >
              {assisting ? 'Polishing…' : 'Polish kindly with AI'}
            </button>
            {error ? <InlineError>{error}</InlineError> : null}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void submitDecline()}
                disabled={pending || assisting}
                className="min-h-11 rounded-xl bg-[image:var(--gradient-primary-btn)] px-6 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-55"
              >
                {pending ? 'Sending…' : 'Send note & decline'}
              </button>
            </div>
          </section>
        )}
      </main>

      <HelpReportDialog
        open={reported}
        onOpenChange={setReported}
        endpoint={`/api/help/asks/${detail.id}/report`}
      />
    </div>
  )
}

function InlineError({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-2 text-xs font-semibold text-[var(--error)]"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  )
}

function TerminalDirectState({ detail }: { detail: HelpAskDetail }) {
  const accepted = detail.status === 'accepted' || detail.status === 'resolved'
  return (
    <section className="mt-3 rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-7 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-6">
      <span className="mx-auto inline-flex size-10 items-center justify-center rounded-full bg-[var(--give-tint)] text-[var(--action-give-text)]">
        <Check aria-hidden className="size-5" />
      </span>
      <h2 className="mt-3 text-body-lg font-bold text-[var(--text-primary)]">
        {accepted ? 'You answered this ask' : 'Your note was sent'}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed font-medium text-[var(--text-secondary)]">
        {accepted
          ? 'The conversation is available in Messages and stays there after the ask is resolved.'
          : 'This ask is closed for you. The member received your note.'}
      </p>
      {detail.conversationId ? (
        <Link
          href={`/messages/${detail.conversationId}`}
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)]"
        >
          Open Messages
        </Link>
      ) : (
        <Link
          href="/help?mode=give"
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--surface-subtle)] px-5 text-body-sm font-bold text-[var(--text-secondary)]"
        >
          Back to Give help
        </Link>
      )}
    </section>
  )
}
