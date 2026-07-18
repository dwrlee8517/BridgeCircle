import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { signIn } from '../helpers/auth'
import { allowHostedDevSeedAcceptance, isRemote } from '../helpers/env'

const RICHARD = {
  email: 'richard@example.com',
  password: 'devseed-password-richard',
}
const RESOLVED_ASK_THREAD = '50000000-0000-4000-8000-000000000003'

async function expectNoAccessibilityViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations, violations.map((violation) => violation.help).join('\n')).toEqual([])
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true)
}

test.describe.configure({ mode: 'serial' })
test.skip(
  isRemote && !allowHostedDevSeedAcceptance,
  'Home acceptance needs local seed ownership or explicit hosted-dev authorization.',
)

test('Home composes the current circle into one calm, accessible dashboard', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await signIn(page, RICHARD.email, RICHARD.password)

  await expect(page.getByRole('heading', { name: 'Welcome back, Richard.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'This week in the circle' })).toBeVisible()
  await expect(page.getByText('1 of 2', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'What do you need help with?' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Waiting on you/ })).toContainText('3')
  await expect(page.getByRole('heading', { name: 'Your asks' })).toBeVisible()
  await expect(page.getByText('2 of 5 open', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'From the school' })).toBeVisible()

  await page.getByRole('button', { name: 'Next spotlight' }).click()
  await expect(page.getByText('2 of 2', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Previous spotlight' }).click()
  await expect(page.getByText('1 of 2', { exact: true })).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectNoAccessibilityViolations(page)
  await page.screenshot({
    path: testInfo.outputPath('playwright-home-1440.png'),
    animations: 'disabled',
  })
})

test('a private Home question arrives in Help intact and leaves no question in the URL', async ({
  page,
}) => {
  const question = 'I need help comparing two product roles.'
  await signIn(page, RICHARD.email, RICHARD.password)
  await page.getByRole('textbox', { name: 'What do you need help with?' }).fill(question)
  await page.getByRole('button', { name: 'Find people' }).click()

  await expect(page).toHaveURL(/\/help$/)
  await expect(page.getByRole('textbox', { name: 'What do you need help with?' })).toHaveValue(
    question,
  )
  await expect(page.locator('[aria-live="polite"][aria-atomic="true"]')).toContainText(
    /possible helpers found|Finding people who can speak/i,
  )
  await expect(page).not.toHaveURL(/product|roles|from=home/)
})

test('the Waiting fold preference is shared between Home and Messages', async ({ page }) => {
  await signIn(page, RICHARD.email, RICHARD.password)
  const homeWaiting = page.getByRole('button', { name: /Waiting on you/ })
  await expect(homeWaiting).toHaveAttribute('aria-expanded', 'true')
  await homeWaiting.click()
  await expect(homeWaiting).toHaveAttribute('aria-expanded', 'false')

  await page.goto('/messages')
  await expect(page.getByRole('button', { name: /Waiting on you/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

test('resolved Ask conversations expose bilateral, dependency-safe outcome consent', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signIn(page, RICHARD.email, RICHARD.password)
  await page.goto(`/messages/${RESOLVED_ASK_THREAD}`)

  const story = page.getByRole('checkbox', { name: 'Share this win with the circle' })
  const identity = page.getByRole('checkbox', { name: 'Include my name if they do too' })
  await expect(story).toBeVisible()
  await expect(story).not.toBeChecked()
  await expect(identity).toBeDisabled()
  await expect(identity).not.toBeChecked()
  await expectNoAccessibilityViolations(page)
})

test('Home keeps its core actions visible without horizontal overflow at acceptance widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await signIn(page, RICHARD.email, RICHARD.password)

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 768 ? 900 : 844 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Welcome back, Richard.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Find people' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your asks' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  }
})
