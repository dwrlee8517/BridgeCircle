import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { decideMembershipAction } from '@/app/(admin)/admin/approvals/actions'
import { createAdminClient } from '@/db/admin'
import { callAction, invite, join } from '../harness/apiClient'
import { bootstrapTenant, TEST_PASSWORD, type Tenant } from '../harness/bootstrapTenant'
import { CookieJar } from '../harness/cookieJar'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'

const scope = new SeedScope()
let tenant: Tenant

// The org is provisioned with the approval gate ON, so invite acceptances
// land pending instead of active — the flow this file exists to exercise.
beforeAll(async () => {
  tenant = await bootstrapTenant(scope, { requiresAdminApproval: true })
})
afterAll(async () => {
  await teardownScope(scope)
})

function decideForm(membershipId: string, decision: 'approve' | 'reject') {
  const fd = new FormData()
  fd.set('membershipId', membershipId)
  fd.set('decision', decision)
  if (decision === 'reject') fd.set('reasonCode', 'could_not_verify')
  return fd
}

async function membershipFor(email: string) {
  const admin = createAdminClient()
  const { data: page } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const user = page.users.find((u) => u.email === email)
  if (!user) return null
  const { data } = await admin
    .from('organization_memberships')
    .select('id, status, joined_at')
    .eq('user_id', user.id)
    .eq('organization_id', tenant.organizationId)
    .maybeSingle()
  return data
}

describe('admin approval queue, when the org gates joins', () => {
  it('a join lands pending, and an admin approval activates it', async () => {
    const email = scope.email('pending-member')
    const invited = await invite(tenant.admin.jar, { email, fullName: 'Pending Member' })
    expect(invited.outcome, JSON.stringify(invited.outcome)).toMatchObject({
      kind: 'return',
      value: { success: true },
    })
    const token = invited.token
    expect(token).toBeTruthy()

    const joined = await join(new CookieJar(), token as string, TEST_PASSWORD)
    // Whatever the post-join redirect is for a gated org, the account exists
    // and its membership must be pending, not active.
    expect(joined.kind).toBe('redirect')

    const before = await membershipFor(email)
    expect(before?.status).toBe('pending')
    expect(before?.joined_at).toBeNull()

    const outcome = await callAction(tenant.admin.jar, () =>
      decideMembershipAction({}, decideForm(before?.id as string, 'approve')),
    )
    expect(outcome.kind).toBe('return')
    if (outcome.kind === 'return') {
      expect(outcome.value, JSON.stringify(outcome.value)).toMatchObject({ ok: true })
    }

    const after = await membershipFor(email)
    expect(after?.status).toBe('active')
    expect(after?.joined_at).not.toBeNull()
  })

  it('a rejection settles the membership as rejected', async () => {
    const email = scope.email('rejected-member')
    const { token } = await invite(tenant.admin.jar, { email, fullName: 'Rejected Member' })
    await join(new CookieJar(), token as string, TEST_PASSWORD)

    const pending = await membershipFor(email)
    expect(pending?.status).toBe('pending')

    const outcome = await callAction(tenant.admin.jar, () =>
      decideMembershipAction({}, decideForm(pending?.id as string, 'reject')),
    )
    expect(outcome.kind).toBe('return')

    const after = await membershipFor(email)
    expect(after?.status).toBe('rejected')
  })

  it('a non-admin cannot decide a membership', async () => {
    const email = scope.email('sneaky-member')
    const { token } = await invite(tenant.admin.jar, { email, fullName: 'Sneaky Member' })
    const sneakyJar = new CookieJar()
    await join(sneakyJar, token as string, TEST_PASSWORD)

    const target = await membershipFor(email)
    // requireAdmin redirects a non-admin away instead of returning.
    const outcome = await callAction(sneakyJar, () =>
      decideMembershipAction({}, decideForm(target?.id as string, 'approve')),
    )
    expect(outcome.kind).toBe('redirect')

    const unchanged = await membershipFor(email)
    expect(unchanged?.status).toBe('pending')
  })
})
