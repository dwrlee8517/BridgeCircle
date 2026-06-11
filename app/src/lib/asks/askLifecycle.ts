import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { NLSearchHit } from '@/lib/search/searchAlumniNL'
import { displayName } from '@/lib/utils'

/**
 * Direct-ask lifecycle: the post-send loop. Three pieces, designed
 * together (see the "close the loop" mocks, 2026-06-11):
 *
 *   - a what-happens-next timeline on the asker's detail view, honest only
 *     because pending asks really do expire (sweepExpirePendingAsks);
 *   - one gentle reminder per ask, unlockable after 7 quiet days — the
 *     system carries the social pressure so the asker never has to;
 *   - a next-best alternative when an ask is declined or expires, so the
 *     moment of rejection turns into momentum instead of a dead end.
 *
 * Heavy dependencies (notifications → Sentry, search → Anthropic SDK) are
 * imported lazily inside the impure functions so the pure availability
 * helpers stay cheap to import and test.
 */

export const ASK_REMINDER_UNLOCK_DAYS = 7
export const ASK_EXPIRY_DAYS = 14
/** Same bar as MatchBandBadge "strong" and the open-ask sweep. */
export const ASK_ALTERNATIVE_MIN_SCORE = 85

const DAY_MS = 24 * 60 * 60 * 1000

export function askReminderUnlockDate(createdAt: string): Date {
  return new Date(new Date(createdAt).getTime() + ASK_REMINDER_UNLOCK_DAYS * DAY_MS)
}

export function askExpiryDate(createdAt: string): Date {
  return new Date(new Date(createdAt).getTime() + ASK_EXPIRY_DAYS * DAY_MS)
}

export type ReminderAvailability = 'not_pending' | 'locked' | 'available' | 'sent'

/** Pure availability rule — shared by the timeline UI and the action so
 * the rendered state and the enforced state can't drift. */
export function reminderAvailability(
  ask: { status: string; createdAt: string; reminderSentAt: string | null },
  now: Date,
): ReminderAvailability {
  if (ask.status !== 'pending') return 'not_pending'
  if (ask.reminderSentAt) return 'sent'
  if (now < askReminderUnlockDate(ask.createdAt)) return 'locked'
  return 'available'
}

export type AskLifecycleView = {
  availability: ReminderAvailability
  unlockDate: Date
  expiryDate: Date
}

/** Request-scoped lifecycle snapshot for the detail page. Lives here (not
 * in the component) so the impure clock read stays out of render bodies. */
export function askLifecycleView(ask: {
  status: string
  createdAt: string
  reminderSentAt: string | null
}): AskLifecycleView {
  return {
    availability: reminderAvailability(ask, new Date()),
    unlockDate: askReminderUnlockDate(ask.createdAt),
    expiryDate: askExpiryDate(ask.createdAt),
  }
}

export type SendAskReminderResult =
  | { ok: true }
  | {
      ok: false
      error:
        | 'not_found'
        | 'not_asker'
        | 'not_pending'
        | 'too_early'
        | 'already_sent'
        | 'update_failed'
    }

/**
 * The one gentle reminder. Service-role write (asks RLS gives askers no
 * update surface) with ownership + timing validated here. On the helper's
 * side it resurfaces the original ask neutrally — never "X is waiting".
 */
export async function sendAskReminder(
  admin: SupabaseClient<Database>,
  { askId, askerId, now = new Date() }: { askId: string; askerId: string; now?: Date },
): Promise<SendAskReminderResult> {
  const { data: ask } = await admin
    .from('asks')
    .select(
      'id, asker_id, helper_id, organization_id, ask_type, status, created_at, reminder_sent_at',
    )
    .eq('id', askId)
    .maybeSingle()

  if (!ask) return { ok: false, error: 'not_found' }
  if (ask.asker_id !== askerId) return { ok: false, error: 'not_asker' }

  const availability = reminderAvailability(
    { status: ask.status, createdAt: ask.created_at, reminderSentAt: ask.reminder_sent_at },
    now,
  )
  if (availability === 'not_pending') return { ok: false, error: 'not_pending' }
  if (availability === 'sent') return { ok: false, error: 'already_sent' }
  if (availability === 'locked') return { ok: false, error: 'too_early' }

  // The null guard makes the one-per-ask rule race-safe.
  const { error, count } = await admin
    .from('asks')
    .update({ reminder_sent_at: now.toISOString() }, { count: 'exact' })
    .eq('id', askId)
    .is('reminder_sent_at', null)
  if (error || (count ?? 0) === 0) return { ok: false, error: 'update_failed' }

  const { data: askerProfile } = await admin
    .from('base_profiles')
    .select('name, preferred_name')
    .eq('user_id', askerId)
    .maybeSingle()
  const actorName = displayName(askerProfile?.name, askerProfile?.preferred_name ?? null)

  const { createNotification } = await import('@/lib/notifications/createNotification')
  await createNotification({
    userId: ask.helper_id,
    type: 'ask_reminder',
    organizationId: ask.organization_id,
    targetType: 'ask',
    targetId: ask.id,
    payload: { actor_id: askerId, actor_name: actorName, ask_type: ask.ask_type },
  })

  return { ok: true }
}

export type ExpireAsksResult = {
  scanned: number
  expired: number
  errors: string[]
}

/**
 * Nightly: close pending asks that have sat quiet past the expiry window,
 * and tell the asker gently. This is what makes the timeline's last step
 * ("it closes on its own") true.
 */
export async function sweepExpirePendingAsks(
  admin: SupabaseClient<Database>,
  { now = new Date(), dryRun = false }: { now?: Date; dryRun?: boolean } = {},
): Promise<ExpireAsksResult> {
  const result: ExpireAsksResult = { scanned: 0, expired: 0, errors: [] }
  const cutoff = new Date(now.getTime() - ASK_EXPIRY_DAYS * DAY_MS).toISOString()

  const { data: stale, error } = await admin
    .from('asks')
    .select('id, asker_id, helper_id, organization_id, ask_type, created_at')
    .eq('status', 'pending')
    .lte('created_at', cutoff)

  if (error) {
    result.errors.push(`select pending asks failed: ${error.message}`)
    return result
  }

  const { createNotification } = await import('@/lib/notifications/createNotification')

  for (const ask of stale ?? []) {
    result.scanned += 1
    if (dryRun) {
      result.expired += 1
      continue
    }

    const { error: updateError, count } = await admin
      .from('asks')
      .update({ status: 'expired' }, { count: 'exact' })
      .eq('id', ask.id)
      .eq('status', 'pending')
    if (updateError || (count ?? 0) === 0) {
      if (updateError) result.errors.push(`expire ${ask.id} failed: ${updateError.message}`)
      continue
    }
    result.expired += 1

    const { data: helperProfile } = await admin
      .from('base_profiles')
      .select('name, preferred_name')
      .eq('user_id', ask.helper_id)
      .maybeSingle()

    await createNotification({
      userId: ask.asker_id,
      type: 'ask_expired',
      organizationId: ask.organization_id,
      targetType: 'ask',
      targetId: ask.id,
      payload: {
        actor_id: ask.helper_id,
        actor_name: displayName(helperProfile?.name, helperProfile?.preferred_name ?? null),
        ask_type: ask.ask_type,
      },
    })
  }

  return result
}

/**
 * Next-best fit for a closed (declined/expired) ask. Runs the same matcher
 * as the live /ask page with the viewer's own client — same privacy
 * posture as live results — excluding the helper who passed and anyone
 * the asker already has an ask with. Strong matches only; null means the
 * block simply doesn't render (honest beats filler).
 */
export async function findAskAlternative(
  supabase: SupabaseClient<Database>,
  {
    organizationId,
    askerId,
    query,
    excludeUserIds,
  }: {
    organizationId: string
    askerId: string
    query: string
    excludeUserIds: Set<string>
  },
): Promise<NLSearchHit | null> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return null

  const [{ data: viewerBase }, { data: viewerMembership }] = await Promise.all([
    supabase
      .from('base_profiles')
      .select('university, major, city')
      .eq('user_id', askerId)
      .maybeSingle(),
    supabase
      .from('organization_memberships')
      .select('id')
      .eq('user_id', askerId)
      .eq('organization_id', organizationId)
      .maybeSingle(),
  ])

  let graduationYear: number | null = null
  if (viewerMembership) {
    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('graduation_year')
      .eq('organization_membership_id', viewerMembership.id)
      .maybeSingle()
    graduationYear = orgProfile?.graduation_year ?? null
  }

  const { searchAlumniNL } = await import('@/lib/search/searchAlumniNL')
  const search = await searchAlumniNL(supabase, {
    query: trimmed,
    organizationId,
    viewerId: askerId,
    viewerUniversity: viewerBase?.university ?? null,
    viewerMajor: viewerBase?.major ?? null,
    viewerCity: viewerBase?.city ?? null,
    viewerGraduationYear: graduationYear,
  })
  if (!search.ok) return null

  return (
    search.hits.find(
      (hit) =>
        hit.userId !== askerId &&
        !excludeUserIds.has(hit.userId) &&
        !hit.mentorPaused &&
        (hit.isOpenAsAdviceHelper || hit.isOpenAsMentor) &&
        hit.rerankScore !== null &&
        hit.rerankScore >= ASK_ALTERNATIVE_MIN_SCORE,
    ) ?? null
  )
}
