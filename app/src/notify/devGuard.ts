// Non-production email guard for the Resend send path.
//
// Outside prod (`APP_ENV !== 'prod'`) the app can run against real Resend keys
// (the `dev_local_live` config and remote-dev both use a live key), but it must
// never deliver to real — or invalid — addresses by accident: the dev seed uses
// `@example.com` recipients that bounce and ding our Resend sender reputation,
// and any triggered flow would otherwise mail real people from a dev box.
//
// So in non-prod, a recipient is delivered as-is only if it is a known-safe
// address — a Resend sink, or one a developer explicitly allowlisted for their
// own testing. Everything else is redirected to a single safe sink.
// `delivered@resend.dev` is Resend's reserved address that accepts mail without
// ever delivering it to a person — the same sink the E2E factory routes to
// (`tests/e2e/helpers/factory.ts`). Set `EMAIL_DEV_REDIRECT` to change the sink,
// and `EMAIL_DEV_ALLOWLIST` (comma-separated exact addresses) to let specific
// dev inboxes receive their own mail.

export const DEV_EMAIL_SINK = 'delivered@resend.dev'

export type DevRecipientOptions = {
  appEnv?: string
  sink?: string
  allowlist?: string[]
}

/**
 * Decide the address a send should actually go to.
 *
 * - In prod (`appEnv === 'prod'`): pass the recipient through unchanged.
 * - Non-prod, address already on `resend.dev` (e.g. the E2E factory's
 *   `delivered+<label>@resend.dev`): pass through so its `+label` survives —
 *   the integ suite asserts against those addresses.
 * - Non-prod, address on the dev allowlist: pass through so a developer
 *   receives their own test mail at their real inbox. Exact-match only.
 * - Non-prod, anything else: redirect to `sink`.
 *
 * Pure and dependency-free so it unit-tests without the Resend client. Every
 * env input defaults from `process.env` but is injectable for tests.
 */
export function resolveDevRecipient(
  to: string,
  options: DevRecipientOptions = {},
): { to: string; redirectedFrom: string | null } {
  const appEnv = options.appEnv ?? process.env.APP_ENV
  const sink = options.sink ?? (process.env.EMAIL_DEV_REDIRECT || DEV_EMAIL_SINK)
  const allowlist = options.allowlist ?? parseAllowlist(process.env.EMAIL_DEV_ALLOWLIST)

  if (appEnv === 'prod') return { to, redirectedFrom: null }
  if (isResendSink(to)) return { to, redirectedFrom: null }
  if (isAllowlisted(to, allowlist)) return { to, redirectedFrom: null }
  return { to: sink, redirectedFrom: to }
}

// Parse a comma-separated allowlist into normalized exact addresses. Exact-match
// only — no domain wildcards, which would defeat the guard.
export function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

// True when the address is a resend.dev sink — already safe to send to.
function isResendSink(address: string): boolean {
  return /@resend\.dev$/i.test(address.trim())
}

function isAllowlisted(address: string, allowlist: string[]): boolean {
  return allowlist.includes(address.trim().toLowerCase())
}
