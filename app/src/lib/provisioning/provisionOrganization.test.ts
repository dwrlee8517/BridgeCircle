import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { Database } from '@/db/database.types'
import { provisionOrganization } from './provisionOrganization'

/**
 * Unit coverage for the failure paths. The integration suite proves the happy
 * path against a real database; what it can't easily force is a mid-sequence
 * failure, so the rollback contract is pinned here with a stub client.
 */

type TableResponse = { data?: unknown; error?: { code?: string; message?: string } | null }

type StubOptions = {
  /** Per-table insert responses. Missing tables succeed with a generated id. */
  inserts?: Record<string, TableResponse>
  createUser?: { id?: string; error?: { message: string } }
}

type Recorded = {
  inserts: Array<{ table: string; row: Record<string, unknown> }>
  deletedOrgIds: string[]
  deletedUserIds: string[]
}

function stubClient(options: StubOptions = {}) {
  const recorded: Recorded = { inserts: [], deletedOrgIds: [], deletedUserIds: [] }

  const client = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          recorded.inserts.push({ table, row })
          const configured = options.inserts?.[table]
          const response = configured ?? { data: { id: `${table}-id` }, error: null }
          return {
            select() {
              return {
                async single() {
                  return response
                },
              }
            },
            // PostgREST's builder is itself a thenable, so an insert that
            // doesn't chain .select() is awaited directly. The stub has to
            // model that to stand in for the real client.
            // biome-ignore lint/suspicious/noThenProperty: deliberate thenable — emulates the PostgREST query builder
            then(resolve: (value: TableResponse) => unknown) {
              return Promise.resolve(response).then(resolve)
            },
          }
        },
        delete() {
          return {
            async eq(_column: string, value: string) {
              recorded.deletedOrgIds.push(value)
              return { data: null, error: null }
            },
          }
        },
      }
    },
    auth: {
      admin: {
        async createUser() {
          if (options.createUser?.error) {
            return { data: { user: null }, error: options.createUser.error }
          }
          return {
            data: { user: { id: options.createUser?.id ?? 'admin-user-id' } },
            error: null,
          }
        },
        async deleteUser(id: string) {
          recorded.deletedUserIds.push(id)
          return { data: null, error: null }
        },
      },
    },
  }

  return { client: client as unknown as SupabaseClient<Database>, recorded }
}

const input = {
  organization: { name: 'Test Org', slug: 'test-org' },
  admin: { email: 'admin@example.com', password: 'a-good-password' },
}

describe('provisionOrganization', () => {
  it('writes the tenant in dependency order and returns its ids', async () => {
    const { client, recorded } = stubClient()

    const result = await provisionOrganization(client, input)

    expect(result).toMatchObject({ ok: true })
    expect(recorded.inserts.map((i) => i.table)).toEqual([
      'organizations',
      'organization_memberships',
      'profiles',
      'organization_profiles',
      'admin_role_assignments',
    ])
  })

  it('grants super_admin to the membership, not the user', async () => {
    const { client, recorded } = stubClient()

    await provisionOrganization(client, input)

    const grant = recorded.inserts.find((i) => i.table === 'admin_role_assignments')
    expect(grant?.row).toMatchObject({
      organization_membership_id: 'organization_memberships-id',
      role: 'super_admin',
    })
    // v2 attaches roles to a membership; a user_id here would not even be a
    // column on the table.
    expect(grant?.row).not.toHaveProperty('user_id')
  })

  it('reports slug_taken on a unique violation without creating a user', async () => {
    const { client, recorded } = stubClient({
      inserts: { organizations: { data: null, error: { code: '23505' } } },
    })

    const result = await provisionOrganization(client, input)

    expect(result).toEqual({ ok: false, error: 'slug_taken' })
    expect(recorded.inserts.map((i) => i.table)).toEqual(['organizations'])
  })

  it('reports admin_exists and removes the org it already created', async () => {
    const { client, recorded } = stubClient({
      createUser: { error: { message: 'A user with this email already exists' } },
    })

    const result = await provisionOrganization(client, input)

    expect(result).toEqual({ ok: false, error: 'admin_exists' })
    expect(recorded.deletedOrgIds).toEqual(['organizations-id'])
  })

  it('rolls back the user and the org when a dependent write fails', async () => {
    const { client, recorded } = stubClient({
      inserts: { admin_role_assignments: { data: null, error: { message: 'grant boom' } } },
    })

    const result = await provisionOrganization(client, input)

    expect(result).toEqual({ ok: false, error: 'grant_failed' })
    // Both halves of the half-built tenant are compensated, so a retry with
    // the same slug and email isn't blocked by leftovers.
    expect(recorded.deletedUserIds).toEqual(['admin-user-id'])
    expect(recorded.deletedOrgIds).toEqual(['organizations-id'])
  })

  it('falls back to the email local-part when no display name is given', async () => {
    const { client, recorded } = stubClient()

    await provisionOrganization(client, {
      ...input,
      admin: { ...input.admin, displayName: '   ' },
    })

    const profile = recorded.inserts.find((i) => i.table === 'profiles')
    expect(profile?.row).toMatchObject({ display_name: 'admin' })
  })
})
