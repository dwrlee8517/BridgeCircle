'use client'

import { CircleHelp, HeartHandshake, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'
import {
  type HelpDraftCandidate,
  readHelpDraft,
  writeHelpCandidateDraft,
  writeHelpQuestionDraft,
} from './help-draft-storage'

const MAX_QUESTION_LENGTH = 2_000

type Candidate = HelpDraftCandidate

type CandidateResponse = {
  candidates?: Candidate[]
  error?: string
}

export function HelpQuestionForm({
  membershipId,
  activeAskCount,
  activeAskLimit,
}: {
  membershipId: string
  activeAskCount: number
  activeAskLimit: number
}) {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'searching' | 'results' | 'failed'>('idle')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const requestRef = useRef<AbortController | null>(null)
  const atCapacity = activeAskCount >= activeAskLimit

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readHelpDraft(window.sessionStorage, membershipId)
      if (stored) setQuestion(stored.question)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      requestRef.current?.abort()
    }
  }, [membershipId])

  function updateQuestion(next: string) {
    setQuestion(next)
    setError(null)
    if (status !== 'idle') {
      requestRef.current?.abort()
      setStatus('idle')
      setCandidates([])
    }
    writeHelpQuestionDraft(window.sessionStorage, membershipId, next)
  }

  function validateQuestion(): string | null {
    const cleaned = question.trim()
    if (!cleaned) return 'Type your question first — it carries into everything from here.'
    if (cleaned.length > MAX_QUESTION_LENGTH) {
      return `Keep your question under ${MAX_QUESTION_LENGTH.toLocaleString()} characters.`
    }
    return null
  }

  function askCircle() {
    const validationError = validateQuestion()
    if (validationError) {
      setError(validationError)
      return
    }
    if (atCapacity) return
    writeHelpQuestionDraft(window.sessionStorage, membershipId, question)
    router.push('/help/ask-circle')
  }

  async function findPeople() {
    const validationError = validateQuestion()
    if (validationError) {
      setError(validationError)
      return
    }

    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setError(null)
    setStatus('searching')

    try {
      const response = await fetch('/api/help/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
        cache: 'no-store',
        signal: controller.signal,
      })
      const body = (await response.json()) as CandidateResponse
      if (!response.ok || !body.candidates) throw new Error(body.error ?? 'search_failed')
      setCandidates(body.candidates)
      setStatus('results')
    } catch (caught) {
      if (controller.signal.aborted) return
      setCandidates([])
      setStatus('failed')
      setError(
        caught instanceof Error && caught.message === 'invalid_input'
          ? 'Check your question and try again.'
          : 'We couldn’t search right now. Your question is still here — try again when you’re ready.',
      )
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Get help or give help"
          className="inline-flex gap-0.5 rounded-full bg-[var(--wash-toggle-track)] p-1 shadow-[inset_0_0_0_1px_rgb(25_31_40_/_0.06)]"
        >
          <Link
            href="/help"
            role="tab"
            aria-selected="true"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-body-sm font-bold text-[var(--blue-600)] shadow-sm"
          >
            <CircleHelp aria-hidden className="size-[15px]" strokeWidth={2} />
            Get help
          </Link>
          <Link
            href="/help?mode=give"
            role="tab"
            aria-selected="false"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-body-sm font-semibold text-[var(--grey-600)] hover:bg-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <HeartHandshake aria-hidden className="size-[15px]" strokeWidth={2} />
            Give help
          </Link>
        </div>
        <span className="ml-auto text-xs font-semibold text-[var(--text-faint)]">
          Asks stay open 14 days
        </span>
      </div>

      <h1 className="mt-5 text-display-hero leading-10 font-extrabold text-[var(--text-primary)]">
        What do you need?
      </h1>
      <p className="mt-2 text-sm leading-[1.55] font-medium text-[var(--grey-600)]">
        Ask it the way it comes out — we’ll find who can help. Nothing here is sent to anyone.
      </p>

      <div className="mt-4.5 rounded-[var(--radius-large)] bg-card px-4 pt-4 pb-3 shadow-[inset_0_0_0_1px_rgb(49_130_246_/_0.2),0_10px_30px_-14px_rgb(25_31_40_/_0.25)] sm:px-5 sm:pt-4.5">
        <label htmlFor="help-question" className="sr-only">
          What do you need help with?
        </label>
        <textarea
          id="help-question"
          value={question}
          onChange={(event) => updateQuestion(event.target.value)}
          rows={3}
          maxLength={MAX_QUESTION_LENGTH + 1}
          placeholder="I’m trying to figure out…"
          aria-describedby={
            error ? 'help-question-error help-question-privacy' : 'help-question-privacy'
          }
          aria-invalid={Boolean(error)}
          className="min-h-20 w-full resize-y border-0 bg-transparent p-0 text-body-lg leading-[1.65] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]"
        />
        {error ? (
          <p
            id="help-question-error"
            className="mt-2 text-xs font-semibold text-[var(--state-danger-text)]"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-3 flex flex-col gap-3 border-t border-[var(--divider)] pt-3 sm:flex-row sm:items-center">
          <p
            id="help-question-privacy"
            className="text-xs leading-relaxed font-medium text-[var(--text-faint)]"
          >
            Searches are private — members never know they matched.
          </p>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            <button
              type="button"
              onClick={askCircle}
              disabled={atCapacity}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-card px-4.5 text-body-sm font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Users aria-hidden className="size-4" />
              Ask the circle
            </button>
            <button
              type="button"
              onClick={findPeople}
              disabled={status === 'searching'}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-[image:var(--gradient-primary-btn)] px-5.5 text-body font-bold text-[var(--action-on-primary)] shadow-[var(--shadow-primary-btn)] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-65"
            >
              <Search aria-hidden className="size-4" />
              {status === 'searching' ? 'Finding people…' : 'Find people'}
            </button>
          </div>
        </div>
      </div>

      {atCapacity ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-[var(--radius-box)] bg-card px-4 py-3 shadow-[var(--ring-card),var(--shadow-card)]">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--grey-400)]" />
          <p className="text-body-sm leading-relaxed font-medium text-[var(--text-secondary)]">
            All {activeAskLimit} ask slots are in use. You can still find people privately, or{' '}
            <Link href="/help/asks" className="font-bold text-[var(--action-primary)]">
              review your asks
            </Link>{' '}
            to free a slot.
          </p>
        </div>
      ) : null}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'searching'
          ? 'Finding people who can speak to your question.'
          : status === 'results'
            ? `${candidates.length} possible helpers found.`
            : status === 'failed'
              ? 'The search could not be completed.'
              : ''}
      </div>

      {status === 'searching' ? <CandidateSkeleton /> : null}
      {status === 'results' ? (
        <CandidateList candidates={candidates} membershipId={membershipId} question={question} />
      ) : null}
    </>
  )
}

function CandidateSkeleton() {
  return (
    <section className="mt-6" aria-hidden="true">
      <p className="mb-2.5 text-body-sm font-semibold text-[var(--grey-600)]">
        Reading your question — finding people who can speak to it…
      </p>
      <div className="overflow-hidden rounded-[18px] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 border-t border-[var(--divider-row)] px-5 py-4 first:border-t-0"
          >
            <span className="size-10 shrink-0 animate-pulse rounded-full bg-[var(--border-subtle)] motion-reduce:animate-none" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3 w-2/5 animate-pulse rounded-full bg-[var(--border-subtle)] motion-reduce:animate-none" />
              <span className="h-2.5 w-3/5 animate-pulse rounded-full bg-[var(--surface-canvas)] motion-reduce:animate-none" />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function CandidateList({
  candidates,
  membershipId,
  question,
}: {
  candidates: Candidate[]
  membershipId: string
  question: string
}) {
  if (candidates.length === 0) {
    return (
      <section className="mt-6 rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-8 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        <h2 className="text-body-lg font-extrabold text-[var(--text-primary)]">
          No strong matches yet
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-body-sm leading-relaxed font-medium text-[var(--text-faint)]">
          Try adding the kind of experience you need, or ask the circle so someone can recognize
          themselves in the question.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-6">
      <div className="mb-2.5 flex flex-wrap items-baseline gap-2">
        <h2 className="text-body-lg font-extrabold text-[var(--text-primary)]">
          People who can speak to it
        </h2>
        <span className="text-xs font-semibold text-[var(--text-faint)]">
          {candidates.length} · strongest first · fit isn’t a promise
        </span>
      </div>
      <div className="overflow-hidden rounded-[18px] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        {candidates.map((candidate, index) => (
          <article
            key={candidate.membershipId}
            className="flex flex-col gap-3 border-t border-[var(--divider-row)] px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:px-5"
          >
            <Avatar className="size-10 shrink-0 after:border-black/5">
              {candidate.avatarUrl ? <AvatarImage src={candidate.avatarUrl} alt="" /> : null}
              <AvatarFallback className={cn(avatarClass(index), 'text-body-sm font-bold')}>
                {getInitials(candidate.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {candidate.displayName}
                </h3>
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
              {candidate.headline ? (
                <p className="mt-1 truncate text-xs font-medium text-[var(--grey-600)]">
                  {candidate.headline}
                </p>
              ) : null}
              <div className="mt-2 rounded-[11px] bg-[var(--surface-subtle)] px-3 py-2.5">
                <span className="block text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase">
                  Why this match
                </span>
                <p className="mt-1 text-body-sm leading-[1.55] font-medium text-[var(--text-primary)]">
                  {candidate.matchReason}
                </p>
              </div>
            </div>
            <Link
              href={`/help/ask/${candidate.membershipId}`}
              onClick={() =>
                writeHelpCandidateDraft(window.sessionStorage, membershipId, question, candidate)
              }
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[var(--action-weak)] px-4 text-xs font-bold text-[var(--blue-600)] hover:bg-[var(--blue-100)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Ask {candidate.displayName.split(/\s+/)[0]}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

function avatarClass(index: number) {
  const classes = [
    'bg-[var(--avatar-1-bg)] text-[var(--avatar-1-fg)]',
    'bg-[var(--avatar-5-bg)] text-[var(--avatar-5-fg)]',
    'bg-[var(--avatar-2-bg)] text-[var(--avatar-2-fg)]',
    'bg-[var(--avatar-3-bg)] text-[var(--avatar-3-fg)]',
    'bg-[var(--avatar-4-bg)] text-[var(--avatar-4-fg)]',
    'bg-[var(--avatar-6-bg)] text-[var(--avatar-6-fg)]',
  ]
  return classes[index % classes.length]
}
