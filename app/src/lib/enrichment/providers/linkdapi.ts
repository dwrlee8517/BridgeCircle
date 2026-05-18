import 'server-only'
import { randomUUID } from 'node:crypto'
import { mapLinkdApiProfile } from '../mappers/linkdapi'
import type {
  EnrichmentProvider,
  EnrichmentResult,
  IdentityInput,
  SweepDrainResult,
  SweepStartResult,
  SweepTarget,
} from '../types'

const BASE_URL = 'https://linkdapi.com'

/**
 * LinkdAPI is the primary for onboarding + manual refresh. It's also the
 * fallback target after Bright Data registers 3 consecutive misses on the
 * same URL. The sweep interface methods exist for symmetry; in practice the
 * sweep code calls fetchByLinkedInUrl per-miss rather than starting a bulk
 * snapshot through this provider.
 *
 * Endpoint cost reference: https://linkdapi.com/docs/endpoints-cost
 */
class LinkdApiProvider implements EnrichmentProvider {
  readonly name = 'linkdapi' as const

  async fetchByLinkedInUrl(url: string): Promise<EnrichmentResult> {
    const apiKey = process.env.LINKDAPI_API_KEY
    if (!apiKey) return { ok: false, error: 'no_api_key' }

    const username = extractUsername(url)
    if (!username) {
      return { ok: false, error: 'invalid_response', detail: 'could not parse linkedin url' }
    }

    let response: Response
    try {
      response = await fetch(
        `${BASE_URL}/api/v1/profile/full?username=${encodeURIComponent(username)}`,
        {
          headers: { 'X-linkdapi-apikey': apiKey },
        },
      )
    } catch (err) {
      return {
        ok: false,
        error: 'network_error',
        detail: err instanceof Error ? err.message : String(err),
      }
    }

    if (response.status === 404) return { ok: false, error: 'not_found' }
    if (response.status === 429) return { ok: false, error: 'rate_limited' }
    if (!response.ok) {
      return { ok: false, error: 'network_error', detail: `http ${response.status}` }
    }

    let body: unknown
    try {
      body = await response.json()
    } catch (err) {
      return {
        ok: false,
        error: 'invalid_response',
        detail: err instanceof Error ? err.message : 'json parse failed',
      }
    }

    // LinkdAPI wraps the profile in `{ success, statusCode, data: {...} }`.
    // Strip the envelope so the mapper only sees the bare profile object.
    const envelope = body as { success?: boolean; data?: unknown } | null
    if (!envelope || envelope.success === false || !envelope.data) {
      return { ok: false, error: 'not_found' }
    }
    return mapLinkdApiProfile(envelope.data)
  }

  async startSweep(targets: SweepTarget[]): Promise<SweepStartResult> {
    const apiKey = process.env.LINKDAPI_API_KEY
    if (!apiKey) return { ok: false, error: 'no_api_key' }

    // Sequential fetches; the sweep code only flips to LinkdAPI as primary if
    // Bright Data is unavailable, and even then this batches small cohorts.
    const records = []
    for (const target of targets) {
      const result = await this.fetchByLinkedInUrl(target.url)
      records.push({ userId: target.userId, url: target.url, result })
    }
    const snapshotId = `linkdapi:${randomUUID()}`
    inMemorySnapshots.set(snapshotId, records)
    return { ok: true, snapshotId }
  }

  async drainSnapshot(snapshotId: string): Promise<SweepDrainResult> {
    if (!snapshotId.startsWith('linkdapi:')) {
      return { ok: false, error: 'failed', detail: 'snapshot id not owned by linkdapi' }
    }
    const records = inMemorySnapshots.get(snapshotId)
    if (!records) return { ok: false, error: 'failed', detail: 'snapshot not found' }
    inMemorySnapshots.delete(snapshotId)
    return { ok: true, records }
  }

  async fetchByIdentity(_input: IdentityInput): Promise<EnrichmentResult> {
    // LinkdAPI is URL-keyed; identity lookups aren't supported on this provider.
    return { ok: false, error: 'not_found' }
  }
}

const inMemorySnapshots = new Map<
  string,
  Awaited<ReturnType<LinkdApiProvider['startSweep']>> extends infer _T
    ? Array<{ userId: string; url: string; result: EnrichmentResult }>
    : never
>()

function extractUsername(url: string): string | null {
  const trimmed = url.trim()
  if (trimmed.length === 0) return null
  // Already just a username?
  if (!trimmed.includes('/') && !trimmed.includes('.')) return trimmed
  const m = trimmed.match(/linkedin\.com\/in\/([^/?#]+)/i)
  return m?.[1] ?? null
}

export function createLinkdApiProvider(): EnrichmentProvider {
  return new LinkdApiProvider()
}
