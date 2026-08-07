import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { POST as respondRoute } from '@/app/api/connections/requests/[requestId]/response/route'
import { POST as requestRoute } from '@/app/api/connections/requests/route'
import {
  GET as listMessagesRoute,
  POST as sendMessageRoute,
} from '@/app/api/conversations/[conversationId]/messages/route'
import { POST as markReadRoute } from '@/app/api/conversations/[conversationId]/read/route'
import { createConversationRepository } from '@/db/repositories/conversations'
import { createClient } from '@/db/server'
import { getOrCreateDirect } from '@/lib/conversations/getOrCreateDirect'
import { callRoute, createMember, type Member } from '../harness/apiClient'
import { runWithJar } from '../harness/cookieJar'
import { bootstrapTenant, TEST_PASSWORD, type Tenant } from '../harness/bootstrapTenant'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'

const scope = new SeedScope()
let tenant: Tenant
let alice: Member
let bob: Member

/**
 * The page resolves a DM's conversation id with getOrCreateDirect — there is
 * no route for it — so the test drives the same lib entry under the member's
 * jar, exactly as the server component does.
 */
function directConversation(member: Member, otherUserId: string) {
  return runWithJar(member.jar, async () => {
    const client = await createClient()
    return getOrCreateDirect(otherUserId, createConversationRepository(client))
  })
}

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

describe('direct messages, gated on connection', () => {
  it('refuses a conversation between unconnected members', async () => {
    const result = await directConversation(alice, bob.userId)
    expect(result.status).toBe('connection_required')
  })

  it('connected members can open a conversation, message, and mark read', async () => {
    // Connect the pair through the real request/response routes.
    const sent = await callRoute<{ requestId?: string | null }>(alice.jar, requestRoute, {
      path: '/api/connections/requests',
      json: {
        recipientUserId: bob.userId,
        originOrganizationId: tenant.organizationId,
        introMessage: null,
        clientRequestId: randomUUID(),
      },
    })
    expect(sent.body.requestId).toBeTruthy()
    const accepted = await callRoute(bob.jar, respondRoute, {
      path: `/api/connections/requests/${sent.body.requestId}/response`,
      params: { requestId: sent.body.requestId as string },
      json: { decision: 'accept' },
    })
    expect(accepted.status).toBe(200)

    // Now the conversation opens, and both sides resolve the same id.
    const forAlice = await directConversation(alice, bob.userId)
    expect(forAlice.status).toBe('ready')
    const conversationId = forAlice.status === 'ready' ? forAlice.conversationId : ''
    const forBob = await directConversation(bob, alice.userId)
    expect(forBob).toEqual({ status: 'ready', conversationId })

    // Alice sends; the same nonce re-sent is a duplicate, not a second row.
    const nonce = randomUUID()
    const sentMsg = await callRoute<{ status: string; messageId?: number }>(
      alice.jar,
      sendMessageRoute,
      {
        path: `/api/conversations/${conversationId}/messages`,
        params: { conversationId },
        json: { body: 'Hello from the integration suite', clientNonce: nonce },
      },
    )
    expect(sentMsg.status).toBe(200)
    expect(sentMsg.body.status).toBe('sent')

    const resent = await callRoute<{ status: string }>(alice.jar, sendMessageRoute, {
      path: `/api/conversations/${conversationId}/messages`,
      params: { conversationId },
      json: { body: 'Hello from the integration suite', clientNonce: nonce },
    })
    expect(resent.body.status).toBe('duplicate')

    // Bob reads it back through the list route and marks it read.
    const listed = await callRoute<{ messages?: Array<{ id: number; body?: string }> }>(
      bob.jar,
      listMessagesRoute,
      {
        path: `/api/conversations/${conversationId}/messages`,
        method: 'GET',
        params: { conversationId },
      },
    )
    expect(listed.status).toBe(200)
    const bodies = JSON.stringify(listed.body)
    expect(bodies).toContain('Hello from the integration suite')

    const read = await callRoute<{ status: string }>(bob.jar, markReadRoute, {
      path: `/api/conversations/${conversationId}/read`,
      params: { conversationId },
      json: { messageId: sentMsg.body.messageId },
    })
    expect(read.status).toBe(200)
  })
})
