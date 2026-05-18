import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import { applyExtractedToProfile } from '@/lib/resume/applyToProfile'
import type { ApplyExtractedInput, ExtractedProfile } from '@/lib/resume/schemas'
import { fingerprintProfile, projectFingerprint } from './fingerprint'

export type ApplyProposalResult =
  | { ok: true; status: 'accepted' | 'edited' | 'declined' }
  | { ok: false; error: 'not_found' | 'not_pending' | 'expired' | 'db_error'; detail?: string }

/**
 * Apply a user's selections from a profile_change_proposals row.
 *
 * Two paths:
 *   - status = 'declined' → just mark the row and return.
 *   - status = 'accepted' or 'edited' → write selections to base_profiles via
 *     applyExtractedToProfile, update the proposal status, and refresh the
 *     fingerprint on profile_enrichment_settings so the sweep won't re-propose
 *     the same diff.
 *
 * We treat 'accepted' vs 'edited' as a caller-supplied distinction: callers
 * compare the submitted input against the proposed_snapshot to decide which.
 */
export async function applyProposal(
  supabase: SupabaseClient<Database>,
  args: {
    userId: string
    proposalId: string
    action: 'accept' | 'decline'
    input?: ApplyExtractedInput
    /** Pre-computed status: 'accepted' if the user kept everything as-is,
     * 'edited' if any field/value was changed during review. The page knows;
     * the lib doesn't need to re-derive. */
    finalStatus?: 'accepted' | 'edited'
  },
): Promise<ApplyProposalResult> {
  const admin = createAdminClient()

  const { data: proposal, error: fetchErr } = await admin
    .from('profile_change_proposals')
    .select('id, user_id, status, expires_at, proposed_snapshot')
    .eq('id', args.proposalId)
    .maybeSingle()
  if (fetchErr) return { ok: false, error: 'db_error', detail: fetchErr.message }
  if (!proposal || proposal.user_id !== args.userId) return { ok: false, error: 'not_found' }
  if (proposal.status !== 'pending') return { ok: false, error: 'not_pending' }
  if (proposal.expires_at && new Date(proposal.expires_at) < new Date()) {
    await admin
      .from('profile_change_proposals')
      .update({ status: 'expired', reviewed_at: new Date().toISOString() })
      .eq('id', proposal.id)
    return { ok: false, error: 'expired' }
  }

  const now = new Date().toISOString()

  if (args.action === 'decline') {
    const { error } = await admin
      .from('profile_change_proposals')
      .update({ status: 'declined', reviewed_at: now })
      .eq('id', proposal.id)
    if (error) return { ok: false, error: 'db_error', detail: error.message }
    return { ok: true, status: 'declined' }
  }

  // Accept path
  if (!args.input) {
    return { ok: false, error: 'db_error', detail: 'missing selections on accept' }
  }

  const applyResult = await applyExtractedToProfile(supabase, args.userId, args.input)
  if (!applyResult.ok) {
    return { ok: false, error: 'db_error', detail: applyResult.detail }
  }

  const finalStatus = args.finalStatus ?? 'accepted'
  const { error: statusErr } = await admin
    .from('profile_change_proposals')
    .update({ status: finalStatus, reviewed_at: now })
    .eq('id', proposal.id)
  if (statusErr) return { ok: false, error: 'db_error', detail: statusErr.message }

  // Refresh the sweep fingerprint so the next monthly cycle doesn't re-propose
  // the same diff. We re-fingerprint from the proposed_snapshot (rather than
  // re-reading base_profiles) so the hash is canonical to what was offered.
  const { hash } = fingerprintProfile(proposal.proposed_snapshot as unknown as ExtractedProfile)
  await admin
    .from('profile_enrichment_settings')
    .update({
      last_profile_fingerprint: hash,
      last_enriched_at: now,
      updated_at: now,
    })
    .eq('user_id', args.userId)

  return { ok: true, status: finalStatus }
}

export { projectFingerprint }
