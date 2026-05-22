import { render } from '@react-email/components'
import type * as React from 'react'
import { Resend } from 'resend'
import { AccountDeleteScheduledEmail } from './emails/account-delete-scheduled-email'
import { AnnouncementEmail } from './emails/announcement-email'
import { EventCanceledEmail } from './emails/event-canceled-email'
import { EventRsvpConfirmationEmail } from './emails/event-rsvp-confirmation-email'
import { EventWaitlistPromotedEmail } from './emails/event-waitlist-promoted-email'
import { FriendRequestAcceptedEmail } from './emails/friend-request-accepted-email'
import { FriendRequestEmail } from './emails/friend-request-email'
import { InviteEmail } from './emails/invite-email'
import { MembershipApprovedEmail } from './emails/membership-approved-email'
import { MembershipDeactivatedEmail } from './emails/membership-deactivated-email'
import { MembershipRejectedEmail } from './emails/membership-rejected-email'
import { MentorshipAcceptedEmail } from './emails/mentorship-accepted-email'
import { MentorshipRequestEmail } from './emails/mentorship-request-email'
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
}

export type NotifyResult = { ok: true; id: string } | { ok: false; error: string }

async function sendRenderedEmail({
  to,
  subject,
  email,
}: {
  to: string
  subject: string
  email: React.ReactNode
}): Promise<NotifyResult> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const [html, text] = await Promise.all([render(email), render(email, { plainText: true })])

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject,
    html,
    text,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
}

export async function sendInviteEmail(input: SendInviteInput): Promise<NotifyResult> {
  return sendRenderedEmail({
    to: input.to,
    subject: `You're invited to join ${input.schoolName} on BridgeCircle`,
    email: InviteEmail(input),
  })
}

export type SendMentorshipRequestInput = {
  to: string
  menteeName: string
  reviewUrl: string
  /** Subject line + greeting differ slightly per ask type. Default 'mentorship'
   * preserves prior behavior for any callers that haven't been updated. */
  askType?: 'advice' | 'mentorship'
}

export async function sendMentorshipRequestEmail(
  input: SendMentorshipRequestInput,
): Promise<NotifyResult> {
  const askType = input.askType ?? 'mentorship'
  const subject =
    askType === 'advice'
      ? `${input.menteeName} asked you for advice`
      : `${input.menteeName} sent you a mentorship request`

  return sendRenderedEmail({
    to: input.to,
    subject,
    email: MentorshipRequestEmail(input),
  })
}

export type SendMentorshipAcceptedInput = {
  to: string
  mentorName: string
  threadUrl: string
  askType?: 'advice' | 'mentorship'
}

export async function sendMentorshipAcceptedEmail(
  input: SendMentorshipAcceptedInput,
): Promise<NotifyResult> {
  const askType = input.askType ?? 'mentorship'
  const subject =
    askType === 'advice'
      ? `${input.mentorName} replied to your advice request`
      : `${input.mentorName} accepted your mentorship request`

  return sendRenderedEmail({
    to: input.to,
    subject,
    email: MentorshipAcceptedEmail(input),
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
    subject: `${input.senderName} sent you a friend request`,
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
    subject: `${input.accepterName} accepted your friend request`,
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
