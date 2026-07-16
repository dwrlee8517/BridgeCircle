import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { signIn } from '../helpers/auth'
import { isRemote } from '../helpers/env'

const RICHARD = { email: 'richard@example.com', password: 'devseed-password-richard' }
const AMY = { email: 'admin-amy@example.com', password: 'devseed-password-amy' }
const DINNER = 'eeee0000-0000-4000-8000-000000000002'

async function signInPersona(page: Page, persona: typeof RICHARD) {
  await page.context().clearCookies()
  await signIn(page, persona.email, persona.password)
}

async function expectNoAccessibilityViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations, violations.map((violation) => violation.help).join('\n')).toEqual([])
}

test.describe.configure({ mode: 'serial' })
test.skip(isRemote, 'School acceptance roads depend on the disposable local seed.')

test('School hub, event detail, announcements, and newsletter form one coherent reading flow', async ({
  page,
}) => {
  await signInPersona(page, RICHARD)
  await page.goto('/school')

  await expect(
    page.getByRole('heading', { name: 'Close to school, not buried in it.' }),
  ).toBeVisible()
  await expect(page.getByRole('region', { name: 'Events you are attending' })).toContainText(
    'Seoul alumni office hours',
  )
  await expect(page.getByRole('heading', { name: 'Seoul alumni office hours' })).toBeVisible()
  await page.getByRole('link', { name: 'View details' }).click()
  await expect(page.getByRole('link', { name: 'Join now' })).toHaveAttribute(
    'href',
    'https://meet.example.com/chadwick-office-hours',
  )
  await expectNoAccessibilityViolations(page)

  await page.getByRole('link', { name: 'Back to School' }).click()
  await page.getByRole('link', { name: /Founders Dinner at The Riviera/ }).click()
  await expect(page).toHaveURL(new RegExp(`/school\\?event=${DINNER}$`))
  await page.getByRole('link', { name: 'View details' }).click()
  await expect(page).toHaveURL(`/school/events/${DINNER}`)
  await expect(page.getByRole('heading', { name: 'Itinerary' })).toBeVisible()
  await expect(page.getByText('Doors open and drinks')).toBeVisible()
  await expect(page.getByRole('heading', { name: "Who's going" })).toBeVisible()

  await page.getByRole('link', { name: 'Back to School' }).click()
  await page.getByRole('link', { name: 'View all' }).click()
  await expect(page).toHaveURL('/school/announcements')
  await page.getByRole('link', { name: 'Mentorship', exact: true }).click()
  await expect(page).toHaveURL('/school/announcements?tag=mentorship')
  await expect(page.getByText('Career conversations for this summer')).toBeVisible()
  await page.getByText('Career conversations for this summer').click()
  await expect(page).toHaveURL('/school/announcements/aaaa0000-0000-4000-8000-000000000002')
  await expect(
    page
      .getByRole('article')
      .getByRole('heading', { name: 'Career conversations for this summer' }),
  ).toBeVisible()
  await expectNoAccessibilityViolations(page)

  await page.goto('/school/newsletter')
  await expect(page.getByRole('heading', { name: 'Notes worth keeping' })).toBeVisible()
  await page.getByRole('link', { name: /The Bridge · July 2026/ }).click()
  await expect(page).toHaveURL('/school/newsletter/july-2026')
  await expect(page.getByRole('heading', { name: 'A summer return to campus' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'One useful conversation' })).toBeVisible()
  await expectNoAccessibilityViolations(page)
})

test('full event uses a held offer and requires an explicit yes before confirming attendance', async ({
  page,
}) => {
  await signInPersona(page, RICHARD)
  await page.goto(`/school/events/${DINNER}`)
  await page.getByRole('button', { name: 'Join waitlist' }).click()
  await expect(page.getByRole('status')).toHaveText(
    "You're on the list — we will ask before taking a spot.",
  )
  await expect(page.getByRole('button', { name: 'On waitlist · Leave' })).toBeVisible()

  await signInPersona(page, AMY)
  await page.goto(`/school/events/${DINNER}`)
  await page.getByRole('button', { name: "You're going · Change" }).click()
  await expect(page.getByRole('status')).toHaveText(
    'You are off the list. If it was full, the next person is asked.',
  )

  await signInPersona(page, RICHARD)
  await page.goto(`/school/events/${DINNER}`)
  const offer = page.getByRole('dialog', { name: 'A spot opened — still want in?' })
  await expect(offer).toBeVisible()
  await expect(offer).toContainText('Nothing happens unless you say yes.')
  await offer.getByRole('button', { name: "Yes — I'm in" }).click()
  await expect(offer).toHaveCount(0)
  await expect(page.getByRole('button', { name: "You're going · Change" })).toBeVisible()
})

test('School remains readable and free of horizontal overflow on a phone viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signInPersona(page, RICHARD)
  await page.goto('/school')
  await expect(page.getByRole('heading', { name: 'Close to school, not buried in it.' })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true)
  await expectNoAccessibilityViolations(page)

  await page.goto(`/school/events/${DINNER}`)
  await expect(page.getByRole('heading', { name: 'Founders Dinner at The Riviera' })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true)
  await expectNoAccessibilityViolations(page)
})
