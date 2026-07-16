import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ONBOARDING_USER = {
  email: 'onboarding@example.com',
  password: 'devseed-password-onboarding',
}

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/sign-in')
  await page.getByLabel(/email/i).fill(ONBOARDING_USER.email)
  await page.getByLabel(/password/i).fill(ONBOARDING_USER.password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'))
}

async function expectAccessible(page: import('@playwright/test').Page) {
  const result = await new AxeBuilder({ page }).analyze()
  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([])
}

test('new member reaches a useful first session through the seven-step flow', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await signIn(page)
  await expect(page).toHaveURL(/\/onboarding$/)
  await expect(page.getByRole('heading', { name: 'Welcome, Alex.' })).toBeVisible()
  await expect(page.getByText('A few quick steps, about two minutes.')).toBeVisible()
  await expectAccessible(page)
  await page.screenshot({ path: '/private/tmp/bridgecircle-onboarding-welcome.png', fullPage: true })

  await page.getByRole('button', { name: 'Get started' }).click()
  await expect(page).toHaveURL(/\/onboarding\?step=1/)
  await expect(page.getByRole('heading', { name: /set up your Chadwick School.* profile/i })).toBeVisible()
  await page.getByRole('button', { name: 'Save and continue' }).click()

  await expect(page).toHaveURL(/step=2/)
  await expect(page.getByRole('heading', { name: 'Bring your history in one go.' })).toBeVisible()
  await expect(page.getByText('Your import is ready to review')).toBeVisible()
  await page.getByRole('link', { name: 'Review imported details' }).click()
  await expect(page).toHaveURL(/\/onboarding\/import\//)
  await expect(page.getByRole('heading', { name: 'Choose what joins your profile.' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Employer' })).toHaveValue('Civic Futures')
  await expectAccessible(page)
  await page.screenshot({ path: '/private/tmp/bridgecircle-onboarding-import-review.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() =>
      page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
      })),
    )
    .toEqual({ viewport: 390, document: 390 })
  await page.screenshot({
    path: '/private/tmp/bridgecircle-onboarding-import-review-mobile.png',
    fullPage: false,
  })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.getByRole('button', { name: 'Apply and continue' }).click()

  for (const step of [3, 4, 5]) {
    await expect(page).toHaveURL(new RegExp(`step=${step}`))
    await page.getByRole('button', { name: 'Skip for now' }).click()
  }

  await expect(page).toHaveURL(/step=6/)
  const availability = page.getByRole('checkbox', { name: /open to helping people in my circle/i })
  if (!(await availability.isChecked())) await availability.check()
  await page.getByRole('button', { name: 'Save and continue' }).click()

  await expect(page).toHaveURL(/step=7/)
  await expect(page.getByRole('heading', { name: 'Start with one real thing.' })).toBeVisible()
  await expect(page.getByText('Want to help someone?')).toBeVisible()
  await expect(page.getByText('Say hi to your class')).toBeVisible()

  await page.getByRole('link', { name: 'Offer' }).first().click()
  await page.waitForURL(/\/onboarding\/offers\//, { timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Send offer' })).toBeVisible()
  await page.getByRole('button', { name: 'Send offer' }).click()
  await expect(page.getByRole('heading', { name: 'Your offer is in' })).toBeVisible()
  await page.getByText('Back to onboarding', { exact: true }).click()

  await expect(page).toHaveURL(/\/onboarding\?step=7/)
  await expect(page.getByText('Offered', { exact: true })).toBeVisible()
  await page.getByLabel(/Taylor Reed/).check()
  await page.getByLabel(/Something you may want help with/).fill('How should I approach a move into climate investing?')

  await page.setViewportSize({ width: 390, height: 844 })
  await expectAccessible(page)
  await page.screenshot({
    path: '/private/tmp/bridgecircle-onboarding-cold-start-mobile.png',
    fullPage: true,
  })

  await page.getByRole('button', { name: 'Send 1 hello and finish' }).click()
  await expect(page).toHaveURL(/\/onboarding\?complete=1/)
  await expect(page.getByRole('heading', { name: "You're all set, Alex." })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to your dashboard' })).toBeVisible()
  await expectAccessible(page)
  await page.screenshot({
    path: '/private/tmp/bridgecircle-onboarding-complete-mobile.png',
    fullPage: true,
  })

  expect(consoleErrors).toEqual([])
})
