import 'server-only'
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
  attempts: OnboardingFetchAttempt[]
}

export type OnboardingFetchFailure = {
  ok: false
  error: 'all_providers_failed'
  attempts: OnboardingFetchAttempt[]
}

export type OnboardingFetchAttempt = {
  provider: ProviderName
  purpose: 'onboarding_import' | 'fallback_verification'
  status: 'succeeded' | 'no_match' | 'failed'
  costUnits: number
  fingerprint: string | null
  error: string | null
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
 * that's the integration contract that lets the shared import confirm UI
 * consume any provider without branching.
 */
export async function fetchForOnboarding(
  input: OnboardingFetchInput,
): Promise<OnboardingFetchResult> {
  const attempts: OnboardingFetchAttempt[] = []

  const primary = providerFor('onboarding')
  const chain: EnrichmentProvider[] = [primary, ...fallbackChainFor('onboarding')]

  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i]
    if (!provider) continue
    const purpose = i === 0 ? 'onboarding_import' : 'fallback_verification'

    // 1) Try by-URL on every provider in the chain.
    const urlResult = await provider.fetchByLinkedInUrl(input.url)
    attempts.push(attemptFrom(provider.name, purpose, urlResult))
    if (urlResult.ok) return successFrom(urlResult, provider.name, attempts)

    // 2) PDL also supports identity lookup — give it the second pass before
    //    moving on. Other providers don't, so this branch only fires for pdl.
    if (provider.name === 'pdl' && input.identity) {
      const idResult = await provider.fetchByIdentity(input.identity)
      attempts.push(attemptFrom(provider.name, 'fallback_verification', idResult, 'identity'))
      if (idResult.ok) return successFrom(idResult, provider.name, attempts)
    }
  }

  return { ok: false, error: 'all_providers_failed', attempts }
}

function successFrom(
  result: Extract<EnrichmentResult, { ok: true }>,
  provider: ProviderName,
  attempts: OnboardingFetchAttempt[],
): OnboardingFetchSuccess {
  const fp = projectFingerprint(result.profile)
  return {
    ok: true,
    profile: result.profile,
    provider,
    providerRecordId: result.providerRecordId,
    linkedinUsername: result.linkedinUsername,
    fingerprintHash: hashFingerprint(fp),
    attempts,
  }
}

function attemptFrom(
  provider: ProviderName,
  purpose: OnboardingFetchAttempt['purpose'],
  result: EnrichmentResult,
  prefix?: string,
): OnboardingFetchAttempt {
  const status = result.ok ? 'succeeded' : result.error === 'not_found' ? 'no_match' : 'failed'
  const fingerprint = result.ok ? hashFingerprint(projectFingerprint(result.profile)) : null
  return {
    provider,
    purpose,
    status,
    costUnits: result.ok ? 1 : 0,
    fingerprint,
    error: result.ok
      ? null
      : `${prefix ? `${prefix}:` : ''}${result.error}${result.detail ? `: ${result.detail}` : ''}`,
  }
}
