import { expect, test, type Page } from '@playwright/test'
import { signInAs } from '../helpers/auth'
import { allowDevSmoke, isRemote } from '../helpers/env'

const RICHARD = {
  email: 'richard@example.com',
  password: 'devseed-password-richard',
}
const AMY = {
  email: 'admin-amy@example.com',
  password: 'devseed-password-amy',
}

test.describe('read-only v2 dev smoke', () => {
  test.skip(!allowDevSmoke, 'Run only through the explicit dev smoke command')
  test.describe.configure({ mode: 'serial' })

  const browserErrors = new WeakMap<Page, string[]>()

  test.beforeEach(async ({ page }) => {
    const errors: string[] = []
    browserErrors.set(page, errors)
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`)
    })
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  })

  test.afterEach(async ({ page }) => {
    expect(browserErrors.get(page), 'browser console and page errors').toEqual([])
  })

  test('health identifies the intended environment and exact deployed SHA', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBe(true)
    const health = (await response.json()) as { status: string; env: string; sha: string }
    expect(health.status).toBe('ok')

    if (isRemote) {
      expect(health.env).toBe('dev')
      expect(health.sha).toBe(process.env.CUTOVER_SHA)
    }
  })

  test('seeded member can read every primary application section', async ({ page }) => {
    await signInAs(page, RICHARD)

    const roads: Array<[string, RegExp]> = [
      ['/', /Welcome back, Richard\./i],
      ['/help', /What do you need\?/i],
      ['/people', /Find people to connect with\./i],
      ['/messages', /^Messages$/i],
      ['/school', /Close to school, not buried in it\./i],
    ]

    for (const [path, heading] of roads) {
      const response = await page.goto(path)
      expect(response?.ok(), `${path} response`).toBe(true)
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
  })

  test('seeded admin can read every minimal admin surface', async ({ page }) => {
    await signInAs(page, AMY)

    const roads: Array<[string, string]> = [
      ['/admin/invite', 'Invite members'],
      ['/admin/approvals', 'Approval queue'],
      ['/admin/events', 'New event'],
      ['/admin/announcements', 'New announcement'],
    ]

    for (const [path, label] of roads) {
      const response = await page.goto(path)
      expect(response?.ok(), `${path} response`).toBe(true)
      await expect(page.getByText(label, { exact: true }).filter({ visible: true })).toBeVisible()
    }
  })
})
