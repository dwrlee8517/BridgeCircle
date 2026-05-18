import 'server-only'
import { randomUUID } from 'node:crypto'
import { mapPdlPerson } from '../mappers/pdl'
import type {
  EnrichmentProvider,
  EnrichmentResult,
  IdentityInput,
  SweepDrainResult,
  SweepRecord,
  SweepStartResult,
  SweepTarget,
} from '../types'

const BASE_URL = 'https://api.peopledatalabs.com/v5/person/enrich'

/**
 * People Data Labs — the last-resort fallback for every job. Free tier is
 * 100 credits/month, Pro tier is $98 for 350 credits. Calls are billed only
 * on a successful match. fetchByIdentity is the only place where we use a
 * non-LinkedIn key (name + email + grad year), which is the whole reason
 * PDL exists in this stack — for alumni LinkdAPI and Bright Data can't find.
 *
 * Reference: https://docs.peopledatalabs.com/docs/person-enrichment-api
 */
class PdlProvider implements EnrichmentProvider {
  readonly name = 'pdl' as const

  async fetchByLinkedInUrl(url: string): Promise<EnrichmentResult> {
    const apiKey = process.env.PDL_API_KEY
    if (!apiKey) return { ok: false, error: 'no_api_key' }

    return this.callEnrich(apiKey, { profile: url })
  }

  async startSweep(targets: SweepTarget[]): Promise<SweepStartResult> {
    const records: SweepRecord[] = []
    for (const target of targets) {
      const result = await this.fetchByLinkedInUrl(target.url)
      records.push({ userId: target.userId, url: target.url, result })
    }
    const snapshotId = `pdl:${randomUUID()}`
    inMemorySnapshots.set(snapshotId, records)
    return { ok: true, snapshotId }
  }

  async drainSnapshot(snapshotId: string): Promise<SweepDrainResult> {
    if (!snapshotId.startsWith('pdl:')) {
      return { ok: false, error: 'failed', detail: 'snapshot id not owned by pdl' }
    }
    const records = inMemorySnapshots.get(snapshotId)
    if (!records) return { ok: false, error: 'failed', detail: 'snapshot not found' }
    inMemorySnapshots.delete(snapshotId)
    return { ok: true, records }
  }

  async fetchByIdentity(input: IdentityInput): Promise<EnrichmentResult> {
    const apiKey = process.env.PDL_API_KEY
    if (!apiKey) return { ok: false, error: 'no_api_key' }

    return this.callEnrich(apiKey, {
      name: input.name,
      email: input.email,
      ...(input.lastEmployer ? { company: input.lastEmployer } : {}),
    })
  }

  private async callEnrich(
    apiKey: string,
    params: Record<string, string>,
  ): Promise<EnrichmentResult> {
    const qs = new URLSearchParams({ ...params, min_likelihood: '6' })

    let response: Response
    try {
      response = await fetch(`${BASE_URL}?${qs.toString()}`, {
        headers: { 'X-Api-Key': apiKey },
      })
    } catch (err) {
      return {
        ok: false,
        error: 'network_error',
        detail: err instanceof Error ? err.message : String(err),
      }
    }

    if (response.status === 404) return { ok: false, error: 'not_found' }
    if (response.status === 429) return { ok: false, error: 'rate_limited' }
    if (response.status === 402) return { ok: false, error: 'budget_exceeded' }
    if (!response.ok) {
      return { ok: false, error: 'network_error', detail: `http ${response.status}` }
    }

    let body: unknown
    try {
      body = await response.json()
    } catch {
      return { ok: false, error: 'invalid_response', detail: 'json parse failed' }
    }

    const data = (body as { data?: unknown } | null)?.data
    if (!data) return { ok: false, error: 'not_found' }
    return mapPdlPerson(data)
  }
}

const inMemorySnapshots = new Map<string, SweepRecord[]>()

export function createPdlProvider(): EnrichmentProvider {
  return new PdlProvider()
}
