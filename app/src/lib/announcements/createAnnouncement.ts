import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/db/admin'
import { sendAnnouncementEmail } from '@/notify/resend'
import type { AnnouncementCreateInput } from './schemas'

export type CreateAnnouncementInput = AnnouncementCreateInput & {
  organizationId: string
  createdBy: string
  appOrigin: string
}

export type CreateAnnouncementResult =
  | { ok: true; announcementId: string; emailsSent: number; emailsAttempted: number }
  | { ok: false; error: 'db_error'; detail?: string }

/**
 * Admin sends a new announcement to the org. Always published immediately
 * (per spec — no draft state at launch). When sendEmail is true, fans out
 * a one-shot email to every active member's address.
 *
 * Email fan-out uses the admin client because we need to read auth.users
 * email addresses and they're not visible via the user's session client.
 * Send failures per recipient are logged to Sentry but don't fail the
 * overall write — the announcement still lands in the DB and shows on
 * /announcements regardless.
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<CreateAnnouncementResult> {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: row, error: insErr } = await admin
    .from('announcements')
    .insert({
      organization_id: input.organizationId,
      created_by: input.createdBy,
      title: input.title,
      body: input.body,
      published_at: nowIso,
    })
    .select('id')
    .single()

  if (insErr || !row) {
    return { ok: false, error: 'db_error', detail: insErr?.message }
  }

  await admin.from('audit_log').insert({
    actor_id: input.createdBy,
    organization_id: input.organizationId,
    action: 'announcement.published',
    target_type: 'announcement',
    target_id: row.id,
    payload: { send_email: input.sendEmail },
  })

  let emailsSent = 0
  let emailsAttempted = 0

  if (input.sendEmail) {
    // Fetch every active member's user_id, then resolve emails via auth.admin.
    // Pulling all org users in one go because Chadwick is small (~30-50);
    // for >1000-member orgs we'd want a batched approach.
    const { data: memberships } = await admin
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', input.organizationId)
      .eq('status', 'active')

    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', input.organizationId)
      .maybeSingle()
    const orgName = org?.name ?? 'BridgeCircle'

    for (const m of memberships ?? []) {
      emailsAttempted += 1
      try {
        const { data: userRes } = await admin.auth.admin.getUserById(m.user_id)
        const email = userRes?.user?.email
        if (!email) continue
        const { data: base } = await admin
          .from('base_profiles')
          .select('name')
          .eq('user_id', m.user_id)
          .maybeSingle()
        const result = await sendAnnouncementEmail({
          to: email,
          recipientName: base?.name ?? null,
          orgName,
          title: input.title,
          body: input.body,
          announcementsUrl: `${input.appOrigin}/announcements`,
        })
        if (result.ok) emailsSent += 1
        else
          Sentry.captureMessage('announcement email failed', {
            level: 'warning',
            extra: { announcementId: row.id, userId: m.user_id, error: result.error },
          })
      } catch (err) {
        Sentry.captureException(err, {
          extra: { announcementId: row.id, userId: m.user_id, scope: 'announcement-fanout' },
        })
      }
    }
  }

  return { ok: true, announcementId: row.id, emailsSent, emailsAttempted }
}
