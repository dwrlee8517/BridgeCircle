import 'server-only'
import { mapBrightDataRecord } from '../mappers/brightdata'
import type {
  EnrichmentProvider,
  EnrichmentResult,
  IdentityInput,
  SweepDrainResult,
  SweepRecord,
  SweepStartResult,
  SweepTarget,
} from '../types'

const BASE_URL = 'https://api.brightdata.com'
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0'

/**
 * Bright Data Dataset Filter API — the sweep primary. The flow is:
 *   1. POST a list of LinkedIn URLs → returns snapshot_id immediately.
 *   2. Poll /snapshot/<id>/status until ready.
 *   3. GET /snapshot/<id>/deliver to download the matched records.
 *
 * fetchByLinkedInUrl is implemented for symmetry but rarely used — the
 * onboarding/manual paths route to LinkdAPI by default; BD only handles
 * those calls if the config flag is flipped (e.g. LinkdAPI shutdown).
 *
 * References:
 *   https://docs.brightdata.com/api-reference/marketplace-dataset-api/filter-dataset
 *   https://docs.brightdata.com/api-reference/marketplace-dataset-api/deliver-snapshot
 */
class BrightDataProvider implements EnrichmentProvider {
  readonly name = 'brightdata' as const

  async fetchByLinkedInUrl(url: string): Promise<EnrichmentResult> {
    const start = await this.startSweep([{ userId: '__manual__', url }])
    if (!start.ok) return { ok: false, error: 'network_error', detail: start.error }

    // Brief poll loop — manual fetch is acceptable up to ~60s of latency since
    // it's only used as a fallback path.
    for (let i = 0; i < 12; i++) {
      await sleep(5000)
      const drained = await this.drainSnapshot(start.snapshotId)
      if (drained.ok) {
        const record = drained.records[0]
        if (!record) return { ok: false, error: 'not_found' }
        return record.result
      }
      if (drained.error === 'not_ready') continue
      return { ok: false, error: 'network_error', detail: drained.detail }
    }
    return { ok: false, error: 'network_error', detail: 'snapshot poll timeout' }
  }

  async startSweep(targets: SweepTarget[]): Promise<SweepStartResult> {
    const apiKey = process.env.BRIGHTDATA_API_KEY
    if (!apiKey) return { ok: false, error: 'no_api_key' }
    if (targets.length === 0) return { ok: false, error: 'no targets' }

    let response: Response
    try {
      response = await fetch(`${BASE_URL}/datasets/v3/filter?dataset_id=${DATASET_ID}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            operator: 'in',
            name: 'url',
            value: targets.map((t) => t.url),
          },
        }),
      })
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'network error' }
    }

    if (!response.ok) {
      return { ok: false, error: `http ${response.status}` }
    }

    const body = (await response.json()) as { snapshot_id?: string } | null
    if (!body?.snapshot_id) {
      return { ok: false, error: 'no snapshot_id in response' }
    }

    targetMap.set(body.snapshot_id, targets)
    return { ok: true, snapshotId: body.snapshot_id }
  }

  async drainSnapshot(snapshotId: string): Promise<SweepDrainResult> {
    const apiKey = process.env.BRIGHTDATA_API_KEY
    if (!apiKey) return { ok: false, error: 'failed', detail: 'no api key' }

    let statusResp: Response
    try {
      statusResp = await fetch(`${BASE_URL}/datasets/v3/snapshot/${snapshotId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
    } catch (err) {
      return {
        ok: false,
        error: 'network_error',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
    if (!statusResp.ok) {
      return { ok: false, error: 'network_error', detail: `http ${statusResp.status}` }
    }
    const status = (await statusResp.json()) as { status?: string } | null
    if (status?.status === 'failed') return { ok: false, error: 'failed' }
    if (status?.status !== 'ready') return { ok: false, error: 'not_ready' }

    let deliverResp: Response
    try {
      deliverResp = await fetch(
        `${BASE_URL}/datasets/v3/snapshot/${snapshotId}/deliver?format=json`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      )
    } catch (err) {
      return {
        ok: false,
        error: 'network_error',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
    if (!deliverResp.ok) {
      return { ok: false, error: 'network_error', detail: `http ${deliverResp.status}` }
    }

    const records = (await deliverResp.json()) as Array<{ url?: string } & Record<string, unknown>>
    const targets = targetMap.get(snapshotId) ?? []
    targetMap.delete(snapshotId)

    const byUrl = new Map<string, unknown>()
    for (const rec of records) {
      if (typeof rec.url === 'string') byUrl.set(normalizeUrl(rec.url), rec)
    }

    const out: SweepRecord[] = targets.map((t) => {
      const raw = byUrl.get(normalizeUrl(t.url))
      const result: EnrichmentResult = raw
        ? mapBrightDataRecord(raw)
        : { ok: false, error: 'not_found' }
      return { userId: t.userId, url: t.url, result }
    })

    return { ok: true, records: out }
  }

  async fetchByIdentity(_input: IdentityInput): Promise<EnrichmentResult> {
    // Bright Data Dataset Filter is URL-keyed only.
    return { ok: false, error: 'not_found' }
  }
}

/**
 * Process-local memory of which userIds we asked about for a given snapshot.
 * Bright Data returns records keyed by url, not by our internal userId.
 * For long-lived snapshots (pending across cron invocations), the sweep code
 * persists the targets table directly in enrichment_sweep_jobs and rebuilds
 * the Map on drain. This in-memory cache only helps when start+drain happen
 * in the same edge function invocation (the manual-fetch case above).
 */
const targetMap = new Map<string, SweepTarget[]>()

function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/\/+$/, '')
    .replace(/^https?:\/\/(www\.)?/, '')
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

export function createBrightDataProvider(): EnrichmentProvider {
  return new BrightDataProvider()
}
