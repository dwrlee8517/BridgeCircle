import type { ExtractedProfile } from '@/lib/resume/schemas'

/**
 * The integration contract: every provider returns a profile shaped like the
 * existing resume-extractor output. That lets the import/review UI and
 * applyExtractedToProfile() consume enrichment results without branching on
 * which provider produced them.
 */
export type EnrichmentSuccess = {
  ok: true
  profile: ExtractedProfile
  /** Vendor-specific identifier — LinkdAPI urn, PDL id, Bright Data record id. */
  providerRecordId: string
  /** Normalized LinkedIn slug, e.g. "john-doe-123". Null if not in response. */
  linkedinUsername: string | null
  /** Provider's record timestamp (Bright Data crawl time, etc.). Null if unknown. */
  recordTimestamp: string | null
}

export type EnrichmentFailure = {
  ok: false
  error:
    | 'no_api_key'
    | 'not_found'
    | 'rate_limited'
    | 'invalid_response'
    | 'network_error'
    | 'budget_exceeded'
  detail?: string
}

export type EnrichmentResult = EnrichmentSuccess | EnrichmentFailure

/**
 * The minimal record shape compared sweep-to-sweep. All providers normalize
 * into this shape before fingerprinting, so manual fetches via LinkdAPI can
 * still diff cleanly against Bright Data snapshots.
 */
export type ProfileFingerprint = {
  currentEmployer: string | null
  currentTitle: string | null
  currentLocation: string | null
  mostRecentSchool: string | null
}

export type SweepTarget = { userId: string; url: string }

export type SweepRecord = {
  userId: string
  url: string
  result: EnrichmentResult
}

export type SweepStartResult = { ok: true; snapshotId: string } | { ok: false; error: string }

export type SweepDrainResult =
  | { ok: true; records: SweepRecord[] }
  | { ok: false; error: 'not_ready' | 'failed' | 'network_error'; detail?: string }

export type IdentityInput = {
  name: string
  email: string
  gradYear: number
  lastEmployer?: string
}

export type ProviderName = 'linkdapi' | 'brightdata' | 'pdl'

export interface EnrichmentProvider {
  readonly name: ProviderName

  /** Live lookup by LinkedIn URL or username. Used for onboarding + manual refresh. */
  fetchByLinkedInUrl(url: string): Promise<EnrichmentResult>

  /** Bulk sweep start. Bright Data is async (returns snapshot_id). LinkdAPI/PDL fall back
   *  to sequential calls and persist results synchronously — they hand back a synthetic
   *  snapshot_id so the caller can still poll. */
  startSweep(targets: SweepTarget[]): Promise<SweepStartResult>

  /** Drain a previously-started snapshot. For sync providers, the records are
   *  available immediately and this resolves on first call. */
  drainSnapshot(snapshotId: string): Promise<SweepDrainResult>

  /** Last-resort: provider lookups keyed by non-LinkedIn identifiers. Only PDL
   *  is expected to succeed at this; LinkdAPI/BD return not_found. */
  fetchByIdentity(input: IdentityInput): Promise<EnrichmentResult>
}

export type EnrichmentJob = 'onboarding' | 'manual' | 'sweep'
