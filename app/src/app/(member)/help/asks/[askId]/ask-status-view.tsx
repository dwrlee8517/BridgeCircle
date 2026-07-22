'use client'

import { formatDistanceToNowStrict } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type {
  HelpAskDetail,
  HelpOffer,
  HelpReportReason,
  IdentifiedHelpProfile,
} from '@/lib/help/contracts'
import { cn } from '@/lib/utils'
import { useMemberShellHeader } from '../../../member-shell-header-context'
import { writeHelpQuestionDraft } from '../../help-draft-storage'
import { daysUntil } from '../ask-presentation'
import { useHelpRealtimeRefresh } from '../use-help-realtime-refresh'

type OpenDialog =
  | { kind: 'retract' }
  | { kind: 'decline'; offer: HelpOffer }
  | { kind: 'report'; offer: HelpOffer }
  | null

type CommandResponse = {
  status?: string
  conversationId?: string | null
  error?: string
}

const REPORT_REASONS: Array<{ value: HelpReportReason; label: string }> = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Something else' },
]

export function AskStatusView({
  detail,
  avatarUrls,
  membershipId,
  organizationName,
  graduationYear,
}: {
  detail: HelpAskDetail
  avatarUrls: Record<string, string>
  membershipId: string
  organizationName: string
  graduationYear: number | null
}) {
  const router = useRouter()
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const [declineText, setDeclineText] = useState('')
  const [reportReason, setReportReason] = useState<HelpReportReason>('harassment')
  const [reportNote, setReportNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useMemberShellHeader({
    title: 'Your ask',
    backHref: '/help',
    backLabel: 'Back to Help',
    hideNotifications: true,
  })
  useHelpRealtimeRefresh()

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3_800)
  }

  function recoverTo(path: '/help' | '/help/ask-circle') {
    writeHelpQuestionDraft(window.sessionStorage, membershipId, detail.question)
    router.push(path)
  }

  function openDecline(offer: HelpOffer) {
    setDeclineText('Went another way on this one — thank you for raising your hand.')
    setDialog({ kind: 'decline', offer })
  }

  function openReport(offer: HelpOffer) {
    setReportReason('harassment')
    setReportNote('')
    setDialog({ kind: 'report', offer })
  }

  async function retractAsk() {
    if (busy) return
    setBusy('retract')
    try {
      const result = await postCommand(`/api/help/asks/${detail.id}/retract`)
      if (result.status !== 'retracted' && result.status !== 'already_decided') {
        throw new Error('retract_unavailable')
      }
      setDialog(null)
      showToast('Retracted quietly — the slot is free.')
      router.refresh()
    } catch {
      showToast('Couldn’t retract that just now. Nothing changed — please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function acceptOffer(offer: HelpOffer) {
    if (busy) return
    setBusy(offer.id)
    const first = firstName(offer.helper.displayName)
    try {
      const result = await postCommand(`/api/help/offers/${offer.id}/decision`, {
        decision: 'accept',
        openingMessage: `Thanks for offering, ${first} — I’d love to connect.`,
        clientNonce: crypto.randomUUID(),
      })
      if (result.status !== 'accepted' && result.status !== 'already_decided') {
        throw new Error('accept_unavailable')
      }
      if (result.conversationId) {
        router.push(`/messages/${result.conversationId}`)
      } else {
        showToast('That offer was already handled. Refreshing the latest status.')
        router.refresh()
      }
    } catch {
      showToast('Couldn’t accept that offer just now. Nothing changed — please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function declineOffer() {
    if (dialog?.kind !== 'decline' || busy) return
    const note = declineText.trim()
    if (!note) {
      showToast('The note can’t be empty — it’s what softens the no.')
      return
    }
    setBusy(dialog.offer.id)
    try {
      const result = await postCommand(`/api/help/offers/${dialog.offer.id}/decision`, {
        decision: 'decline',
        declineReasonCode: 'went_another_direction',
        declineNote: note,
      })
      if (result.status !== 'declined' && result.status !== 'already_decided') {
        throw new Error('decline_unavailable')
      }
      setDialog(null)
      showToast(
        `Your note went to ${firstName(dialog.offer.helper.displayName)} — declined kindly.`,
      )
      router.refresh()
    } catch {
      showToast('Couldn’t send that note just now. It’s still here — please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function reportOffer() {
    if (dialog?.kind !== 'report' || busy) return
    setBusy(dialog.offer.id)
    try {
      const result = await postCommand(`/api/help/offers/${dialog.offer.id}/report`, {
        reason: reportReason,
        note: reportNote.trim() || null,
      })
      if (result.status !== 'submitted') throw new Error('report_unavailable')
      setDialog(null)
      showToast('Thanks — we’ll look into it privately.')
    } catch {
      showToast('Couldn’t send that report just now. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const closingDays =
    detail.status === 'waiting' || detail.status === 'open' ? daysUntil(detail.expiresAt) : null
  const warningDays = closingDays !== null && closingDays <= 3 ? closingDays : null
  const canRetract = detail.status === 'waiting' || detail.status === 'open'

  return (
    <div className="min-h-full bg-[image:var(--wash-page)]">
      <div className="mx-auto w-full max-w-[732px] px-4 py-7 sm:px-6.5 sm:pb-10">
        <section className="rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={detail.status} />
            {warningDays !== null ? (
              <span className="rounded-full bg-[var(--closing-soon-tint)] px-2 py-0.5 text-kicker font-bold text-[var(--closing-soon-text)]">
                {warningDays === 0
                  ? 'Closes today'
                  : `${warningDays} ${warningDays === 1 ? 'day' : 'days'} left before this ask closes`}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-h1 leading-[1.35] font-bold tracking-tight text-[var(--text-primary)]">
            “{detail.question}”
          </h1>
          <p className="mt-2.5 text-xs leading-relaxed font-medium text-[var(--grey-600)]">
            {reachLine(detail, organizationName)}
          </p>
          {detail.kind === 'circle' && detail.anonymousUntilAccepted ? (
            <p className="mt-1.5 text-xs leading-relaxed font-medium text-[var(--text-faint)]">
              Posted without your name — helpers see “A member
              {graduationYear ? ` · Class of ’${String(graduationYear).slice(-2)}` : ''}”. Your name
              goes only to the helper you accept.
            </p>
          ) : null}
          {canRetract ? (
            <button
              type="button"
              onClick={() => setDialog({ kind: 'retract' })}
              className="mt-3.5 inline-flex min-h-11 items-center justify-center rounded-[11px] bg-card px-4 text-xs font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Retract this ask
            </button>
          ) : null}
        </section>

        {detail.kind === 'direct' && detail.status !== 'retracted' && detail.recipient ? (
          <DirectStatusCard
            detail={detail}
            recipient={detail.recipient}
            avatarUrls={avatarUrls}
            onAskSomeoneElse={() => recoverTo('/help')}
            onOpenCircle={() => recoverTo('/help/ask-circle')}
          />
        ) : null}

        {detail.kind === 'circle' && detail.status === 'closed' ? (
          <ClosedCircleRecovery
            onRest={() => router.push('/help/asks')}
            onRenew={() => recoverTo('/help/ask-circle')}
          />
        ) : null}

        {detail.kind === 'circle' &&
        detail.status !== 'closed' &&
        detail.status !== 'retracted' &&
        detail.offers.length > 0 ? (
          <section aria-labelledby="offers-title" className="mt-5.5">
            <div className="mb-2.5 flex items-baseline gap-2">
              <h2
                id="offers-title"
                className="text-body-lg font-bold tracking-tight text-[var(--text-primary)]"
              >
                Offers
              </h2>
              <p className="text-xs font-semibold text-[var(--text-faint)]">you hold the accept</p>
            </div>
            <div className="grid gap-2.5">
              {detail.offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  askStatus={detail.status}
                  conversationId={detail.conversationId}
                  avatarUrls={avatarUrls}
                  busy={busy === offer.id}
                  onAccept={() => void acceptOffer(offer)}
                  onDecline={() => openDecline(offer)}
                  onReport={() => openReport(offer)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {detail.kind === 'circle' && detail.status === 'open' && detail.offers.length === 0 ? (
          <CalmMessage>
            No offers yet — your ask is in front of good matches. You’ll only hear from members who
            offer.
          </CalmMessage>
        ) : null}

        {detail.status === 'retracted' ? (
          <CalmMessage>
            You retracted this ask — anything pending disappeared quietly, and the slot is free.
          </CalmMessage>
        ) : null}

        {detail.status === 'resolved' ? (
          <CalmMessage>
            {detail.outcomeNote
              ? `Resolved — ${detail.outcomeNote}`
              : 'Resolved — the conversation stays available in Messages.'}
          </CalmMessage>
        ) : null}
      </div>

      <RetractDialog
        open={dialog?.kind === 'retract'}
        busy={busy === 'retract'}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={() => void retractAsk()}
      />
      <DeclineDialog
        offer={dialog?.kind === 'decline' ? dialog.offer : null}
        value={declineText}
        busy={dialog?.kind === 'decline' && busy === dialog.offer.id}
        onChange={setDeclineText}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={() => void declineOffer()}
      />
      <ReportDialog
        offer={dialog?.kind === 'report' ? dialog.offer : null}
        reason={reportReason}
        note={reportNote}
        busy={dialog?.kind === 'report' && busy === dialog.offer.id}
        onReasonChange={setReportReason}
        onNoteChange={setReportNote}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={() => void reportOffer()}
      />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-[var(--grey-900)] px-5 py-3 text-center text-body-sm font-semibold text-white shadow-[0_10px_30px_var(--scrim)] md:bottom-7"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function DirectStatusCard({
  detail,
  recipient,
  avatarUrls,
  onAskSomeoneElse,
  onOpenCircle,
}: {
  detail: HelpAskDetail
  recipient: IdentifiedHelpProfile
  avatarUrls: Record<string, string>
  onAskSomeoneElse(): void
  onOpenCircle(): void
}) {
  const first = firstName(recipient.displayName)
  const recoverable = detail.status === 'declined' || detail.status === 'closed'
  return (
    <section className="mt-3.5 rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-4.5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-5.5">
      <p className="text-kicker font-bold tracking-label text-[var(--text-faint)] uppercase">
        Sent to
      </p>
      <div className="mt-3 flex items-center gap-3">
        <ProfileAvatar profile={recipient} avatarUrls={avatarUrls} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <strong className="text-sm font-bold text-[var(--text-primary)]">
              {recipient.displayName}
            </strong>
            {recipient.graduationYear ? (
              <span className="text-kicker font-semibold text-[var(--text-faint)]">
                ’{String(recipient.graduationYear).slice(-2)}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed font-medium text-[var(--grey-600)]">
            {directStateLine(detail, first)}
          </p>
        </div>
        {detail.status === 'waiting' ? (
          <span className="shrink-0 rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-kicker font-bold text-[var(--text-secondary)]">
            Waiting
          </span>
        ) : null}
      </div>

      {detail.status === 'declined' && detail.declineNote ? (
        <div className="mt-3 rounded-xl bg-[var(--surface-inset)] px-4 py-3.25">
          <p className="text-kicker font-bold text-[var(--text-faint)]">{first}’s note</p>
          <p className="mt-1.5 text-body-sm leading-[1.6] font-medium text-[var(--text-primary)]">
            “{detail.declineNote}”
          </p>
        </div>
      ) : null}

      {detail.status === 'closed' ? (
        <div className="mt-3 rounded-xl bg-[var(--surface-inset)] px-4 py-3.25">
          <p className="text-body-sm leading-[1.6] font-medium text-[var(--text-primary)]">
            No fault on either side — sometimes the timing’s just off. The pending item disappeared
            quietly for {first}, and your slot is free.
          </p>
        </div>
      ) : null}

      {recoverable ? (
        <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onAskSomeoneElse}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-card px-4 text-body-sm font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Ask someone else
          </button>
          <button
            type="button"
            onClick={onOpenCircle}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] px-4 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Open it to the circle
          </button>
        </div>
      ) : null}

      {(detail.status === 'accepted' || detail.status === 'resolved') && detail.conversationId ? (
        <Link
          href={`/messages/${detail.conversationId}`}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--blue-50)] px-4 text-xs font-bold text-[var(--action-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Thread started in Messages →
        </Link>
      ) : null}
    </section>
  )
}

function ClosedCircleRecovery({ onRest, onRenew }: { onRest(): void; onRenew(): void }) {
  return (
    <section className="mt-3.5 rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-5 py-5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:px-6">
      <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
        Your ask has closed — nothing answered it this time.
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed font-medium text-[var(--grey-600)]">
        No fault — sometimes the timing’s just off. Want to renew it, or let it rest?
      </p>
      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRest}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-card px-4 text-body-sm font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Let it rest
        </button>
        <button
          type="button"
          onClick={onRenew}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] px-4 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Renew this ask
        </button>
      </div>
    </section>
  )
}

function OfferCard({
  offer,
  askStatus,
  conversationId,
  avatarUrls,
  busy,
  onAccept,
  onDecline,
  onReport,
}: {
  offer: HelpOffer
  askStatus: HelpAskDetail['status']
  conversationId: string | null
  avatarUrls: Record<string, string>
  busy: boolean
  onAccept(): void
  onDecline(): void
  onReport(): void
}) {
  const first = firstName(offer.helper.displayName)
  const pending = askStatus === 'open' && offer.status === 'pending'
  return (
    <article className="rounded-2xl bg-[image:var(--surface-card-elevated)] px-4.5 py-4 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
      <div className="flex items-center gap-3">
        <ProfileAvatar profile={offer.helper} avatarUrls={avatarUrls} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <strong className="text-sm font-bold text-[var(--text-primary)]">
              {offer.helper.displayName}
            </strong>
            {offer.helper.graduationYear ? (
              <span className="text-kicker font-semibold text-[var(--text-faint)]">
                ’{String(offer.helper.graduationYear).slice(-2)}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs font-medium text-[var(--grey-600)]">
            {offer.helper.headline ?? 'Offered to help'}
          </p>
        </div>
      </div>
      <p className="mt-3 text-body-sm leading-[1.6] font-medium text-[var(--text-primary)]">
        “{offer.offerNote}”
      </p>

      {pending ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={busy}
            onClick={onReport}
            className="inline-flex min-h-11 items-center justify-center rounded-[11px] bg-transparent px-3 text-xs font-semibold text-[var(--text-faint)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50 sm:min-h-10"
          >
            Report
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="inline-flex min-h-11 items-center justify-center rounded-[11px] bg-card px-4 text-xs font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50 sm:min-h-10"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] bg-[image:var(--gradient-primary-btn)] px-4 text-xs font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60 sm:min-h-10"
          >
            {busy ? 'Starting…' : 'Accept — start the thread'}
          </button>
        </div>
      ) : null}

      {offer.status === 'accepted' && conversationId ? (
        <Link
          href={`/messages/${conversationId}`}
          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-[9px] bg-[var(--blue-50)] px-3 text-xs font-bold text-[var(--action-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Thread started in Messages →
        </Link>
      ) : null}
      {offer.status === 'closed' ? (
        <p className="mt-3 text-xs font-semibold text-[var(--text-faint)]">
          This ask has been answered — {first} got the no-fault closure.
        </p>
      ) : null}
      {offer.status === 'declined' ? (
        <p className="mt-3 text-xs font-semibold text-[var(--text-faint)]">
          Declined kindly — your note went to {first}.
        </p>
      ) : null}
    </article>
  )
}

function CalmMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3.5 rounded-2xl bg-[image:var(--surface-card-elevated)] px-5 py-5 text-center text-xs leading-relaxed font-semibold text-[var(--text-faint)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
      {children}
    </p>
  )
}

function StatusPill({ status }: { status: HelpAskDetail['status'] }) {
  const label = {
    waiting: 'Open',
    open: 'Open',
    accepted: 'Answered',
    declined: 'Declined',
    retracted: 'Retracted',
    resolved: 'Resolved',
    closed: 'Closed',
  }[status]
  const positive = status === 'accepted' || status === 'resolved'
  const active = status === 'waiting' || status === 'open'
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-kicker font-bold',
        active && 'bg-[var(--blue-50)] text-[var(--blue-600)]',
        positive && 'bg-[var(--give-tint)] text-[var(--action-give-text)]',
        !active && !positive && 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
      )}
    >
      {label}
    </span>
  )
}

function ProfileAvatar({
  profile,
  avatarUrls,
  size = 'default',
}: {
  profile: IdentifiedHelpProfile
  avatarUrls: Record<string, string>
  size?: 'default' | 'lg'
}) {
  const url = profile.avatarPath ? avatarUrls[profile.avatarPath] : undefined
  return (
    <Avatar className={size === 'lg' ? 'size-[42px]' : 'size-[38px]'}>
      {url ? <AvatarImage src={url} alt="" /> : null}
      <AvatarFallback seed={profile.userId} className="text-xs font-bold">
        {initials(profile.displayName)}
      </AvatarFallback>
    </Avatar>
  )
}

function RetractDialog({
  open,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  busy: boolean
  onOpenChange(open: boolean): void
  onConfirm(): void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--scrim)] backdrop-blur-none"
        className="max-w-[420px] gap-0 rounded-[20px] p-6 [box-shadow:0_24px_60px_rgb(25_31_40_/_0.25)]"
      >
        <DialogTitle className="text-body-lg leading-tight font-bold tracking-tight">
          Retract this ask?
        </DialogTitle>
        <DialogDescription className="mt-2 text-body-sm leading-[1.6] font-medium text-[var(--text-secondary)]">
          It disappears quietly — anything pending vanishes, no one is notified, and the slot frees
          up. You can always ask again.
        </DialogDescription>
        <div className="mt-4.5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[var(--surface-subtle)] px-4 text-body-sm font-bold text-[var(--text-primary)] hover:bg-[var(--grey-200)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] px-4 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? 'Retracting…' : 'Retract'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeclineDialog({
  offer,
  value,
  busy,
  onChange,
  onOpenChange,
  onConfirm,
}: {
  offer: HelpOffer | null
  value: string
  busy: boolean
  onChange(value: string): void
  onOpenChange(open: boolean): void
  onConfirm(): void
}) {
  const first = offer ? firstName(offer.helper.displayName) : ''
  return (
    <Dialog open={Boolean(offer)} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--scrim)] backdrop-blur-none"
        className="max-w-[440px] gap-0 rounded-[20px] p-6 [box-shadow:0_24px_60px_rgb(25_31_40_/_0.25)]"
      >
        <DialogTitle className="text-body-lg leading-tight font-bold tracking-tight">
          Decline {first}’s offer
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-xs leading-relaxed font-medium text-[var(--grey-600)]">
          {first} gets a cushioned note, never a bare no.
        </DialogDescription>
        <label htmlFor="offer-decline-note" className="sr-only">
          Note to {first}
        </label>
        <textarea
          id="offer-decline-note"
          rows={3}
          maxLength={2_000}
          value={value}
          disabled={busy}
          onChange={(event) => onChange(event.target.value)}
          className="mt-3.5 w-full resize-none rounded-xl border-0 bg-card px-3.5 py-3 text-body-sm leading-[1.55] font-medium text-[var(--text-primary)] shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)] disabled:opacity-60"
        />
        <p className="mt-2 text-kicker font-medium text-[var(--text-faint)]">
          A ready draft — make it yours.
        </p>
        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-card px-4 text-body-sm font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] px-4 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send note & decline'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReportDialog({
  offer,
  reason,
  note,
  busy,
  onReasonChange,
  onNoteChange,
  onOpenChange,
  onConfirm,
}: {
  offer: HelpOffer | null
  reason: HelpReportReason
  note: string
  busy: boolean
  onReasonChange(reason: HelpReportReason): void
  onNoteChange(note: string): void
  onOpenChange(open: boolean): void
  onConfirm(): void
}) {
  const first = offer ? firstName(offer.helper.displayName) : ''
  return (
    <Dialog open={Boolean(offer)} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--scrim)] backdrop-blur-none"
        className="max-w-[400px] gap-0 rounded-[20px] p-6 [box-shadow:0_24px_60px_rgb(25_31_40_/_0.25)]"
      >
        <DialogTitle className="text-body-lg leading-tight font-bold tracking-tight">
          Report {first}’s offer
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-xs leading-relaxed font-medium text-[var(--grey-600)]">
          This goes to the moderation team, privately. {first} won’t know.
        </DialogDescription>
        <fieldset className="mt-3.5 grid gap-1">
          <legend className="sr-only">Reason for report</legend>
          {REPORT_REASONS.map((item) => {
            const selected = reason === item.value
            return (
              <label
                key={item.value}
                className={cn(
                  'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[10px] px-3 text-xs text-[var(--text-secondary)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring',
                  selected
                    ? 'bg-[var(--selected-tint)] font-bold text-[var(--text-primary)] shadow-[var(--selected-accent)]'
                    : 'font-semibold hover:bg-[var(--row-hover)]',
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={item.value}
                  checked={selected}
                  disabled={busy}
                  onChange={() => onReasonChange(item.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    'size-3.5 shrink-0 rounded-full bg-card',
                    selected
                      ? 'border-4 border-[var(--action-primary)]'
                      : 'shadow-[var(--ring-outline)]',
                  )}
                />
                {item.label}
              </label>
            )
          })}
        </fieldset>
        <label htmlFor="offer-report-note" className="sr-only">
          Additional report details
        </label>
        <textarea
          id="offer-report-note"
          rows={2}
          maxLength={4_000}
          value={note}
          disabled={busy}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Anything that helps us look into it (optional)"
          className="mt-2.5 w-full resize-none rounded-xl border-0 bg-card px-3.5 py-3 text-body-sm leading-[1.55] font-medium text-[var(--text-primary)] shadow-[var(--ring-outline)] outline-none placeholder:text-[var(--text-faint)] focus-visible:shadow-[0_0_0_2px_var(--focus-ring)] disabled:opacity-60"
        />
        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-card px-4 text-body-sm font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[image:var(--gradient-primary-btn)] px-4 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send report'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

async function postCommand(url: string, body?: object): Promise<CommandResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const result = (await response.json().catch(() => ({}))) as CommandResponse
  if (!response.ok) throw new Error(result.error ?? 'command_unavailable')
  return result
}

function reachLine(detail: HelpAskDetail, organizationName: string) {
  const sent = formatDistanceToNowStrict(new Date(detail.createdAt), { addSuffix: true })
  if (detail.kind === 'direct') {
    return `Sent to ${detail.recipient?.displayName ?? 'a member'} · ${sent}`
  }
  return detail.reach === 'organization'
    ? `Public — anyone at ${organizationName} can find it · posted ${sent}`
    : `Private — suggested to good matches, browsable by no one · posted ${sent}`
}

function directStateLine(detail: HelpAskDetail, first: string) {
  const sent = formatDistanceToNowStrict(new Date(detail.createdAt), { addSuffix: true })
  if (detail.status === 'waiting') return `Waiting — no read receipts, just patience. Sent ${sent}.`
  if (detail.status === 'declined') return 'Declined, with a note — the ask closed early.'
  if (detail.status === 'closed') return `This ask has closed — ${first} wasn’t able to get to it.`
  if (detail.status === 'accepted' || detail.status === 'resolved') {
    return 'Answered — your conversation is in Messages.'
  }
  return 'This ask has ended.'
}

function firstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] ?? displayName
}

function initials(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
