'use client'

import { ArrowUp, Check, CircleAlert, Sparkle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useMemberShellHeader } from '../../member-shell-header-context'
import { requestHelpAssistance } from '../help-assistance-client'
import { clearHelpDraft, readHelpDraft, writeHelpQuestionDraft } from '../help-draft-storage'
import {
  buildCircleRevisionFallback,
  type CircleAskStatus,
  circlePostFailureMessage,
} from './circle-ask-draft'

type HelpReach = 'matched' | 'organization'

type ChatMessage = {
  id: string
  role: 'member' | 'assistant'
  text: string
}

type CircleAskResponse = {
  status?: CircleAskStatus
  askId?: string | null
  error?: string
}

const MAX_QUESTION_LENGTH = 2_000

export function CircleAskComposer({
  membershipId,
  organizationName,
  graduationYear,
}: {
  membershipId: string
  organizationName: string
  graduationYear: number | null
}) {
  const [originalQuestion, setOriginalQuestion] = useState<string | null | undefined>(undefined)
  const [question, setQuestion] = useState('')
  const [instruction, setInstruction] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reach, setReach] = useState<HelpReach>('matched')
  const [anonymousUntilAccepted, setAnonymousUntilAccepted] = useState(false)
  const [lastEditor, setLastEditor] = useState<'member' | 'assistant' | null>(null)
  const [assisting, setAssisting] = useState(false)
  const [flash, setFlash] = useState(false)
  const [posting, setPosting] = useState(false)
  const [questionError, setQuestionError] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [sentAskId, setSentAskId] = useState<string | null>(null)
  const assistanceRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef<string | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const questionErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)
  const visibleMessageCount = messages.length + (assisting ? 1 : 0)

  useMemberShellHeader({
    title: 'Ask the circle',
    backHref: '/help',
    backLabel: 'Back to Help',
    hideNotifications: true,
  })

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const stored = readHelpDraft(window.sessionStorage, membershipId)
      const carriedQuestion = stored?.question.trim() || null
      setOriginalQuestion(carriedQuestion)
      setQuestion(carriedQuestion ?? '')
    }, 0)
    return () => window.clearTimeout(initialize)
  }, [membershipId])

  useEffect(
    () => () => {
      assistanceRef.current?.abort('composer_unmounted')
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      if (questionErrorTimerRef.current) clearTimeout(questionErrorTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (visibleMessageCount > 0) {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [visibleMessageCount])

  function updateQuestion(value: string, editor: 'member' | 'assistant') {
    setQuestion(value)
    setLastEditor(editor)
    setQuestionError(false)
    if (questionErrorTimerRef.current) clearTimeout(questionErrorTimerRef.current)
    setPostError(null)
    requestIdRef.current = null
    writeHelpQuestionDraft(window.sessionStorage, membershipId, value)
  }

  function showFlash() {
    setFlash(true)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlash(false), 1_400)
  }

  function showQuestionError() {
    setQuestionError(true)
    if (questionErrorTimerRef.current) clearTimeout(questionErrorTimerRef.current)
    questionErrorTimerRef.current = setTimeout(() => setQuestionError(false), 3_800)
  }

  function selectReach(value: HelpReach) {
    setReach(value)
    setPostError(null)
    requestIdRef.current = null
  }

  function toggleAnonymous() {
    setAnonymousUntilAccepted((value) => !value)
    setPostError(null)
    requestIdRef.current = null
  }

  async function reviseQuestion(nextInstruction: string) {
    const cleaned = nextInstruction.trim()
    if (!cleaned || assisting) return
    if (!question.trim()) {
      setInstruction('')
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'member', text: cleaned },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: /^(start over|reset)$/i.test(cleaned)
            ? 'Fresh start — your ask is ready for what you need.'
            : 'Write your ask first — a sentence in the box on the right is plenty. Then I can work on it.',
        },
      ])
      return
    }

    setQuestionError(false)
    setInstruction('')
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'member', text: cleaned },
    ])

    const fallback = buildCircleRevisionFallback(question, cleaned, originalQuestion ?? question)
    if (/^(start over|reset)$/i.test(cleaned)) {
      updateQuestion(fallback, 'assistant')
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Fresh start — back to what you first wrote.',
        },
      ])
      showFlash()
      return
    }

    const controller = new AbortController()
    assistanceRef.current?.abort('new_help_assistance_request')
    assistanceRef.current = controller
    setAssisting(true)
    const result = await requestHelpAssistance({
      currentText: question,
      context: [
        'This is a circle Ask shown to potential helpers, not a note to one named person.',
        `Requested revision: ${cleaned}`,
      ],
      fallbackText: fallback,
      signal: controller.signal,
    })
    if (controller.signal.aborted) return

    if (result.text) {
      updateQuestion(result.text, 'assistant')
      showFlash()
    }
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text:
          result.status === 'suggested'
            ? 'Updated — take a look at your ask on the right.'
            : result.text
              ? 'I made a safe local edit while the writing assistant is unavailable.'
              : 'I couldn’t apply that automatically. Your ask is safe and still editable.',
      },
    ])
    setAssisting(false)
  }

  async function postAsk() {
    const cleanedQuestion = question.trim()
    if (!cleanedQuestion) {
      showQuestionError()
      return
    }
    if (posting) return

    setQuestionError(false)
    setPostError(null)
    setPosting(true)
    requestIdRef.current ??= crypto.randomUUID()

    try {
      const response = await fetch('/api/help/asks/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: cleanedQuestion,
          reach,
          anonymousUntilAccepted,
          clientRequestId: requestIdRef.current,
        }),
        cache: 'no-store',
      })
      const result = (await response.json()) as CircleAskResponse
      if (!response.ok) throw new Error(result.error ?? 'post_unavailable')

      if ((result.status === 'created' || result.status === 'existing') && result.askId) {
        clearHelpDraft(window.sessionStorage, membershipId)
        setSentAskId(result.askId)
        return
      }
      setPostError(circlePostFailureMessage(result.status))
    } catch {
      setPostError('Couldn’t post that — check your connection. Your ask is safe right here.')
    } finally {
      setPosting(false)
    }
  }

  if (originalQuestion === undefined) return <ComposerLoading />
  if (sentAskId) return <ComposerSuccess askId={sentAskId} />

  return (
    <div className="min-h-full bg-[image:var(--wash-page)] lg:h-[calc(100dvh-var(--topbar-height)_-_1px)]">
      <div className="mx-auto flex w-full max-w-[1140px] flex-col px-4 py-4 sm:px-6 sm:py-5 lg:h-full lg:px-6.5 lg:pt-4.5 lg:pb-5.5">
        <div className="grid min-h-[720px] gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_398px]">
          <section
            aria-label="Refine your ask with AI"
            className="flex min-h-[430px] flex-col overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] lg:min-h-0"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] px-4.5 py-3.25">
              <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary-btn)] text-white">
                <Sparkle aria-hidden className="size-3" fill="currentColor" stroke="none" />
              </span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">Refine with AI</span>
              <span className="ml-auto hidden text-kicker font-medium text-[var(--text-faint)] sm:inline">
                Every change lands in your ask →
              </span>
            </div>

            <div ref={chatRef} className="flex-1 space-y-3 overflow-y-auto px-4.5 pt-1.5 pb-4">
              {originalQuestion ? (
                <ChatBubble speaker="member">{originalQuestion}</ChatBubble>
              ) : null}
              <ChatBubble speaker="assistant">
                This is what busy helpers will skim — your ask is on the right. Tell me what to
                change: clearer, warmer, shorter, or anything to fold in, like “mention I’m
                graduating in spring.”
              </ChatBubble>
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

            <div className="flex flex-wrap gap-1.75 px-4.5 pb-2.5">
              {['Make it clearer', 'Warmer', 'Shorter', 'Start over'].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled={assisting}
                  onClick={() => reviseQuestion(label)}
                  className="min-h-8 rounded-full bg-[var(--surface-subtle)] px-3.25 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--grey-200)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50 lg:py-1.75"
                >
                  {label}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2.25 border-t border-[var(--border-subtle)] px-4 pt-3 pb-3.5"
              onSubmit={(event) => {
                event.preventDefault()
                void reviseQuestion(instruction)
              }}
            >
              <label htmlFor="circle-ai-instruction" className="sr-only">
                Tell the writing assistant what to change
              </label>
              <input
                id="circle-ai-instruction"
                value={instruction}
                maxLength={800}
                onChange={(event) => setInstruction(event.target.value)}
                placeholder="Tell it anything — “mention I’m graduating in spring”…"
                className="min-h-11 min-w-0 flex-1 rounded-full border-0 bg-card px-4 text-body-sm font-medium text-[var(--text-primary)] shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)] lg:min-h-10"
              />
              <button
                type="submit"
                aria-label="Send to writing assistant"
                disabled={assisting}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50 lg:size-10"
              >
                <ArrowUp aria-hidden className="size-[17px]" strokeWidth={2.2} />
              </button>
            </form>
          </section>

          <aside
            aria-label="Your ask"
            className="flex min-h-[620px] flex-col rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] p-4 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-5 sm:pt-4 sm:pb-4.5 lg:min-h-0 lg:overflow-y-auto"
          >
            <div className="flex min-h-5 items-center gap-2">
              <span className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase">
                Your ask
              </span>
              {flash ? (
                <span className="ml-auto rounded-full bg-[var(--blue-50)] px-2 py-0.5 text-kicker font-bold text-[var(--blue-600)]">
                  AI updated
                </span>
              ) : lastEditor === 'member' ? (
                <span className="ml-auto rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-kicker font-bold text-[var(--text-secondary)]">
                  Edited by you
                </span>
              ) : null}
            </div>
            <label htmlFor="circle-question" className="sr-only">
              Your ask
            </label>
            <textarea
              id="circle-question"
              value={question}
              maxLength={MAX_QUESTION_LENGTH}
              aria-invalid={questionError}
              onChange={(event) => {
                setFlash(false)
                updateQuestion(event.target.value, 'member')
              }}
              placeholder="What do you need?"
              className="mt-[11px] min-h-[132px] resize-none rounded-xl border-0 bg-card px-3.75 py-3.25 text-body-sm leading-[1.65] font-medium text-[var(--text-primary)] shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)] lg:resize-none"
            />
            <p className="mt-2 text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
              This is what the circle sees. AI keeps it up to date as you chat — or edit it
              directly.
            </p>

            <fieldset className="mt-4">
              <legend className="text-body-sm font-bold tracking-tight text-[var(--text-primary)]">
                Who can find this?
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
                <ReachOption
                  selected={reach === 'matched'}
                  title="Good matches"
                  description="Routed to fitting experience, never browsable."
                  onSelect={() => selectReach('matched')}
                />
                <ReachOption
                  selected={reach === 'organization'}
                  title={`Anyone at ${organizationName}`}
                  description="Findable in Help · Give."
                  onSelect={() => selectReach('organization')}
                />
              </div>
            </fieldset>
            <p className="mx-0.5 mt-2 text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
              Set once — reach can’t change after posting. Retract anytime.
            </p>

            <label className="mt-3 flex items-start gap-2.5 rounded-xl bg-[var(--surface-inset)] px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              <input
                type="checkbox"
                checked={anonymousUntilAccepted}
                onChange={toggleAnonymous}
                className="sr-only"
              />
              <span
                aria-hidden
                className={
                  anonymousUntilAccepted
                    ? 'mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-md bg-[var(--action-primary)] text-white'
                    : 'mt-0.5 size-[18px] shrink-0 rounded-md bg-card shadow-[var(--ring-outline)]'
                }
              >
                {anonymousUntilAccepted ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0">
                <strong className="block text-xs font-bold text-[var(--text-primary)]">
                  Post without your name
                </strong>
                <span className="mt-1 block text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
                  Helpers see “A member
                  {graduationYear ? ` · Class of ’${String(graduationYear).slice(-2)}` : ''}”. Your
                  name is shared only with the helper you accept.
                </span>
              </span>
            </label>

            {postError ? (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-xl bg-card px-3 py-3 shadow-[inset_0_0_0_1.5px_var(--red-200)]"
              >
                <CircleAlert
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-[var(--state-danger-text)]"
                />
                <p className="text-xs leading-relaxed font-semibold text-[var(--text-secondary)]">
                  {postError}
                </p>
              </div>
            ) : null}

            <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
              <p className="text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
                Open 14 days · you’ll only hear from members who offer.
              </p>
              <button
                type="button"
                disabled={posting}
                onClick={postAsk}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[11px] bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:bg-none disabled:bg-[var(--surface-subtle)] disabled:text-[var(--grey-400)] disabled:shadow-none sm:ml-auto"
              >
                {posting ? 'Posting…' : 'Post your ask'}
              </button>
            </div>
          </aside>
        </div>
      </div>
      {questionError ? (
        <div
          role="alert"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--grey-900)] px-5 py-3 text-center text-body-sm font-semibold text-white shadow-[0_10px_30px_rgb(25_31_40_/_0.35)] md:bottom-7"
        >
          Write your ask first — a sentence is plenty.
        </div>
      ) : null}
    </div>
  )
}

function ReachOption({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean
  title: string
  description: string
  onSelect(): void
}) {
  return (
    <label
      className={
        selected
          ? 'cursor-pointer rounded-xl bg-[var(--selected-tint)] px-3.25 py-2.75 text-left shadow-[var(--selected-accent),var(--ring-card)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring'
          : 'cursor-pointer rounded-xl bg-card px-3.25 py-2.75 text-left shadow-[var(--ring-card)] hover:bg-[var(--surface-subtle)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring'
      }
    >
      <input
        type="radio"
        name="circle-reach"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <strong className="block text-xs font-bold text-[var(--text-primary)]">{title}</strong>
      <span className="mt-1 block text-kicker leading-relaxed font-medium text-[var(--grey-600)]">
        {description}
      </span>
    </label>
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
      <div className="flex items-start gap-2.25">
        <span className="mt-0.5 inline-flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)]">
          <Sparkle aria-hidden className="size-[13px]" fill="currentColor" stroke="none" />
        </span>
        <div className="max-w-[76%] rounded-[4px_15px_15px_15px] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-body-sm leading-[1.55] font-medium text-[var(--text-primary)]">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[76%] rounded-[15px_4px_15px_15px] bg-[var(--action-primary)] px-3.5 py-2.5 text-body-sm leading-[1.55] font-medium text-white">
        {children}
      </div>
    </div>
  )
}

function ComposerLoading() {
  return (
    <div className="min-h-full bg-[image:var(--wash-page)] px-4 py-6">
      <div className="mx-auto grid max-w-[1140px] animate-pulse gap-3 motion-reduce:animate-none lg:grid-cols-[minmax(0,1fr)_398px]">
        <div className="h-[620px] rounded-[var(--radius-card-xl)] bg-[var(--border-subtle)]" />
        <div className="h-[620px] rounded-[var(--radius-card-xl)] bg-[var(--surface-card)]" />
      </div>
    </div>
  )
}

function ComposerSuccess({ askId }: { askId: string }) {
  return (
    <div className="min-h-full bg-[image:var(--wash-page)] px-4 py-12">
      <section className="mx-auto max-w-xl rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-6 py-8 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[image:var(--gradient-primary-btn)] text-white shadow-[var(--shadow-primary-btn)]">
          <Check aria-hidden className="size-5.5" strokeWidth={2.6} />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Your ask is out
        </h1>
        <p className="mt-2 text-body-sm leading-relaxed font-medium text-[var(--grey-600)]">
          Your question is shown to people who can help — you’ll only hear from members who offer.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/help"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-card px-5 text-body-sm font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)]"
          >
            Back to Help
          </Link>
          <Link
            href={`/help/asks/${askId}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)]"
          >
            View status
          </Link>
        </div>
      </section>
    </div>
  )
}
