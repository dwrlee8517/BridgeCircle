import { Resend } from 'resend'
import { render } from '@react-email/components'
import { InviteEmail } from './emails/invite-email'

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

  if (error) {
    return { ok: false, error: error.message }
  }
  if (!data?.id) {
    return { ok: false, error: 'no id returned' }
  }
  return { ok: true, id: data.id }
}
