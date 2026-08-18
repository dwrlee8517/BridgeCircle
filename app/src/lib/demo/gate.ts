import { DEV_APP_ORIGIN } from '@/lib/cutover/dev-target'

/**
 * Only allowlisted operator emails may arm or close the door. The allowlist is
 * DEMO_ARM_EMAILS, comma-separated; an empty or missing allowlist admits no one.
 */
export function isDemoOperator(
  email: string | null | undefined,
  allowlist: string | undefined,
): boolean {
  if (!email || !allowlist) return false
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false
  return allowlist
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized)
}

export type DemoDoorGateInput = {
  enabled: string | undefined
  appEnv: string | undefined
  /**
   * Must be the explicitly configured NEXT_PUBLIC_APP_URL — never an origin
   * derived from request headers, which a client can spoof. With the flag on,
   * an unset app URL is a misconfiguration and throws.
   */
  configuredAppUrl: string | undefined
}

function parsedOrigin(value: string | undefined): URL {
  if (!value) {
    throw new Error('DEMO_LOGIN_ENABLED=1 requires NEXT_PUBLIC_APP_URL to be set explicitly')
  }
  try {
    return new URL(value)
  } catch {
    throw new Error('Demo door app origin is not a valid URL')
  }
}

/**
 * Fail-closed authorization for the demo door surfaces (/demo, /demo/arm).
 *
 * An absent flag means "the door does not exist" and is not an error — the
 * caller renders a 404. Once the flag is set, every target assertion becomes
 * mandatory and a mismatch throws instead of silently allowing: production
 * never sets DEMO_LOGIN_ENABLED, and even if it did, APP_ENV=prod and the
 * production origin both fail here.
 */
export function authorizeDemoDoor(input: DemoDoorGateInput): boolean {
  if (input.enabled !== '1') return false

  const origin = parsedOrigin(input.configuredAppUrl)

  if (input.appEnv === 'local') {
    if (origin.hostname !== 'localhost' && origin.hostname !== '127.0.0.1') {
      throw new Error('DEMO_LOGIN_ENABLED=1 with APP_ENV=local is restricted to localhost')
    }
    return true
  }

  if (input.appEnv !== 'dev') {
    throw new Error('DEMO_LOGIN_ENABLED=1 requires APP_ENV=dev or APP_ENV=local')
  }
  if (origin.origin !== DEV_APP_ORIGIN) {
    throw new Error(`DEMO_LOGIN_ENABLED=1 is restricted to ${DEV_APP_ORIGIN}`)
  }
  return true
}
