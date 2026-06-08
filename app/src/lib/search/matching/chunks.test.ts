import { describe, expect, it } from 'vitest'
import { buildProfileEmbeddingChunks, buildRawChunks, type ProfileForChunking } from './chunks'

const baseProfile: ProfileForChunking = {
  userId: 'user-1',
  organizationId: 'org-1',
  organizationMembershipId: 'membership-1',
  name: 'Jamie Kim',
  preferredName: null,
  headline: 'Product manager',
  currentEmployer: 'Stripe',
  currentTitle: 'Product Manager',
  city: 'New York, NY',
  university: 'Cornell University',
  major: 'Economics',
  graduationYear: 2020,
  bio: 'Former consultant now working in product.',
  mentoringTopics: ['Career transitions', 'Product management'],
  careerHistory: [
    {
      employer: 'McKinsey',
      title: 'Associate',
      start_date: '2018',
      end_date: '2020',
      description: 'Strategy consulting.',
    },
  ],
  educationHistory: [
    {
      school: 'Cornell University',
      degree: 'BA',
      field: 'Economics',
      start_date: '2016',
      end_date: '2020',
    },
  ],
  skills: ['product strategy', 'consulting'],
  privacySettings: {},
}

describe('profile embedding chunks', () => {
  it('builds org-visible raw chunks for default-visible sections', () => {
    const chunks = buildRawChunks(baseProfile, {})

    expect(chunks.map((chunk) => chunk.sourceSection)).toContain('directory')
    expect(chunks.map((chunk) => chunk.sourceSection)).toContain('career_history')
    expect(chunks.every((chunk) => chunk.visibilityTier === 'org')).toBe(true)
  })

  it('excludes self-only profile sections from Ask embeddings', () => {
    const chunks = buildRawChunks(baseProfile, {
      career_history: 'self',
      education_history: 'self',
      bio: 'self',
      skills: 'self',
    })

    expect(chunks.map((chunk) => chunk.sourceSection)).toEqual(['directory'])
  })

  it('keeps friends-only chunks separate from org-visible chunks', () => {
    const chunks = buildRawChunks(baseProfile, {
      career_history: 'friends',
      skills: 'friends',
    })

    const career = chunks.find((chunk) => chunk.sourceSection === 'career_history')
    const skills = chunks.find((chunk) => chunk.sourceSection === 'skills')
    expect(career?.visibilityTier).toBe('friends')
    expect(skills?.visibilityTier).toBe('friends')
  })

  it('creates semantic chunks from visibility-scoped fact bundles', async () => {
    const chunks = await buildProfileEmbeddingChunks(baseProfile, ({ visibilityTier, facts }) => [
      {
        sourceSection: 'career_path_summary',
        content: `${visibilityTier}: ${facts.join(' | ')}`,
      },
    ])

    const synthetic = chunks.filter((chunk) => chunk.chunkKind === 'synthetic')
    expect(synthetic.length).toBeGreaterThan(0)
    expect(synthetic.every((chunk) => chunk.syntheticPromptVersion)).toBe(true)
  })

  it('changes content hashes when visible facts change', () => {
    const original = buildRawChunks(baseProfile, {})
    const changed = buildRawChunks({ ...baseProfile, currentEmployer: 'OpenAI' }, {})

    const originalDirectory = original.find((chunk) => chunk.sourceSection === 'directory')
    const changedDirectory = changed.find((chunk) => chunk.sourceSection === 'directory')
    expect(originalDirectory?.contentHash).not.toBe(changedDirectory?.contentHash)
  })
})
