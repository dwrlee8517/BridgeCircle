'use client'

import { useActionState, useRef, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [cancelOpen, setCancelOpen] = useState(false)
  const cancelTriggerRef = useRef<HTMLButtonElement>(null)
  const keepRsvpRef = useRef<HTMLButtonElement>(null)
  const passOfferRef = useRef<HTMLButtonElement>(null)
  const offerTriggerRef = useRef<HTMLButtonElement>(null)
  const offerOpen = event.viewerRsvp === 'offered' && !offerDismissed && state.status !== 'success'

  const base = cn(
    'rounded-xl px-4 py-2.5 text-caption font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60',
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
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <button
            ref={cancelTriggerRef}
            type="button"
            onClick={() => setCancelOpen(true)}
            className={quiet}
          >
            Cancel RSVP
          </button>
          <DialogContent
            className="w-full max-w-[420px] gap-0 rounded-2xl bg-surface-card p-6 text-text-primary shadow-hero"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              keepRsvpRef.current?.focus()
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              cancelTriggerRef.current?.focus()
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-body font-bold">Cancel your RSVP?</DialogTitle>
              <DialogDescription className="mt-2 text-caption leading-relaxed text-text-secondary">
                You will come off the attendee list. If the event is full, the next person will be
                offered the spot.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mx-0 mt-5 mb-0 grid grid-cols-2 gap-2 rounded-none border-0 bg-transparent p-0">
              <DialogClose asChild>
                <button
                  ref={keepRsvpRef}
                  type="button"
                  className="w-full rounded-xl bg-surface-subtle px-4 py-2.5 text-caption font-bold text-text-primary transition-colors hover:bg-primary-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  Keep RSVP
                </button>
              </DialogClose>
              <ResponseForm eventId={event.id} intent="not_going" action={action}>
                <button
                  type="submit"
                  disabled={pending}
                  onClick={() => setCancelOpen(false)}
                  className="w-full rounded-xl bg-state-danger px-4 py-2.5 text-caption font-bold text-white transition-colors hover:bg-state-danger/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60"
                >
                  {pending ? 'Cancelling…' : 'Cancel RSVP'}
                </button>
              </ResponseForm>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : event.viewerRsvp === 'waitlisted' ? (
        <ResponseForm eventId={event.id} intent="not_going" action={action}>
          <button type="submit" disabled={pending} className={quiet}>
            On waitlist · Leave
          </button>
        </ResponseForm>
      ) : event.viewerRsvp === 'offered' ? (
        <button
          ref={offerTriggerRef}
          type="button"
          onClick={() => setOfferDismissed(false)}
          className={base}
        >
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
        <Dialog open={offerOpen} onOpenChange={(open) => !open && setOfferDismissed(true)}>
          <DialogContent
            showCloseButton={false}
            className="w-full max-w-[420px] gap-0 rounded-2xl bg-surface-card p-6 text-text-primary shadow-hero"
            overlayClassName="bg-black/45"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              passOfferRef.current?.focus()
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              offerTriggerRef.current?.focus()
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-body font-bold">
                A spot opened — still want in?
              </DialogTitle>
              <DialogDescription className="mt-2 text-caption leading-relaxed text-text-secondary">
                Nothing happens unless you say yes. Letting it go passes the spot along quietly.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mx-0 mt-5 mb-0 grid grid-cols-2 gap-2 rounded-none border-0 bg-transparent p-0">
              <ResponseForm eventId={event.id} intent="pass_offer" action={action}>
                <button
                  type="submit"
                  ref={passOfferRef}
                  disabled={pending}
                  className="w-full rounded-xl bg-surface-subtle px-4 py-2.5 text-caption font-bold text-text-primary transition-colors hover:bg-primary-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60"
                >
                  Let it go
                </button>
              </ResponseForm>
              <ResponseForm eventId={event.id} intent="accept_offer" action={action}>
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-action-primary-pressed px-4 py-2.5 text-caption font-bold text-action-on-primary transition-colors hover:bg-[var(--blue-800)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60"
                >
                  Yes — I&apos;m in
                </button>
              </ResponseForm>
            </DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="mt-3 w-full rounded-lg px-3 py-2 text-chip font-semibold text-text-muted hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Decide later — the spot holds for a day
              </button>
            </DialogClose>
          </DialogContent>
        </Dialog>
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
