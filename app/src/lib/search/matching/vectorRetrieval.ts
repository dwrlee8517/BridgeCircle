import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { VoyageClient } from './voyage'

export type VectorEvidence = {
  chunkId: string
  userId: string
  chunkKind: 'raw' | 'synthetic'
  sourceSection: string
  visibilityTier: 'org' | 'friends'
  content: string
  similarity: number
}

export type VectorRetrievalResult =
  | { ok: true; hits: VectorEvidence[] }
  | {
      ok: false
      error: 'embedding_failed' | 'rpc_failed'
      detail?: string
    }

export async function retrieveVectorMatches(
  admin: SupabaseClient<Database>,
  input: {
    query: string
    organizationId: string
    viewerId: string
    friendIds: string[]
    limit?: number
    voyage?: VoyageClient
  },
): Promise<VectorRetrievalResult> {
  const voyage = input.voyage ?? new VoyageClient()
  const embedded = await voyage.embed([input.query], 'query')
  if (!embedded.ok) {
    return {
      ok: false,
      error: 'embedding_failed',
      detail: `${embedded.error}${embedded.detail ? `: ${embedded.detail}` : ''}`,
    }
  }

  const queryEmbedding = vectorLiteral(embedded.value[0])
  const { data, error } = await admin.rpc('match_profile_embedding_chunks', {
    p_organization_id: input.organizationId,
    p_query_embedding: queryEmbedding,
    p_viewer_id: input.viewerId,
    p_friend_ids: input.friendIds,
    p_limit: input.limit ?? 80,
  })
  if (error) return { ok: false, error: 'rpc_failed', detail: error.message }

  return {
    ok: true,
    hits: (data ?? []).flatMap((row) => {
      if (row.chunk_kind !== 'raw' && row.chunk_kind !== 'synthetic') return []
      if (row.visibility_tier !== 'org' && row.visibility_tier !== 'friends') return []
      return [
        {
          chunkId: row.chunk_id,
          userId: row.user_id,
          chunkKind: row.chunk_kind,
          sourceSection: row.source_section,
          visibilityTier: row.visibility_tier,
          content: row.content,
          similarity: row.similarity,
        },
      ]
    }),
  }
}

export function vectorLiteral(values: number[]): string {
  return `[${values.map((value) => Number(value).toFixed(8)).join(',')}]`
}
