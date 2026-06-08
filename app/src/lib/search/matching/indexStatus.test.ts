import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  markProfileEmbeddingFailed,
  markProfileEmbeddingReady,
  sanitizeIndexError,
} from './indexStatus'

describe('profile embedding index status helpers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sanitizes provider errors before status storage', () => {
    const result = sanitizeIndexError(new Error('Voyage failed\nwith\ttoo much detail'))

    expect(result).toBe('Voyage failed with too much detail')
  })

  it('bounds stored error length', () => {
    const result = sanitizeIndexError('x'.repeat(600))

    expect(result).toHaveLength(500)
  })

  it('upserts a ready status row for direct index runs', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-09T00:00:00.000Z'))
    const calls: Array<{ table: string; payload: unknown; options: unknown }> = []
    const admin = {
      from: (table: string) => ({
        upsert: async (payload: unknown, options: unknown) => {
          calls.push({ table, payload, options })
          return { error: null }
        },
      }),
    }

    await markProfileEmbeddingReady(
      {
        organizationId: 'org-1',
        userId: 'user-1',
        organizationMembershipId: 'membership-1',
      },
      { admin: admin as never },
    )

    expect(calls).toEqual([
      {
        table: 'profile_embedding_index_status',
        payload: {
          organization_id: 'org-1',
          user_id: 'user-1',
          organization_membership_id: 'membership-1',
          status: 'ready',
          dirty_reason: null,
          dirty_since: null,
          last_indexed_at: '2026-06-09T00:00:00.000Z',
          last_success_at: '2026-06-09T00:00:00.000Z',
          last_error: null,
          locked_at: null,
          locked_by: null,
          updated_at: '2026-06-09T00:00:00.000Z',
        },
        options: { onConflict: 'organization_id,user_id,organization_membership_id' },
      },
    ])
  })

  it('upserts a failed status row with sanitized errors', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-09T00:00:00.000Z'))
    const calls: Array<{ table: string; payload: unknown; options: unknown }> = []
    const admin = {
      from: (table: string) => ({
        upsert: async (payload: unknown, options: unknown) => {
          calls.push({ table, payload, options })
          return { error: null }
        },
      }),
    }

    await markProfileEmbeddingFailed(
      {
        organizationId: 'org-1',
        userId: 'user-1',
        organizationMembershipId: 'membership-1',
      },
      new Error('Voyage failed\nwith secret-looking multiline detail'),
      { admin: admin as never },
    )

    expect(calls[0]).toEqual({
      table: 'profile_embedding_index_status',
      payload: {
        organization_id: 'org-1',
        user_id: 'user-1',
        organization_membership_id: 'membership-1',
        status: 'failed',
        dirty_since: '2026-06-09T00:00:00.000Z',
        last_indexed_at: '2026-06-09T00:00:00.000Z',
        last_error: 'Voyage failed with secret-looking multiline detail',
        locked_at: null,
        locked_by: null,
        updated_at: '2026-06-09T00:00:00.000Z',
      },
      options: { onConflict: 'organization_id,user_id,organization_membership_id' },
    })
  })
})
