import { currentJar } from '../cookieJar'

/**
 * Stand-in for `next/headers`, aliased in vitest.integration.config.ts.
 *
 * Returns the CookieJar bound to the current async context so server actions
 * read/write real session cookies against a real jar. Called outside a
 * runWithJar scope, it throws — that means an action touched cookies without a
 * user context, which is a test-wiring bug worth surfacing loudly.
 */
export async function cookies() {
  const jar = currentJar()
  if (!jar) {
    throw new Error(
      'cookies() called outside runWithJar(). Drive actions via the harness apiClient so a CookieJar is bound.',
    )
  }
  return jar
}

// Minimal surface for the rest of next/headers. The suite drives server
// actions, which only use cookies(); headers()/draftMode() are here so any
// incidental import resolves rather than crashing.
export async function headers() {
  return new Headers()
}

export function draftMode() {
  return { isEnabled: false, enable() {}, disable() {} }
}
