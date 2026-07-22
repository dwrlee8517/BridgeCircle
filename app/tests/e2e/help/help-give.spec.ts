import * as crypto from 'node:crypto'
import { expect, test } from '@playwright/test'
import { signInAs } from '../helpers/auth'
import { FoundationScenario, type FoundationMember } from '../helpers/foundation'

const scenario = new FoundationScenario()
let helper: FoundationMember
const question = 'Who can pressure-test an orchard robotics pilot?'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  const organization = await scenario.createOrganization(false, 'Give Help Browse')
  const asker = await scenario.createMember(organization.id, 'Asker')
  helper = await scenario.createMember(organization.id, 'Helper')
  const { error } = await scenario.admin.from('asks').insert({
    organization_id: organization.id,
    asker_membership_id: asker.membershipId,
    kind: 'circle',
    status: 'open',
    question,
    reach: 'organization',
    anonymous_until_accepted: false,
    client_request_id: crypto.randomUUID(),
  })
  if (error) throw new Error(`create Give Help ask: ${error.message}`)
})

test.afterAll(async () => {
  await scenario.destroy()
})

test('Give Help supports private browse search, result navigation, and a truthful no-match state', async ({
  page,
}) => {
  await signInAs(page, helper)
  await page.goto('/help?mode=give')

  const browse = page
    .getByRole('heading', { name: 'Browse open asks' })
    .locator('xpath=ancestor::section[1]')
  await expect(browse).toBeVisible()
  await expect(browse.getByText(question)).toBeVisible()

  const search = page.getByRole('textbox', { name: 'Search open asks' })
  await search.fill('orchard robotics')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page).toHaveURL(/\/help\?mode=give&q=orchard(?:\+|%20)robotics$/)
  await expect(browse.getByText(question)).toBeVisible()

  await search.fill('marine archaeology')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(browse.getByText('No open asks match “marine archaeology” yet.')).toBeVisible()
})

test('Give Help remains usable without horizontal overflow on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signInAs(page, helper)
  await page.goto('/help?mode=give&q=orchard')

  const browse = page
    .getByRole('heading', { name: 'Browse open asks' })
    .locator('xpath=ancestor::section[1]')
  await expect(browse.getByText(question)).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true)
})
