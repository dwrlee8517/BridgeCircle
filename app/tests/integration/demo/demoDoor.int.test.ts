import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { armDemo, closeDemo, type DemoArmState } from '@/app/demo/arm/actions'
import { GET as demoDoor } from '@/app/demo/route'
import { createAdminClient } from '@/db/admin'
import {
  authUserIdByEmail,
  callAction,
  callRoute,
  createMember,
  provisionOrg,
  signIn,
} from '../harness/apiClient'
import { TEST_PASSWORD } from '../harness/bootstrapTenant'
import { CookieJar } from '../harness/cookieJar'
import { requireIntegrationEnv } from '../harness/env'
import { EMAIL_DOMAIN } from '../harness/seedScope'

/**
 * The demo door, end to end against real Auth + RLS: provision an org with
 * the load-bearing slug 'demo' (through the real provisioning endpoint),
 * mint the demo persona through the real invite → join flow, then drive the
 * arm action and the door route exactly as the app does.
 *
 * Reuse over teardown: the demo slug is fixed by design (the revocation RPC
 * and the door's persona assertion both key on it), and v2's org-scoped FKs
 * are `on delete restrict` across the board, so a content-bearing org cannot
 * be torn down cheaply. Instead the suite uses DETERMINISTIC accounts: the
 * first run on a fresh database provisions them; later runs sign back into
 * them. `pnpm db:reset` is the real cleanup, as everywhere else locally.
 *
 * The fixtures deliberately do NOT carry the it+ sweep prefix: the global
 * teardown sweep deletes prefixed auth users but cannot delete the
 * restrict-locked org, which would strand the org without its operator and
 * wedge every later run. Durable fixtures, not run residue.
 *
 * Skipped when the demo slug is occupied by an org this suite does not own
 * (e.g. seed:demo-org ran on this stack) and on the shared dev target, where
 * the slug belongs to the real demo org.
 */

const OPERATOR_EMAIL = `demo-door-operator@${EMAIL_DOMAIN}`
const PERSONA_EMAIL = `demo-door-persona@${EMAIL_DOMAIN}`

const remote = (() => {
  try {
    return requireIntegrationEnv().isRemote
  } catch {
    return false
  }
})()

/** 'fresh' | 'reuse' | 'foreign' — resolved at collect time so skip works. */
const stackState = await (async () => {
  if (remote) return 'foreign'
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('organizations').select('id').eq('slug', 'demo').maybeSingle()
    if (!data) return 'fresh'
    if (await authUserIdByEmail(OPERATOR_EMAIL)) return 'reuse'
    console.warn(
      "demo door suite skipped: the 'demo' slug is held by an org this suite does not own " +
        "(likely seed:demo-org). Run 'pnpm db:reset' to run this suite locally.",
    )
    return 'foreign'
  } catch (cause) {
    console.warn(`demo door suite skipped: could not inspect the local stack (${String(cause)})`)
    return 'foreign'
  }
})()

const ENV_KEYS = [
  'DEMO_LOGIN_ENABLED',
  'DEMO_USER_EMAIL',
  'DEMO_ARM_EMAILS',
  'APP_ENV',
  'NEXT_PUBLIC_APP_URL',
] as const

function durationForm(duration: string): FormData {
  const fd = new FormData()
  fd.set('duration', duration)
  return fd
}

async function knock(token: string | null): Promise<{ status: number; jar: CookieJar }> {
  const jar = new CookieJar()
  const path = token === null ? '/demo' : `/demo?k=${encodeURIComponent(token)}`
  const res = await callRoute(jar, demoDoor, { path, method: 'GET' })
  return { status: res.status, jar }
}

/**
 * A fresh operator session per arming call. Unlike the real dev operator
 * (allowlisted by email, not a demo-org member), the test's operator is the
 * demo org's own admin — exclusively a demo-org member — so every arm/close
 * revokes their session too, by design. Signing in fresh per call keeps the
 * tests honest about that.
 */
async function freshOperatorJar(): Promise<CookieJar> {
  const jar = new CookieJar()
  const outcome = await signIn(jar, OPERATOR_EMAIL, TEST_PASSWORD)
  if (outcome.kind !== 'redirect') {
    throw new Error(`operator sign-in did not redirect: ${JSON.stringify(outcome)}`)
  }
  return jar
}

describe.skipIf(stackState === 'foreign')('demo door', () => {
  const savedEnv = new Map<string, string | undefined>()

  beforeAll(async () => {
    for (const key of ENV_KEYS) savedEnv.set(key, process.env[key])

    if (stackState === 'fresh') {
      const provisioned = await provisionOrg({
        organization: { name: 'Demo Integration Circle', slug: 'demo' },
        admin: { email: OPERATOR_EMAIL, password: TEST_PASSWORD, displayName: 'Demo Operator' },
      })
      if (provisioned.status !== 201) {
        throw new Error(`provisioning the demo org failed: ${JSON.stringify(provisioned.body)}`)
      }
      const adminJar = new CookieJar()
      const signedIn = await signIn(adminJar, OPERATOR_EMAIL, TEST_PASSWORD)
      if (signedIn.kind !== 'redirect') {
        throw new Error(`operator sign-in did not redirect: ${JSON.stringify(signedIn)}`)
      }
      await createMember(adminJar, PERSONA_EMAIL, TEST_PASSWORD, { fullName: 'Demo Persona' })
    }

    process.env.DEMO_USER_EMAIL = PERSONA_EMAIL
    process.env.DEMO_ARM_EMAILS = OPERATOR_EMAIL
    process.env.APP_ENV = 'local'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    delete process.env.DEMO_LOGIN_ENABLED
  }, 60_000)

  afterAll(async () => {
    for (const [key, value] of savedEnv) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    // Windows are the only rows worth clearing (they'd otherwise satisfy a
    // later run's door before it arms). The org and accounts stay for reuse —
    // see the suite header.
    const admin = createAdminClient()
    await admin.from('demo_access_windows').delete().gte('created_at', '1970-01-01')
  }, 60_000)

  it('does not exist while the flag is off', async () => {
    const closed = await knock('any-token-of-plausible-length')
    expect(closed.status).toBe(404)
    expect(closed.jar.hasSession()).toBe(false)
  })

  it('stays 404 when enabled but unarmed', async () => {
    process.env.DEMO_LOGIN_ENABLED = '1'
    const unarmed = await knock('any-token-of-plausible-length')
    expect(unarmed.status).toBe(404)
  })

  it('refuses to arm for a non-operator', async () => {
    process.env.DEMO_LOGIN_ENABLED = '1'
    const personaJar = new CookieJar()
    const personaIn = await signIn(personaJar, PERSONA_EMAIL, TEST_PASSWORD)
    if (personaIn.kind !== 'redirect') {
      throw new Error(`persona sign-in did not redirect: ${JSON.stringify(personaIn)}`)
    }
    const outcome = await callAction(personaJar, () =>
      armDemo({} as DemoArmState, durationForm('120')),
    )
    expect(outcome.kind).toBe('return')
    if (outcome.kind === 'return') {
      expect(outcome.value.error).toBeDefined()
      expect(outcome.value.link).toBeUndefined()
    }
  })

  it('armed window admits a visitor as the demo persona, once per link', async () => {
    process.env.DEMO_LOGIN_ENABLED = '1'

    const operator = await freshOperatorJar()
    const armed = await callAction(operator, () => armDemo({} as DemoArmState, durationForm('120')))
    expect(armed.kind).toBe('return')
    if (armed.kind !== 'return') return
    expect(armed.value.error).toBeUndefined()
    expect(armed.value.link).toBeDefined()

    const token = new URL(armed.value.link as string).searchParams.get('k')
    expect(token).toBeTruthy()

    // The real link admits: redirect + a live session in the visitor's jar.
    const admitted = await knock(token)
    expect([302, 303, 307, 308]).toContain(admitted.status)
    expect(admitted.jar.hasSession()).toBe(true)

    // A wrong token during the same window stays out.
    const intruder = await knock(`${token?.slice(0, -2)}xx`)
    expect(intruder.status).toBe(404)
    expect(intruder.jar.hasSession()).toBe(false)

    // No token at all stays out.
    const bare = await knock(null)
    expect(bare.status).toBe(404)
  })

  it('re-arming rotates the token: the old link dies', async () => {
    process.env.DEMO_LOGIN_ENABLED = '1'

    const first = await callAction(await freshOperatorJar(), () =>
      armDemo({} as DemoArmState, durationForm('30')),
    )
    if (first.kind !== 'return' || !first.value.link) throw new Error('first arm failed')
    const oldToken = new URL(first.value.link).searchParams.get('k')

    const second = await callAction(await freshOperatorJar(), () =>
      armDemo({} as DemoArmState, durationForm('30')),
    )
    expect(second.kind).toBe('return')

    const replayed = await knock(oldToken)
    expect(replayed.status).toBe(404)
  })

  it('closing the window kills the current link', async () => {
    process.env.DEMO_LOGIN_ENABLED = '1'

    const armed = await callAction(await freshOperatorJar(), () =>
      armDemo({} as DemoArmState, durationForm('30')),
    )
    if (armed.kind !== 'return' || !armed.value.link) throw new Error('arm failed')
    const token = new URL(armed.value.link).searchParams.get('k')

    const closed = await callAction(await freshOperatorJar(), () => closeDemo({} as DemoArmState))
    expect(closed.kind).toBe('return')

    const afterClose = await knock(token)
    expect(afterClose.status).toBe(404)
  })

  it('rejects invalid durations', async () => {
    process.env.DEMO_LOGIN_ENABLED = '1'
    const outcome = await callAction(await freshOperatorJar(), () =>
      armDemo({} as DemoArmState, durationForm('45')),
    )
    expect(outcome.kind).toBe('return')
    if (outcome.kind === 'return') expect(outcome.value.error).toBeDefined()
  })
})
