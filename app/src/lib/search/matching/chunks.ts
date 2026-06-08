import 'server-only'
import { createHash } from 'node:crypto'
import {
  effectiveTier,
  type PrivacySettings,
  type PrivacyTier,
  parseStoredPrivacySettings,
} from '@/lib/profile/privacy'
import type { CareerEntry, EducationEntry } from '../searchAlumni'
import {
  RAW_CHUNK_PROMPT_VERSION,
  SYNTHETIC_CHUNK_PROMPT_VERSION,
  VOYAGE_EMBEDDING_DIMENSIONS,
  VOYAGE_EMBEDDING_MODEL,
} from './config'

export type ChunkKind = 'raw' | 'synthetic'
export type EmbeddableVisibilityTier = Exclude<PrivacyTier, 'self'>

export type ChunkSourceSection =
  | 'directory'
  | 'career_history'
  | 'education_history'
  | 'bio'
  | 'skills'
  | 'mentoring_topics'
  | 'career_path_summary'
  | 'help_topics_summary'

export type ProfileForChunking = {
  userId: string
  organizationId: string
  organizationMembershipId: string
  name: string | null
  preferredName: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  bio: string | null
  mentoringTopics: string[] | null
  careerHistory: CareerEntry[] | null
  educationHistory: EducationEntry[] | null
  skills: string[] | null
  privacySettings: unknown
}

export type ProfileEmbeddingChunk = {
  organizationId: string
  userId: string
  organizationMembershipId: string
  chunkKind: ChunkKind
  sourceSection: ChunkSourceSection
  visibilityTier: EmbeddableVisibilityTier
  content: string
  contentHash: string
  syntheticPromptVersion: string | null
  embeddingModel: string
  embeddingDim: number
}

export type SemanticPassageInput = {
  profile: ProfileForChunking
  visibilityTier: EmbeddableVisibilityTier
  facts: string[]
}

export type SemanticPassage = {
  sourceSection: Extract<ChunkSourceSection, 'career_path_summary' | 'help_topics_summary'>
  content: string
}

export type SemanticPassageGenerator = (
  input: SemanticPassageInput,
) => Promise<SemanticPassage[]> | SemanticPassage[]

export async function buildProfileEmbeddingChunks(
  profile: ProfileForChunking,
  generateSemanticPassages?: SemanticPassageGenerator,
): Promise<ProfileEmbeddingChunk[]> {
  const settings = parseStoredPrivacySettings(profile.privacySettings)
  const rawChunks = buildRawChunks(profile, settings)
  const chunks = [...rawChunks]

  if (generateSemanticPassages) {
    for (const tier of ['org', 'friends'] as const) {
      const facts = factsVisibleAtTier(rawChunks, tier)
      if (facts.length === 0) continue
      const passages = await generateSemanticPassages({ profile, visibilityTier: tier, facts })
      for (const passage of passages) {
        chunks.push(
          makeChunk(profile, {
            chunkKind: 'synthetic',
            sourceSection: passage.sourceSection,
            visibilityTier: tier,
            content: passage.content,
            syntheticPromptVersion: SYNTHETIC_CHUNK_PROMPT_VERSION,
          }),
        )
      }
    }
  }

  return dedupeChunks(chunks)
}

export function buildRawChunks(
  profile: ProfileForChunking,
  settings: PrivacySettings,
): ProfileEmbeddingChunk[] {
  const chunks: ProfileEmbeddingChunk[] = []
  const directory = formatDirectory(profile)
  if (directory) {
    chunks.push(
      makeChunk(profile, {
        chunkKind: 'raw',
        sourceSection: 'directory',
        visibilityTier: 'org',
        content: directory,
        syntheticPromptVersion: RAW_CHUNK_PROMPT_VERSION,
      }),
    )
  }

  pushSectionChunk(chunks, profile, settings, 'career_history', formatCareer(profile.careerHistory))
  pushSectionChunk(
    chunks,
    profile,
    settings,
    'education_history',
    formatEducation(profile.educationHistory),
  )
  pushSectionChunk(chunks, profile, settings, 'bio', profile.bio)
  pushSectionChunk(chunks, profile, settings, 'skills', profile.skills?.join(', ') ?? null)

  const bioTier = embeddableTier(effectiveTier(settings, 'bio'))
  const topics = profile.mentoringTopics?.filter(Boolean).join(', ') ?? null
  if (bioTier && topics) {
    chunks.push(
      makeChunk(profile, {
        chunkKind: 'raw',
        sourceSection: 'mentoring_topics',
        visibilityTier: bioTier,
        content: `Mentoring topics: ${topics}`,
        syntheticPromptVersion: RAW_CHUNK_PROMPT_VERSION,
      }),
    )
  }

  return chunks
}

export function contentHash(content: string): string {
  return createHash('sha256').update(normalizeContent(content)).digest('hex')
}

function pushSectionChunk(
  chunks: ProfileEmbeddingChunk[],
  profile: ProfileForChunking,
  settings: PrivacySettings,
  section: Extract<ChunkSourceSection, 'career_history' | 'education_history' | 'bio' | 'skills'>,
  content: string | null | undefined,
) {
  const visibilityTier = embeddableTier(effectiveTier(settings, section))
  if (!visibilityTier || !content?.trim()) return
  chunks.push(
    makeChunk(profile, {
      chunkKind: 'raw',
      sourceSection: section,
      visibilityTier,
      content,
      syntheticPromptVersion: RAW_CHUNK_PROMPT_VERSION,
    }),
  )
}

function makeChunk(
  profile: ProfileForChunking,
  input: {
    chunkKind: ChunkKind
    sourceSection: ChunkSourceSection
    visibilityTier: EmbeddableVisibilityTier
    content: string
    syntheticPromptVersion: string | null
  },
): ProfileEmbeddingChunk {
  const normalized = normalizeContent(input.content)
  return {
    organizationId: profile.organizationId,
    userId: profile.userId,
    organizationMembershipId: profile.organizationMembershipId,
    chunkKind: input.chunkKind,
    sourceSection: input.sourceSection,
    visibilityTier: input.visibilityTier,
    content: normalized,
    contentHash: contentHash(normalized),
    syntheticPromptVersion: input.syntheticPromptVersion,
    embeddingModel: VOYAGE_EMBEDDING_MODEL,
    embeddingDim: VOYAGE_EMBEDDING_DIMENSIONS,
  }
}

function embeddableTier(tier: PrivacyTier): EmbeddableVisibilityTier | null {
  return tier === 'self' ? null : tier
}

function factsVisibleAtTier(chunks: ProfileEmbeddingChunk[], tier: EmbeddableVisibilityTier) {
  return chunks
    .filter((chunk) => chunk.visibilityTier === 'org' || chunk.visibilityTier === tier)
    .map((chunk) => `${chunk.sourceSection}: ${chunk.content}`)
}

function dedupeChunks(chunks: ProfileEmbeddingChunk[]) {
  const seen = new Set<string>()
  const out: ProfileEmbeddingChunk[] = []
  for (const chunk of chunks) {
    const key = [
      chunk.userId,
      chunk.chunkKind,
      chunk.sourceSection,
      chunk.visibilityTier,
      chunk.contentHash,
    ].join(':')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(chunk)
  }
  return out
}

function normalizeContent(content: string) {
  return content.trim().replace(/\s+/g, ' ')
}

function formatDirectory(profile: ProfileForChunking) {
  const parts = [
    profile.preferredName
      ? `Name: ${profile.preferredName}`
      : profile.name
        ? `Name: ${profile.name}`
        : null,
    profile.headline ? `Headline: ${profile.headline}` : null,
    profile.currentTitle && profile.currentEmployer
      ? `Current role: ${profile.currentTitle} at ${profile.currentEmployer}`
      : profile.currentTitle
        ? `Current title: ${profile.currentTitle}`
        : profile.currentEmployer
          ? `Current employer: ${profile.currentEmployer}`
          : null,
    profile.city ? `City: ${profile.city}` : null,
    profile.university ? `University: ${profile.university}` : null,
    profile.major ? `Major: ${profile.major}` : null,
    profile.graduationYear ? `Class year: ${profile.graduationYear}` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join('. ') : null
}

function formatCareer(history: CareerEntry[] | null) {
  if (!history || history.length === 0) return null
  return history
    .filter((entry) => entry.employer || entry.title || entry.description)
    .map((entry) => {
      const role = entry.title ? `${entry.title} at ${entry.employer}` : entry.employer
      const dates = formatDates(entry.start_date, entry.end_date)
      return [dates, role, entry.description].filter(Boolean).join(' - ')
    })
    .join('. ')
}

function formatEducation(history: EducationEntry[] | null) {
  if (!history || history.length === 0) return null
  return history
    .filter((entry) => entry.school || entry.degree || entry.field)
    .map((entry) => {
      const degree = [entry.degree, entry.field].filter(Boolean).join(', ')
      const dates = formatDates(entry.start_date, entry.end_date)
      return [dates, entry.school, degree].filter(Boolean).join(' - ')
    })
    .join('. ')
}

function formatDates(start: string | null, end: string | null) {
  if (!start && !end) return null
  if (start && end) return `${start}-${end}`
  if (start) return `${start}-present`
  return end
}
