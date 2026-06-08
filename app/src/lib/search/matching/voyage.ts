import 'server-only'
import { z } from 'zod'
import { VOYAGE_EMBEDDING_DIMENSIONS, VOYAGE_EMBEDDING_MODEL, VOYAGE_RERANK_MODEL } from './config'

const VOYAGE_API_BASE = 'https://api.voyageai.com/v1'
const DEFAULT_TIMEOUT_MS = 8000

export type VoyageErrorCode = 'no_api_key' | 'network_error' | 'invalid_response' | 'empty_input'

export type VoyageResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: VoyageErrorCode; detail?: string }

export type VoyageClientOptions = {
  apiKey?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      embedding: z.array(z.number()),
      index: z.number(),
    }),
  ),
})

const rerankResponseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number(),
      relevance_score: z.number(),
    }),
  ),
})

export type VoyageRerankDocument = {
  id: string
  text: string
}

export type VoyageRerankScore = {
  id: string
  score: number
}

export class VoyageClient {
  private readonly apiKey: string | undefined
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number

  constructor(options: VoyageClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.VOYAGE_API_KEY
    this.fetchImpl = options.fetchImpl ?? fetch
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  async embed(texts: string[], inputType: 'query' | 'document'): Promise<VoyageResult<number[][]>> {
    if (!this.apiKey) return { ok: false, error: 'no_api_key' }
    if (texts.length === 0) return { ok: false, error: 'empty_input' }

    const response = await this.post('/embeddings', {
      model: VOYAGE_EMBEDDING_MODEL,
      input: texts,
      input_type: inputType,
      output_dimension: VOYAGE_EMBEDDING_DIMENSIONS,
    })
    if (!response.ok) return response

    const parsed = embeddingResponseSchema.safeParse(response.value)
    if (!parsed.success) {
      return { ok: false, error: 'invalid_response', detail: parsed.error.message }
    }

    const embeddings = [...parsed.data.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding)

    if (embeddings.some((embedding) => embedding.length !== VOYAGE_EMBEDDING_DIMENSIONS)) {
      return {
        ok: false,
        error: 'invalid_response',
        detail: `embedding dimension did not equal ${VOYAGE_EMBEDDING_DIMENSIONS}`,
      }
    }

    return { ok: true, value: embeddings }
  }

  async rerank(
    query: string,
    documents: VoyageRerankDocument[],
    topK: number,
  ): Promise<VoyageResult<VoyageRerankScore[]>> {
    if (!this.apiKey) return { ok: false, error: 'no_api_key' }
    if (documents.length === 0) return { ok: false, error: 'empty_input' }

    const response = await this.post('/rerank', {
      model: VOYAGE_RERANK_MODEL,
      query,
      documents: documents.map((d) => d.text),
      top_k: Math.min(topK, documents.length),
    })
    if (!response.ok) return response

    const parsed = rerankResponseSchema.safeParse(response.value)
    if (!parsed.success) {
      return { ok: false, error: 'invalid_response', detail: parsed.error.message }
    }

    const scores = parsed.data.data
      .filter((item) => documents[item.index])
      .map((item) => ({
        id: documents[item.index].id,
        score: item.relevance_score,
      }))

    return { ok: true, value: scores }
  }

  private async post(path: string, body: unknown): Promise<VoyageResult<unknown>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await this.fetchImpl(`${VOYAGE_API_BASE}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        return { ok: false, error: 'network_error', detail: `Voyage ${res.status}` }
      }

      return { ok: true, value: await res.json() }
    } catch (err) {
      return {
        ok: false,
        error: 'network_error',
        detail: err instanceof Error ? err.message : String(err),
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
