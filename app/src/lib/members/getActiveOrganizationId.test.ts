import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { Database } from '@/db/database.types'
import { getActiveOrganizationId } from './getActiveOrganizationId'

/** Stub the `.from().select().eq().eq().limit().maybeSingle()` chain. */
function stubClient(response: { data: { organization_id: string } | null; error: unknown }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    limit: () => chain,
    maybeSingle: () => Promise.resolve(response),
  }
  const client = {
    from(table: string) {
      if (table !== 'organization_memberships') throw new Error(`unexpected table ${table}`)
      return chain
    },
  }
  return client as unknown as SupabaseClient<Database>
}

describe('getActiveOrganizationId', () => {
  it('returns the active organization id', async () => {
    const db = stubClient({ data: { organization_id: 'org-1' }, error: null })
    expect(await getActiveOrganizationId(db, 'user-1')).toBe('org-1')
  })

  it('returns null when the member has no active membership', async () => {
    const db = stubClient({ data: null, error: null })
    expect(await getActiveOrganizationId(db, 'user-1')).toBeNull()
  })

  it('returns null on a db error rather than throwing', async () => {
    const db = stubClient({ data: null, error: { message: 'boom' } })
    expect(await getActiveOrganizationId(db, 'user-1')).toBeNull()
  })
})
