import { vi } from 'vitest'
import { requireIntegrationEnv } from './env'

/**
 * Global setup for the integration suite (setupFiles in
 * vitest.integration.config.ts). Applies to every test file.
 *
 * Fail fast if the connection env is missing, and stub the one true external
 * boundary — Resend. We are testing our own code against a real database, not
 * a real email provider, so the send* functions return a synthetic id instead
 * of hitting the network (which would also mean `sendInvite` reports
 * `send_failed` whenever RESEND_API_KEY is absent). Everything else — DB, auth,
 * RLS — is real.
 */

requireIntegrationEnv()

vi.mock('@/notify/resend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/notify/resend')>()
  const ok = async () => ({ ok: true as const, id: 'it_email_stub' })
  return {
    ...actual,
    sendInviteEmail: ok,
    sendAskRequestEmail: ok,
    sendAskAcceptedEmail: ok,
    sendEventRsvpConfirmationEmail: ok,
    sendFriendRequestEmail: ok,
    sendFriendRequestAcceptedEmail: ok,
    sendMembershipApprovedEmail: ok,
    sendMembershipRejectedEmail: ok,
    sendMembershipDeactivatedEmail: ok,
    sendAccountDeleteScheduledEmail: ok,
    sendEventCanceledEmail: ok,
    sendEventWaitlistPromotedEmail: ok,
    sendAnnouncementEmail: ok,
    sendProposalReviewEmail: ok,
    sendProposalAppliedEmail: ok,
    sendAskReminderEmail: ok,
    sendAskExpiredEmail: ok,
  }
})
