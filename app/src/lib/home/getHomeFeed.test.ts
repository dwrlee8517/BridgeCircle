import { describe, expect, it } from 'vitest'
import { getHomeFeed } from './getHomeFeed'

const VIEWER = 'viewer-1'
const OTHER = 'other-1'
const ORG = 'org-1'

/**
 * Chainable Supabase query mock. Each `.from(table)` returns a thenable
 * builder that resolves to the canned rows for that table and records every
 * filter call so tests can assert query intent (e.g. viewer exclusion).
 */
type FilterCall = { method: string; args: unknown[] }

function makeSupabaseMock(rowsByTable: Record<string, unknown[]>) {
  const filterCalls: Record<string, FilterCall[]> = {}

  function builder(table: string) {
    const calls: FilterCall[] = []
    filterCalls[table] = filterCalls[table] ?? []
    filterCalls[table].push(...[]) // ensure key exists
    const record = (method: string, args: unknown[]) => {
      const call = { method, args }
      calls.push(call)
      filterCalls[table].push(call)
    }

    const rows = rowsByTable[table] ?? []
    // Apply flat eq/neq filters so the mock behaves like PostgREST for
    // non-joined columns; joined-path filters (containing a dot) are ignored.
    const result = () => {
      let out = rows as Record<string, unknown>[]
      for (const c of calls) {
        const [col, val] = c.args as [string, unknown]
        if (typeof col !== 'string' || col.includes('.')) continue
        if (c.method === 'eq') out = out.filter((r) => !(col in r) || r[col] === val)
        if (c.method === 'neq') out = out.filter((r) => !(col in r) || r[col] !== val)
      }
      return out
    }

    const b: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'neq', 'is', 'not', 'gte', 'or', 'order', 'limit', 'in']) {
      b[m] = (...args: unknown[]) => {
        if (m === 'eq' || m === 'neq') record(m, args)
        return b
      }
    }
    b.maybeSingle = () => Promise.resolve({ data: result()[0] ?? null, error: null })
    b.single = b.maybeSingle
    // Thenable: `await query` resolves like a Supabase response. `count` is
    // included for the head:true count query on organization_memberships.
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mirrors Supabase's awaitable query builder
    b.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: result(), error: null, count: result().length }).then(resolve)
    return b
  }

  return {
    client: { from: (table: string) => builder(table) },
    filterCalls,
  }
}

function membershipRow(userId: string) {
  return {
    user_id: userId,
    joined_at: '2026-06-01T00:00:00Z',
    organization_id: ORG,
    status: 'active',
    organization_profiles: { graduation_year: 2018 },
  }
}

describe('getHomeFeed viewer exclusion', () => {
  it('never includes the viewer in their own home rails', async () => {
    const { client, filterCalls } = makeSupabaseMock({
      organization_memberships: [membershipRow(VIEWER), membershipRow(OTHER)],
      helper_preferences: [
        // The joined-path .neq can't be applied by this mock, so the viewer
        // row coming back here exercises the defensive in-code filter.
        { organization_membership_id: 'm-viewer', organization_memberships: membershipRow(VIEWER) },
        { organization_membership_id: 'm-other', organization_memberships: membershipRow(OTHER) },
      ],
      events: [],
      announcements: [],
      asks: [],
      notifications: [],
      ask_threads: [],
      base_profiles: [
        { user_id: VIEWER, name: 'Viewer Vee', avatar_url: null },
        { user_id: OTHER, name: 'Other Oh', avatar_url: null },
      ],
      event_rsvps: [],
    })

    const feed = await getHomeFeed(
      client as unknown as Parameters<typeof getHomeFeed>[0],
      ORG,
      VIEWER,
    )

    expect(feed.openMentors.map((m) => m.userId)).not.toContain(VIEWER)
    expect(feed.openMentors.map((m) => m.userId)).toContain(OTHER)
    expect(feed.recentJoiners.map((m) => m.userId)).not.toContain(VIEWER)

    // Query intent: the flat membership queries exclude the viewer at the DB.
    const membershipNeqs = (filterCalls.organization_memberships ?? []).filter(
      (c) => c.method === 'neq' && c.args[0] === 'user_id' && c.args[1] === VIEWER,
    )
    expect(membershipNeqs.length).toBeGreaterThanOrEqual(2)
  })
})
