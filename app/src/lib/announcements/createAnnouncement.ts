import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/db/admin'
import { createNotificationsForMany } from '@/lib/notifications/createNotification'
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
 * (per spec — no draft state at launch). Fans out:
 *   - in-app notification to every active member (always)
 *   - email to every active member (only when sendEmail=true)
 *
 * In-app notifications are cheap (one row per recipient) so we fire them
 * unconditionally — that's what populates the bell. Emails are opt-in per
 * announcement so the admin can choose to be loud or quiet.
 *
 * Email fan-out uses the admin client because we need to read auth.users
 * email addresses. Send failures per recipient are logged to Sentry but
 * don't fail the overall write — the announcement still lands in the DB
 * and shows on /announcements regardless.
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

  // Fetch every active member's user_id once. Used by both the in-app
  // notification fan-out (always) and the email fan-out (when opted in).
  // Pulling all org users in one go because Chadwick is small (~30-50);
  // for >1000-member orgs we'd want a batched approach.
  const { data: memberships } = await admin
    .from('organization_memberships')
    .select('user_id')
    .eq('organization_id', input.organizationId)
    .eq('status', 'active')

  const recipientIds = (memberships ?? []).map((m) => m.user_id)

  const { data: actorBase } = await admin
    .from('base_profiles')
    .select('name')
    .eq('user_id', input.createdBy)
    .maybeSingle()

  await createNotificationsForMany(recipientIds, {
    type: 'announcement',
    organizationId: input.organizationId,
    targetType: 'announcement',
    targetId: row.id,
    payload: {
      actor_id: input.createdBy,
      actor_name: actorBase?.name ?? null,
      title: input.title,
    },
  })

  let emailsSent = 0
  let emailsAttempted = 0

  if (input.sendEmail) {
    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', input.organizationId)
      .maybeSingle()
    const orgName = org?.name ?? 'BridgeCircle'

    for (const userId of recipientIds) {
      emailsAttempted += 1
      try {
        const { data: userRes } = await admin.auth.admin.getUserById(userId)
        const email = userRes?.user?.email
        if (!email) continue
        const { data: base } = await admin
          .from('base_profiles')
          .select('name')
          .eq('user_id', userId)
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
            extra: { announcementId: row.id, userId, error: result.error },
          })
      } catch (err) {
        Sentry.captureException(err, {
          extra: { announcementId: row.id, userId, scope: 'announcement-fanout' },
        })
      }
    }
  }

  return { ok: true, announcementId: row.id, emailsSent, emailsAttempted }
}
