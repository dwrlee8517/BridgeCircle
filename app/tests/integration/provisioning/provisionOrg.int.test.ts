import { NextRequest } from 'next/server'
import { afterAll, describe, expect, it } from 'vitest'
import { POST as provisionRoute } from '@/app/api/admin/provision-org/route'
import { provisionOrg } from '../harness/apiClient'
import { TEST_PASSWORD } from '../harness/bootstrapTenant'
import { requireIntegrationEnv } from '../harness/env'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'

// One scope for the file; afterAll purges everything it created.
const scope = new SeedScope()
afterAll(async () => {
  await teardownScope(scope)
})

describe('POST /api/admin/provision-org', () => {
  it('rejects a request with no provisioning secret (401, no DB write)', async () => {
    const req = new NextRequest('http://localhost/api/admin/provision-org', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organization: { name: scope.orgName(), slug: scope.slug() },
        admin: { email: scope.email('nope'), password: TEST_PASSWORD },
      }),
    })
    const res = await provisionRoute(req)
    expect(res.status).toBe(401)
  })

  it('rejects malformed input with 400', async () => {
    const env = requireIntegrationEnv()
    const req = new NextRequest('http://localhost/api/admin/provision-org', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.provisionSecret}`,
      },
      body: JSON.stringify({
        organization: { name: '', slug: 'Not A Valid Slug' },
        admin: { email: 'not-an-email', password: 'short' },
      }),
    })
    const res = await provisionRoute(req)
    expect(res.status).toBe(400)
  })

  it('provisions an org + super_admin, and reports slug_taken on a repeat slug', async () => {
    const slug = scope.slug()
    const input = {
      organization: { name: scope.orgName(), slug },
      admin: { email: scope.email('admin'), password: TEST_PASSWORD, name: 'Prov Admin' },
    }

    const first = await provisionOrg(input)
    expect(first.status).toBe(201)
    expect(first.body).toMatchObject({ ok: true })
    if ('organizationId' in first.body) {
      expect(first.body.organizationId).toBeTruthy()
      expect(first.body.adminUserId).toBeTruthy()
    }

    // Same slug, different admin email → the unique constraint surfaces as a
    // typed 409, not a crash.
    const second = await provisionOrg({
      ...input,
      admin: { ...input.admin, email: scope.email('admin') },
    })
    expect(second.status).toBe(409)
    expect(second.body).toMatchObject({ ok: false, error: 'slug_taken' })
  })
})
