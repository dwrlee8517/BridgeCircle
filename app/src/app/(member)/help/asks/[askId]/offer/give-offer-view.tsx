'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowUp, Check, CircleAlert, Sparkle } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { HelpAskDetail } from '@/lib/help/contracts'
import { getInitials } from '@/lib/utils'
import { useOptionalMemberShellHeader } from '../../../../member-shell-header-context'
import { requestHelpAssistance } from '../../../help-assistance-client'
import { HelpReportDialog } from '../../../help-report-dialog'
import { buildOfferDraft, reviseHelperReplyFallback } from '../../../helper-response-draft'

type OfferResponse = {
  status?: 'created' | 'existing' | 'idempotency_conflict' | 'invalid_input' | 'not_available'
  offerId?: string | null
  error?: string
}

export function GiveOfferView({
  detail,
  avatarUrl,
  viewerUserId,
  returnHref = '/help?mode=give',
  returnLabel = 'Back to Give help',
  onboarding = false,
}: {
  detail: HelpAskDetail
  avatarUrl: string | null
  viewerUserId: string
  returnHref?: string
  returnLabel?: string
  onboarding?: boolean
}) {
  const askerName = detail.asker.identity === 'identified' ? detail.asker.displayName : null
  const initialDraft = buildOfferDraft(askerName, detail.question)
  const existingOffer = detail.offers.find((offer) => offer.helper.userId === viewerUserId) ?? null
  const [offerText, setOfferText] = useState(existingOffer?.offerNote ?? initialDraft)
  const [instruction, setInstruction] = useState('')
  const [assisting, setAssisting] = useState(false)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(Boolean(existingOffer))
  const [error, setError] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const requestIdRef = useRef<string | null>(null)

  useOptionalMemberShellHeader({
    title: 'Offer help',
    backHref: returnHref,
    backLabel: returnLabel,
    hideNotifications: true,
  })

  async function revise(instructionText: string) {
    const cleaned = instructionText.trim()
    if (!cleaned || assisting || !offerText.trim()) return
    setInstruction('')
    setError(null)
    const fallback = reviseHelperReplyFallback(offerText, cleaned, initialDraft)
    if (/^(start over|reset)$/i.test(cleaned)) {
      setOfferText(fallback)
      requestIdRef.current = null
      return
    }
    setAssisting(true)
    const controller = new AbortController()
    const result = await requestHelpAssistance({
      task: 'offer_note',
      currentText: offerText,
      context: [detail.question, `Requested revision: ${cleaned}`],
      fallbackText: fallback,
      signal: controller.signal,
    })
    if (result.text) {
      setOfferText(result.text)
      requestIdRef.current = null
    } else {
      setError('The writing assistant is unavailable. Your offer is still safe and editable.')
    }
    setAssisting(false)
  }

  async function submitOffer() {
    if (!offerText.trim() || pending) {
      if (!offerText.trim()) setError('Write a short note so the member knows how you can help.')
      return
    }
    setPending(true)
    setError(null)
    requestIdRef.current ??= crypto.randomUUID()
    try {
      const response = await fetch(`/api/help/asks/${detail.id}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerNote: offerText.trim(),
          clientRequestId: requestIdRef.current,
        }),
        cache: 'no-store',
      })
      const result = (await response.json()) as OfferResponse
      if (!response.ok) throw new Error(result.error ?? 'offer_failed')
      if (result.status === 'created' || result.status === 'existing') {
        setSent(true)
        return
      }
      if (result.status === 'idempotency_conflict') {
        requestIdRef.current = crypto.randomUUID()
        setError('That retry no longer matches this draft. Review it once, then send again.')
      } else {
        setError('This ask is no longer available for offers.')
      }
    } catch {
      setError('Couldn’t send your offer. Check your connection — the draft is still here.')
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <OfferSuccess
        detail={detail}
        askerName={askerName}
        returnHref={returnHref}
        returnLabel={returnLabel}
      />
    )
  }

  const source =
    detail.reach === 'matched' ? 'Matched to your experience' : 'Open to members in your circle'

  return (
    <div className="min-h-full bg-[image:var(--wash-page)]">
      <section className="bg-[image:var(--wash-give)] px-4 py-5 sm:px-8 sm:py-6">
        <div className="mx-auto max-w-[1140px]">
          <span className="inline-flex rounded-full bg-[var(--give-tint-weak)] px-2.5 py-1 text-kicker font-bold text-[var(--action-give-text)]">
            {source}
          </span>
          <h1 className="mt-3 max-w-[800px] text-page-title leading-tight font-bold tracking-display text-[var(--text-primary)]">
            “{detail.question}”
          </h1>
          <div className="mt-4 flex items-center gap-2.5">
            <Avatar className="size-10 shadow-[var(--ring-avatar)]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback
                seed={
                  detail.asker.identity === 'identified'
                    ? detail.asker.userId
                    : `anonymous:${detail.asker.graduationYear ?? 'member'}`
                }
              >
                {detail.asker.identity === 'identified'
                  ? getInitials(detail.asker.displayName)
                  : 'AM'}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="flex flex-wrap items-baseline gap-2">
                {detail.asker.identity === 'identified' && onboarding ? (
                  <span className="text-body-sm font-bold text-[var(--text-primary)]">
                    {detail.asker.displayName}
                  </span>
                ) : detail.asker.identity === 'identified' ? (
                  <Link
                    href={`/profile/${detail.asker.userId}`}
                    className="text-body-sm font-bold text-[var(--text-primary)] hover:text-[var(--blue-600)] hover:underline"
                  >
                    {detail.asker.displayName}
                  </Link>
                ) : (
                  <span className="text-body-sm font-bold text-[var(--text-primary)]">
                    A member
                  </span>
                )}
                {detail.asker.graduationYear ? (
                  <span className="text-xs font-semibold text-[var(--text-faint)]">
                    Class of ’{String(detail.asker.graduationYear).slice(-2)}
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-[var(--text-faint)]">
                Asked {formatDistanceToNow(new Date(detail.createdAt), { addSuffix: true })} · open
                ask
              </span>
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1140px] gap-3 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_398px] lg:px-6.5">
        <div className="space-y-3">
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
          {!onboarding ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="min-h-9 rounded-lg px-2 text-xs font-semibold text-[var(--text-faint)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Report this ask
              </button>
            </div>
          ) : null}

          <section className="flex min-h-[430px] flex-col overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4.5 py-3.25">
              <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-[var(--action-give)] text-white">
                <Sparkle aria-hidden className="size-3" fill="currentColor" stroke="none" />
              </span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">Refine with AI</span>
              <span className="ml-auto hidden text-kicker font-medium text-[var(--text-faint)] sm:inline">
                Every change lands in your offer →
              </span>
            </div>
            <div className="flex-1 px-4.5 py-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--action-give)] text-white">
                  <Sparkle aria-hidden className="size-3.5" fill="currentColor" stroke="none" />
                </span>
                <p className="max-w-[560px] rounded-[14px] bg-[var(--surface-subtle)] px-4 py-3 text-body-sm leading-[1.6] font-medium text-[var(--text-secondary)]">
                  I drafted a first line from the ask — it’s on the right, and only the member will
                  see it. Make it warmer, shorter, or tell me what to add.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 px-4.5 pb-2.5">
              {['Warmer', 'Shorter', 'Add when I’m free', 'Start over'].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled={assisting}
                  onClick={() => void revise(label)}
                  className="min-h-9 rounded-full bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--grey-200)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void revise(instruction)
              }}
              className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-4 py-3"
            >
              <label htmlFor="offer-ai-instruction" className="sr-only">
                Tell the writing assistant what to change
              </label>
              <input
                id="offer-ai-instruction"
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                maxLength={800}
                placeholder="Tell the AI what to change…"
                className="min-h-11 min-w-0 flex-1 rounded-full border-0 bg-card px-4 text-body-sm font-medium shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
              />
              <button
                type="submit"
                aria-label="Send to writing assistant"
                disabled={assisting}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--action-give)] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
              >
                <ArrowUp aria-hidden className="size-[17px]" />
              </button>
            </form>
          </section>
        </div>

        <aside className="h-fit rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] p-4.5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] lg:sticky lg:top-4">
          <label
            htmlFor="offer-note"
            className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase"
          >
            Your offer {askerName ? `to ${askerName.split(/\s+/)[0]}` : ''}
          </label>
          <textarea
            id="offer-note"
            value={offerText}
            onChange={(event) => {
              setOfferText(event.target.value)
              setError(null)
              requestIdRef.current = null
            }}
            maxLength={4_000}
            rows={9}
            className="mt-3 w-full resize-none rounded-xl border-0 bg-card px-3.5 py-3 text-body-sm leading-[1.65] font-medium shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
          />
          <p className="mt-2 text-kicker leading-relaxed font-medium text-[var(--text-faint)]">
            AI keeps this up to date as you revise — or edit it directly. Offers are private; only
            the asker sees yours.
          </p>
          {error ? (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 text-xs font-semibold text-[var(--error)]"
            >
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
            <p className="flex-1 text-xs leading-relaxed font-medium text-[var(--text-faint)]">
              If it’s accepted, the conversation starts in Messages. You’ll hear either way.
            </p>
            <button
              type="button"
              onClick={() => void submitOffer()}
              disabled={pending || assisting}
              className="min-h-11 shrink-0 rounded-xl bg-[var(--action-give)] px-6 text-body-sm font-bold text-white shadow-[0_4px_12px_rgb(11_138_87_/_0.25)] hover:bg-[var(--action-give-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-55"
            >
              {pending ? 'Sending…' : 'Send offer'}
            </button>
          </div>
        </aside>
      </main>

      <HelpReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        endpoint={`/api/help/asks/${detail.id}/report`}
      />
    </div>
  )
}

function OfferSuccess({
  detail,
  askerName,
  returnHref,
  returnLabel,
}: {
  detail: HelpAskDetail
  askerName: string | null
  returnHref: string
  returnLabel: string
}) {
  return (
    <div className="min-h-full bg-[image:var(--wash-page)] px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-[620px] rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-6 py-10 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        <span className="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-[var(--give-tint)] text-[var(--action-give-text)]">
          <Check aria-hidden className="size-5" />
        </span>
        <h1 className="mt-4 text-display-section font-bold text-[var(--text-primary)]">
          Your offer is in
        </h1>
        <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed font-medium text-[var(--text-secondary)]">
          {askerName ? `${askerName.split(/\s+/)[0]} can see` : 'The member can see'} your note now.
          If they accept, the conversation will open in Messages.
        </p>
        <p className="mx-auto mt-3 max-w-md rounded-xl bg-[var(--surface-inset)] px-4 py-3 text-xs leading-relaxed font-semibold text-[var(--text-secondary)]">
          “{detail.question}”
        </p>
        <Link
          href={returnHref}
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--action-give)] px-5 text-body-sm font-bold text-white"
        >
          {returnLabel}
        </Link>
      </section>
    </div>
  )
}
