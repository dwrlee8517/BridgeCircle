import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { signIn } from '../helpers/auth'
import { isRemote } from '../helpers/env'

const RICHARD = {
  email: 'richard@example.com',
  password: 'devseed-password-richard',
}

async function expectNoAccessibilityViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations, violations.map((violation) => violation.help).join('\n')).toEqual([])
}

async function waitForOwnAnimations(locator: Locator) {
  await locator.evaluate(async (element) => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => {})))
  })
}

test.describe.configure({ mode: 'serial' })
test.skip(isRemote, 'People acceptance roads depend on the disposable local seed.')

test('directory selection, filters, Connect, profile navigation, and mobile preview stay coherent', async ({
  page,
}) => {
  await signIn(page, RICHARD.email, RICHARD.password)
  await page.goto('/people')

  await expect(page.getByRole('heading', { name: 'Find people to connect with.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Industry' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Class year' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Location' })).toBeVisible()
  await expectNoAccessibilityViolations(page)

  const jordanPreviewButton = page.getByRole('button', {
    name: 'Open preview for Jordan Kim',
  })
  await jordanPreviewButton.click()
  const desktopPreview = page.getByRole('complementary', {
    name: 'Profile preview for Jordan Kim',
  })
  await expect(desktopPreview).toBeVisible()
  await expect(desktopPreview.getByRole('link', { name: 'View full profile' })).toBeVisible()
  await desktopPreview.getByRole('button', { name: 'Close profile preview' }).click()
  await expect(jordanPreviewButton).toBeFocused()

  await page.getByRole('button', { name: 'Location' }).click()
  await page.getByRole('textbox', { name: 'Location' }).fill('New York')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page).toHaveURL('/people?location=New+York')
  await expect(page.getByRole('button', { name: 'Location · New York' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Jordan Kim' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mark Chen' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Location · New York' }).click()
  await page.getByRole('button', { name: 'Clear' }).click()
  await expect(page).toHaveURL('/people')

  await page.getByRole('button', { name: 'In your circle' }).click()
  await expect(page).toHaveURL('/people?scope=in_circle')
  await page.getByRole('link', { name: 'Manage circle' }).click()
  await expect(page).toHaveURL('/people/circle')
  await expect(page.getByRole('heading', { name: 'My circle' })).toBeVisible()
  const meiCircleRow = page.getByRole('article').filter({
    has: page.getByRole('link', { name: 'Mei Park' }),
  })
  await expect(meiCircleRow.getByRole('link', { name: 'Message', exact: true })).toBeVisible()
  await meiCircleRow.getByRole('button', { name: 'Disconnect…' }).click()
  const disconnectDialog = page.getByRole('dialog', { name: 'Disconnect from Mei Park?' })
  await expect(disconnectDialog).toContainText(
    'Your messages stay, and neither of you is notified.',
  )
  await disconnectDialog.getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('link', { name: 'Back to People' }).click()
  await expect(page).toHaveURL('/people')

  await page.getByRole('button', { name: 'Connect' }).first().click()
  const connectDialog = page.getByRole('dialog', { name: /^Connect with / })
  await expect(connectDialog.getByRole('button', { name: 'Quick hello' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await connectDialog.getByRole('button', { name: 'Say why — AI shapes it' }).click()
  await connectDialog
    .getByRole('textbox', { name: 'For someone new — say why, casually' })
    .fill('I am exploring a similar move into climate investing.')
  const shapeButton = connectDialog.getByRole('button', { name: 'Shape my note' })
  await expect(shapeButton).toBeEnabled()
  await expect(connectDialog.getByRole('textbox', { name: 'Your request message' })).toBeEditable()
  await waitForOwnAnimations(shapeButton)
  await waitForOwnAnimations(connectDialog)
  await expectNoAccessibilityViolations(page)
  await connectDialog.getByRole('button', { name: 'Cancel' }).click()

  const jordanProfileLink = page.getByRole('link', { name: 'Jordan Kim' })
  await jordanProfileLink.click()
  await expect(page).toHaveURL('/profile/10000000-0000-4000-8000-000000000006')
  const profileOverlay = page.getByRole('dialog', { name: 'Jordan Kim' })
  await expect(profileOverlay.getByRole('heading', { name: 'About' })).toBeVisible()
  await expect(profileOverlay.getByRole('heading', { name: 'Can help with' })).toBeVisible()
  await expect(profileOverlay.getByRole('link', { name: 'Open full profile' })).toBeVisible()
  await expect(profileOverlay.getByRole('heading', { name: 'Career' })).toHaveCount(0)
  await waitForOwnAnimations(profileOverlay)
  await expectNoAccessibilityViolations(page)
  await profileOverlay.getByRole('button', { name: 'Close' }).click()
  await expect(page).toHaveURL('/people')
  await expect(jordanProfileLink).toBeFocused()

  await page.goForward()
  await expect(page.getByRole('dialog', { name: 'Jordan Kim' })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL('/people')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await page.getByRole('button', { name: 'Open preview for Jordan Kim' }).click()
  const mobilePreviewDialog = page.getByRole('dialog', {
    name: 'Profile preview for Jordan Kim',
  })
  await expect(mobilePreviewDialog).toBeVisible()
  await expect(
    mobilePreviewDialog.getByRole('complementary', {
      name: 'Profile preview for Jordan Kim',
    }),
  ).toBeVisible()
  await waitForOwnAnimations(mobilePreviewDialog)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true)
  await expectNoAccessibilityViolations(page)
  await mobilePreviewDialog.getByRole('button', { name: 'Close profile preview' }).click()
  await expect(page.getByRole('button', { name: 'Open preview for Jordan Kim' })).toBeFocused()
})
