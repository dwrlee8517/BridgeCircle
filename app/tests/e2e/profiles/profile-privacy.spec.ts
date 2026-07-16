import { expect, test, type Page } from '@playwright/test'
import { signIn } from '../helpers/auth'
import { isRemote } from '../helpers/env'

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
}

const LINKS = {
  self: 'https://www.linkedin.com/in/richard-lee',
  organization: 'https://www.linkedin.com/in/mark-chen',
  connection: 'https://www.linkedin.com/in/mei-park',
}

async function switchPersona(
  page: Page,
  persona: { email: string; password: string },
): Promise<void> {
  await page.context().clearCookies()
  await signIn(page, persona.email, persona.password)
}

test.describe.configure({ mode: 'serial' })
test.skip(isRemote, 'Profile privacy acceptance depends on the disposable local v2 seed.')

test('profile links follow organization, connection, and self audiences in the rendered app', async ({
  page,
}) => {
  await switchPersona(page, PERSONAS.stranger)
  await page.goto(`/profile/${MEMBERS.organizationLink}`)
  await expect(page.locator(`a[href="${LINKS.organization}"]`)).toBeVisible()

  await page.goto(`/profile/${MEMBERS.connectionLink}`)
  await expect(page.getByRole('heading', { name: 'Mei Park' })).toBeVisible()
  await expect(page.locator(`a[href="${LINKS.connection}"]`)).toHaveCount(0)

  await switchPersona(page, PERSONAS.connected)
  await page.goto(`/profile/${MEMBERS.connectionLink}`)
  await expect(page.locator(`a[href="${LINKS.connection}"]`)).toBeVisible()

  await switchPersona(page, PERSONAS.owner)
  await page.goto('/profile/me')
  await expect(page.getByRole('heading', { name: 'Richard Lee' })).toBeVisible()
  await expect(page.locator(`a[href="${LINKS.self}"]`)).toBeVisible()
})

test('blocked profile and directory access converge on an unavailable surface', async ({ page }) => {
  await switchPersona(page, PERSONAS.owner)
  await page.goto(`/profile/${MEMBERS.blocked}`)
  await expect(page.getByRole('heading', { name: 'This profile isn’t here anymore' })).toBeVisible()

  await page.goto('/people')
  await expect(page.getByRole('link', { name: 'Amy Admin' })).toHaveCount(0)
})
