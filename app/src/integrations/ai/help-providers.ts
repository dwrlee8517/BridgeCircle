export type HelpEmbeddingProvider = {
  embedQuery(question: string, signal: AbortSignal): Promise<readonly number[]>
  embedDocuments(
    content: readonly string[],
    signal: AbortSignal,
  ): Promise<readonly (readonly number[])[]>
}

export type HelpRerankInput = {
  candidateId: string
  evidence: readonly string[]
}

export type HelpRerankProvider = {
  rerank(
    question: string,
    candidates: readonly HelpRerankInput[],
    signal: AbortSignal,
  ): Promise<readonly { candidateId: string; score: number }[]>
}

export type HelpAssistanceTask = 'ask_draft' | 'match_explanation' | 'decline_note'

export type HelpAssistanceProvider = {
  complete(
    task: HelpAssistanceTask,
    input: Readonly<Record<string, string | readonly string[]>>,
    signal: AbortSignal,
  ): Promise<Readonly<Record<string, string>>>
}

export type HelpProviders = {
  embeddings: HelpEmbeddingProvider | null
  reranker: HelpRerankProvider | null
  assistance: HelpAssistanceProvider | null
}
