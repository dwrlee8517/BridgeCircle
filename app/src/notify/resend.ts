import { render } from '@react-email/components'
import type * as React from 'react'
import { Resend } from 'resend'
import { resolveDevRecipient } from './devGuard'
import { AccountDeleteScheduledEmail } from './emails/account-delete-scheduled-email'
import { AnnouncementEmail } from './emails/announcement-email'
import { AskAcceptedEmail } from './emails/ask-accepted-email'
import { AskExpiredEmail } from './emails/ask-expired-email'
import { AskReminderEmail } from './emails/ask-reminder-email'
import { AskRequestEmail } from './emails/ask-request-email'
import { EventCanceledEmail } from './emails/event-canceled-email'
import { EventRsvpConfirmationEmail } from './emails/event-rsvp-confirmation-email'
import { EventWaitlistPromotedEmail } from './emails/event-waitlist-promoted-email'
import { FriendRequestAcceptedEmail } from './emails/friend-request-accepted-email'
import { FriendRequestEmail } from './emails/friend-request-email'
import { HelpNotificationEmail } from './emails/help-notification-email'
import { InviteEmail } from './emails/invite-email'
import { MembershipApprovedEmail } from './emails/membership-approved-email'
import { MembershipDeactivatedEmail } from './emails/membership-deactivated-email'
import { MembershipRejectedEmail } from './emails/membership-rejected-email'
import { ProposalAppliedEmail } from './emails/proposal-applied-email'
import { ProposalReviewEmail } from './emails/proposal-review-email'

// Wrapped Resend client. Server-only: uses RESEND_API_KEY which is not exposed
// to the browser. Importing from a 'use client' file will fail at build time.

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

// Sender address. Configurable so we can swap in a verified domain (e.g.
// noreply@bridgecircle.org or events@…) without code changes once the user
// has added the SPF/DKIM records in Resend. Default keeps the current
// invites@ address that's already wired up.
const FROM = process.env.RESEND_FROM ?? 'BridgeCircle <invites@bridgecircle.org>'

export type SendInviteInput = {
  to: string
  fullName: string | null
  schoolName: string
  joinUrl: string
  idempotencyKey?: string
}

export type NotifyResult = { ok: true; id: string } | { ok: false; error: string }

async function sendRenderedEmail({
  to,
  subject,
  email,
  idempotencyKey,
}: {
  to: string
  subject: string
  email: React.ReactNode
  idempotencyKey?: string
}): Promise<NotifyResult> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  // Non-prod guard: never let a dev/local box send real mail to real (or
  // bouncing) addresses. Redirects to a safe sink unless APP_ENV=prod. See
  // ./devGuard.
  const { to: recipient, redirectedFrom } = resolveDevRecipient(to)
  if (redirectedFrom) {
    console.info('[notify] development redirect applied', {
      appEnv: process.env.APP_ENV ?? 'unset',
    })
  }

  const [html, text] = await Promise.all([render(email), render(email, { plainText: true })])

  const { data, error } = await resend.emails.send(
    {
      from: FROM,
      to: [recipient],
      subject,
      html,
      text,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  )

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
}

export type SendHelpNotificationInput = {
  to: string
  recipientName: string
  notificationType:
    | 'ask_received'
    | 'ask_accepted'
    | 'ask_declined'
    | 'ask_reminder'
    | 'ask_closed'
    | 'offer_received'
    | 'offer_accepted'
    | 'offer_declined'
    | 'offer_closed'
    | 'circle_ask_match'
    | 'circle_ask_closed'
    | 'message_received'
  actorName: string | null
  actionUrl: string
  idempotencyKey: string
}

export async function sendHelpNotificationEmail(
  input: SendHelpNotificationInput,
): Promise<NotifyResult> {
  const copy = helpEmailCopy(input.notificationType, input.actorName)
  return sendRenderedEmail({
    to: input.to,
    subject: copy.subject,
    email: HelpNotificationEmail({
      recipientName: input.recipientName,
      heading: copy.heading,
      body: copy.body,
      actionLabel: copy.actionLabel,
      actionUrl: input.actionUrl,
    }),
    idempotencyKey: input.idempotencyKey,
  })
}

function helpEmailCopy(
  type: SendHelpNotificationInput['notificationType'],
  actorName: string | null,
) {
  const actor = actorName ?? 'A member'
  const copies: Record<
    SendHelpNotificationInput['notificationType'],
    { subject: string; heading: string; body: string; actionLabel: string }
  > = {
    ask_received: {
      subject: `${actor} is hoping you can help`,
      heading: `${actor} is hoping you can help`,
      body: 'Take a look when you have a moment. Passing kindly is always an option.',
      actionLabel: 'Review the request',
    },
    ask_accepted: {
      subject: `${actor} said yes`,
      heading: `${actor} said yes`,
      body: 'Your conversation is ready whenever you are.',
      actionLabel: 'Open the conversation',
    },
    ask_declined: {
      subject: 'An update on your request',
      heading: 'An update on your request',
      body: 'The member could not help this time. Your request is ready to revisit.',
      actionLabel: 'View your request',
    },
    ask_reminder: {
      subject: 'A request is waiting for you',
      heading: 'A request is waiting for you',
      body: 'A member is still waiting for your response. A quick yes or kind decline helps them move forward.',
      actionLabel: 'Review the request',
    },
    ask_closed: {
      subject: 'Your request has closed',
      heading: 'Your request has closed',
      body: 'This request reached the end of its response window. You can ask again with a fresh request.',
      actionLabel: 'View Help',
    },
    offer_received: {
      subject: `${actor} offered to help`,
      heading: `${actor} offered to help`,
      body: 'Review their note and decide when you are ready.',
      actionLabel: 'Review the offer',
    },
    offer_accepted: {
      subject: 'Your offer was accepted',
      heading: 'Your offer was accepted',
      body: 'The conversation is ready whenever you are.',
      actionLabel: 'Open the conversation',
    },
    offer_declined: {
      subject: 'An update on your offer',
      heading: 'An update on your offer',
      body: 'The member went another direction this time. Thank you for offering.',
      actionLabel: 'View Help',
    },
    offer_closed: {
      subject: 'This offer has closed',
      heading: 'This offer has closed',
      body: 'The request is no longer open. Thank you for being willing to help.',
      actionLabel: 'View Help',
    },
    circle_ask_match: {
      subject: 'A request may be a good fit for you',
      heading: 'A request may be a good fit for you',
      body: 'BridgeCircle found a request that matches what you can speak to.',
      actionLabel: 'Take a look',
    },
    circle_ask_closed: {
      subject: 'Your circle request has closed',
      heading: 'Your circle request has closed',
      body: 'This request reached the end of its response window. You can ask the circle again any time.',
      actionLabel: 'View Help',
    },
    message_received: {
      subject: `New message from ${actor}`,
      heading: `New message from ${actor}`,
      body: 'Open BridgeCircle to continue the conversation.',
      actionLabel: 'Open the conversation',
    },
  }
  return copies[type]
}

export async function sendInviteEmail(input: SendInviteInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `You're invited to join ${input.schoolName} on BridgeCircle`,
    email: InviteEmail(input),
    idempotencyKey: input.idempotencyKey,
  })
}

export type SendAskRequestInput = {
  to: string
  askerName: string
  reviewUrl: string
}

export async function sendAskRequestEmail(input: SendAskRequestInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `${input.askerName} is hoping you can help`,
    email: AskRequestEmail(input),
  })
}

export type SendAskAcceptedInput = {
  to: string
  helperName: string
  threadUrl: string
}

export async function sendAskAcceptedEmail(input: SendAskAcceptedInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `${input.helperName} said yes to your ask`,
    email: AskAcceptedEmail(input),
  })
}

export type SendEventRsvpConfirmationInput = {
  to: string
  eventTitle: string
  eventStartsAt: string
  eventLocation: string | null
  eventUrl: string
}

export async function sendEventRsvpConfirmationEmail(
  input: SendEventRsvpConfirmationInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `You're going to ${input.eventTitle}`,
    email: EventRsvpConfirmationEmail(input),
  })
}

export type SendFriendRequestInput = {
  to: string
  senderName: string
  reviewUrl: string
  message: string | null
}

export async function sendFriendRequestEmail(input: SendFriendRequestInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `${input.senderName} would like to connect`,
    email: FriendRequestEmail({
      senderName: input.senderName,
      reviewUrl: input.reviewUrl,
      message: input.message,
    }),
  })
}

export type SendMembershipApprovedInput = {
  to: string
  recipientName: string | null
  orgName: string
  signInUrl: string
}

export async function sendMembershipApprovedEmail(
  input: SendMembershipApprovedInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `You're approved — welcome to ${input.orgName} on BridgeCircle`,
    email: MembershipApprovedEmail({
      recipientName: input.recipientName,
      orgName: input.orgName,
      signInUrl: input.signInUrl,
    }),
  })
}

export type SendMembershipRejectedInput = {
  to: string
  recipientName: string | null
  orgName: string
}

export async function sendMembershipRejectedEmail(
  input: SendMembershipRejectedInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `Update on your ${input.orgName} BridgeCircle membership`,
    email: MembershipRejectedEmail({
      recipientName: input.recipientName,
      orgName: input.orgName,
    }),
  })
}

export type SendMembershipDeactivatedInput = {
  to: string
  recipientName: string | null
  orgName: string
  reason: string | null
}

export async function sendMembershipDeactivatedEmail(
  input: SendMembershipDeactivatedInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `Your ${input.orgName} BridgeCircle access has been deactivated`,
    email: MembershipDeactivatedEmail({
      recipientName: input.recipientName,
      orgName: input.orgName,
      reason: input.reason,
    }),
  })
}

export type SendAccountDeleteScheduledInput = {
  to: string
  recipientName: string | null
  reason: string
  scheduledFor: string
}

export async function sendAccountDeleteScheduledEmail(
  input: SendAccountDeleteScheduledInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: 'Your BridgeCircle account has been deactivated',
    email: AccountDeleteScheduledEmail({
      recipientName: input.recipientName,
      reason: input.reason,
      scheduledFor: input.scheduledFor,
    }),
  })
}

export type SendEventCanceledInput = {
  to: string
  recipientName: string | null
  eventTitle: string
  eventStartsAt: string
  eventLocation: string | null
  reason: string | null
}

export async function sendEventCanceledEmail(input: SendEventCanceledInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `${input.eventTitle} has been canceled`,
    email: EventCanceledEmail({
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      eventStartsAt: input.eventStartsAt,
      eventLocation: input.eventLocation,
      reason: input.reason,
    }),
  })
}

export type SendEventWaitlistPromotedInput = {
  to: string
  recipientName: string | null
  eventTitle: string
  eventStartsAt: string
  eventLocation: string | null
  eventUrl: string
}

export async function sendEventWaitlistPromotedEmail(
  input: SendEventWaitlistPromotedInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `A spot opened up for ${input.eventTitle}`,
    email: EventWaitlistPromotedEmail({
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      eventStartsAt: input.eventStartsAt,
      eventLocation: input.eventLocation,
      eventUrl: input.eventUrl,
    }),
  })
}

export type SendAnnouncementInput = {
  to: string
  recipientName: string | null
  orgName: string
  title: string
  body: string | null
  announcementsUrl: string
}

export async function sendAnnouncementEmail(input: SendAnnouncementInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `${input.orgName}: ${input.title}`,
    email: AnnouncementEmail({
      recipientName: input.recipientName,
      orgName: input.orgName,
      title: input.title,
      body: input.body,
      announcementsUrl: input.announcementsUrl,
    }),
  })
}

export type SendFriendRequestAcceptedInput = {
  to: string
  accepterName: string
  profileUrl: string
}

export async function sendFriendRequestAcceptedEmail(
  input: SendFriendRequestAcceptedInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `You and ${input.accepterName} are connected`,
    email: FriendRequestAcceptedEmail({
      accepterName: input.accepterName,
      profileUrl: input.profileUrl,
    }),
  })
}

// ---------------------------------------------------------------------------
// Profile enrichment — monthly sweep proposals
// ---------------------------------------------------------------------------

export type SendProposalReviewInput = {
  to: string
  recipientName: string | null
  reviewUrl: string
  confirmUrl: string
  declineUrl: string
  changeSummary: string
}

export async function sendProposalReviewEmail(
  input: SendProposalReviewInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: 'BridgeCircle: updates from your LinkedIn',
    email: ProposalReviewEmail({
      recipientName: input.recipientName,
      reviewUrl: input.reviewUrl,
      confirmUrl: input.confirmUrl,
      declineUrl: input.declineUrl,
      changeSummary: input.changeSummary,
    }),
  })
}

export type SendProposalAppliedInput = {
  to: string
  recipientName: string | null
  undoUrl: string
  changeSummary: string
}

export async function sendProposalAppliedEmail(
  input: SendProposalAppliedInput,
): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: 'BridgeCircle: we updated your profile from LinkedIn',
    email: ProposalAppliedEmail({
      recipientName: input.recipientName,
      undoUrl: input.undoUrl,
      changeSummary: input.changeSummary,
    }),
  })
}

export type SendAskReminderInput = {
  to: string
  helperName: string | null
  askerName: string
  askExcerpt: string | null
  reviewUrl: string
}

export async function sendAskReminderEmail(input: SendAskReminderInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `${input.askerName}'s ask is still open — when you have a minute`,
    email: AskReminderEmail({
      helperName: input.helperName,
      askerName: input.askerName,
      askExcerpt: input.askExcerpt,
      reviewUrl: input.reviewUrl,
    }),
  })
}

export type SendAskExpiredInput = {
  to: string
  askerName: string | null
  helperName: string
  detailUrl: string
}

export async function sendAskExpiredEmail(input: SendAskExpiredInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `Your ask to ${input.helperName} closed quietly`,
    email: AskExpiredEmail({
      askerName: input.askerName,
      helperName: input.helperName,
      detailUrl: input.detailUrl,
    }),
  })
}
