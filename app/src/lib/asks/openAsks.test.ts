import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { Database } from '@/db/database.types'
import { createOpenAsk, OPEN_ASK_MAX_LENGTH, OPEN_ASK_TTL_DAYS } from './openAsks'

/** Minimal stub of the supabase insert chain. Records the inserted row and
 * resolves with the given response. */
function stubInsertClient(response: { data: unknown; error: { code: string } | null }) {
  const calls: Record<string, unknown>[] = []
  const client = {
    from(table: string) {
      if (table !== 'open_asks') throw new Error(`unexpected table ${table}`)
      return {
        insert(row: Record<string, unknown>) {
          calls.push(row)
          return {
            select() {
              return {
                async single() {
                  return response
                },
              }
            },
          }
        },
      }
    },
  }
  return { client: client as unknown as SupabaseClient<Database>, calls }
}

function neverTouchedClient() {
  return {
    from() {
      throw new Error('db should not be touched for invalid input')
    },
  } as unknown as SupabaseClient<Database>
}

const base = { userId: 'user-1', organizationId: 'org-1' }

describe('createOpenAsk', () => {
  it('rejects questions under the minimum without touching the db', async () => {
    const result = await createOpenAsk(neverTouchedClient(), { ...base, question: 'too short' })
    expect(result).toEqual({ ok: false, error: 'invalid_question' })
  })

  it('rejects questions over the maximum without touching the db', async () => {
    const result = await createOpenAsk(neverTouchedClient(), {
      ...base,
      question: 'x'.repeat(OPEN_ASK_MAX_LENGTH + 1),
    })
    expect(result).toEqual({ ok: false, error: 'invalid_question' })
  })

  it('inserts a trimmed question with the TTL expiry', async () => {
    const now = new Date('2026-06-11T12:00:00Z')
    const { client, calls } = stubInsertClient({
      data: {
        id: 'ask-1',
        question: 'Should I take the consulting offer?',
        created_at: now.toISOString(),
        expires_at: '2026-06-25T12:00:00Z',
      },
      error: null,
    })

    const result = await createOpenAsk(client, {
      ...base,
      question: '  Should I take the consulting offer?  ',
      now,
    })

    expect(result.ok).toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0].question).toBe('Should I take the consulting offer?')
    const expectedExpiry = new Date(now.getTime() + OPEN_ASK_TTL_DAYS * 24 * 60 * 60 * 1000)
    expect(calls[0].expires_at).toBe(expectedExpiry.toISOString())
  })

  it('maps the partial-unique-index violation to already_open', async () => {
    const { client } = stubInsertClient({ data: null, error: { code: '23505' } })
    const result = await createOpenAsk(client, {
      ...base,
      question: 'Should I take the consulting offer?',
    })
    expect(result).toEqual({ ok: false, error: 'already_open' })
  })
})
