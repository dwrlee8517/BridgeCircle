import { render } from '@react-email/components'
import { Resend } from 'resend'
import { AccountDeleteScheduledEmail } from './emails/account-delete-scheduled-email'
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

// Wrapped Resend client. Server-only: uses RESEND_API_KEY which is not exposed
// to the browser. Importing from a 'use client' file will fail at build time.

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

const FROM = 'BridgeCircle <invites@bridgecircle.org>'

export type SendInviteInput = {
  to: string
  fullName: string | null
  schoolName: string
  joinUrl: string
}

export type NotifyResult = { ok: true; id: string } | { ok: false; error: string }

export async function sendInviteEmail(input: SendInviteInput): Promise<NotifyResult> {
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const html = await render(InviteEmail(input))

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `You're invited to join ${input.schoolName} on BridgeCircle`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
}

export type SendMentorshipRequestInput = {
  to: string
  menteeName: string
  reviewUrl: string
}

export async function sendMentorshipRequestEmail(
  input: SendMentorshipRequestInput,
): Promise<NotifyResult> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(MentorshipRequestEmail(input))
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `${input.menteeName} sent you a mentorship request`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
}

export type SendMentorshipAcceptedInput = {
  to: string
  mentorName: string
  threadUrl: string
}

export async function sendMentorshipAcceptedEmail(
  input: SendMentorshipAcceptedInput,
): Promise<NotifyResult> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(MentorshipAcceptedEmail(input))
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `${input.mentorName} accepted your mentorship request`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
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
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(EventRsvpConfirmationEmail(input))
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `You're going to ${input.eventTitle}`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
}

export type SendFriendRequestInput = {
  to: string
  senderName: string
  reviewUrl: string
  message: string | null
}

export async function sendFriendRequestEmail(input: SendFriendRequestInput): Promise<NotifyResult> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(
    FriendRequestEmail({
      senderName: input.senderName,
      reviewUrl: input.reviewUrl,
      message: input.message,
    }),
  )
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `${input.senderName} sent you a friend request`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
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
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(
    MembershipApprovedEmail({
      recipientName: input.recipientName,
      orgName: input.orgName,
      signInUrl: input.signInUrl,
    }),
  )
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `You're approved — welcome to ${input.orgName} on BridgeCircle`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
}

export type SendMembershipRejectedInput = {
  to: string
  recipientName: string | null
  orgName: string
}

export async function sendMembershipRejectedEmail(
  input: SendMembershipRejectedInput,
): Promise<NotifyResult> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(
    MembershipRejectedEmail({
      recipientName: input.recipientName,
      orgName: input.orgName,
    }),
  )
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `Update on your ${input.orgName} BridgeCircle membership`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
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
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(
    MembershipDeactivatedEmail({
      recipientName: input.recipientName,
      orgName: input.orgName,
      reason: input.reason,
    }),
  )
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `Your ${input.orgName} BridgeCircle access has been deactivated`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
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
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(
    AccountDeleteScheduledEmail({
      recipientName: input.recipientName,
      reason: input.reason,
      scheduledFor: input.scheduledFor,
    }),
  )
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: 'Your BridgeCircle account has been deactivated',
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
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
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(
    EventCanceledEmail({
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      eventStartsAt: input.eventStartsAt,
      eventLocation: input.eventLocation,
      reason: input.reason,
    }),
  )
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `${input.eventTitle} has been canceled`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
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
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(
    EventWaitlistPromotedEmail({
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      eventStartsAt: input.eventStartsAt,
      eventLocation: input.eventLocation,
      eventUrl: input.eventUrl,
    }),
  )
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `A spot opened up for ${input.eventTitle}`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
}

export type SendFriendRequestAcceptedInput = {
  to: string
  accepterName: string
  profileUrl: string
}

export async function sendFriendRequestAcceptedEmail(
  input: SendFriendRequestAcceptedInput,
): Promise<NotifyResult> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const html = await render(
    FriendRequestAcceptedEmail({
      accepterName: input.accepterName,
      profileUrl: input.profileUrl,
    }),
  )
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [input.to],
    subject: `${input.accepterName} accepted your friend request`,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data?.id) return { ok: false, error: 'no id returned' }
  return { ok: true, id: data.id }
}
