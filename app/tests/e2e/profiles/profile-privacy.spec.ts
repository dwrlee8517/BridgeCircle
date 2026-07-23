// Parity coverage (see parity/README.md): @feature:profile.view @feature:ask.compose
import { expect, test, type Page } from '@playwright/test'
import { signIn } from '../helpers/auth'
import { allowHostedDevSeedAcceptance, isRemote } from '../helpers/env'

const PERSONAS = {
  owner: {
    email: 'richard@example.com',
    password: 'devseed-password-richard',
  },
  connected: {
    email: 'richard@example.com',
    password: 'devseed-password-richard',
  },
  stranger: {
    email: 'sam@example.com',
    password: 'devseed-password-sam',
  },
}

const MEMBERS = {
  blocked: '10000000-0000-4000-8000-000000000001',
  organizationLink: '10000000-0000-4000-8000-000000000003',
  connectionLink: '10000000-0000-4000-8000-000000000004',
  directAsk: '10000000-0000-4000-8000-000000000006',
}

const LINKS = {
  self: 'https://www.linkedin.com/in/richard-lee',
  organization: 'https://www.linkedin.com/in/mark-chen',
  connection: 'https://www.linkedin.com/in/mei-park',
}

const JORDAN_THREAD = '50000000-0000-4000-8000-000000000002'

async function switchPersona(
  page: Page,
  persona: { email: string; password: string },
): Promise<void> {
  await page.context().clearCookies()
  await signIn(page, persona.email, persona.password)
}

test.describe.configure({ mode: 'serial' })
test.skip(
  isRemote && !allowHostedDevSeedAcceptance,
  'Profile privacy acceptance needs local seed ownership or explicit hosted-dev authorization.',
)

test('profile links follow organization, connection, and self audiences in the rendered app', async ({
  page,
}) => {
  await switchPersona(page, PERSONAS.stranger)
  await page.goto(`/profile/${MEMBERS.organizationLink}`)
  await expect(
    page.locator(`a[href="${LINKS.organization}"]`).filter({ visible: true }),
  ).toBeVisible()

  await page.goto(`/profile/${MEMBERS.connectionLink}`)
  await expect(page.getByRole('heading', { name: 'Mei Park' })).toBeVisible()
  await expect(page.locator(`a[href="${LINKS.connection}"]`)).toHaveCount(0)

  await switchPersona(page, PERSONAS.connected)
  await page.goto(`/profile/${MEMBERS.connectionLink}`)
  await expect(
    page.locator(`a[href="${LINKS.connection}"]`).filter({ visible: true }),
  ).toBeVisible()

  await switchPersona(page, PERSONAS.owner)
  await page.goto('/profile/me')
  await expect(page.getByRole('heading', { name: 'Richard Lee' })).toBeVisible()
  await expect(page.locator(`a[href="${LINKS.self}"]`).filter({ visible: true })).toBeVisible()
  await expect(
    page.locator('a[href="/profile/me"][aria-current="page"]').filter({ visible: true }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: 'Primary' })
      .locator('a[aria-current="page"]')
      .filter({ visible: true }),
  ).toHaveCount(0)
})

test('blocked profile and directory access converge on an unavailable surface', async ({ page }) => {
  await switchPersona(page, PERSONAS.owner)
  await page.goto(`/profile/${MEMBERS.blocked}`)
  await expect(page.getByRole('heading', { name: 'This profile isn’t here anymore' })).toBeVisible()

  await page.goto('/people')
  await expect(page.getByRole('link', { name: 'Amy Admin' })).toHaveCount(0)
})

test('an open helper profile starts a direct Ask without a prior Help search', async ({ page }) => {
  await switchPersona(page, PERSONAS.owner)
  await page.goto(`/profile/${MEMBERS.directAsk}`)

  await page.getByRole('link', { name: 'Ask for help' }).click()
  await expect(page).toHaveURL('/help/ask/20000000-0000-4000-8000-000000000006')
  await expect(page.getByRole('textbox', { name: 'What would you like help with?' })).toBeVisible()

  await page.goto(`/profile/${MEMBERS.directAsk}`)
  await page.getByRole('link', { name: 'Climate tech' }).click()
  await expect(page).toHaveURL(
    '/help/ask/20000000-0000-4000-8000-000000000006?topic=Climate%20tech',
  )
  await expect(page.getByRole('textbox', { name: 'What would you like help with?' })).toHaveValue(
    'I’m hoping to learn from your experience with Climate tech.',
  )
})

test('an intercepted profile preserves its originating section and restores focus on close', async ({
  page,
}) => {
  await switchPersona(page, PERSONAS.owner)
  await page.goto('/messages')
  await page.getByRole('link', { name: 'Jordan Kim' }).click()
  await expect(page).toHaveURL(`/messages/${JORDAN_THREAD}`)

  const profileLink = page
    .getByLabel('Conversation details')
    .getByRole('link', { name: 'Jordan Kim' })
  await profileLink.click()
  await expect(page).toHaveURL(`/profile/${MEMBERS.directAsk}`)
  await expect(
    page.locator('nav[aria-label="Primary"] a[href="/messages"]').filter({ visible: true }),
  ).toHaveAttribute('aria-current', 'page')

  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page).toHaveURL(`/messages/${JORDAN_THREAD}`)
  await expect(profileLink).toBeFocused()
})
