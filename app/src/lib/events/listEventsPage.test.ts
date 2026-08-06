import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { Database } from '@/db/database.types'
import { encodeKeysetCursor } from '@/lib/pagination/keyset'
import { listEventsPage } from './listEventsPage'

type EventRecord = {
  id: string
  title: string
  description: string | null
  location: string | null
  starts_at: string
  published_at: string | null
  capacity: number | null
}

/** Stub the events keyset query and the two event_rsvps hydration queries.
 * The stub does not itself filter/order — it records the `.or()` keyset filter
 * and returns canned rows, so we test query construction + mapping, not the DB. */
function stubClient(opts: {
  events: EventRecord[]
  rsvps?: { event_id: string; status: string }[]
  viewerRsvps?: { event_id: string; status: string }[]
}) {
  const orCalls: string[] = []

  function eventsChain() {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      gte: () => chain,
      not: () => chain,
      or: (arg: string) => {
        orCalls.push(arg)
        return chain
      },
      order: () => chain,
      limit: () => Promise.resolve({ data: opts.events, error: null }),
    }
    return chain
  }

  function rsvpChain() {
    let isViewer = false
    const chain: Record<string, unknown> = {
      select: () => chain,
      in: () => chain,
      eq: (column: string) => {
        if (column === 'user_id') isViewer = true
        return chain
      },
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve({
          data: isViewer ? (opts.viewerRsvps ?? []) : (opts.rsvps ?? []),
          error: null,
        }).then(resolve, reject),
    }
    return chain
  }

  const client = {
    from(table: string) {
      if (table === 'events') return eventsChain()
      if (table === 'event_rsvps') return rsvpChain()
      throw new Error(`unexpected table ${table}`)
    },
  }
  return { client: client as unknown as SupabaseClient<Database>, orCalls: () => orCalls }
}

const evt = (id: string, startsAt: string): EventRecord => ({
  id,
  title: `Event ${id}`,
  description: null,
  location: null,
  starts_at: startsAt,
  published_at: startsAt,
  capacity: null,
})

const base = { organizationId: 'org-1', viewerId: 'user-1', limit: 10, inverted: false }

describe('listEventsPage', () => {
  it('maps rows and hydrates going/waitlist counts and viewerRsvp', async () => {
    const { client } = stubClient({
      events: [evt('e1', '2026-09-01T00:00:00Z'), evt('e2', '2026-09-02T00:00:00Z')],
      rsvps: [
        { event_id: 'e1', status: 'going' },
        { event_id: 'e1', status: 'going' },
        { event_id: 'e1', status: 'waitlisted' },
      ],
      viewerRsvps: [{ event_id: 'e2', status: 'going' }],
    })
    const rows = await listEventsPage(client, base)
    expect(rows.map((r) => r.id)).toEqual(['e1', 'e2'])
    expect(rows[0]).toMatchObject({ goingCount: 2, waitlistCount: 1, viewerRsvp: null })
    expect(rows[1]).toMatchObject({ goingCount: 0, waitlistCount: 0, viewerRsvp: 'going' })
  })

  it('reverses rows when paging backward (inverted)', async () => {
    const { client } = stubClient({
      events: [evt('e2', '2026-09-02T00:00:00Z'), evt('e1', '2026-09-01T00:00:00Z')],
    })
    const rows = await listEventsPage(client, { ...base, inverted: true })
    // Fetched descending; returned ascending.
    expect(rows.map((r) => r.id)).toEqual(['e1', 'e2'])
  })

  it('applies a forward keyset filter for the after cursor', async () => {
    const { client, orCalls } = stubClient({ events: [] })
    await listEventsPage(client, {
      ...base,
      after: encodeKeysetCursor('2026-09-01T00:00:00Z', 'e1'),
    })
    expect(orCalls()).toContain(
      'starts_at.gt.2026-09-01T00:00:00Z,and(starts_at.eq.2026-09-01T00:00:00Z,id.gt.e1)',
    )
  })

  it('returns an empty page without hydration when no events match', async () => {
    const { client } = stubClient({ events: [] })
    expect(await listEventsPage(client, base)).toEqual([])
  })
})
