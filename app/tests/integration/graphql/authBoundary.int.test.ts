import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { POST as graphqlRoute } from '@/app/api/graphql/route'
import { CookieJar, runWithJar } from '../harness/cookieJar'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'
import { TEST_PASSWORD } from '../harness/bootstrapTenant'
import { graphqlAs } from './harness/parityRunner'
import { buildParityWorld, type ParityWorld } from './harness/world'

/**
 * The auth boundary of both entry points.
 *
 * `parity.int.test.ts` diffs the in-process path, which is what the cutover
 * will use. This file covers the other two things that path cannot show:
 *
 * 1. The **HTTP + bearer** contract that `docs/architecture/graphql-parity.md`
 *    specifies and `createClientWithToken` exists for. If it regressed, every
 *    non-browser caller would break while the in-process suite stayed green.
 * 2. **Unauthenticated behavior.** Reads must return null and commands must
 *    reach their NOT_AVAILABLE terminal — never throw, and never leak a row.
 *    An RLS mistake shows up here first.
 */

const scope = new SeedScope()
let world: ParityWorld

beforeAll(async () => {
  world = await buildParityWorld(scope)
}, 120_000)
afterAll(async () => {
  await teardownScope(scope)
})

/**
 * POST a document at the real Yoga route, optionally as a bearer identity.
 *
 * Bound to a fresh empty CookieJar because `buildContext` falls back to the
 * cookie client whenever there is no bearer, and the harness's `next/headers`
 * shim throws outside `runWithJar`. An empty jar is the faithful model: a real
 * unauthenticated request still has a cookie store, it just has nothing in it.
 */
async function postGraphql(
  document: string,
  options: { accessToken?: string; variables?: Record<string, unknown> } = {},
): Promise<{ data?: Record<string, unknown>; errors?: unknown[] }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`

  const response = await runWithJar(new CookieJar(), () =>
    Promise.resolve(
      graphqlRoute(
        new Request('http://localhost/api/graphql', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: document, variables: options.variables }),
        }),
      ),
    ),
  )
  return response.json()
}

async function accessTokenFor(email: string): Promise<string> {
  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  )
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })
  if (error || !data.session) throw new Error(`could not sign ${email} in: ${error?.message}`)
  return data.session.access_token
}

describe('graphql over HTTP with a bearer token', () => {
  it('resolves the same member the in-process cookie path resolves', async () => {
    const document = 'query { me { id userId displayName organizationName } }'

    const overHttp = await postGraphql(document, {
      accessToken: await accessTokenFor(world.viewer.email),
    })
    const inProcess = await graphqlAs<{ me: unknown }>(world.viewer.jar, document)

    expect(overHttp.errors).toBeUndefined()
    expect(overHttp.data?.me).toEqual(inProcess.me)
  })

  it('rejects a token that is not a token rather than trusting it', async () => {
    const result = await postGraphql('query { me { id } }', { accessToken: 'not-a-jwt' })
    // An unverifiable bearer is anonymous, not an error: buildContext validates
    // with auth.getUser(token) and leaves the session null when it fails.
    expect(result.data?.me).toBeNull()
  })
})

describe('unauthenticated callers', () => {
  it('reads resolve to null instead of leaking a row', async () => {
    const result = await postGraphql('query { me { id } accountStatus { accountState } }')

    expect(result.errors).toBeUndefined()
    expect(result.data?.me).toBeNull()
    expect(result.data?.accountStatus).toBeNull()
  })

  it('commands reach their NOT_AVAILABLE terminal instead of throwing', async () => {
    const result = await postGraphql(
      'mutation { saveNotificationPreference(type: ASK_ACCEPTED, inAppEnabled: true, emailEnabled: true) }',
    )

    expect(result.errors).toBeUndefined()
    expect(result.data?.saveNotificationPreference).toBe('NOT_AVAILABLE')
  })

  it('the in-process path is anonymous too when the jar holds no session', async () => {
    const data = await graphqlAs<{ me: unknown }>(new CookieJar(), 'query { me { id } }')
    expect(data.me).toBeNull()
  })
})
