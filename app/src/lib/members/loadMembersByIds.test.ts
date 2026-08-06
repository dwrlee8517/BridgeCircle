import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { Database } from '@/db/database.types'
import { loadMembersByIds } from './loadMembersByIds'

/** Minimal stub of the `.from('base_profiles').select(...).in(...)` chain.
 * Records the ids passed to `.in()` and resolves with the given rows/error. */
function stubSelectClient(
  rows: Record<string, unknown>[],
  error: { message: string } | null = null,
) {
  let receivedIds: readonly string[] | null = null
  const client = {
    from(table: string) {
      if (table !== 'base_profiles') throw new Error(`unexpected table ${table}`)
      return {
        select() {
          return {
            in(_column: string, ids: readonly string[]) {
              receivedIds = ids
              return Promise.resolve({ data: error ? null : rows, error })
            },
          }
        },
      }
    },
  }
  return { client: client as unknown as SupabaseClient<Database>, ids: () => receivedIds }
}

const row = (userId: string, name: string) => ({
  user_id: userId,
  name,
  preferred_name: null,
  headline: null,
  current_employer: null,
  current_title: null,
  city: null,
  university: null,
  major: null,
  avatar_url: null,
})

describe('loadMembersByIds', () => {
  it('returns an empty map without touching the db for no ids', async () => {
    const { client, ids } = stubSelectClient([])
    const result = await loadMembersByIds(client, [])
    expect(result.size).toBe(0)
    expect(ids()).toBeNull()
  })

  it('keys members by user id from a single query', async () => {
    const { client, ids } = stubSelectClient([row('u1', 'Ada'), row('u2', 'Grace')])
    const result = await loadMembersByIds(client, ['u1', 'u2'])
    expect(ids()).toEqual(['u1', 'u2'])
    expect(result.get('u1')?.name).toBe('Ada')
    expect(result.get('u2')?.name).toBe('Grace')
  })

  it('omits ids RLS filtered out (absent from the returned rows)', async () => {
    // The viewer may request u3, but RLS drops it — it simply isn't returned,
    // so the caller resolves it to null rather than leaking its existence.
    const { client } = stubSelectClient([row('u1', 'Ada')])
    const result = await loadMembersByIds(client, ['u1', 'u3'])
    expect(result.has('u1')).toBe(true)
    expect(result.has('u3')).toBe(false)
  })

  it('throws on a db error', async () => {
    const { client } = stubSelectClient([], { message: 'boom' })
    await expect(loadMembersByIds(client, ['u1'])).rejects.toEqual({ message: 'boom' })
  })
})
