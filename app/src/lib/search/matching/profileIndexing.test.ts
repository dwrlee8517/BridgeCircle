import { describe, expect, it } from 'vitest'
import { buildRawChunks, type ProfileForChunking } from './chunks'
import { planEmbeddingChunkChanges } from './profileIndexing'

const profile: ProfileForChunking = {
  userId: 'user-1',
  organizationId: 'org-1',
  organizationMembershipId: 'membership-1',
  name: 'Jamie Kim',
  preferredName: null,
  headline: 'Product manager',
  currentEmployer: 'Stripe',
  currentTitle: 'Product Manager',
  city: 'New York',
  university: 'Cornell University',
  major: 'Economics',
  graduationYear: 2020,
  bio: 'Former consultant now working in product.',
  mentoringTopics: ['Career transitions'],
  careerHistory: [
    {
      employer: 'McKinsey',
      title: 'Associate',
      start_date: '2018',
      end_date: '2020',
      description: 'Strategy consulting.',
    },
  ],
  educationHistory: null,
  skills: ['product strategy'],
  privacySettings: {},
}

describe('profile Ask embedding indexing planner', () => {
  it('reuses unchanged chunks without embedding or deleting them', () => {
    const chunks = buildRawChunks(profile, {})
    const existing = chunks.map((chunk, index) => ({
      id: `chunk-${index}`,
      chunk_kind: chunk.chunkKind,
      source_section: chunk.sourceSection,
      visibility_tier: chunk.visibilityTier,
      content_hash: chunk.contentHash,
      synthetic_prompt_version: chunk.syntheticPromptVersion,
      embedding_model: chunk.embeddingModel,
      embedding_dim: chunk.embeddingDim,
    }))

    const plan = planEmbeddingChunkChanges(chunks, existing)

    expect(plan.reusedChunks).toBe(chunks.length)
    expect(plan.chunksToEmbed).toHaveLength(0)
    expect(plan.staleIds).toHaveLength(0)
  })

  it('embeds changed chunks and deletes stale old chunks only after planning replacement', () => {
    const original = buildRawChunks(profile, {})
    const changed = buildRawChunks({ ...profile, currentEmployer: 'OpenAI' }, {})
    const existing = original.map((chunk, index) => ({
      id: `chunk-${index}`,
      chunk_kind: chunk.chunkKind,
      source_section: chunk.sourceSection,
      visibility_tier: chunk.visibilityTier,
      content_hash: chunk.contentHash,
      synthetic_prompt_version: chunk.syntheticPromptVersion,
      embedding_model: chunk.embeddingModel,
      embedding_dim: chunk.embeddingDim,
    }))

    const plan = planEmbeddingChunkChanges(changed, existing)

    expect(plan.chunksToEmbed.map((chunk) => chunk.sourceSection)).toContain('directory')
    expect(plan.staleIds).toContain('chunk-0')
    expect(plan.reusedChunks).toBe(changed.length - plan.chunksToEmbed.length)
  })

  it('plans deletions when privacy removes a previously indexed section', () => {
    const original = buildRawChunks(profile, {})
    const privateCareer = buildRawChunks(profile, { career_history: 'self' })
    const existing = original.map((chunk, index) => ({
      id: `chunk-${index}`,
      chunk_kind: chunk.chunkKind,
      source_section: chunk.sourceSection,
      visibility_tier: chunk.visibilityTier,
      content_hash: chunk.contentHash,
      synthetic_prompt_version: chunk.syntheticPromptVersion,
      embedding_model: chunk.embeddingModel,
      embedding_dim: chunk.embeddingDim,
    }))

    const plan = planEmbeddingChunkChanges(privateCareer, existing)

    const staleCareerId = existing.find((row) => row.source_section === 'career_history')?.id
    expect(staleCareerId).toBeDefined()
    expect(plan.staleIds).toContain(staleCareerId)
    expect(privateCareer.map((chunk) => chunk.sourceSection)).not.toContain('career_history')
  })
})
