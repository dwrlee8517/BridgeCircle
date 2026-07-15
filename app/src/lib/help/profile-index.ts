import { createHash } from 'node:crypto'

export const HELP_PROFILE_CONTENT_VERSION = 'help-profile-v1'
export const HELP_SYNTHETIC_PROMPT_VERSION = 'help-passages-v1'

export type HelpProfileVisibility = 'organization' | 'connections'
export type HelpProfileRawSection =
  | 'directory'
  | 'career_history'
  | 'education_history'
  | 'bio'
  | 'skills'
  | 'helper_topics'
export type HelpProfileSyntheticSection = 'career_path_summary' | 'help_topics_summary'

export type HelpProfileFact = {
  id: string
  sourceSection: HelpProfileRawSection
  visibility: HelpProfileVisibility
  content: string
}

export type HelpSyntheticPassage = {
  sourceSection: HelpProfileSyntheticSection
  visibility: HelpProfileVisibility
  content: string
  evidenceFactIds: readonly string[]
}

export type ExistingHelpProfileChunk = {
  id: string
  fingerprint: string
}

export type PlannedHelpProfileChunk = {
  chunkKind: 'raw' | 'synthetic'
  sourceSection: HelpProfileRawSection | HelpProfileSyntheticSection
  visibility: HelpProfileVisibility
  content: string
  contentHash: string
  syntheticPromptVersion: string | null
  embeddingModel: string
  embeddingDimensions: number
  fingerprint: string
}

export type HelpProfileIndexPlan = {
  chunks: PlannedHelpProfileChunk[]
  chunksToEmbed: PlannedHelpProfileChunk[]
  obsoleteChunkIds: string[]
}

export function buildHelpProfileIndexPlan(input: {
  facts: readonly HelpProfileFact[]
  syntheticPassages?: readonly HelpSyntheticPassage[]
  existingChunks: readonly ExistingHelpProfileChunk[]
  embeddingModel: string
  embeddingDimensions: number
  contentVersion?: string
  syntheticPromptVersion?: string
}): HelpProfileIndexPlan {
  if (!input.embeddingModel.trim() || input.embeddingDimensions <= 0) {
    throw new Error('Invalid Help profile embedding contract')
  }
  const contentVersion = input.contentVersion ?? HELP_PROFILE_CONTENT_VERSION
  const syntheticPromptVersion = input.syntheticPromptVersion ?? HELP_SYNTHETIC_PROMPT_VERSION
  const factIds = new Set(input.facts.map((fact) => fact.id))
  const chunks = dedupe(
    [
      ...input.facts.map((fact) =>
        chunk({
          chunkKind: 'raw',
          sourceSection: fact.sourceSection,
          visibility: fact.visibility,
          content: fact.content,
          syntheticPromptVersion: null,
          embeddingModel: input.embeddingModel,
          embeddingDimensions: input.embeddingDimensions,
          contentVersion,
        }),
      ),
      ...(input.syntheticPassages ?? []).map((passage) => {
        if (
          passage.evidenceFactIds.length === 0 ||
          passage.evidenceFactIds.some((id) => !factIds.has(id))
        ) {
          throw new Error('Synthetic Help passage has invalid evidence')
        }
        return chunk({
          chunkKind: 'synthetic',
          sourceSection: passage.sourceSection,
          visibility: passage.visibility,
          content: passage.content,
          syntheticPromptVersion,
          embeddingModel: input.embeddingModel,
          embeddingDimensions: input.embeddingDimensions,
          contentVersion,
        })
      }),
    ].filter((item) => item.content.length > 0),
  )
  const existingByFingerprint = new Map(
    input.existingChunks.map((existing) => [existing.fingerprint, existing.id]),
  )
  const desiredFingerprints = new Set(chunks.map((item) => item.fingerprint))
  return {
    chunks,
    chunksToEmbed: chunks.filter((item) => !existingByFingerprint.has(item.fingerprint)),
    obsoleteChunkIds: input.existingChunks
      .filter((existing) => !desiredFingerprints.has(existing.fingerprint))
      .map((existing) => existing.id),
  }
}

function chunk(input: {
  chunkKind: 'raw' | 'synthetic'
  sourceSection: HelpProfileRawSection | HelpProfileSyntheticSection
  visibility: HelpProfileVisibility
  content: string
  syntheticPromptVersion: string | null
  embeddingModel: string
  embeddingDimensions: number
  contentVersion: string
}): PlannedHelpProfileChunk {
  const content = normalize(input.content)
  const contentHash = hash(content)
  const fingerprint = hash(
    [
      input.chunkKind,
      input.sourceSection,
      input.visibility,
      contentHash,
      input.syntheticPromptVersion ?? 'raw',
      input.embeddingModel,
      input.embeddingDimensions,
      input.contentVersion,
    ].join('|'),
  )
  return { ...input, content, contentHash, fingerprint }
}

function dedupe(chunks: PlannedHelpProfileChunk[]): PlannedHelpProfileChunk[] {
  const byFingerprint = new Map<string, PlannedHelpProfileChunk>()
  for (const item of chunks) {
    if (item.content && !byFingerprint.has(item.fingerprint)) {
      byFingerprint.set(item.fingerprint, item)
    }
  }
  return Array.from(byFingerprint.values())
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
