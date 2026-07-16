import type { Json } from '@/db/database.types'
import type { HelpWorkerRepository } from '@/db/repositories/help-worker'
import { findHelpCandidates } from '@/lib/help/matching'
import {
  buildHelpProfileIndexPlan,
  type HelpProfileFact,
  type HelpSyntheticPassage,
} from '@/lib/help/profile-index'
import type {
  HelpEmbeddingProvider,
  HelpProfilePassageProvider,
  HelpRerankProvider,
} from '@/lib/help/providers'
import { type OutboxHandlerRegistry, OutboxJobError } from '@/lib/outbox/contracts'

const EMBEDDING_MODEL = 'voyage-4'
const EMBEDDING_DIMENSIONS = 1024

export type HelpEmailSendInput = {
  to: string
  recipientName: string
  notificationType:
    | 'ask_received'
    | 'ask_accepted'
    | 'ask_declined'
    | 'ask_reminder'
    | 'ask_closed'
    | 'offer_received'
    | 'offer_accepted'
    | 'offer_declined'
    | 'offer_closed'
    | 'circle_ask_match'
    | 'circle_ask_closed'
    | 'message_received'
  actorName: string | null
  actionUrl: string
  idempotencyKey: string
}

export type HelpEmailSender = {
  send(input: HelpEmailSendInput, signal: AbortSignal): Promise<{ providerId: string }>
}

export type HelpOutboxHandlerDependencies = {
  repository: HelpWorkerRepository
  embeddings: HelpEmbeddingProvider | null
  reranker: HelpRerankProvider | null
  profilePassages: HelpProfilePassageProvider | null
  emailSender: HelpEmailSender
  appBaseUrl: string
  profileIndexingEnabled: boolean
  pipelineVersion: string
  modelVersion: string
  entryOperations: {
    sendInvite(payload: unknown, idempotencyKey: string, signal: AbortSignal): Promise<void>
    generateAccountExport(payload: unknown, signal: AbortSignal): Promise<void>
  }
}

export function createHelpOutboxHandlers(
  dependencies: HelpOutboxHandlerDependencies,
): OutboxHandlerRegistry {
  const appBaseUrl = normalizeHelpAppBaseUrl(dependencies.appBaseUrl)
  return {
    async send_invite_email(job, signal) {
      await dependencies.entryOperations.sendInvite(job.payload, `outbox:${job.id}`, signal)
      return { outcome: 'completed' }
    },

    async generate_account_export(job, signal) {
      await dependencies.entryOperations.generateAccountExport(job.payload, signal)
      return { outcome: 'completed' }
    },

    async create_notification(job) {
      const result = await dependencies.repository.materializeNotification(job.id, job.lockedBy)
      if (result.result_code === 'not_available') return { outcome: 'skipped' }
      return { outcome: 'completed' }
    },

    async send_email(job, signal) {
      const context = await dependencies.repository.getEmailContext(job.id, job.lockedBy)
      if (!context) return { outcome: 'skipped' }
      if (context.providerResultId) return { outcome: 'already_applied' }
      const sent = await dependencies.emailSender.send(
        {
          to: context.recipientEmail,
          recipientName: context.recipientDisplayName,
          notificationType: context.notificationType,
          actorName: context.actorDisplayName,
          actionUrl: actionUrl(appBaseUrl, context.targetType, context.targetId),
          idempotencyKey: context.idempotencyKey,
        },
        signal,
      )
      if (!sent.providerId.trim()) throw new OutboxJobError('email_provider_id_missing', false)
      const recorded = await dependencies.repository.recordEmailProviderResult(
        job.id,
        job.lockedBy,
        sent.providerId,
      )
      if (recorded === 'provider_conflict') {
        throw new OutboxJobError('email_provider_conflict', true)
      }
      if (recorded !== 'recorded') throw new OutboxJobError('email_result_not_recorded', false)
      return { outcome: 'completed' }
    },

    async run_ask_matching(job, signal) {
      const context = await dependencies.repository.getMatchingContext(job.id, job.lockedBy)
      if (!context) return { outcome: 'skipped' }
      const result = await findHelpCandidates(
        {
          membershipId: context.askerMembershipId,
          question: context.question,
          limit: 10,
          signal,
        },
        {
          repository: {
            searchCandidates: (input) =>
              dependencies.repository.searchMatchingCandidates({
                jobId: job.id,
                workerId: job.lockedBy,
                queryEmbedding: input.queryEmbedding,
                limit: input.limit,
              }),
          },
          embeddings: dependencies.embeddings,
          reranker: dependencies.reranker,
        },
      )
      const matches: Json = result.candidates.map((candidate, index) => ({
        helperMembershipId: candidate.membershipId,
        rank: index + 1,
        score: candidate.finalScore,
        reason: candidate.matchReason,
        evidence: { chunkIds: candidate.evidenceChunkIds },
      }))
      const applied = await dependencies.repository.applyMatches({
        askId: context.askId,
        pipelineVersion: dependencies.pipelineVersion,
        modelVersion: dependencies.modelVersion,
        matches,
      })
      if (applied.result_code === 'not_available') return { outcome: 'skipped' }
      if (applied.result_code !== 'applied') {
        throw new OutboxJobError('invalid_match_result', true)
      }
      return { outcome: 'completed' }
    },

    async index_profile(job, signal) {
      const source = await dependencies.repository.getProfileIndexSource(job.id, job.lockedBy)
      if (!source) return { outcome: 'skipped' }
      if (!dependencies.profileIndexingEnabled) return { outcome: 'skipped' }
      if (!dependencies.embeddings) {
        throw new OutboxJobError('embedding_not_configured', true)
      }
      const syntheticPassages = await generateSyntheticPassages(
        source.facts,
        dependencies.profilePassages,
        signal,
      )
      const plan = buildHelpProfileIndexPlan({
        facts: source.facts,
        syntheticPassages,
        existingChunks: source.existingChunks,
        embeddingModel: EMBEDDING_MODEL,
        embeddingDimensions: EMBEDDING_DIMENSIONS,
      })
      const embeddings = await dependencies.embeddings.embedDocuments(
        plan.chunksToEmbed.map((chunk) => chunk.content),
        signal,
      )
      if (
        embeddings.length !== plan.chunksToEmbed.length ||
        embeddings.some(
          (embedding) =>
            embedding.length !== EMBEDDING_DIMENSIONS ||
            embedding.some((value) => !Number.isFinite(value)),
        )
      ) {
        throw new OutboxJobError('invalid_profile_embeddings', false)
      }
      const newChunks: Json = plan.chunksToEmbed.map((chunk, index) => ({
        chunkKind: chunk.chunkKind,
        sourceSection: chunk.sourceSection,
        visibility: chunk.visibility,
        content: chunk.content,
        contentVersion: chunk.contentVersion,
        contentHash: chunk.contentHash,
        fingerprint: chunk.fingerprint,
        syntheticPromptVersion: chunk.syntheticPromptVersion,
        embeddingModel: chunk.embeddingModel,
        embeddingDimensions: chunk.embeddingDimensions,
        embedding: `[${embeddings[index]?.join(',') ?? ''}]`,
      }))
      const synced = await dependencies.repository.syncProfileIndex({
        jobId: job.id,
        workerId: job.lockedBy,
        desiredFingerprints: plan.chunks.map((chunk) => chunk.fingerprint),
        newChunks,
      })
      if (synced.result_code === 'not_available') return { outcome: 'skipped' }
      if (synced.result_code !== 'synced') {
        throw new OutboxJobError('invalid_profile_index', true)
      }
      return { outcome: 'completed' }
    },
  }
}

export function normalizeHelpAppBaseUrl(value: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Invalid Help app base URL')
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('Invalid Help app base URL')
  }
  return parsed.origin
}

async function generateSyntheticPassages(
  facts: readonly HelpProfileFact[],
  provider: HelpProfilePassageProvider | null,
  signal: AbortSignal,
): Promise<HelpSyntheticPassage[]> {
  if (!provider) return []
  const requests: Array<{
    visibility: 'organization' | 'connections'
    facts: readonly HelpProfileFact[]
  }> = []
  const organizationFacts = facts.filter((fact) => fact.visibility === 'organization')
  if (organizationFacts.length > 0) {
    requests.push({ visibility: 'organization', facts: organizationFacts })
  }
  if (facts.some((fact) => fact.visibility === 'connections')) {
    requests.push({ visibility: 'connections', facts })
  }
  const passages: HelpSyntheticPassage[] = []
  for (const request of requests) {
    try {
      const generated = await provider.generateProfilePassages(
        {
          visibility: request.visibility,
          facts: request.facts.map((fact) => ({
            id: fact.id,
            sourceSection: fact.sourceSection,
            content: fact.content,
          })),
        },
        signal,
      )
      passages.push(
        ...generated.map((passage) => ({
          ...passage,
          visibility: request.visibility,
        })),
      )
    } catch {
      // Raw factual chunks remain the complete fallback.
    }
  }
  return passages
}

function actionUrl(baseUrl: string, targetType: string, targetId: string): string {
  if (targetType === 'conversation') return `${baseUrl}/messages/${targetId}`
  if (targetType === 'offer') return `${baseUrl}/help/asks`
  return `${baseUrl}/help/asks/${targetId}`
}
