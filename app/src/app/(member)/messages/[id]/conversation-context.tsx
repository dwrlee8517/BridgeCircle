'use client'

import { CircleCheck, Link2, ShieldAlert, UserMinus, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ConversationDetail } from '@/lib/conversations/contracts'
import { cn, getInitials } from '@/lib/utils'

export function ConversationContext({
  conversation,
  avatarUrl,
  resolved,
  outcomeSharing,
  disconnected,
  connectionRequestState,
  actionPending,
  actionError,
  onResolve,
  onOutcomeSharingChange,
  onRequestConnection,
  onDisconnect,
  onBlock,
}: {
  conversation: ConversationDetail
  avatarUrl: string | null
  resolved: boolean
  outcomeSharing: NonNullable<ConversationDetail['askContext']>['outcomeSharing'] | null
  disconnected: boolean
  connectionRequestState: 'idle' | 'pending' | 'sent'
  actionPending: boolean
  actionError: string | null
  onResolve(): void
  onOutcomeSharingChange(shareStory: boolean, shareIdentity: boolean): void
  onRequestConnection(): void
  onDisconnect(): void
  onBlock(): void
}) {
  const counterpart = conversation.counterpart
  const isConnected = conversation.isConnected && !disconnected
  const relationship = isConnected
    ? 'In your circle'
    : conversation.connectionState === 'incoming_pending'
      ? 'Connection request waiting on you'
      : conversation.connectionState === 'outgoing_pending' || connectionRequestState === 'sent'
        ? 'Connection request sent'
        : 'Not in your circle'
  const work = [counterpart.currentTitle, counterpart.currentEmployer].filter(Boolean).join(' · ')

  return (
    <div className="space-y-5 px-5 py-6">
      <div className="text-center">
        <Avatar className="mx-auto size-16 shadow-[var(--ring-avatar)]">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-body-lg">
            {getInitials(counterpart.displayName)}
          </AvatarFallback>
        </Avatar>
        <Link
          href={`/profile/${counterpart.userId}`}
          className="mt-3 block text-body-md font-extrabold text-foreground hover:text-primary hover:underline"
        >
          {counterpart.displayName}
        </Link>
        {counterpart.graduationYear ? (
          <p className="mt-1 text-xs font-semibold text-text-secondary">
            Class of ’{String(counterpart.graduationYear).slice(-2)}
          </p>
        ) : null}
      </div>

      {counterpart.headline || work ? (
        <section className="rounded-[14px] bg-surface-inset p-4">
          <p className="text-kicker font-bold tracking-label text-text-secondary uppercase">
            About
          </p>
          {counterpart.headline ? (
            <p className="mt-2 text-caption leading-relaxed font-semibold text-foreground">
              {counterpart.headline}
            </p>
          ) : null}
          {work ? <p className="mt-1 text-kicker text-text-secondary">{work}</p> : null}
        </section>
      ) : null}

      <section className="grid gap-2 rounded-[14px] bg-surface-inset p-4 text-kicker font-semibold text-text-secondary">
        <p className="flex items-center gap-2">
          <Link2 aria-hidden className="size-4 text-primary" /> {relationship}
        </p>
        <p className="flex items-center gap-2">
          <CircleCheck aria-hidden className="size-4 text-primary" />
          {counterpart.openToHelp ? 'Open to helping their circle' : 'Not marked open to help'}
        </p>
      </section>

      {conversation.askContext && conversation.askId ? (
        <section className="rounded-[14px] bg-surface-inset p-4">
          <p className="text-kicker font-bold tracking-label text-text-secondary uppercase">
            About this conversation
          </p>
          <Link
            href={`/help/asks/${conversation.askId}`}
            className="mt-2 block text-caption leading-snug font-bold text-foreground hover:text-primary"
          >
            Ask · {conversation.askContext.question}
          </Link>
          <span
            className={cn(
              'mt-2 inline-flex rounded-full px-2 py-0.5 text-kicker font-bold',
              resolved
                ? 'bg-[var(--state-success-bg)] text-[var(--state-success-fg)]'
                : 'bg-primary-tint-strong text-[var(--blue-800)]',
            )}
          >
            {resolved ? 'Resolved' : 'Open'}
          </span>
          {resolved && conversation.askContext.outcomeNote ? (
            <>
              <p className="mt-2 text-kicker leading-relaxed text-text-secondary">
                {conversation.askContext.outcomeNote}
              </p>
              {outcomeSharing ? (
                <div className="mt-4 grid gap-2.5 border-t border-border-subtle pt-3">
                  <label className="flex cursor-pointer items-start gap-2.5 text-kicker leading-relaxed font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={outcomeSharing.viewerShareStory}
                      disabled={actionPending}
                      onChange={(event) => onOutcomeSharingChange(event.target.checked, false)}
                      className="mt-0.5 size-4 rounded border-border text-primary focus:ring-focus-ring"
                    />
                    <span>
                      Share this win with the circle
                      <span className="mt-0.5 block font-medium text-text-secondary">
                        It appears only if the other person also says yes.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2.5 text-kicker leading-relaxed font-semibold text-foreground has-disabled:cursor-not-allowed has-disabled:opacity-55">
                    <input
                      type="checkbox"
                      checked={outcomeSharing.viewerShareIdentity}
                      disabled={!outcomeSharing.viewerShareStory || actionPending}
                      onChange={(event) => onOutcomeSharingChange(true, event.target.checked)}
                      className="mt-0.5 size-4 rounded border-border text-primary focus:ring-focus-ring"
                    />
                    <span>
                      Include my name if they do too
                      <span className="mt-0.5 block font-medium text-text-secondary">
                        Otherwise the story stays anonymous.
                      </span>
                    </span>
                  </label>
                  {outcomeSharing.storyEligible ? (
                    <p className="text-kicker font-semibold text-[var(--state-success-fg)]">
                      This win can now appear on Home.
                      {outcomeSharing.identityEligible ? ' Both names can appear too.' : ''}
                    </p>
                  ) : outcomeSharing.viewerShareStory ? (
                    <p className="text-kicker font-medium text-text-secondary">
                      Your choice is saved. The story stays private unless they also opt in.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {conversation.askContext && !resolved ? (
        <button
          type="button"
          onClick={onResolve}
          disabled={actionPending}
          className="min-h-11 w-full rounded-xl bg-card px-4 text-xs font-bold text-text-secondary shadow-[var(--ring-outline)] hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-55"
        >
          Mark ask resolved
        </button>
      ) : null}

      {conversation.canRequestConnection || connectionRequestState !== 'idle' ? (
        <div className="rounded-[14px] border border-border-subtle p-4">
          <p className="text-caption font-bold text-foreground">Stay in each other’s circle</p>
          <p className="mt-1 text-kicker leading-relaxed text-text-secondary">
            Send a quiet Connection request after this helpful conversation.
          </p>
          <button
            type="button"
            onClick={onRequestConnection}
            disabled={connectionRequestState !== 'idle' || actionPending}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-tint-strong px-3 text-xs font-bold text-[var(--blue-800)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
          >
            <UserPlus aria-hidden className="size-4" />
            {connectionRequestState === 'sent'
              ? 'Request sent'
              : connectionRequestState === 'pending'
                ? 'Sending…'
                : 'Add to your circle'}
          </button>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="text-kicker font-semibold text-destructive">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-2 border-t border-border-subtle pt-4">
        {isConnected ? (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={actionPending}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <UserMinus aria-hidden className="size-4" /> Disconnect
          </button>
        ) : null}
        <button
          type="button"
          onClick={onBlock}
          disabled={actionPending}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-destructive hover:bg-destructive/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <ShieldAlert aria-hidden className="size-4" /> Block member
        </button>
      </div>

      {conversation.askContext ? (
        <p className="text-center text-kicker leading-relaxed font-medium text-text-secondary">
          Accepted asks do not expire. Resolving closes the ask, not this conversation.
        </p>
      ) : null}
    </div>
  )
}
