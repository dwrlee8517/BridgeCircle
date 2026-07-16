'use client'

import { Check, HandHeart, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, startTransition, useActionState, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getInitials } from '@/lib/utils'

type State = { error?: string }

type Classmate = {
  userId: string
  displayName: string
  headline: string | null
  graduationYear: number | null
}

type OpenAsk = {
  id: string
  question: string
  memberLine: string
  offered: boolean
}

type ConnectionResponse = {
  status?:
    | 'created'
    | 'existing'
    | 'incoming_pending'
    | 'already_connected'
    | 'not_available'
    | 'invalid_input'
    | 'idempotency_conflict'
  error?: string
}

export function StepSayHi({
  defaultQuestion,
  organizationId,
  classmates,
  openAsks,
  action,
}: {
  defaultQuestion: string
  organizationId: string
  classmates: Classmate[]
  openAsks: OpenAsk[]
  action: (state: State, formData: FormData) => Promise<State>
}) {
  const [state, formAction, finishing] = useActionState(action, {})
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [connecting, setConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const requestIds = useRef(new Map<string, string>())
  const allSelected = classmates.length > 0 && selected.size === classmates.length
  const pending = finishing || connecting

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const formData = new FormData(event.currentTarget)
    const hello = String(formData.get('helloNote') ?? '').trim() || null
    const recipients = classmates.filter((person) => selected.has(person.userId))
    setConnectionError(null)

    if (recipients.length > 0) {
      setConnecting(true)
      const outcomes = await Promise.all(
        recipients.map(async (person) => {
          const requestId = requestIds.current.get(person.userId) ?? crypto.randomUUID()
          requestIds.current.set(person.userId, requestId)
          try {
            const response = await fetch('/api/connections/requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientUserId: person.userId,
                originOrganizationId: organizationId,
                introMessage: hello,
                clientRequestId: requestId,
              }),
              cache: 'no-store',
            })
            const result = (await response.json()) as ConnectionResponse
            return {
              person,
              ok:
                response.ok &&
                ['created', 'existing', 'incoming_pending', 'already_connected'].includes(
                  result.status ?? '',
                ),
            }
          } catch {
            return { person, ok: false }
          }
        }),
      )
      setConnecting(false)

      const failed = outcomes.filter((outcome) => !outcome.ok)
      if (failed.length > 0) {
        setConnectionError(
          failed.length === 1
            ? `We couldn’t send the hello to ${failed[0].person.displayName}. Your other choices are safe; try once more.`
            : `We couldn’t send ${failed.length} of the hellos. Your successful choices are safe; try once more.`,
        )
        return
      }
    }

    startTransition(() => formAction(formData))
  }

  function toggle(userId: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
    setConnectionError(null)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="space-y-3 rounded-2xl bg-card p-5 shadow-[var(--ring-card),var(--shadow-card)]">
        <div>
          <h2 className="text-base font-bold">Anything you&apos;re trying to figure out?</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Keep a private draft ready for Help. Nothing is posted during onboarding.
          </p>
        </div>
        <Label htmlFor="question" className="sr-only">
          Something you may want help with
        </Label>
        <Textarea
          id="question"
          name="question"
          defaultValue={defaultQuestion}
          maxLength={600}
          placeholder="What do you need?"
          className="min-h-28"
        />
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-[var(--ring-card),var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--give-tint)] text-[var(--action-give-text)]">
            <HandHeart aria-hidden className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-bold">Want to help someone?</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Open asks from your circle. Every offer includes a private note you can review first.
            </p>
          </div>
        </div>
        {openAsks.length > 0 ? (
          <ul className="mt-4 divide-y divide-[var(--divider-row)]">
            {openAsks.map((ask) => (
              <li key={ask.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug font-semibold">
                    &ldquo;{ask.question}&rdquo;
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{ask.memberLine}</span>
                </span>
                {ask.offered ? (
                  <span className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[var(--give-tint)] px-3 text-xs font-bold text-[var(--action-give-hover)]">
                    <Check aria-hidden className="size-3.5" />
                    Offered
                  </span>
                ) : (
                  <Link
                    href={`/onboarding/offers/${ask.id}`}
                    className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-[var(--give-tint)] px-4 text-xs font-bold text-[var(--action-give-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    Offer
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl bg-[var(--surface-inset)] px-4 py-3 text-xs text-muted-foreground">
            No open asks fit this moment. You can browse Give help after setup.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-[var(--ring-card),var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--blue-50)] text-[var(--blue-600)]">
            <UserPlus aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold">Say hi to your class</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              One Connection request each — a quick hello, nothing formal.
            </p>
          </div>
          {classmates.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setSelected(
                  allSelected
                    ? new Set()
                    : new Set(classmates.map((classmate) => classmate.userId)),
                )
              }
              className="min-h-9 shrink-0 rounded-lg px-2 text-xs font-bold text-[var(--blue-700)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {allSelected ? 'Clear' : 'Select all'}
            </button>
          ) : null}
        </div>

        {classmates.length > 0 ? (
          <>
            <fieldset className="mt-4 divide-y divide-[var(--divider-row)]">
              <legend className="sr-only">Choose classmates to greet</legend>
              {classmates.map((person) => {
                const checked = selected.has(person.userId)
                return (
                  <label
                    key={person.userId}
                    className="flex cursor-pointer items-center gap-3 rounded-lg py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(person.userId)}
                      className="size-4 accent-primary"
                    />
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--avatar-2-bg)] text-xs font-bold text-[var(--avatar-2-fg)] shadow-[var(--ring-avatar)]">
                      {getInitials(person.displayName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{person.displayName}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {person.headline ??
                          (person.graduationYear
                            ? `Class of ${person.graduationYear}`
                            : 'In your school circle')}
                      </span>
                    </span>
                  </label>
                )
              })}
            </fieldset>
            <div className="mt-4 space-y-2">
              <Label htmlFor="helloNote">A short note to each person</Label>
              <Textarea
                id="helloNote"
                name="helloNote"
                rows={2}
                maxLength={2_000}
                defaultValue="Hi — I’m getting settled into BridgeCircle and wanted to say hello."
              />
              <p className="text-xs text-muted-foreground">
                You can edit this once. It is sent privately to each person you select.
              </p>
            </div>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-[var(--surface-inset)] px-4 py-3 text-xs text-muted-foreground">
            No classmates are available to greet right now. You can explore People after setup.
          </p>
        )}
      </section>

      {connectionError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {connectionError}
        </p>
      ) : state.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full bg-[var(--blue-700)] text-white hover:bg-[var(--blue-800)]"
        disabled={pending}
      >
        {connecting
          ? `Sending ${selected.size} ${selected.size === 1 ? 'hello' : 'hellos'}…`
          : finishing
            ? 'Finishing…'
            : selected.size > 0
              ? `Send ${selected.size} ${selected.size === 1 ? 'hello' : 'hellos'} and finish`
              : 'Finish setup'}
      </Button>
      <p className="text-center text-xs text-[var(--text-secondary)]">
        Every choice here is optional. You can change your mind later.
      </p>
    </form>
  )
}
