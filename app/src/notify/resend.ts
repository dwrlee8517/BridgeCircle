import { render } from '@react-email/components'
import { Resend } from 'resend'
import { EventRsvpConfirmationEmail } from './emails/event-rsvp-confirmation-email'
import { FriendRequestAcceptedEmail } from './emails/friend-request-accepted-email'
import { FriendRequestEmail } from './emails/friend-request-email'
import { InviteEmail } from './emails/invite-email'
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
