import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createNotification } from '@/lib/notifications/createNotification'
import { searchAlumniNL } from '@/lib/search/searchAlumniNL'

/**
 * Standing-ask sweep — service-role only. Two passes:
 *
 *   1. Expire: any open ask past its expires_at closes itself, and the
 *      asker gets a gentle in-app note. The TTL is the staleness defense.
 *   2. Re-match: every remaining open ask is run through the same matcher
 *      the live /ask page uses. New strong fits (match band "strong", same
 *      threshold as MatchBandBadge) are recorded in open_ask_matches and
 *      the asker is notified with a COUNT only — they meet the helper by
 *      re-running their ask on /ask, the same gated surface as everyone
 *      else. Helper identities never travel through notification payloads
 *      or client-readable rows (see the open_asks migration rationale).
 *
 * Run nightly (Railway worker / pg_cron later; scripts/sweep-open-asks.ts
 * for now). At pilot scale this approximates event-driven matching: joins,
 * opt-ins, unpauses, and enrichment updates all land within a day.
 */

export const OPEN_ASK_STRONG_MATCH_THRESHOLD = 85

export type OpenAskSweepResult = {
  scanned: number
  expired: number
  newMatches: number
  askersNotified: number
  errors: string[]
}

export async function sweepOpenAsks(
  admin: SupabaseClient<Database>,
  { now = new Date(), dryRun = false }: { now?: Date; dryRun?: boolean } = {},
): Promise<OpenAskSweepResult> {
  const result: OpenAskSweepResult = {
    scanned: 0,
    expired: 0,
    newMatches: 0,
    askersNotified: 0,
    errors: [],
  }
  const nowIso = now.toISOString()

  const { data: openAsks, error } = await admin
    .from('open_asks')
    .select('id, user_id, organization_id, question, expires_at')
    .eq('status', 'open')

  if (error) {
    result.errors.push(`select open_asks failed: ${error.message}`)
    return result
  }

  for (const ask of openAsks ?? []) {
    result.scanned += 1

    // Pass 1 — expiry.
    if (ask.expires_at <= nowIso) {
      result.expired += 1
      if (dryRun) continue
      const { error: expireError } = await admin
        .from('open_asks')
        .update({ status: 'expired', closed_at: nowIso })
        .eq('id', ask.id)
        .eq('status', 'open')
      if (expireError) {
        result.errors.push(`expire ${ask.id} failed: ${expireError.message}`)
        continue
      }
      await createNotification({
        userId: ask.user_id,
        type: 'open_ask_expired',
        organizationId: ask.organization_id,
        targetType: 'open_ask',
        targetId: ask.id,
        payload: { question: ask.question },
      })
      continue
    }

    // Pass 2 — re-match through the same pipeline as the live /ask page.
    try {
      const newMatches = await rematchOpenAsk(admin, ask, nowIso, dryRun)
      result.newMatches += newMatches
      if (newMatches > 0) result.askersNotified += 1
    } catch (err) {
      result.errors.push(
        `rematch ${ask.id} failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return result
}

type OpenAskRow = {
  id: string
  user_id: string
  organization_id: string
  question: string
}

async function rematchOpenAsk(
  admin: SupabaseClient<Database>,
  ask: OpenAskRow,
  nowIso: string,
  dryRun: boolean,
): Promise<number> {
  // Asker context mirrors what getMemberSearchResults passes for the viewer.
  const [{ data: baseProfile }, { data: membership }] = await Promise.all([
    admin
      .from('base_profiles')
      .select('university, major, city')
      .eq('user_id', ask.user_id)
      .maybeSingle(),
    admin
      .from('organization_memberships')
      .select('id, status')
      .eq('user_id', ask.user_id)
      .eq('organization_id', ask.organization_id)
      .maybeSingle(),
  ])

  // Asker left the org — close quietly rather than matching for a ghost.
  if (!membership || membership.status !== 'active') {
    if (!dryRun) {
      await admin
        .from('open_asks')
        .update({ status: 'closed', close_reason: 'resolved', closed_at: nowIso })
        .eq('id', ask.id)
        .eq('status', 'open')
    }
    return 0
  }

  const { data: orgProfile } = await admin
    .from('organization_profiles')
    .select('graduation_year')
    .eq('organization_membership_id', membership.id)
    .maybeSingle()

  const search = await searchAlumniNL(admin, {
    query: ask.question,
    organizationId: ask.organization_id,
    viewerId: ask.user_id,
    viewerUniversity: baseProfile?.university ?? null,
    viewerMajor: baseProfile?.major ?? null,
    viewerCity: baseProfile?.city ?? null,
    viewerGraduationYear: orgProfile?.graduation_year ?? null,
  })

  if (!search.ok) return 0

  const strongHits = search.hits.filter(
    (hit) =>
      hit.userId !== ask.user_id &&
      hit.rerankScore !== null &&
      hit.rerankScore >= OPEN_ASK_STRONG_MATCH_THRESHOLD &&
      !hit.mentorPaused &&
      (hit.isOpenAsAdviceHelper || hit.isOpenAsMentor),
  )
  if (strongHits.length === 0) return 0

  const { data: existing } = await admin
    .from('open_ask_matches')
    .select('helper_user_id')
    .eq('open_ask_id', ask.id)
  const alreadyMatched = new Set((existing ?? []).map((row) => row.helper_user_id))

  const fresh = strongHits.filter((hit) => !alreadyMatched.has(hit.userId))
  if (fresh.length === 0) return 0
  if (dryRun) return fresh.length

  const { error: insertError } = await admin.from('open_ask_matches').insert(
    fresh.map((hit) => ({
      open_ask_id: ask.id,
      helper_user_id: hit.userId,
      match_score: hit.rerankScore,
      rationale: hit.rationale,
      notified_at: nowIso,
    })),
  )
  if (insertError) throw new Error(`insert matches failed: ${insertError.message}`)

  await admin.from('open_asks').update({ last_matched_at: nowIso }).eq('id', ask.id)

  // Count only — the asker meets the helper by re-running the ask on /ask.
  await createNotification({
    userId: ask.user_id,
    type: 'open_ask_match',
    organizationId: ask.organization_id,
    targetType: 'open_ask',
    targetId: ask.id,
    payload: { match_count: fresh.length, question: ask.question },
  })

  return fresh.length
}
