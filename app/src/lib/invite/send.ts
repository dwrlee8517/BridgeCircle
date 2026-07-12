import 'server-only'
import { randomBytes } from 'node:crypto'
import { createAdminClient } from '@/db/admin'
import { sendInviteEmail } from '@/notify/resend'

const TOKEN_BYTES = 32
const EXPIRES_DAYS = 14

export type SendInviteInput = {
  organizationId: string
  email: string
  fullName: string | null
  graduationYear: number | null
  sentBy: string
}

export type SendInviteResult =
  | { ok: true; inviteId: string; emailId: string | null }
  | {
      ok: false
      error: 'duplicate' | 'org_not_found' | 'send_failed' | 'db_error'
      detail?: string
    }

/**
 * Issue an invite + send the email. Admin-only — caller must verify privilege
 * before invoking (e.g. via requireAdmin in the server action).
 *
 * Idempotency: the (organization_id, email) unique index in 0001_init means
 * re-inviting the same email errors with 23505. We surface that as
 * 'duplicate' so the caller can show a "this person was already invited"
 * message.
 */
export async function sendInvite(input: SendInviteInput): Promise<SendInviteResult> {
  const admin = createAdminClient()

  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .select('id, name, slug')
    .eq('id', input.organizationId)
    .maybeSingle()
  if (orgErr || !org) return { ok: false, error: 'org_not_found' }

  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000)

  const { data: invite, error: insertErr } = await admin
    .from('invites')
    .insert({
      organization_id: input.organizationId,
      email: input.email,
      token,
      status: 'pending',
      full_name: input.fullName,
      graduation_year: input.graduationYear,
      expires_at: expiresAt.toISOString(),
      sent_by: input.sentBy,
    })
    .select('id')
    .single()

  if (insertErr) {
    if (insertErr.code === '23505') return { ok: false, error: 'duplicate' }
    return { ok: false, error: 'db_error', detail: insertErr.message }
  }
  if (!invite) return { ok: false, error: 'db_error' }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  const joinUrl = `${baseUrl}/join?token=${encodeURIComponent(token)}`

  const send = await sendInviteEmail({
    to: input.email,
    fullName: input.fullName,
    schoolName: org.name,
    joinUrl,
  })

  await admin.from('audit_log').insert({
    actor_id: input.sentBy,
    organization_id: input.organizationId,
    action: 'invite.sent',
    target_type: 'invite',
    target_id: invite.id,
    payload: { email: input.email, email_send_ok: send.ok },
  })

  if (!send.ok) {
    return { ok: false, error: 'send_failed', detail: send.error }
  }

  return { ok: true, inviteId: invite.id, emailId: send.id }
}
