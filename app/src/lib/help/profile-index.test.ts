import { describe, expect, it } from 'vitest'
import { buildHelpProfileIndexPlan, type HelpProfileFact } from './profile-index'

const facts: HelpProfileFact[] = [
  {
    id: 'directory',
    sourceSection: 'directory',
    visibility: 'organization',
    content: ' Product leader at Acme ',
  },
  {
    id: 'topics',
    sourceSection: 'helper_topics',
    visibility: 'organization',
    content: 'Product strategy, career transitions',
  },
]

describe('Help profile index planning', () => {
  it('normalizes facts and marks only missing fingerprints for embedding', () => {
    const first = buildHelpProfileIndexPlan({
      facts,
      existingChunks: [],
      embeddingModel: 'voyage-4',
      embeddingDimensions: 1024,
    })
    const second = buildHelpProfileIndexPlan({
      facts,
      existingChunks: [
        {
          id: '70000000-0000-4000-8000-000000000001',
          fingerprint: first.chunks[0]?.fingerprint ?? '',
        },
      ],
      embeddingModel: 'voyage-4',
      embeddingDimensions: 1024,
    })
    expect(first.chunks[0]?.content).toBe('Product leader at Acme')
    expect(first.chunksToEmbed).toHaveLength(2)
    expect(second.chunksToEmbed).toHaveLength(1)
    expect(second.obsoleteChunkIds).toEqual([])
  })

  it('invalidates old chunks when model or content version changes', () => {
    const oldPlan = buildHelpProfileIndexPlan({
      facts,
      existingChunks: [],
      embeddingModel: 'voyage-4',
      embeddingDimensions: 1024,
      contentVersion: 'v1',
    })
    const changed = buildHelpProfileIndexPlan({
      facts,
      existingChunks: oldPlan.chunks.map((item, index) => ({
        id: `70000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        fingerprint: item.fingerprint,
      })),
      embeddingModel: 'voyage-4',
      embeddingDimensions: 1024,
      contentVersion: 'v2',
    })
    expect(changed.chunksToEmbed).toHaveLength(2)
    expect(changed.obsoleteChunkIds).toHaveLength(2)
  })

  it('allows retrieval-only synthetic passages only when they cite raw fact IDs', () => {
    const plan = buildHelpProfileIndexPlan({
      facts,
      syntheticPassages: [
        {
          sourceSection: 'career_path_summary',
          visibility: 'organization',
          content: 'Has navigated product leadership transitions.',
          evidenceFactIds: ['directory'],
        },
      ],
      existingChunks: [],
      embeddingModel: 'voyage-4',
      embeddingDimensions: 1024,
    })
    expect(plan.chunks.at(-1)).toMatchObject({
      chunkKind: 'synthetic',
      sourceSection: 'career_path_summary',
      syntheticPromptVersion: 'help-passages-v1',
    })
    expect(() =>
      buildHelpProfileIndexPlan({
        facts,
        syntheticPassages: [
          {
            sourceSection: 'career_path_summary',
            visibility: 'organization',
            content: 'Unsupported passage',
            evidenceFactIds: ['missing'],
          },
        ],
        existingChunks: [],
        embeddingModel: 'voyage-4',
        embeddingDimensions: 1024,
      }),
    ).toThrow('invalid evidence')
  })

  it('does not widen connection-only evidence into an organization-visible passage', () => {
    expect(() =>
      buildHelpProfileIndexPlan({
        facts: [
          ...facts,
          {
            id: 'private-career',
            sourceSection: 'career_history',
            visibility: 'connections',
            content: 'Connection-only career detail',
          },
        ],
        syntheticPassages: [
          {
            sourceSection: 'career_path_summary',
            visibility: 'organization',
            content: 'A broader passage built from a restricted fact.',
            evidenceFactIds: ['private-career'],
          },
        ],
        existingChunks: [],
        embeddingModel: 'voyage-4',
        embeddingDimensions: 1024,
      }),
    ).toThrow('invalid evidence')
  })

  it('deduplicates identical chunks and drops blank facts', () => {
    const duplicateFact = facts[0]
    if (!duplicateFact) throw new Error('missing fixture')
    const plan = buildHelpProfileIndexPlan({
      facts: [
        duplicateFact,
        { ...duplicateFact, id: 'duplicate' },
        {
          id: 'blank',
          sourceSection: 'bio',
          visibility: 'organization',
          content: '   ',
        },
      ],
      existingChunks: [],
      embeddingModel: 'voyage-4',
      embeddingDimensions: 1024,
    })
    expect(plan.chunks).toHaveLength(1)
  })
})
