import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { createAdminClient } from '../../../src/db/admin'
import { signIn, sendComposerMessage } from '../helpers/auth'
import { isRemote, loadE2eEnv } from '../helpers/env'

const RICHARD = {
  email: 'richard@example.com',
  password: 'devseed-password-richard',
}
const JORDAN = {
  email: 'jordan@example.com',
  password: 'devseed-password-jordan',
}

const JORDAN_THREAD = '50000000-0000-4000-8000-000000000002'
const MARK_THREAD = '50000000-0000-4000-8000-000000000004'
const MARK_USER = '10000000-0000-4000-8000-000000000003'

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

test.describe.configure({ mode: 'serial', timeout: 90_000 })
test.skip(isRemote, 'Messages acceptance roads mutate the disposable local seed only.')

test.beforeAll(() => loadE2eEnv())

test('inbox exposes the canonical seed branches and accepts a direct Ask into Messages', async ({
  page,
}) => {
  await signIn(page, RICHARD.email, RICHARD.password)
  await page.goto('/messages')

  const filters = page.getByRole('group', { name: 'Message filters' })
  await expect(filters.getByRole('button', { name: 'All 5' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(filters.getByRole('button', { name: 'Unread 1' })).toBeVisible()
  await expect(filters.getByRole('button', { name: 'My circle 1' })).toBeVisible()
  await expect(filters.getByRole('button', { name: 'Open asks 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Waiting on you/ })).toContainText('3')
  await expect(page.getByRole('link', { name: /Jordan Kim, 1 unread/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Jordan Kim/ })).toHaveCount(1)
  await expect(page.getByRole('link', { name: /Amy Admin/ })).toHaveCount(0)
  await expectNoAccessibilityViolations(page)

  await filters.getByRole('button', { name: 'Unread 1' }).click()
  await expect(page.getByRole('link', { name: /Jordan Kim, 1 unread/ })).toBeVisible()
  await filters.getByRole('button', { name: 'My circle 1' }).click()
  await expect(page.getByRole('link', { name: 'Mei Park', exact: true })).toBeVisible()
  await filters.getByRole('button', { name: 'Open asks 1' }).click()
  await expect(page.getByRole('list', { name: 'Conversations' }).getByRole('link')).toHaveCount(1)
  await expect(page.getByRole('link', { name: /Jordan Kim/ })).toBeVisible()
  await filters.getByRole('button', { name: 'All 5' }).click()

  const search = page.getByRole('textbox', { name: 'Search messages' })
  await search.fill('Historical risk discussion 27')
  await expect(page.getByRole('link', { name: /Jordan Kim/ })).toHaveCount(1)
  await expect(page.getByText('1 conversation shown.')).toBeAttached()
  await page.getByRole('button', { name: 'Clear message search' }).click()
  await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Deleted member', exact: true })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Conversations' }).getByRole('link')).toHaveCount(5)

  const directAsk = page.locator('li').filter({ hasText: 'Asked for your help' })
  await directAsk.getByRole('link', { name: 'View ask' }).click()
  await expect(page).toHaveURL(/\/help\/asks\/30000000-0000-4000-8000-000000000005$/)

  const opening = 'I can help you pressure-test the case structure before the interview.'
  await page.getByLabel('Your opening message').fill(opening)
  await page.getByRole('button', { name: 'Accept & send' }).click()
  await expect(page).toHaveURL(/\/messages\/[0-9a-f-]{36}$/)
  await expect(
    page.getByLabel('Conversation', { exact: true }).getByText(opening, { exact: true }),
  ).toBeVisible()

  const followUp = 'Send the outline when it is ready and I will mark up the decision points.'
  await sendComposerMessage(page, followUp)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
  await expect(
    page.getByLabel('Conversation', { exact: true }).getByText(followUp, { exact: true }),
  ).toBeVisible()
})

test('Connection accept and decline are durable and preserve the accepted intro', async ({ page }) => {
  await signIn(page, RICHARD.email, RICHARD.password)
  await page.goto('/messages')

  const markRequest = page.locator('li').filter({ hasText: 'Mark Chen' }).filter({
    hasText: 'Wants to connect',
  })
  await markRequest.getByRole('button', { name: 'Accept' }).click()
  await expect(page).toHaveURL(`/messages/${MARK_THREAD}`)
  await expect(
    page
      .getByLabel('Conversation', { exact: true })
      .getByText('I enjoyed our earlier conversation and would be glad to stay in touch.', {
        exact: true,
      }),
  ).toBeVisible()
  await expect(page.getByText('In your circle', { exact: true })).toBeVisible()

  await page.goto('/messages')
  const samRequest = page.locator('li').filter({ hasText: 'Sam Rivera' }).filter({
    hasText: 'Wants to connect',
  })
  await samRequest.getByRole('button', { name: 'Decline' }).click()
  await expect(samRequest).toHaveCount(0)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
  await expect(
    page.locator('li').filter({ hasText: 'Sam Rivera' }).filter({ hasText: 'Wants to connect' }),
  ).toHaveCount(0)

  const admin = createAdminClient()
  await expect
    .poll(async () => {
      const [{ data: connection }, { data: declined }] = await Promise.all([
        admin
          .from('connections')
          .select('user_a_id,user_b_id')
          .or(`user_a_id.eq.${MARK_USER},user_b_id.eq.${MARK_USER}`)
          .maybeSingle(),
        admin
          .from('connection_requests')
          .select('status')
          .eq('id', '40000000-0000-4000-8000-000000000002')
          .single(),
      ])
      return { connected: Boolean(connection), declined: declined?.status }
    })
    .toEqual({ connected: true, declined: 'declined' })
})

test('owner Realtime converges unread state and the Ask remains sendable after resolution', async ({
  page,
  browser,
}) => {
  await signIn(page, RICHARD.email, RICHARD.password)
  await page.goto(`/messages/${JORDAN_THREAD}`)
  await expect(
    page
      .getByLabel('Conversation', { exact: true })
      .getByText('Start with who bears completion risk', { exact: false }),
  ).toBeVisible()
  await page.waitForTimeout(500)
  await page.goto('/messages')
  await expect(page.locator(`a[href="/messages/${JORDAN_THREAD}"]`)).toHaveAttribute(
    'aria-label',
    'Jordan Kim',
  )

  const jordanContext = await browser.newContext()
  const jordanPage = await jordanContext.newPage()
  try {
    await signIn(jordanPage, JORDAN.email, JORDAN.password)
    await jordanPage.goto(`/messages/${JORDAN_THREAD}`)
    const realtimeBody = `Realtime check ${Date.now()}`
    await sendComposerMessage(jordanPage, realtimeBody)

    await expect(page.getByRole('link', { name: /Jordan Kim, 1 unread/ })).toBeVisible()
    await expect(page.getByText(realtimeBody, { exact: true })).toBeVisible()
    await page.getByRole('link', { name: /Jordan Kim, 1 unread/ }).click()
    await expect(
      page.getByLabel('Conversation', { exact: true }).getByText(realtimeBody, { exact: true }),
    ).toBeVisible()
  } finally {
    await jordanContext.close()
  }

  await page.getByRole('button', { name: 'Add to your circle' }).click()
  await expect(page.getByRole('button', { name: 'Request sent' })).toBeVisible()

  await page.getByRole('button', { name: 'Mark ask resolved' }).click()
  const resolveDialog = page.getByRole('dialog', { name: 'Mark this ask resolved?' })
  await expect(resolveDialog).toBeVisible()
  await expect
    .poll(() => resolveDialog.evaluate((dialog) => dialog.contains(document.activeElement)))
    .toBe(true)
  await expectNoAccessibilityViolations(page)
  await resolveDialog.getByLabel(/What helped/).fill('A durable risk framework and concrete questions.')
  await resolveDialog.getByRole('button', { name: 'Mark resolved' }).click()
  await expect(
    page
      .getByLabel('Conversation details')
      .getByText('Resolved', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible()

  const afterResolve = 'The ask is closed, and this conversation still works.'
  await sendComposerMessage(page, afterResolve)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
  await expect(
    page.getByLabel('Conversation', { exact: true }).getByText(afterResolve, { exact: true }),
  ).toBeVisible()
  await expect(
    page
      .getByLabel('Conversation details')
      .getByText('Resolved', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible()
})

test('report, disconnect, block, keyboard focus, and acceptance widths stay safe', async ({ page }) => {
  await signIn(page, RICHARD.email, RICHARD.password)
  await page.goto(`/messages/${MARK_THREAD}`)

  await page.getByRole('button', { name: 'Report' }).first().click()
  const reportDialog = page.getByRole('dialog', { name: 'Report this message' })
  await expect(reportDialog).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await reportDialog.getByRole('button', { name: 'Spam' }).click()
  await reportDialog.getByLabel(/Anything else/).fill('Acceptance-road evidence only.')
  await reportDialog.getByRole('button', { name: 'Send report' }).click()
  await expect(reportDialog.getByRole('status')).toHaveText('Thanks — we’ll look into it.')
  await reportDialog.getByRole('button', { name: 'Done' }).click()
  await expect(reportDialog).toBeHidden()

  await page.getByRole('button', { name: 'Disconnect' }).click()
  const disconnectDialog = page.getByRole('dialog', { name: 'Disconnect from Mark Chen?' })
  await expect(disconnectDialog).toBeVisible()
  await disconnectDialog.getByRole('button', { name: 'Disconnect' }).click()
  await expect(page.getByText('This conversation is read-only.').first()).toBeVisible()
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
  await expect(page.getByText('This conversation is read-only.').first()).toBeVisible()
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Block member' }).click()
  const blockDialog = page.getByRole('dialog', { name: 'Block Mark Chen?' })
  await expect(blockDialog).toBeVisible()
  await blockDialog.getByRole('button', { name: 'Block member' }).click()
  await expect(page).toHaveURL(/\/messages$/)
  await expect(page.getByRole('link', { name: /Mark Chen/ })).toHaveCount(0)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
  await expect(page.getByRole('link', { name: /Mark Chen/ })).toHaveCount(0)

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/messages')
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      )
      .toBe(true)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/messages/${JORDAN_THREAD}`)
  const details = page.getByRole('button', { name: 'Details' })
  await details.focus()
  await details.click()
  const detailsDialog = page.getByRole('dialog', { name: 'Conversation details' })
  await expect(detailsDialog).toBeVisible()
  await waitForOwnAnimations(detailsDialog)
  await expectNoAccessibilityViolations(page)
  await page.keyboard.press('Escape')
  await expect(detailsDialog).toBeHidden()
  await expect(details).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
