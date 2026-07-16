'use client'

import { useActionState, useState } from 'react'
import type { SchoolEventCard } from '@/lib/school/contracts'
import { cn } from '@/lib/utils'
import { respondToEventAction, type SchoolActionState } from './actions'

const initialState: SchoolActionState = { status: 'idle', message: '' }

export function RsvpControl({
  event,
  tone = 'light',
}: {
  event: SchoolEventCard
  tone?: 'light' | 'dark'
}) {
  const [state, action, pending] = useActionState(respondToEventAction, initialState)
  const [offerDismissed, setOfferDismissed] = useState(false)
  const offerOpen = event.viewerRsvp === 'offered' && !offerDismissed
  const base = cn(
    'rounded-xl px-4 py-2.5 text-caption font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60',
    tone === 'dark'
      ? 'bg-white text-surface-ink hover:bg-primary-tint-strong'
      : 'bg-action-primary-pressed text-action-on-primary hover:bg-[var(--blue-800)]',
  )
  const quiet = cn(
    'rounded-xl px-4 py-2.5 text-caption font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60',
    tone === 'dark'
      ? 'bg-white/8 text-white hover:bg-white/12'
      : 'bg-surface-subtle text-text-primary hover:bg-primary-tint',
  )

  if (event.phase === 'cancelled' || event.phase === 'past') return null

  return (
    <div className="contents">
      {event.viewerRsvp === 'going' ? (
        <ResponseForm eventId={event.id} intent="not_going" action={action}>
          <button type="submit" disabled={pending} className={quiet}>
            You&apos;re going · Change
          </button>
        </ResponseForm>
      ) : event.viewerRsvp === 'waitlisted' ? (
        <ResponseForm eventId={event.id} intent="not_going" action={action}>
          <button type="submit" disabled={pending} className={quiet}>
            On waitlist · Leave
          </button>
        </ResponseForm>
      ) : event.viewerRsvp === 'offered' ? (
        <button type="button" onClick={() => setOfferDismissed(false)} className={base}>
          A spot is held for you
        </button>
      ) : (
        <ResponseForm
          eventId={event.id}
          intent={event.spotsLeft === 0 ? 'join_waitlist' : 'going'}
          action={action}
        >
          <button type="submit" disabled={pending} className={base}>
            {pending ? 'Saving…' : event.spotsLeft === 0 ? 'Join waitlist' : 'I’m going'}
          </button>
        </ResponseForm>
      )}

      {state.message ? (
        <span
          role={state.status === 'error' ? 'alert' : 'status'}
          className={cn(
            'w-full text-chip font-semibold',
            tone === 'dark'
              ? state.status === 'error'
                ? 'text-red-200'
                : 'text-surface-ink-muted'
              : state.status === 'error'
                ? 'text-state-danger-text'
                : 'text-state-success-text',
          )}
        >
          {state.message}
        </span>
      ) : null}

      {offerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5">
          <button
            type="button"
            aria-label="Close spot offer"
            className="absolute inset-0 cursor-default"
            onClick={() => setOfferDismissed(true)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`spot-title-${event.id}`}
            className="relative w-full max-w-[420px] rounded-2xl bg-surface-card p-6 text-text-primary shadow-hero"
          >
            <h2 id={`spot-title-${event.id}`} className="text-body font-extrabold">
              A spot opened — still want in?
            </h2>
            <p className="mt-2 text-caption leading-relaxed text-text-secondary">
              Nothing happens unless you say yes. Letting it go passes the spot along quietly.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <ResponseForm eventId={event.id} intent="pass_offer" action={action}>
                <button type="submit" disabled={pending} className={`${quiet} w-full`}>
                  Let it go
                </button>
              </ResponseForm>
              <ResponseForm eventId={event.id} intent="accept_offer" action={action}>
                <button type="submit" disabled={pending} className={`${base} w-full`}>
                  Yes — I&apos;m in
                </button>
              </ResponseForm>
            </div>
            <button
              type="button"
              onClick={() => setOfferDismissed(true)}
              className="mt-3 w-full rounded-lg px-3 py-2 text-chip font-semibold text-text-muted hover:bg-surface-subtle"
            >
              Decide later — the spot holds for a day
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ResponseForm({
  eventId,
  intent,
  action,
  children,
}: {
  eventId: string
  intent: 'going' | 'not_going' | 'join_waitlist' | 'accept_offer' | 'pass_offer'
  action: (payload: FormData) => void
  children: React.ReactNode
}) {
  return (
    <form action={action} className="contents">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="intent" value={intent} />
      {children}
    </form>
  )
}
