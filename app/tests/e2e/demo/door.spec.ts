// Parity coverage (see parity/README.md): @feature:demo.door
import { expect, test } from '@playwright/test'

/**
 * The demo door's load-bearing property is that it fails closed. These
 * assertions hold in both suite modes:
 *
 * - Local/hermetic: DEMO_LOGIN_ENABLED is unset, so the gate is closed and
 *   both surfaces are 404 unconditionally.
 * - Integ (dev.bridgecircle.org): the gate may be open, but a bogus token
 *   never matches an armed window's hash, and /demo/arm without an
 *   allowlisted operator session never renders.
 */
test('demo door rejects a bogus token as 404', async ({ request }) => {
  const response = await request.get('/demo?k=not-a-real-token-aaaaaaaaaaaaaaaa', {
    maxRedirects: 0,
  })
  expect(response.status()).toBe(404)
})

test('demo door without any token is 404', async ({ request }) => {
  const response = await request.get('/demo', { maxRedirects: 0 })
  expect(response.status()).toBe(404)
})

test('arm page never renders without an allowlisted operator session', async ({ page }) => {
  const response = await page.goto('/demo/arm')
  expect(response).not.toBeNull()

  if (response?.status() === 404) {
    // Gate closed (local mode) — the page does not exist.
    return
  }

  // Gate open (integ mode): an anonymous visitor is bounced to sign-in and
  // the arm form is never present.
  await expect(page).toHaveURL(/\/sign-in/)
  await expect(page.getByText('Demo access')).toHaveCount(0)
})
