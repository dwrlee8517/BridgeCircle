import { expect, test } from '@playwright/test'
import { signIn } from '../helpers/auth'
import { allowHostedDevSeedAcceptance, isRemote } from '../helpers/env'

const RICHARD = { email: 'richard@example.com', password: 'devseed-password-richard' }

test.describe.configure({ mode: 'serial' })
test.skip(
  isRemote && !allowHostedDevSeedAcceptance,
  'Help Get acceptance needs local seed ownership or explicit hosted-dev authorization.',
)

test('Help remembers the member’s last mode without using invalid tab semantics', async ({
  page,
}) => {
  await signIn(page, RICHARD.email, RICHARD.password)
  await page.goto('/help')

  const modeNavigation = page.getByRole('navigation', { name: 'Get help or give help' })
  await expect(modeNavigation.getByRole('link', { name: 'Get help' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await modeNavigation.getByRole('link', { name: 'Give help' }).click()
  await expect(page.getByRole('heading', { name: 'Where your experience matters.' })).toBeVisible()

  await page.goto('/school')
  await page.goto('/help')
  await expect(page.getByRole('heading', { name: 'Where your experience matters.' })).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Get help or give help' })
    .getByRole('link', { name: 'Get help' })
    .click()
  await expect(page.getByRole('heading', { name: 'What do you need?' })).toBeVisible()
  await page.goto('/people')
  await page.goto('/help')
  await expect(page.getByRole('heading', { name: 'What do you need?' })).toBeVisible()
})

test('Help searches after a typing pause and carries a no-match question into Ask the circle', async ({
  page,
}) => {
  let searches = 0
  await page.route('**/api/help/candidates', async (route) => {
    searches += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [] }),
    })
  })

  await signIn(page, RICHARD.email, RICHARD.password)
  await page.goto('/help')
  const question = 'How do I move from research into climate infrastructure investing?'
  await page.getByRole('textbox', { name: 'What do you need help with?' }).fill(question)

  const noMatches = page.getByRole('region', { name: 'No strong matches yet' })
  await expect(noMatches).toBeVisible()
  await expect.poll(() => searches).toBe(1)
  await noMatches.getByRole('button', { name: 'Ask the circle' }).click()
  await expect(page).toHaveURL('/help/ask-circle')
  await expect(page.getByRole('textbox', { name: 'Your ask' })).toHaveValue(question)
})
