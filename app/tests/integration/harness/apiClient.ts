import { NextRequest } from 'next/server'
import { signUpWithPassword } from '@/app/(auth)/join/actions'
import { signInWithPassword } from '@/app/(auth)/sign-in/actions'
import { inviteFromForm } from '@/app/(admin)/admin/invite/actions'
import { POST as provisionRoute } from '@/app/api/admin/provision-org/route'
import { createAdminClient } from '@/db/admin'
import { createOutboxRepository } from '@/db/repositories/outbox'
import type { ProvisionOrganizationInput } from '@/lib/provisioning/provisionOrganization'
import { CookieJar, runWithJar } from './cookieJar'
import { requireIntegrationEnv } from './env'
import { isNotFoundError, isRedirectError } from './shims/next-navigation'

/**
 * The only way tests touch the system: real server actions and route handlers,
 * invoked in-process so v8 records their line coverage. There is no raw DB
 * seeding here — orgs and accounts are created through provisionOrg / invite /
 * join, exactly as the running app creates them.
 *
 * Reads of app-created state (like fetching an invite token to simulate
 * clicking the email link) go through a service-role client; those are reads,
 * not seeds.
 */

/** What a driven action did: returned a value, or halted via redirect/notFound. */
export type ActionOutcome<T> =
  | { kind: 'return'; value: T }
  | { kind: 'redirect'; destination: string }
  | { kind: 'notFound' }

function toFormData(fields: Record<string, string | number | undefined | null>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) fd.set(key, String(value))
  }
  return fd
}

/**
 * Run a server action bound to `jar`'s identity, normalizing Next's
 * redirect/notFound control-flow throws into an outcome value.
 */
export async function callAction<T>(
  jar: CookieJar,
  fn: () => Promise<T>,
): Promise<ActionOutcome<T>> {
  try {
    const value = await runWithJar(jar, fn)
    return { kind: 'return', value }
  } catch (error) {
    if (isRedirectError(error)) return { kind: 'redirect', destination: error.destination }
    if (isNotFoundError(error)) return { kind: 'notFound' }
    throw error
  }
}

// ---- Route handlers --------------------------------------------------------

export type RouteResponse<T = unknown> = { status: number; body: T }

/**
 * Drive a route handler as `jar`'s identity. Mirrors how Next invokes it: a
 * fetch Request plus a `context.params` promise for the dynamic segments. The
 * handler's `createClient()` resolves cookies from the jar, so auth behaves
 * exactly as it would for a signed-in browser.
 *
 * The handler's params are typed as Promise<never>, which every concrete
 * segment type accepts — so any route handler fits without a generic that
 * explicit response-type arguments would silence (TS has no partial
 * inference). The single cast below is the tradeoff: segment names in
 * `params` are not checked against the route, only their presence at runtime.
 */
export async function callRoute<T = unknown>(
  jar: CookieJar,
  handler: (request: Request, context: { params: Promise<never> }) => Promise<Response>,
  {
    path,
    method = 'POST',
    params,
    json,
  }: { path: string; method?: string; params?: Record<string, string>; json?: unknown },
): Promise<RouteResponse<T>> {
  const request = new Request(`http://localhost${path}`, {
    method,
    headers: json === undefined ? undefined : { 'content-type': 'application/json' },
    body: json === undefined ? undefined : JSON.stringify(json),
  })
  const response = await runWithJar(jar, () =>
    handler(request, { params: Promise.resolve(params ?? {}) as Promise<never> }),
  )
  const text = await response.text()
  return { status: response.status, body: (text ? JSON.parse(text) : null) as T }
}

// ---- Provisioning (POST /api/admin/provision-org) -------------------------

export type ProvisionResponse = {
  status: number
  body:
    | { ok: true; organizationId: string; adminUserId: string; membershipId: string }
    | { ok: false; error: string }
    | { error: string }
}

export async function provisionOrg(input: ProvisionOrganizationInput): Promise<ProvisionResponse> {
  const env = requireIntegrationEnv()
  const req = new NextRequest('http://localhost/api/admin/provision-org', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.provisionSecret}`,
    },
    body: JSON.stringify(input),
  })
  const res = await provisionRoute(req)
  return { status: res.status, body: await res.json() }
}

// ---- Auth: sign in --------------------------------------------------------

/**
 * Drive the real sign-in action. On success it redirects (to /onboarding or
 * the next path) and `jar` is left holding the Supabase session cookies, so
 * later calls bound to the same jar act as this user.
 */
export function signIn(
  jar: CookieJar,
  email: string,
  password: string,
  next?: string,
): Promise<ActionOutcome<{ error?: string }>> {
  return callAction(jar, () => signInWithPassword({}, toFormData({ email, password, next })))
}

// ---- Admin: invite --------------------------------------------------------

export type InviteResult = {
  outcome: ActionOutcome<{ success?: boolean; error?: string; emailJustSent?: string }>
  /** The raw invite token, read back from the row the action created. */
  token: string | null
}

/**
 * Drive the admin invite action as `adminJar`, then read back the token the
 * app persisted (the app emails it; here we fetch it to stand in for the
 * recipient clicking the link).
 */
export async function invite(
  adminJar: CookieJar,
  input: { email: string; fullName?: string; graduationYear?: number },
): Promise<InviteResult> {
  // A browser form posts every field, empty string when blank — never absent.
  // formData.get() on a missing key returns null, which z.string().optional()
  // rejects (null is not undefined), so omitting fields here would make the
  // driver stricter than the real form.
  const outcome = await callAction(adminJar, () =>
    inviteFromForm(
      {},
      toFormData({
        email: input.email,
        fullName: input.fullName ?? '',
        graduationYear: input.graduationYear ?? '',
      }),
    ),
  )
  const token = await latestInviteToken(input.email)
  return { outcome, token }
}

/**
 * Recover the raw invite token for an email.
 *
 * v2 never persists the raw token: `private.issue_invite` mints it in SQL,
 * stores only `token_hash` (sha256), and hands the raw value to the outbox as
 * a `send_invite_email` job payload. The email the worker sends is the only
 * other copy. So a test recovers it the same way the production worker does —
 * by claiming the job through `api.claim_outbox_jobs` — rather than reading a
 * column that no longer exists.
 *
 * We complete the job afterwards, exactly as the worker would, so the run
 * leaves no jobs locked behind it.
 */
export async function latestInviteToken(email: string): Promise<string | null> {
  const repo = createOutboxRepository(createAdminClient())
  const workerId = `integration-test-${process.pid}`
  const target = email.toLowerCase()

  const jobs = await repo.claim(workerId, ['send_invite_email'], 50)
  for (const job of jobs) {
    const payload = job.payload as { recipientEmail?: string; token?: string } | null
    if (payload?.recipientEmail?.toLowerCase() === target && payload.token) {
      await repo.complete(job.id, workerId)
      return payload.token
    }
  }
  return null
}

// ---- Members (invite → join, composed) -------------------------------------

export type Member = { jar: CookieJar; email: string; userId: string }

/** The auth user id behind an email (service-role read, paginated). */
export async function authUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient()
  const target = email.toLowerCase()
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === target)
    if (hit) return hit.id
    if (data.users.length < 200) return null
  }
}

/**
 * Mint a member the way the product does: the tenant admin invites, the
 * recipient joins. Returns the member signed in (their jar carries the
 * session join() established).
 */
export async function createMember(
  adminJar: CookieJar,
  email: string,
  password: string,
  opts: { fullName?: string; graduationYear?: number } = {},
): Promise<Member> {
  const { outcome, token } = await invite(adminJar, {
    email,
    fullName: opts.fullName ?? 'IT Member',
    graduationYear: opts.graduationYear,
  })
  if (outcome.kind !== 'return' || !outcome.value.success) {
    throw new Error(`invite failed: ${JSON.stringify(outcome)}`)
  }
  if (!token) throw new Error(`no invite token recovered for ${email}`)

  const jar = new CookieJar()
  const joined = await join(jar, token, password)
  if (joined.kind !== 'redirect') {
    throw new Error(`join did not redirect: ${JSON.stringify(joined)}`)
  }

  const userId = await authUserIdByEmail(email)
  if (!userId) throw new Error(`no auth user found for ${email}`)
  return { jar, email, userId }
}

// ---- Auth: join (accept invite + create account) --------------------------

/**
 * Drive the real join action for `jar`. On success it accepts the invite,
 * creates the member's account, signs them in (cookies land in `jar`), and
 * redirects to onboarding.
 */
export function join(
  jar: CookieJar,
  token: string,
  password: string,
): Promise<ActionOutcome<{ error?: string }>> {
  return callAction(jar, () => signUpWithPassword({}, toFormData({ token, password })))
}
