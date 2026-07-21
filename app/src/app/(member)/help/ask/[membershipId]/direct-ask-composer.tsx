'use client'

import { Check, CircleAlert, SendHorizontal, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { useMemberShellHeader } from '../../../member-shell-header-context'
import { requestHelpAssistance } from '../../help-assistance-client'
import {
  clearHelpDraft,
  type HelpDraft,
  type HelpDraftCandidate,
  readHelpDraft,
} from '../../help-draft-storage'

type DirectAskResponse = {
  status?:
    | 'created'
    | 'existing'
    | 'idempotency_conflict'
    | 'active_limit_reached'
    | 'helper_limit_reached'
    | 'invalid_input'
    | 'not_available'
  askId?: string | null
}

type ChatMessage = {
  id: string
  role: 'member' | 'assistant'
  text: string
}

export function DirectAskComposer({
  viewerMembershipId,
  recipient,
  initialQuestion,
  skipAi,
  useSearchDraft,
}: {
  viewerMembershipId: string
  recipient: HelpDraftCandidate
  initialQuestion: string
  skipAi: boolean
  useSearchDraft: boolean
}) {
  const [draft, setDraft] = useState<HelpDraft | null | undefined>(undefined)
  const [plain, setPlain] = useState(skipAi)
  const [note, setNote] = useState('')
  const [instruction, setInstruction] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [assisting, setAssisting] = useState(false)
  const [flash, setFlash] = useState(false)
  const [sending, setSending] = useState(false)
  const [questionError, setQuestionError] = useState(false)
  const [noteError, setNoteError] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sentAskId, setSentAskId] = useState<string | null>(null)
  const requestIdRef = useRef<string | null>(null)
  const assistanceRef = useRef<AbortController | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    let controller: AbortController | null = null
    const initialize = window.setTimeout(() => {
      if (cancelled) return
      const stored = useSearchDraft
        ? readHelpDraft(window.sessionStorage, viewerMembershipId)
        : null
      const carriedQuestion =
        stored?.candidate?.membershipId === recipient.membershipId ? stored.question : null
      const question = carriedQuestion ?? initialQuestion
      const nextDraft: HelpDraft = {
        question,
        candidate: recipient,
        expiresAt: stored?.expiresAt ?? 0,
      }
      setDraft(nextDraft)

      const fallback = question ? buildInitialNote(question, recipient) : ''
      setNote(fallback)
      if (skipAi || !question) return

      controller = new AbortController()
      assistanceRef.current = controller
      setAssisting(true)
      void requestHelpAssistance({
        currentText: question,
        context: candidateContext(recipient, 'Draft a warm first note from the member’s question.'),
        fallbackText: fallback,
        signal: controller.signal,
      }).then((result) => {
        if (cancelled || controller?.signal.aborted) return
        setNote(result.text ?? fallback)
        setMessages([
          {
            id: 'initial',
            role: 'assistant',
            text:
              result.status === 'suggested'
                ? 'I drafted a note from your question. Edit it directly or tell me what to change.'
                : 'I left you a complete editable starting note. It’s ready on the right — edit it directly or tell me what to change.',
          },
        ])
        setAssisting(false)
      })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(initialize)
      controller?.abort('composer_unmounted')
    }
  }, [initialQuestion, recipient, skipAi, useSearchDraft, viewerMembershipId])

  useEffect(
    () => () => {
      assistanceRef.current?.abort()
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    },
    [],
  )

  const candidate = draft?.candidate
  const firstName = candidate ? firstNameOf(candidate.displayName) : 'them'
  useMemberShellHeader(
    candidate
      ? {
          title: `Ask ${firstName}`,
          backHref: '/help',
          backLabel: 'Back to Help',
          hideNotifications: true,
        }
      : null,
  )

  async function reviseNote(nextInstruction: string) {
    if (!draft || !candidate || assisting || !draft.question.trim()) return
    const cleaned = nextInstruction.trim()
    if (!cleaned) return

    const fallback = buildRevisionFallback(note, cleaned, draft.question, candidate)
    if (/^(start over|reset)$/i.test(cleaned)) {
      setNote(fallback)
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'member', text: cleaned },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Fresh start — the original editable draft is back.',
        },
      ])
      setInstruction('')
      showFlash()
      return
    }

    const controller = new AbortController()
    assistanceRef.current?.abort()
    assistanceRef.current = controller
    setAssisting(true)
    setInstruction('')
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'member', text: cleaned },
    ])

    const result = await requestHelpAssistance({
      currentText: note || draft.question,
      context: candidateContext(candidate, `Requested revision: ${cleaned}`),
      fallbackText: fallback,
      signal: controller.signal,
    })
    if (controller.signal.aborted) return
    if (result.text) {
      setNote(result.text)
      showFlash()
    }
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text:
          result.status === 'suggested'
            ? 'Updated — the note is ready on the right.'
            : result.text && result.text !== note
              ? 'I used a safe local edit while the writing assistant is unavailable.'
              : 'I couldn’t apply that automatically. Your note is safe and still editable.',
      },
    ])
    setAssisting(false)
  }

  function showFlash() {
    setFlash(true)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlash(false), 1_400)
  }

  function switchToAi() {
    if (!draft || !candidate || !draft.question.trim()) return
    setPlain(false)
    setNote(buildInitialNote(draft.question, candidate))
    void reviseNote('Start over')
  }

  async function sendAsk() {
    if (!draft || !candidate || sending) return
    const question = draft.question.trim()
    if (!question) {
      setQuestionError(true)
      return
    }
    const requestMessage = note.trim()
    if (!requestMessage) {
      setNoteError(true)
      return
    }
    setQuestionError(false)
    setNoteError(false)
    setSendError(null)
    setSending(true)
    requestIdRef.current ??= crypto.randomUUID()

    try {
      const response = await fetch('/api/help/asks/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientMembershipId: recipient.membershipId,
          question,
          requestMessage,
          clientRequestId: requestIdRef.current,
        }),
        cache: 'no-store',
      })
      const result = (await response.json()) as DirectAskResponse & { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'send_unavailable')

      if ((result.status === 'created' || result.status === 'existing') && result.askId) {
        clearHelpDraft(window.sessionStorage, viewerMembershipId)
        setSentAskId(result.askId)
        return
      }
      setSendError(sendFailureMessage(result.status, firstName))
    } catch {
      setSendError('Couldn’t send that — check your connection. Your note is safe right here.')
    } finally {
      setSending(false)
    }
  }

  if (draft === undefined) {
    return <ComposerLoading />
  }

  if (!draft || !candidate) return <ComposerLoading />

  if (sentAskId) {
    return <ComposerSuccess firstName={firstName} />
  }

  return (
    <div className="min-h-full bg-[image:var(--wash-page)] lg:h-[calc(100dvh-var(--topbar-height)_-_1px)]">
      <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:h-full xl:px-7">
        <CandidateSummary candidate={candidate} />
        <QuestionPrompt
          question={draft.question}
          error={questionError}
          onChange={(question) => {
            setDraft((current) => (current ? { ...current, question } : current))
            setQuestionError(false)
          }}
        />

        {plain ? (
          <PlainComposer
            firstName={firstName}
            note={note}
            noteError={noteError}
            sendError={sendError}
            sending={sending}
            onNoteChange={(value) => {
              setNote(value)
              setNoteError(false)
            }}
            onUseAi={switchToAi}
            onSend={sendAsk}
          />
        ) : (
          <div className="grid min-h-[560px] gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_398px]">
            <section
              aria-label="Drafting conversation"
              className="flex min-h-[390px] flex-col overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]"
            >
              <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary-btn)] text-white">
                  <Sparkles aria-hidden className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  Refine with AI
                </span>
                <span className="ml-auto hidden text-kicker font-medium text-[var(--text-faint)] sm:inline">
                  Every change lands in the note →
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                {messages.map((message) => (
                  <ChatBubble key={message.id} speaker={message.role}>
                    {message.text}
                  </ChatBubble>
                ))}
                {assisting ? (
                  <ChatBubble speaker="assistant">
                    <span
                      role="status"
                      aria-label="Writing"
                      className="inline-flex items-center gap-1"
                    >
                      {[0, 1, 2].map((dot) => (
                        <i
                          key={dot}
                          className="size-1.5 animate-pulse rounded-full bg-[var(--grey-400)] motion-reduce:animate-none"
                        />
                      ))}
                    </span>
                  </ChatBubble>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
                {['Make it warmer', 'Shorter', 'More formal', 'Start over'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled={assisting}
                    onClick={() => reviseNote(label)}
                    className="min-h-9 rounded-full bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--grey-200)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    assistanceRef.current?.abort('member_switched_to_plain')
                    setAssisting(false)
                    setPlain(true)
                    setNote(draft.question)
                    setMessages([])
                  }}
                  className="ml-auto min-h-9 rounded-lg px-2 text-xs font-bold text-[var(--action-primary)] hover:bg-[var(--blue-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  Write it myself
                </button>
              </div>

              <form
                className="flex gap-2 border-t border-[var(--border-subtle)] px-4 py-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  void reviseNote(instruction)
                }}
              >
                <label htmlFor="help-ai-instruction" className="sr-only">
                  Tell the writing assistant what to change
                </label>
                <input
                  id="help-ai-instruction"
                  value={instruction}
                  maxLength={800}
                  onChange={(event) => setInstruction(event.target.value)}
                  placeholder="Tell the AI what to change…"
                  className="min-h-11 min-w-0 flex-1 rounded-full border-0 bg-card px-4 text-body-sm font-medium text-[var(--text-primary)] shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
                />
                <button
                  type="submit"
                  aria-label="Send to writing assistant"
                  disabled={assisting || !instruction.trim()}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
                >
                  <SendHorizontal aria-hidden className="size-4.5" />
                </button>
              </form>
            </section>

            <NotePanel
              firstName={firstName}
              note={note}
              noteError={noteError}
              sendError={sendError}
              sending={sending}
              flash={flash}
              onNoteChange={(value) => {
                setNote(value)
                setNoteError(false)
              }}
              onSend={sendAsk}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CandidateSummary({ candidate }: { candidate: HelpDraftCandidate }) {
  return (
    <section className="flex items-center gap-3 rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-4 py-3 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-5">
      <Avatar className="size-10 shrink-0 after:border-black/5">
        {candidate.avatarUrl ? <AvatarImage src={candidate.avatarUrl} alt="" /> : null}
        <AvatarFallback seed={candidate.userId} className="text-body-sm font-bold">
          {getInitials(candidate.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">{candidate.displayName}</h2>
          {candidate.graduationYear ? (
            <span className="text-kicker font-semibold text-[var(--text-faint)]">
              ’{String(candidate.graduationYear).slice(-2)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--give-tint-weak)] px-2 py-0.5 text-kicker font-bold text-[var(--action-give-text)]">
            <i className="size-1.5 rounded-full bg-[var(--green-500)]" />
            Open to help
          </span>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-[var(--grey-600)]">
          {candidate.headline ?? candidate.matchReason}
        </p>
      </div>
      <Link
        href={`/profile/${candidate.userId}`}
        className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-bold text-[var(--action-primary)] hover:bg-[var(--blue-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        Profile →
      </Link>
    </section>
  )
}

function QuestionPrompt({
  question,
  error,
  onChange,
}: {
  question: string
  error: boolean
  onChange(question: string): void
}) {
  return (
    <section className="rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-4 py-3.5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-5">
      <label
        htmlFor="direct-ask-question"
        className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase"
      >
        What would you like help with?
      </label>
      <textarea
        id="direct-ask-question"
        value={question}
        rows={2}
        maxLength={2_000}
        aria-invalid={error}
        aria-describedby={error ? 'direct-ask-question-error' : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder="I’m trying to figure out…"
        className="mt-2 min-h-18 w-full resize-y rounded-xl border-0 bg-[var(--surface-subtle)] px-3.5 py-3 text-body-sm leading-relaxed font-medium text-[var(--text-primary)] outline-none shadow-[var(--ring-outline)] placeholder:text-[var(--text-faint)] focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
      />
      {error ? (
        <p
          id="direct-ask-question-error"
          className="mt-2 text-xs font-semibold text-[var(--state-danger-text)]"
        >
          Add a short question so your helper knows what you need.
        </p>
      ) : null}
    </section>
  )
}

function PlainComposer({
  firstName,
  note,
  noteError,
  sendError,
  sending,
  onNoteChange,
  onUseAi,
  onSend,
}: {
  firstName: string
  note: string
  noteError: boolean
  sendError: string | null
  sending: boolean
  onNoteChange(value: string): void
  onUseAi(): void
  onSend(): void
}) {
  return (
    <section
      aria-label="Your note"
      className="flex min-h-[480px] flex-col rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] p-4 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:p-5 lg:flex-1"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase">
          Your note to {firstName}
        </span>
        <button
          type="button"
          onClick={onUseAi}
          className="ml-auto min-h-9 rounded-lg px-2 text-xs font-bold text-[var(--action-primary)] hover:bg-[var(--blue-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Draft with AI instead →
        </button>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed font-medium text-[var(--grey-600)]">
        Plain form — no AI drafting. Say it the way it comes out; your question carried over.
      </p>
      <label htmlFor="plain-direct-note" className="sr-only">
        Your note to {firstName}
      </label>
      <textarea
        id="plain-direct-note"
        value={note}
        maxLength={4_000}
        aria-invalid={noteError}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder={`Write your note to ${firstName} — a line or two is plenty.`}
        className="mt-3 min-h-64 flex-1 resize-y rounded-xl border-0 bg-card p-4 text-body-sm leading-[1.65] font-medium text-[var(--text-primary)] shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
      />
      {noteError ? (
        <p className="mt-2 text-xs font-semibold text-[var(--state-danger-text)]">
          The note can’t send empty — a line or two is plenty.
        </p>
      ) : null}
      <SendFooter firstName={firstName} sendError={sendError} sending={sending} onSend={onSend} />
    </section>
  )
}

function NotePanel({
  firstName,
  note,
  noteError,
  sendError,
  sending,
  flash,
  onNoteChange,
  onSend,
}: {
  firstName: string
  note: string
  noteError: boolean
  sendError: string | null
  sending: boolean
  flash: boolean
  onNoteChange(value: string): void
  onSend(): void
}) {
  return (
    <aside
      aria-label="Note draft"
      className="flex min-h-[390px] flex-col rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] p-4 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:p-5 lg:min-h-0"
    >
      <div className="flex items-center gap-2">
        <span className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase">
          Note to {firstName}
        </span>
        {flash ? (
          <span className="ml-auto rounded-full bg-[var(--blue-50)] px-2 py-0.5 text-kicker font-bold text-[var(--blue-600)]">
            AI updated
          </span>
        ) : null}
      </div>
      <label htmlFor="direct-note" className="sr-only">
        Note draft
      </label>
      <textarea
        id="direct-note"
        value={note}
        maxLength={4_000}
        aria-invalid={noteError}
        onChange={(event) => onNoteChange(event.target.value)}
        className="mt-3 min-h-64 flex-1 resize-y rounded-xl border-0 bg-card p-4 text-body-sm leading-[1.65] font-medium text-[var(--text-primary)] shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)] lg:min-h-0 lg:resize-none"
      />
      {noteError ? (
        <p className="mt-2 text-xs font-semibold text-[var(--state-danger-text)]">
          The note can’t send empty — a line or two is plenty.
        </p>
      ) : null}
      <p className="mt-2 text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
        AI keeps this note up to date as you chat — or edit it directly. Nothing sends until you say
        so.
      </p>
      <SendFooter firstName={firstName} sendError={sendError} sending={sending} onSend={onSend} />
    </aside>
  )
}

function SendFooter({
  firstName,
  sendError,
  sending,
  onSend,
}: {
  firstName: string
  sendError: string | null
  sending: boolean
  onSend(): void
}) {
  return (
    <>
      {sendError ? (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl bg-card px-3 py-3 shadow-[inset_0_0_0_1.5px_var(--red-200)]"
        >
          <CircleAlert
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-[var(--state-danger-text)]"
          />
          <p className="text-xs leading-relaxed font-semibold text-[var(--text-secondary)]">
            {sendError}
          </p>
        </div>
      ) : null}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
          {firstName} will answer either way — a yes, or a kind note.
        </p>
        <button
          type="button"
          disabled={sending}
          onClick={onSend}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[11px] bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:bg-none disabled:bg-[var(--surface-subtle)] disabled:text-[var(--grey-400)] disabled:shadow-none sm:ml-auto"
        >
          {sending ? 'Sending…' : `Send to ${firstName}`}
        </button>
      </div>
    </>
  )
}

function ChatBubble({
  speaker,
  children,
}: {
  speaker: 'member' | 'assistant'
  children: React.ReactNode
}) {
  if (speaker === 'assistant') {
    return (
      <div className="flex items-start gap-2">
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)]">
          <Sparkles aria-hidden className="size-3.5" strokeWidth={2} />
        </span>
        <div className="max-w-[78%] rounded-[6px_18px_18px_18px] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-body-sm leading-relaxed font-medium text-[var(--text-primary)]">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-[18px_18px_6px_18px] bg-[var(--action-primary)] px-3.5 py-2.5 text-body-sm leading-relaxed font-medium text-white">
        {children}
      </div>
    </div>
  )
}

function ComposerLoading() {
  return (
    <div className="min-h-full bg-[image:var(--wash-page)] px-4 py-6">
      <div className="mx-auto max-w-[1140px] animate-pulse space-y-3 motion-reduce:animate-none">
        <div className="h-16 rounded-[var(--radius-card-xl)] bg-[var(--border-subtle)]" />
        <div className="h-[540px] rounded-[var(--radius-card-xl)] bg-[var(--surface-card)]" />
      </div>
    </div>
  )
}

function ComposerSuccess({ firstName }: { firstName: string }) {
  return (
    <div className="min-h-full bg-[image:var(--wash-page)] px-4 py-12">
      <section className="mx-auto max-w-xl rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-6 py-8 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)]">
          <Check aria-hidden className="size-5.5" strokeWidth={2.6} />
        </span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Sent to {firstName}
        </h1>
        <p className="mt-2 text-body-sm leading-relaxed font-medium text-[var(--grey-600)]">
          {firstName} will see it today. Asks stay open 14 days — you’ll hear either way.
        </p>
        <Link
          href="/help"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)]"
        >
          Back to Help
        </Link>
        <p className="mt-3 text-kicker font-medium text-[var(--text-faint)]">
          Its status now appears under Your asks.
        </p>
      </section>
    </div>
  )
}

function buildInitialNote(question: string, candidate: HelpDraftCandidate) {
  const firstName = firstNameOf(candidate.displayName)
  return (
    'Hi ' +
    firstName +
    ' — ' +
    question.trim() +
    ' I’d really value your perspective. No pressure at all if now isn’t a good time.'
  )
}

function buildRevisionFallback(
  note: string,
  instruction: string,
  question: string,
  candidate: HelpDraftCandidate,
) {
  const base = note.trim() || buildInitialNote(question, candidate)
  if (/^(start over|reset)$/i.test(instruction)) return buildInitialNote(question, candidate)
  if (/short|brief|trim|concise/i.test(instruction)) {
    return base
      .split(/(?<=[.!?])\s+/)
      .slice(0, 2)
      .join(' ')
  }
  if (/formal|professional/i.test(instruction)) {
    return base
      .replace(/^Hi\s+/, 'Hello ')
      .replace('I’d really value', 'I would greatly value')
      .replace('No pressure at all', 'Please feel no pressure')
  }
  if (/warm|friendl|softer|kind/i.test(instruction) && !/hope your week/i.test(base)) {
    return base.replace(' — ', ' — I hope your week is going well. ')
  }
  return base
}

function candidateContext(candidate: HelpDraftCandidate, instruction: string) {
  return [
    `Recipient first name: ${firstNameOf(candidate.displayName)}`,
    `Visible match evidence: ${candidate.matchReason}`,
    instruction,
  ]
}

function firstNameOf(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || 'them'
}

function sendFailureMessage(status: DirectAskResponse['status'], firstName: string) {
  switch (status) {
    case 'active_limit_reached':
      return 'All five Ask slots are in use. Your note is safe — end an existing Ask, then try again.'
    case 'helper_limit_reached':
      return `${firstName} has enough requests right now. Your note is safe; choose another match.`
    case 'idempotency_conflict':
      return 'This send may already have reached the server with an earlier version. Check Your asks before trying a new send.'
    case 'not_available':
      return `${firstName} is no longer available for this Ask. Your question is safe back on Help.`
    default:
      return 'That note needs one more look before it can send. Nothing was created.'
  }
}
