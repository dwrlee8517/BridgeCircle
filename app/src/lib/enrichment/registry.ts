import 'server-only'
type EnvSource = Record<string, string | undefined>

import { createBrightDataProvider } from './providers/brightdata'
import { createLinkdApiProvider } from './providers/linkdapi'
import { createPdlProvider } from './providers/pdl'
import type { EnrichmentJob, EnrichmentProvider, ProviderName } from './types'

/**
 * Per-job provider routing. Defaults match docs/architecture/profile-enrichment.md:
 *   onboarding → linkdapi
 *   manual     → linkdapi
 *   sweep      → brightdata
 *
 * Overridable via env vars so swapping providers (e.g. on a LinkdAPI shutdown)
 * is a config flag change, not a code edit:
 *   ENRICHMENT_PRIMARY_ONBOARDING=pdl
 *   ENRICHMENT_PRIMARY_MANUAL=pdl
 *   ENRICHMENT_PRIMARY_SWEEP=linkdapi
 */
const DEFAULTS: Record<EnrichmentJob, ProviderName> = {
  onboarding: 'linkdapi',
  manual: 'linkdapi',
  sweep: 'brightdata',
}

const ENV_KEYS: Record<EnrichmentJob, string> = {
  onboarding: 'ENRICHMENT_PRIMARY_ONBOARDING',
  manual: 'ENRICHMENT_PRIMARY_MANUAL',
  sweep: 'ENRICHMENT_PRIMARY_SWEEP',
}

/**
 * Fallback chain per spec §"Provider Architecture". The runner walks this
 * after the primary fails with not_found/invalid_response/rate_limited.
 * Returning an array of names rather than instances keeps the chain
 * declarative and testable.
 */
const FALLBACK_CHAINS: Record<EnrichmentJob, ProviderName[]> = {
  onboarding: ['pdl'],
  manual: ['pdl'],
  // Sweep miss-escalation is policy-gated (3 consecutive misses), so the
  // sweep runner doesn't auto-fall-back inside a single run. The chain is
  // here for symmetry; the runner checks it explicitly when it decides to
  // escalate a stuck miss.
  sweep: ['linkdapi', 'pdl'],
}

export function providerFor(job: EnrichmentJob, env: EnvSource = process.env): EnrichmentProvider {
  return createProvider(resolveProviderName(job, env))
}

export function fallbackChainFor(
  job: EnrichmentJob,
  env: EnvSource = process.env,
): EnrichmentProvider[] {
  const primary = resolveProviderName(job, env)
  return FALLBACK_CHAINS[job].filter((n) => n !== primary).map(createProvider)
}

export function resolveProviderName(
  job: EnrichmentJob,
  env: EnvSource = process.env,
): ProviderName {
  const override = env[ENV_KEYS[job]]
  if (override && isProviderName(override)) return override
  return DEFAULTS[job]
}

function isProviderName(value: string): value is ProviderName {
  return value === 'linkdapi' || value === 'brightdata' || value === 'pdl'
}

function createProvider(name: ProviderName): EnrichmentProvider {
  switch (name) {
    case 'linkdapi':
      return createLinkdApiProvider()
    case 'brightdata':
      return createBrightDataProvider()
    case 'pdl':
      return createPdlProvider()
  }
}
