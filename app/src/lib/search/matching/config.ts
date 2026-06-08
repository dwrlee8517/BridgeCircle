import 'server-only'

export const ASK_MATCHING_PIPELINES = ['legacy', 'voyage_hybrid'] as const
export type AskMatchingPipeline = (typeof ASK_MATCHING_PIPELINES)[number]

export const ASK_MATCHING_EXPLANATIONS = ['templated', 'haiku_polish'] as const
export type AskMatchingExplanations = (typeof ASK_MATCHING_EXPLANATIONS)[number]

export const VOYAGE_EMBEDDING_MODEL = 'voyage-4'
export const VOYAGE_EMBEDDING_DIMENSIONS = 1024
export const VOYAGE_RERANK_MODEL = 'rerank-2.5-lite'

export const RAW_CHUNK_PROMPT_VERSION = 'raw-v1'
export const SYNTHETIC_CHUNK_PROMPT_VERSION = 'semantic-profile-v1'

export function askMatchingPipeline(): AskMatchingPipeline {
  return process.env.ASK_MATCHING_PIPELINE === 'voyage_hybrid' ? 'voyage_hybrid' : 'legacy'
}

export function askMatchingExplanations(): AskMatchingExplanations {
  return process.env.ASK_MATCHING_EXPLANATIONS === 'haiku_polish' ? 'haiku_polish' : 'templated'
}

export function hasVoyageConfig(): boolean {
  return !!process.env.VOYAGE_API_KEY
}
