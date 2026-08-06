import { CookieJar } from './cookieJar'
import { provisionOrg, signIn } from './apiClient'
import type { SeedScope } from './seedScope'

/**
 * Stand up a fresh tenant for a test through the provisioning API, then sign
 * the admin in so their CookieJar carries a real session. From here a test
 * builds the rest of its world through the same real APIs (invite → join,
 * events, asks, …). No raw DB writes.
 */

// Meets the join/sign-in min length (8); shared across seeded users since the
// email is what's unique.
export const TEST_PASSWORD = 'integration-test-pw-9x!'

export type Tenant = {
  organizationId: string
  adminUserId: string
  membershipId: string
  admin: { email: string; password: string; jar: CookieJar }
  org: { name: string; slug: string }
}

export async function bootstrapTenant(
  scope: SeedScope,
  opts: { requiresAdminApproval?: boolean; adminName?: string } = {},
): Promise<Tenant> {
  const org = { name: scope.orgName(), slug: scope.slug() }
  const email = scope.email('admin')

  const res = await provisionOrg({
    organization: { ...org, requiresAdminApproval: opts.requiresAdminApproval },
    admin: { email, password: TEST_PASSWORD, displayName: opts.adminName ?? 'IT Admin' },
  })
  if (res.status !== 201 || !('organizationId' in res.body) || !res.body.ok) {
    throw new Error(`provisionOrg failed (${res.status}): ${JSON.stringify(res.body)}`)
  }

  // Sign the admin in. A freshly provisioned admin hasn't onboarded, so the
  // action redirects to /onboarding — a redirect outcome is success here.
  const jar = new CookieJar()
  const signInOutcome = await signIn(jar, email, TEST_PASSWORD)
  if (signInOutcome.kind !== 'redirect') {
    throw new Error(`admin sign-in did not redirect: ${JSON.stringify(signInOutcome)}`)
  }
  if (!jar.hasSession()) {
    throw new Error('admin sign-in left no session cookie in the jar')
  }

  return {
    organizationId: res.body.organizationId,
    adminUserId: res.body.adminUserId,
    membershipId: res.body.membershipId,
    admin: { email, password: TEST_PASSWORD, jar },
    org,
  }
}
