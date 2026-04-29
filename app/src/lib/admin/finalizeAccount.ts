import 'server-only'
import { createAdminClient } from '@/db/admin'

const PERMABAN_HOURS = 24 * 365 * 100 // 100 years; effectively forever

export type FinalizeAccountInput = {
  userId: string
  /** Who triggered the finalize. Can be the original admin actor or a sweep job. */
  actorUserId: string | null
}

export type FinalizeAccountResult =
  | { ok: true }
  | { ok: false; error: 'user_not_found' | 'already_finalized' | 'unknown' }

/**
 * Tombstones an account. Phase 3 (terminal) of the grace flow. Called by:
 *   - The "Finalize now" admin button on /admin/members for a row whose grace
 *     has expired (or even before — admin override).
 *   - The sweep script (scripts/sweep-deletions.ts) for batch processing.
 *
 * What this does (irreversible without a DB restore):
 *   1. Wipe base_profiles PII: name → "Former member", clear employer/title,
 *      LinkedIn, avatar, bio-equivalents, city, university, major.
 *   2. Wipe organization_profiles fields that hold PII (bio, graduation year is
 *      kept as it's not strongly identifying and helps audit).
 *   3. Wipe career_history, education_history, skills (all on base_profiles).
 *   4. Set users.deleted_at = now(), clear delete_scheduled_for and reason.
 *   5. Permaban auth user (100y; they can't sign back in).
 *
 * What we deliberately keep:
 *   - The users row itself (so foreign keys to messages, friend_requests,
 *     mentorship_requests don't break — recipients still see "Former member"
 *     in their conversation history).
 *   - The auth.users row (deleting it would cascade into our schema and wipe
 *     other people's history).
 *   - Audit log entries (forensic record).
 */
export async function finalizeAccount(input: FinalizeAccountInput): Promise<FinalizeAccountResult> {
  const admin = createAdminClient()

  const { data: userRow } = await admin
    .from('users')
    .select('id, deleted_at')
    .eq('id', input.userId)
    .maybeSingle()

  if (!userRow) return { ok: false, error: 'user_not_found' }
  if (userRow.deleted_at) return { ok: false, error: 'already_finalized' }

  // 1. Tombstone base_profiles. We update rather than delete so foreign keys
  // (e.g. friend_requests.requester_id → users → base_profiles join) keep
  // working in queries that show conversation history.
  const { error: baseErr } = await admin
    .from('base_profiles')
    .update({
      name: 'Former member',
      headline: null,
      current_employer: null,
      current_title: null,
      city: null,
      university: null,
      major: null,
      linkedin_url: null,
      avatar_url: null,
      career_history: null,
      education_history: null,
      skills: null,
    })
    .eq('user_id', input.userId)

  if (baseErr) return { ok: false, error: 'unknown' }

  // 2. Wipe org-context PII (bio). Graduation year stays — non-PII and useful
  // for audit/era context.
  const { data: memberships } = await admin
    .from('organization_memberships')
    .select('id, organization_id')
    .eq('user_id', input.userId)

  if (memberships && memberships.length > 0) {
    await admin
      .from('organization_profiles')
      .update({ bio: null })
      .in(
        'organization_membership_id',
        memberships.map((m) => m.id),
      )
  }

  // 3. Mark the user row as fully deleted and clear schedule.
  const { error: usersErr } = await admin
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
      delete_scheduled_for: null,
      delete_reason: null,
      // delete_initiated_by_admin stays for forensic record
    })
    .eq('id', input.userId)
  if (usersErr) return { ok: false, error: 'unknown' }

  // 4. Permaban auth user. Use a very long ban_duration; we don't deleteUser
  // because that cascades into our schema via the users.id FK.
  await admin.auth.admin.updateUserById(input.userId, {
    ban_duration: `${PERMABAN_HOURS}h`,
  })

  // 5. Audit log per affected org.
  const orgIds = Array.from(new Set((memberships ?? []).map((m) => m.organization_id)))
  for (const orgId of orgIds) {
    await admin.from('audit_log').insert({
      actor_id: input.actorUserId,
      organization_id: orgId,
      action: 'account.finalized',
      target_type: 'user',
      target_id: input.userId,
    })
  }

  return { ok: true }
}
