import 'server-only'
import { createAdminClient } from '@/db/admin'

export type VerifyProposalResult =
  | {
      ok: true
      proposal: {
        id: string
        userId: string
        status: string
        source: string
        currentSnapshot: unknown
        proposedSnapshot: unknown
      }
    }
  | { ok: false; error: 'not_found' | 'expired' | 'used' }

/**
 * Look up a proposal by its (id, token) pair using the admin client. Returns
 * the proposal row when the token is valid, unexpired, and the row is still
 * pending. Mirrors lib/invite/verify.ts: the token itself is the
 * authorization, so callers can render the review UI without a logged-in
 * session.
 */
export async function verifyProposalToken(
  proposalId: string,
  token: string,
): Promise<VerifyProposalResult> {
  if (!proposalId || !token) return { ok: false, error: 'not_found' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profile_change_proposals')
    .select('id, user_id, status, source, current_snapshot, proposed_snapshot, expires_at')
    .eq('id', proposalId)
    .eq('review_token', token)
    .maybeSingle()

  if (error || !data) return { ok: false, error: 'not_found' }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { ok: false, error: 'expired' }
  }
  if (data.status !== 'pending') {
    return { ok: false, error: 'used' }
  }

  return {
    ok: true,
    proposal: {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      source: data.source,
      currentSnapshot: data.current_snapshot,
      proposedSnapshot: data.proposed_snapshot,
    },
  }
}
