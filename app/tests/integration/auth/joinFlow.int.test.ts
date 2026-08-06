import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAdminClient } from '@/db/admin'
import { invite, join } from '../harness/apiClient'
import { bootstrapTenant, TEST_PASSWORD, type Tenant } from '../harness/bootstrapTenant'
import { CookieJar } from '../harness/cookieJar'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'

const scope = new SeedScope()
let tenant: Tenant

beforeAll(async () => {
  tenant = await bootstrapTenant(scope)
})
afterAll(async () => {
  await teardownScope(scope)
})

describe('invite → join, through the real actions', () => {
  it('an admin invites and a member joins, landing an active membership + profile', async () => {
    const email = scope.email('member')

    // Admin action: create + "send" the invite (Resend stubbed).
    const { outcome, token } = await invite(tenant.admin.jar, {
      email,
      fullName: 'New Member',
      graduationYear: 2015,
    })
    expect(outcome.kind).toBe('return')
    if (outcome.kind === 'return') expect(outcome.value.success).toBe(true)
    expect(token).toBeTruthy()

    // Member action: accept the invite + create the account. Success redirects
    // to onboarding and leaves a real session in the member's jar.
    const memberJar = new CookieJar()
    const joinOutcome = await join(memberJar, token as string, TEST_PASSWORD)
    expect(joinOutcome.kind).toBe('redirect')
    if (joinOutcome.kind === 'redirect') expect(joinOutcome.destination).toContain('/onboarding')
    expect(memberJar.hasSession()).toBe(true)

    // Verify the rows acceptInvite created, via a service-role read.
    const admin = createAdminClient()
    const { data: page } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const member = page.users.find((u) => u.email === email)
    expect(member).toBeTruthy()

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('status, organization_id')
      .eq('user_id', member!.id)
      .maybeSingle()
    expect(membership?.organization_id).toBe(tenant.organizationId)
    expect(membership?.status).toBe('active')

    // v2 keys the person-scoped profile on user_id and names the column
    // display_name; accept_invite seeds it from the invite's full_name.
    const { data: profile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('user_id', member!.id)
      .maybeSingle()
    expect(profile?.display_name).toBe('New Member')
  })

  it('rejects a bogus invite token without creating an account', async () => {
    const memberJar = new CookieJar()
    const joinOutcome = await join(memberJar, 'not-a-real-token', TEST_PASSWORD)
    expect(joinOutcome.kind).toBe('return')
    if (joinOutcome.kind === 'return') expect(joinOutcome.value.error).toBeTruthy()
    expect(memberJar.hasSession()).toBe(false)
  })
})
