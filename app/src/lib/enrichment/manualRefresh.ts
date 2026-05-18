import 'server-only'
import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import type { ExtractedProfile } from '@/lib/resume/schemas'
import { fingerprintProfile, fingerprintsDiffer, projectFingerprint } from './fingerprint'
import { isAcceptableResult } from './quality'
import { fallbackChainFor, providerFor } from './registry'
import type { EnrichmentProvider, ProviderName } from './types'

const PROPOSAL_TOKEN_BYTES = 32
const PROPOSAL_TTL_DAYS = 14

export type ManualRefreshSuccess =
  | {
      ok: true
      outcome: 'no_meaningful_change'
      provider: ProviderName
    }
  | {
      ok: true
      outcome: 'proposal_created'
      provider: ProviderName
      proposalId: string
    }

export type ManualRefreshFailure = {
  ok: false
  error: 'no_settings' | 'all_providers_failed' | 'quality_rejected' | 'db_error'
  detail?: string
}

export type ManualRefreshResult = ManualRefreshSuccess | ManualRefreshFailure

/**
 * On-demand "Update from LinkedIn" path.
 *
 *   1. Load the saved LinkedIn URL + last fingerprint from settings.
 *   2. Walk primary → fallback chain via providerFor('manual').
 *   3. Run quality gates against the user's *current* profile.
 *   4. Diff fingerprint against last_profile_fingerprint.
 *      - No diff   → bump last_checked_at, return no_meaningful_change.
 *      - Diff       → write a profile_change_proposals row (with a one-time
 *                     review token), return proposal_created.
 *
 * Returns a thin status — the action layer redirects accordingly.
 */
export async function refreshFromLinkedIn(input: { userId: string }): Promise<ManualRefreshResult> {
  const admin = createAdminClient()

  const { data: settings, error: settingsErr } = await admin
    .from('profile_enrichment_settings')
    .select('linkedin_url, linkedin_username, last_profile_fingerprint')
    .eq('user_id', input.userId)
    .maybeSingle()
  if (settingsErr) return { ok: false, error: 'db_error', detail: settingsErr.message }
  if (!settings?.linkedin_url) return { ok: false, error: 'no_settings' }

  const { data: base, error: baseErr } = await admin
    .from('base_profiles')
    .select(
      'name, headline, city, current_employer, current_title, university, major, career_history, education_history, skills',
    )
    .eq('user_id', input.userId)
    .maybeSingle()
  if (baseErr) return { ok: false, error: 'db_error', detail: baseErr.message }
  const currentProfile = toExtractedProfile(base)

  const fetchResult = await fetchManual({
    url: settings.linkedin_url,
    chain: [providerFor('manual'), ...fallbackChainFor('manual')],
    userId: input.userId,
    admin,
  })
  if (!fetchResult.ok) return { ok: false, error: 'all_providers_failed' }

  const quality = isAcceptableResult(currentProfile, fetchResult.profile)
  if (!quality.ok) {
    await logRun(admin, {
      userId: input.userId,
      provider: fetchResult.provider,
      status: 'failed',
      error: `quality:${quality.reason}`,
      fingerprint: null,
    })
    return { ok: false, error: 'quality_rejected', detail: quality.reason }
  }

  const { hash: newHash } = fingerprintProfile(fetchResult.profile)

  if (!fingerprintsDiffer(settings.last_profile_fingerprint, newHash)) {
    const now = new Date().toISOString()
    await admin
      .from('profile_enrichment_settings')
      .update({ last_checked_at: now, updated_at: now })
      .eq('user_id', input.userId)
    await logRun(admin, {
      userId: input.userId,
      provider: fetchResult.provider,
      status: 'skipped_unchanged',
      error: null,
      fingerprint: newHash,
    })
    return { ok: true, outcome: 'no_meaningful_change', provider: fetchResult.provider }
  }

  const token = randomBytes(PROPOSAL_TOKEN_BYTES).toString('base64url')
  const expiresAt = new Date(Date.now() + PROPOSAL_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: proposal, error: insertErr } = await admin
    .from('profile_change_proposals')
    .insert({
      user_id: input.userId,
      source: fetchResult.provider,
      status: 'pending',
      current_snapshot:
        currentProfile as unknown as Database['public']['Tables']['profile_change_proposals']['Insert']['current_snapshot'],
      proposed_snapshot:
        fetchResult.profile as unknown as Database['public']['Tables']['profile_change_proposals']['Insert']['proposed_snapshot'],
      review_token: token,
      expires_at: expiresAt,
    })
    .select('id')
    .single()
  if (insertErr || !proposal) {
    return { ok: false, error: 'db_error', detail: insertErr?.message }
  }

  await admin
    .from('profile_enrichment_settings')
    .update({ last_checked_at: new Date().toISOString() })
    .eq('user_id', input.userId)

  return {
    ok: true,
    outcome: 'proposal_created',
    provider: fetchResult.provider,
    proposalId: proposal.id,
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

type FetchManualSuccess = { ok: true; profile: ExtractedProfile; provider: ProviderName }
type FetchManualFailure = { ok: false }

async function fetchManual(args: {
  url: string
  chain: EnrichmentProvider[]
  userId: string
  admin: SupabaseClient<Database>
}): Promise<FetchManualSuccess | FetchManualFailure> {
  for (const provider of args.chain) {
    if (!provider) continue
    const result = await provider.fetchByLinkedInUrl(args.url)
    await logRun(args.admin, {
      userId: args.userId,
      provider: provider.name,
      status: result.ok ? 'succeeded' : result.error === 'not_found' ? 'no_match' : 'failed',
      error: result.ok ? null : `${result.error}${result.detail ? `: ${result.detail}` : ''}`,
      fingerprint: result.ok ? fingerprintProfile(result.profile).hash : null,
    })
    if (result.ok) return { ok: true, profile: result.profile, provider: provider.name }
  }
  return { ok: false }
}

async function logRun(
  admin: SupabaseClient<Database>,
  args: {
    userId: string
    provider: ProviderName
    status: 'succeeded' | 'no_match' | 'failed' | 'skipped_unchanged'
    error: string | null
    fingerprint: string | null
  },
) {
  await admin.from('profile_enrichment_runs').insert({
    user_id: args.userId,
    provider: args.provider,
    purpose: 'manual_refresh',
    status: args.status,
    cost_units: args.status === 'succeeded' ? 1 : 0,
    fingerprint: args.fingerprint,
    error: args.error,
    fetched_at: new Date().toISOString(),
  })
}

type BaseProfileRow = {
  name: string | null
  headline: string | null
  city: string | null
  current_employer: string | null
  current_title: string | null
  university: string | null
  major: string | null
  career_history: unknown
  education_history: unknown
  skills: string[] | null
}

type DbCareer = {
  employer: string
  title: string
  start_date: string | null
  end_date: string | null
  description: string | null
}
type DbEducation = {
  school: string
  degree: string | null
  field: string | null
  start_date: string | null
  end_date: string | null
}

function toExtractedProfile(row: BaseProfileRow | null | undefined): ExtractedProfile {
  return {
    name: row?.name ?? null,
    headline: row?.headline ?? null,
    city: row?.city ?? null,
    currentEmployer: row?.current_employer ?? null,
    currentTitle: row?.current_title ?? null,
    university: row?.university ?? null,
    major: row?.major ?? null,
    careerHistory: ((row?.career_history as DbCareer[] | null) ?? []).map((e) => ({
      employer: e.employer,
      title: e.title,
      startDate: e.start_date,
      endDate: e.end_date,
      description: e.description,
    })),
    educationHistory: ((row?.education_history as DbEducation[] | null) ?? []).map((e) => ({
      school: e.school,
      degree: e.degree,
      field: e.field,
      startDate: e.start_date,
      endDate: e.end_date,
    })),
    skills: row?.skills ?? [],
  }
}

// Re-export so callers don't need a separate import path.
export { projectFingerprint }
