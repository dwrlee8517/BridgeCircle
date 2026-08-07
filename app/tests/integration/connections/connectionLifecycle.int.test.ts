import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { POST as disconnectRoute } from '@/app/api/connections/[userId]/disconnect/route'
import { POST as respondRoute } from '@/app/api/connections/requests/[requestId]/response/route'
import { POST as requestRoute } from '@/app/api/connections/requests/route'
import { callRoute, createMember, type Member } from '../harness/apiClient'
import { bootstrapTenant, TEST_PASSWORD, type Tenant } from '../harness/bootstrapTenant'
import { CookieJar } from '../harness/cookieJar'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'

const scope = new SeedScope()
let tenant: Tenant
let alice: Member
let bob: Member

beforeAll(async () => {
  tenant = await bootstrapTenant(scope)
  alice = await createMember(tenant.admin.jar, scope.email('alice'), TEST_PASSWORD, {
    fullName: 'Alice IT',
  })
  bob = await createMember(tenant.admin.jar, scope.email('bob'), TEST_PASSWORD, {
    fullName: 'Bob IT',
  })
})
afterAll(async () => {
  await teardownScope(scope)
})

describe('connection lifecycle, through the real route handlers', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const { status } = await callRoute(new CookieJar(), requestRoute, {
      path: '/api/connections/requests',
      json: {
        recipientUserId: bob.userId,
        originOrganizationId: tenant.organizationId,
        introMessage: null,
        clientRequestId: randomUUID(),
      },
    })
    expect(status).toBe(401)
  })

  it('request → accept → disconnect round-trips', async () => {
    // Alice asks to connect with Bob.
    const sent = await callRoute<{ status: string; requestId?: string | null }>(
      alice.jar,
      requestRoute,
      {
        path: '/api/connections/requests',
        json: {
          recipientUserId: bob.userId,
          originOrganizationId: tenant.organizationId,
          introMessage: 'We met at the reunion — would love to stay in touch.',
          clientRequestId: randomUUID(),
        },
      },
    )
    expect(sent.status).toBe(200)
    const requestId = sent.body.requestId
    expect(requestId, `send result: ${JSON.stringify(sent.body)}`).toBeTruthy()

    // Bob accepts.
    const accepted = await callRoute<{ status: string }>(bob.jar, respondRoute, {
      path: `/api/connections/requests/${requestId}/response`,
      params: { requestId: requestId as string },
      json: { decision: 'accept' },
    })
    expect(accepted.status).toBe(200)

    // Either side can now disconnect; Alice does.
    const disconnected = await callRoute<{ status: string }>(alice.jar, disconnectRoute, {
      path: `/api/connections/${bob.userId}/disconnect`,
      params: { userId: bob.userId },
      json: {},
    })
    expect(disconnected.status).toBe(200)
  })

  it('a decline leaves no connection behind', async () => {
    // Bob asks Alice this time; Alice declines.
    const sent = await callRoute<{ status: string; requestId?: string | null }>(
      bob.jar,
      requestRoute,
      {
        path: '/api/connections/requests',
        json: {
          recipientUserId: alice.userId,
          originOrganizationId: tenant.organizationId,
          introMessage: null,
          clientRequestId: randomUUID(),
        },
      },
    )
    expect(sent.status).toBe(200)
    expect(sent.body.requestId).toBeTruthy()

    const declined = await callRoute<{ status: string }>(alice.jar, respondRoute, {
      path: `/api/connections/requests/${sent.body.requestId}/response`,
      params: { requestId: sent.body.requestId as string },
      json: { decision: 'decline' },
    })
    expect(declined.status).toBe(200)

    // Nothing to disconnect — the route reports the pair as not connected.
    const disconnected = await callRoute<{ status: string }>(bob.jar, disconnectRoute, {
      path: `/api/connections/${alice.userId}/disconnect`,
      params: { userId: alice.userId },
      json: {},
    })
    expect(disconnected.body.status).not.toBe('disconnected')
  })
})
