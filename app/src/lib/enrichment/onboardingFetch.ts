import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import type { ExtractedProfile } from '@/lib/resume/schemas'
import { hashFingerprint, projectFingerprint } from './fingerprint'
import { fallbackChainFor, providerFor } from './registry'
import type { EnrichmentProvider, EnrichmentResult, IdentityInput, ProviderName } from './types'

export type OnboardingFetchInput = {
  userId: string
  url: string
  /** Optional identity for PDL fallback when URL lookups fail. */
  identity?: IdentityInput
}

export type OnboardingFetchSuccess = {
  ok: true
  profile: ExtractedProfile
  provider: ProviderName
  providerRecordId: string
  linkedinUsername: string | null
  fingerprintHash: string
}

export type OnboardingFetchFailure = {
  ok: false
  error: 'all_providers_failed'
  attempts: Array<{ provider: ProviderName; error: string }>
}

export type OnboardingFetchResult = OnboardingFetchSuccess | OnboardingFetchFailure

/**
 * Onboarding entry-point: paste-a-LinkedIn-URL → ExtractedProfile.
 *
 * Walks the configured primary provider for the 'onboarding' job, then the
 * declared fallback chain (PDL by default). Logs one profile_enrichment_runs
 * row per attempt so we have a full audit trail and the 3-miss escalation
 * rule has data to read.
 *
 * Returns the same `ExtractedProfile` shape the resume extractor produces —
 * that's the integration contract that lets the /profile/import confirm UI
 * consume any provider without branching.
 */
export async function fetchForOnboarding(
  input: OnboardingFetchInput,
): Promise<OnboardingFetchResult> {
  const admin = createAdminClient()
  const attempts: Array<{ provider: ProviderName; error: string }> = []

  const primary = providerFor('onboarding')
  const chain: EnrichmentProvider[] = [primary, ...fallbackChainFor('onboarding')]

  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i]
    if (!provider) continue
    const purpose = i === 0 ? 'onboarding_import' : 'fallback_verification'

    // 1) Try by-URL on every provider in the chain.
    const urlResult = await provider.fetchByLinkedInUrl(input.url)
    await logRun(admin, {
      userId: input.userId,
      provider: provider.name,
      purpose,
      result: urlResult,
    })
    if (urlResult.ok) return successFrom(urlResult, provider.name)

    attempts.push({ provider: provider.name, error: urlResult.error })

    // 2) PDL also supports identity lookup — give it the second pass before
    //    moving on. Other providers don't, so this branch only fires for pdl.
    if (provider.name === 'pdl' && input.identity) {
      const idResult = await provider.fetchByIdentity(input.identity)
      await logRun(admin, {
        userId: input.userId,
        provider: provider.name,
        purpose: 'fallback_verification',
        result: idResult,
      })
      if (idResult.ok) return successFrom(idResult, provider.name)
      attempts.push({ provider: provider.name, error: `identity:${idResult.error}` })
    }
  }

  return { ok: false, error: 'all_providers_failed', attempts }
}

function successFrom(
  result: Extract<EnrichmentResult, { ok: true }>,
  provider: ProviderName,
): OnboardingFetchSuccess {
  const fp = projectFingerprint(result.profile)
  return {
    ok: true,
    profile: result.profile,
    provider,
    providerRecordId: result.providerRecordId,
    linkedinUsername: result.linkedinUsername,
    fingerprintHash: hashFingerprint(fp),
  }
}

async function logRun(
  admin: SupabaseClient<Database>,
  args: {
    userId: string
    provider: ProviderName
    purpose: 'onboarding_import' | 'fallback_verification'
    result: EnrichmentResult
  },
) {
  const status = args.result.ok
    ? 'succeeded'
    : args.result.error === 'not_found'
      ? 'no_match'
      : 'failed'
  const fingerprint = args.result.ok
    ? hashFingerprint(projectFingerprint(args.result.profile))
    : null
  await admin.from('profile_enrichment_runs').insert({
    user_id: args.userId,
    provider: args.provider,
    purpose: args.purpose,
    status,
    cost_units: args.result.ok ? 1 : 0,
    fingerprint,
    error: args.result.ok
      ? null
      : `${args.result.error}${args.result.detail ? `: ${args.result.detail}` : ''}`,
    fetched_at: new Date().toISOString(),
  })
}
