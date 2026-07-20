import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { Database } from '@/db/database.types'
import type { OutboxJobError } from '@/lib/outbox/contracts'
import { createEntryOperationsWorker } from './entry-operations'

describe('entry operations worker', () => {
  it('classifies a malformed invite payload as terminal before any provider work', async () => {
    const worker = createEntryOperationsWorker(
      {} as SupabaseClient<Database>,
      'http://localhost:3000',
    )

    await expect(
      worker.sendInvite(
        {
          inviteId: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          recipientEmail: 'a@b',
          token: 'x'.repeat(32),
        },
        'outbox:1',
        new AbortController().signal,
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<OutboxJobError>>({
        code: 'invalid_invite_payload',
        terminal: true,
      }),
    )
  })
})
