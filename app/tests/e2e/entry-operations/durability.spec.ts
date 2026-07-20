import AxeBuilder from '@axe-core/playwright'
import { createClient } from '@supabase/supabase-js'
import { expect, test, type Page } from '@playwright/test'
import type { Database } from '../../../src/db/database.types'
import { createEntryOperationsWorker } from '../../../src/workers/outbox/entry-operations'
import { signInAs } from '../helpers/auth'
import { baseURL, isRemote, loadE2eEnv } from '../helpers/env'
import { FoundationScenario, type FoundationMember } from '../helpers/foundation'

test.describe('entry and operations durability', () => {
  test.skip(isRemote, 'Destructive lifecycle worker roads are local-only')
  test.describe.configure({ mode: 'parallel', timeout: 90_000 })

  test('expired, revoked, and reused invitations converge to safe states', async ({ page }) => {
    const scenario = new FoundationScenario()
    try {
      const organization = await scenario.createOrganization(false, 'Invitation State Circle')
      const expired = await scenario.createInvite(organization.id, { status: 'expired' })
      const revoked = await scenario.createInvite(organization.id, { status: 'revoked' })
      const usable = await scenario.createInvite(organization.id, { fullName: 'Reusable Rowan' })

      await page.goto(`/join?token=${expired.token}`)
      await expect(page.getByRole('heading', { name: 'This invite has expired.' })).toBeVisible()
      await expect(page.getByText(/your spot didn’t/i)).toBeVisible()

      await page.goto(`/join?token=${revoked.token}`)
      await expect(page.getByRole('heading', { name: 'This invite isn’t available.' })).toBeVisible()
      await expect(page.getByText(/most recent invitation email/i)).toBeVisible()

      await page.goto(`/join?token=${usable.token}`)
      await page.locator('#password').fill('foundation-invite-reuse-9')
      await page.getByRole('button', { name: 'Create account' }).click()
      await page.waitForURL(/\/onboarding\?step=1/)
      await scenario.trackAcceptedUser(usable.email)

      await page.context().clearCookies()
      await page.goto(`/join?token=${usable.token}`)
      await expect(page.getByRole('heading', { name: 'This link was already used.' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeFocused()
      await expectAccessible(page)
    } finally {
      await scenario.destroy()
    }
  })

  test('a recovery link works once and a reused link cannot reopen password update', async ({
    browser,
  }) => {
    const scenario = new FoundationScenario()
    const firstContext = await browser.newContext()
    const secondContext = await browser.newContext()
    try {
      const organization = await scenario.createOrganization(false, 'Recovery Circle')
      const member = await scenario.createMember(organization.id, 'Recovery')
      const firstPage = await firstContext.newPage()
      await firstPage.goto('/reset-password')
      await firstPage.locator('#email').fill(member.email)
      await firstPage.getByRole('button', { name: 'Send reset link' }).click()
      await expect(firstPage.getByText(/a reset link is on its way/i)).toBeVisible()

      const actionLink = await waitForRecoveryLink(member.email)
      await firstPage.goto(actionLink)
      await firstPage.waitForURL(/\/reset-password\/update/)
      await firstPage.locator('#password').fill('foundation-recovered-password-9')
      await firstPage.getByRole('button', { name: 'Save new password' }).click()
      await firstPage.waitForURL((url) => url.pathname === '/')

      const secondPage = await secondContext.newPage()
      await secondPage.goto(actionLink)
      await expect(secondPage).toHaveURL(/\/sign-in/)

      await firstContext.clearCookies()
      await firstPage.goto('/sign-in')
      await firstPage.locator('#email').fill(member.email)
      await firstPage.locator('#password').fill('foundation-recovered-password-9')
      await firstPage.getByRole('button', { name: 'Sign in', exact: true }).click()
      await firstPage.waitForURL((url) => url.pathname === '/')
    } finally {
      await firstContext.close()
      await secondContext.close()
      await scenario.destroy()
    }
  })

  test('onboarding resumes from the furthest durable step across devices', async ({ browser }) => {
    const scenario = new FoundationScenario()
    const firstContext = await browser.newContext()
    const secondContext = await browser.newContext()
    try {
      const organization = await scenario.createOrganization(false, 'Resume Circle')
      const member = await scenario.createMember(organization.id, 'Resume', {
        onboardingCompleted: false,
      })
      const firstPage = await firstContext.newPage()
      const secondPage = await secondContext.newPage()

      await signInToOnboarding(firstPage, member)
      await firstPage.getByRole('button', { name: 'Get started' }).click()
      await firstPage.getByRole('button', { name: 'Save and continue' }).click()
      await expect(firstPage).toHaveURL(/step=2/)

      await signInToOnboarding(secondPage, member)
      await expect(secondPage.getByRole('heading', { name: 'Bring your history in one go.' })).toBeVisible()
      await secondPage.getByRole('button', { name: 'Skip this step' }).click()
      await expect(secondPage).toHaveURL(/step=3/)

      await firstPage.goto('/onboarding')
      await expect(firstPage.getByRole('heading', { name: 'Where you studied.' })).toBeVisible()
    } finally {
      await firstContext.close()
      await secondContext.close()
      await scenario.destroy()
    }
  })

  test('export reaches ready and deletion can cancel before finalizing once', async ({ page }) => {
    loadE2eEnv()
    const scenario = new FoundationScenario()
    let exportPath: string | null = null
    try {
      const organization = await scenario.createOrganization(false, 'Lifecycle Circle')
      const member = await scenario.createMember(organization.id, 'Lifecycle')
      const memberClient = createMemberClient()
      const signedIn = await memberClient.auth.signInWithPassword({
        email: member.email,
        password: member.password,
      })
      if (signedIn.error) throw new Error(`member client sign in: ${signedIn.error.message}`)

      await signInAs(page, member)
      await page.goto('/settings')
      await page.getByRole('button', { name: 'Request data export' }).click()
      await expect(page.getByText('Your export is queued')).toBeVisible()

      const exportRequest = await waitForExport(memberClient)
      const worker = createEntryOperationsWorker(scenario.admin, baseURL)
      await worker.generateAccountExport(
        { userId: member.userId, exportRequestId: exportRequest.id },
        new AbortController().signal,
      )

      await page.reload()
      await expect(page.locator('#main-content').getByText('Your export is ready')).toBeVisible()
      const download = await memberClient.schema('api').rpc('get_my_account_export_download')
      exportPath = download.data?.[0]?.storage_path ?? null
      expect(exportPath).toBeTruthy()
      const signedUrl = await scenario.admin.storage
        .from('account-exports')
        .createSignedUrl(exportPath ?? '', 60)
      expect(signedUrl.error).toBeNull()
      const archiveResponse = await page.request.get(signedUrl.data?.signedUrl ?? '')
      expect(archiveResponse.ok()).toBe(true)
      const archive = await archiveResponse.json()
      expect(archive.user.id).toBe(member.userId)

      await page.getByRole('button', { name: 'Schedule account deletion' }).click()
      await expect(
        page.getByRole('heading', { name: 'Your account is scheduled for deletion' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Cancel deletion and restore access' }).click()
      await page.waitForURL((url) => url.pathname === '/')

      await page.goto('/settings')
      await page.getByRole('button', { name: 'Schedule account deletion' }).click()
      await expect(
        page.getByRole('heading', { name: 'Your account is scheduled for deletion' }),
      ).toBeVisible()
      await scenario.admin
        .from('users')
        .update({ delete_scheduled_for: new Date(Date.now() - 60_000).toISOString() })
        .eq('id', member.userId)
      await expect(
        worker.processAccountDeletion(
          { userId: member.userId },
          new AbortController().signal,
        ),
      ).resolves.toBe('completed')
      await page.reload()
      await expect(page).toHaveURL(/\/sign-in/)
      const tombstone = await scenario.admin
        .from('users')
        .select('account_state')
        .eq('id', member.userId)
        .single()
      expect(tombstone.data?.account_state).toBe('deleted')
    } finally {
      if (exportPath) {
        await scenario.admin.storage.from('account-exports').remove([exportPath])
      }
      await scenario.destroy()
    }
  })

  test('system states stay accessible, focused, offline-aware, and 320px safe', async ({
    page,
    context,
  }) => {
    const scenario = new FoundationScenario()
    try {
      const organization = await scenario.createOrganization(false, 'System State Circle')
      const member = await scenario.createMember(organization.id, 'State')
      await signInAs(page, member)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize({ width: 320, height: 720 })

      await page.goto('/school/events/00000000-0000-4000-8000-000000000000')
      await expect(page.getByRole('heading', { name: 'This isn’t here anymore.' })).toBeVisible()
      await expect(page.getByRole('link', { name: '← Back to School' })).toBeFocused()
      await expectNoHorizontalOverflow(page)
      await expectAccessible(page)

      await page.goto('/settings')
      await context.setOffline(true)
      await expect(page.getByText(/you’re offline/i)).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await context.setOffline(false)
      await expect(page.getByText(/you’re offline/i)).toHaveCount(0)
    } finally {
      await context.setOffline(false)
      await scenario.destroy()
    }
  })
})

async function signInToOnboarding(page: Page, member: FoundationMember) {
  await page.goto('/sign-in')
  await page.locator('#email').fill(member.email)
  await page.locator('#password').fill(member.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(/\/onboarding/)
}

function createMemberClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('missing local Supabase public configuration')
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function waitForExport(client: ReturnType<typeof createMemberClient>) {
  await expect
    .poll(async () => {
      const result = await client.schema('api').rpc('get_my_account_export')
      const row = result.data?.[0]
      return row ? { id: row.export_request_id ?? '', status: row.status ?? '' } : null
    })
    .toMatchObject({ status: 'queued' })
  const result = await client.schema('api').rpc('get_my_account_export')
  const row = result.data?.[0]
  if (!row?.export_request_id) throw new Error('export request did not become visible')
  return { id: row.export_request_id, status: row.status ?? '' }
}

async function waitForRecoveryLink(email: string): Promise<string> {
  const query = encodeURIComponent(`to:${email}`)
  let link: string | null = null

  await expect
    .poll(async () => {
      const response = await fetch(`http://127.0.0.1:54324/view/latest.html?query=${query}`)
      if (!response.ok) return null
      const html = await response.text()
      const match = html.match(/href="([^"]*\/auth\/confirm\?[^"]+)"/)
      if (!match?.[1]) return null
      link = match[1].replaceAll('&amp;', '&')
      return link
    })
    .not.toBeNull()

  if (!link) throw new Error(`recovery email for ${email} did not contain a confirmation link`)
  const normalized = new URL(link)
  const appOrigin = new URL(baseURL)
  normalized.protocol = appOrigin.protocol
  normalized.host = appOrigin.host
  return normalized.toString()
}

async function expectAccessible(page: Page) {
  const result = await new AxeBuilder({ page }).analyze()
  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([])
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      })),
    )
    .toEqual({ viewport: 320, document: 320 })
}
