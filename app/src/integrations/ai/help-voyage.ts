import { z } from 'zod'
import type {
  HelpEmbeddingProvider,
  HelpRerankInput,
  HelpRerankProvider,
} from '@/lib/help/providers'

const VOYAGE_API_BASE = 'https://api.voyageai.com/v1'
const EMBEDDING_MODEL = 'voyage-4'
const RERANK_MODEL = 'rerank-2.5'
const EMBEDDING_DIMENSIONS = 1024
const DEFAULT_TIMEOUT_MS = 8_000

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      embedding: z.array(z.number().finite()).length(EMBEDDING_DIMENSIONS),
      index: z.number().int().nonnegative(),
    }),
  ),
})

const rerankResponseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      relevance_score: z.number().finite(),
    }),
  ),
})

export type VoyageHelpProviderOptions = {
  apiKey: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export class HelpProviderError extends Error {
  constructor(readonly code: 'not_configured' | 'timeout' | 'network' | 'invalid_response') {
    super(`Help provider failed: ${code}`)
    this.name = 'HelpProviderError'
  }
}

export class VoyageHelpProvider implements HelpEmbeddingProvider, HelpRerankProvider {
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number

  constructor(private readonly options: VoyageHelpProviderOptions) {
    if (!options.apiKey.trim()) throw new HelpProviderError('not_configured')
    this.fetchImpl = options.fetchImpl ?? fetch
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  async embedQuery(question: string, signal: AbortSignal): Promise<readonly number[]> {
    const embeddings = await this.embed([question], 'query', signal)
    const embedding = embeddings[0]
    if (!embedding) throw new HelpProviderError('invalid_response')
    return embedding
  }

  async embedDocuments(
    content: readonly string[],
    signal: AbortSignal,
  ): Promise<readonly (readonly number[])[]> {
    if (content.length === 0) return []
    return this.embed(content, 'document', signal)
  }

  async rerank(
    question: string,
    candidates: readonly HelpRerankInput[],
    signal: AbortSignal,
  ): Promise<readonly { candidateId: string; score: number }[]> {
    if (candidates.length === 0) return []
    const response = await this.post(
      '/rerank',
      {
        model: RERANK_MODEL,
        query: question,
        documents: candidates.map((candidate) => candidate.evidence.join('\n')),
        top_k: candidates.length,
      },
      signal,
    )
    const parsed = rerankResponseSchema.safeParse(response)
    if (!parsed.success) throw new HelpProviderError('invalid_response')
    return parsed.data.data
      .filter((item) => candidates[item.index])
      .map((item) => ({
        candidateId: candidates[item.index]?.candidateId ?? '',
        score: item.relevance_score,
      }))
      .filter((item) => item.candidateId)
  }

  private async embed(
    content: readonly string[],
    inputType: 'query' | 'document',
    signal: AbortSignal,
  ): Promise<readonly (readonly number[])[]> {
    const response = await this.post(
      '/embeddings',
      {
        model: EMBEDDING_MODEL,
        input: content,
        input_type: inputType,
        output_dimension: EMBEDDING_DIMENSIONS,
      },
      signal,
    )
    const parsed = embeddingResponseSchema.safeParse(response)
    if (!parsed.success || parsed.data.data.length !== content.length) {
      throw new HelpProviderError('invalid_response')
    }
    return [...parsed.data.data].sort((a, b) => a.index - b.index).map((item) => item.embedding)
  }

  private async post(path: string, body: unknown, signal: AbortSignal): Promise<unknown> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort('timeout'), this.timeoutMs)
    const abort = () => controller.abort(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    try {
      const response = await this.fetchImpl(`${VOYAGE_API_BASE}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!response.ok) throw new HelpProviderError('network')
      try {
        return await response.json()
      } catch {
        throw new HelpProviderError('invalid_response')
      }
    } catch (error) {
      if (error instanceof HelpProviderError) throw error
      if (controller.signal.aborted) throw new HelpProviderError('timeout')
      throw new HelpProviderError('network')
    } finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abort)
    }
  }
}

export function createVoyageHelpProviderFromEnvironment(): VoyageHelpProvider | null {
  const apiKey = process.env.VOYAGE_API_KEY?.trim()
  return apiKey ? new VoyageHelpProvider({ apiKey }) : null
}
