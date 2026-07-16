import { expect, test } from '@playwright/test'

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/sign-in')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'))
}

test('member settings and notifications render through fixed contracts', async ({ page }) => {
  await signIn(page, 'richard@example.com', 'devseed-password-richard')
  await page.goto('/settings')
  const settings = page.locator('#main-content')
  await expect(settings.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(settings.getByText('School communication', { exact: true })).toBeVisible()
  await expect(settings.getByText('Blocked members', { exact: true })).toBeVisible()
  await page.screenshot({ path: '/private/tmp/bridgecircle-entry-settings.png', fullPage: true })

  await page.goto('/notifications')
  const notifications = page.locator('#main-content')
  await expect(notifications.getByRole('heading', { name: 'Notifications' })).toBeVisible()
  await expect(notifications.getByRole('link', { name: 'Unread' })).toBeVisible()
  await expect(notifications.getByRole('button', { name: 'Mark all read' })).toBeVisible()
  await page.screenshot({ path: '/private/tmp/bridgecircle-entry-notifications.png', fullPage: true })
})

test('administrator invite and approval operations render', async ({ page }) => {
  await signIn(page, 'admin-amy@example.com', 'devseed-password-amy')
  await page.goto('/admin/invite')
  const main = page.locator('#main-content')
  await expect(main.getByText('Invite members', { exact: true })).toBeVisible()
  await expect(main.getByText('Recent invites', { exact: true })).toBeVisible()
  await page.screenshot({ path: '/private/tmp/bridgecircle-entry-admin-invites.png', fullPage: true })

  await page.goto('/admin/approvals')
  await expect(main.getByText('Approval queue', { exact: true })).toBeVisible()
  await page.screenshot({ path: '/private/tmp/bridgecircle-entry-admin-approvals.png', fullPage: true })
})
