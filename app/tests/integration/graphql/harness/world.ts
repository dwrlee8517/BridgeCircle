import { randomUUID } from 'node:crypto'
import { createAnnouncementAction } from '@/app/(admin)/admin/announcements/actions'
import { saveHelpPreferencesAction } from '@/app/(member)/help/help-preferences-actions'
import { markNotificationReadAction } from '@/app/(member)/notifications-actions'
import { saveNotificationGroupAction } from '@/app/(member)/settings/actions'
import { POST as connectionResponseRoute } from '@/app/api/connections/requests/[requestId]/response/route'
import { POST as connectionRequestRoute } from '@/app/api/connections/requests/route'
import { POST as circleAskRoute } from '@/app/api/help/asks/circle/route'
import { createAdminClient } from '@/db/admin'
import { createHelpWorkerRepository } from '@/db/repositories/help-worker'
import { createInviteAcceptanceRepository } from '@/db/repositories/invites'
import { getMemberContext } from '@/db/repositories/member-context'
import { createNotificationRepository } from '@/db/repositories/notifications'
import { createOutboxRepository } from '@/db/repositories/outbox'
import { acceptInvite } from '@/lib/invite/accept'
import { callAction, createMember, invite, callRoute, type Member } from '../../harness/apiClient'
import { bootstrapTenant, TEST_PASSWORD, type Tenant } from '../../harness/bootstrapTenant'
import type { SeedScope } from '../../harness/seedScope'
import { repositoryAs } from './parityRunner'

/**
 * The world every parity case reads from.
 *
 * Built through real APIs only (the rule in tests/integration/README.md): the
 * tenant is provisioned, members arrive by invite → join, the ask is opened
 * through its route handler. Nothing is seeded by raw DB write, so what the
 * graph and the repositories read is state the product itself created.
 *
 * The cast is shaped by what a diff can *distinguish*, not by what is
 * convenient. Mutation-testing the resolvers showed a world can be rich enough
 * to pass every case and still be blind:
 *
 * - `other` is connected to the viewer, so a scope of `all` and a scope of
 *   `circle` return the same people. `stranger` exists to separate them.
 * - Every notification was unread, so `unreadOnly: true` and `false` returned
 *   the same rows. One of the viewer's is now read.
 * - Every member had exactly one membership, so "the selected one" and "the
 *   first one" were the same row. `multiOrgMember` belongs to two.
 *
 * Each of those is a resolver bug the suite could not have caught.
 */
export type ParityWorld = {
  tenant: Tenant
  viewer: Member
  other: Member
  /** In the org but unconnected to the viewer: separates `all` from `circle`. */
  stranger: Member
  /**
   * Two active memberships in two organizations.
   *
   * With more than one active membership and no preference supplied, the
   * `get_my_member_context` RPC leaves `selected_membership_id` null and sets
   * `requires_circle_choice` — so "selected" and "first" stop being the same
   * row, which is what makes a wrong pick detectable.
   */
  multiOrgMember: Member
  secondTenant: Tenant
  viewerMembershipId: string
  otherMembershipId: string
  /** A circle ask opened by the viewer, so ask-shaped reads have a subject. */
  askId: string
  /** The viewer notification marked read, so unread filtering is observable. */
  readNotificationId: number
}

async function membershipIdOf(member: Member): Promise<string> {
  const context = await repositoryAs(member.jar, (db) => getMemberContext(db))
  const selected =
    context.memberships.find((m) => m.membershipId === context.selectedMembershipId) ??
    context.memberships[0]
  if (!selected) throw new Error(`no membership for ${member.email}`)
  return selected.membershipId
}

export async function buildParityWorld(scope: SeedScope): Promise<ParityWorld> {
  const tenant = await bootstrapTenant(scope)

  const viewer = await createMember(tenant.admin.jar, scope.email('viewer'), TEST_PASSWORD, {
    fullName: 'Parity Viewer',
    graduationYear: 2014,
  })
  const other = await createMember(tenant.admin.jar, scope.email('other'), TEST_PASSWORD, {
    fullName: 'Parity Other',
    graduationYear: 2016,
  })
  // Same organization, deliberately never connected to the viewer, so a scope
  // of `all` returns strictly more than a scope of `circle`.
  const stranger = await createMember(tenant.admin.jar, scope.email('stranger'), TEST_PASSWORD, {
    fullName: 'Parity Stranger',
    graduationYear: 2011,
  })

  // The other member opts into helping, so they surface in helper-aware reads
  // (peopleSearch evidence, memberProfile.help) instead of being invisible.
  const preferences = new FormData()
  preferences.set('openToHelp', 'on')
  preferences.set('topics', 'career switching')
  const saved = await callAction(other.jar, () => saveHelpPreferencesAction({}, preferences))
  if (saved.kind === 'return' && saved.value && 'error' in saved.value && saved.value.error) {
    throw new Error(`saveHelpPreferences failed: ${JSON.stringify(saved.value)}`)
  }

  const asked = await callRoute<{ askId?: string | null }>(viewer.jar, circleAskRoute, {
    path: '/api/help/asks/circle',
    json: {
      question: 'Who has moved from consulting into product, and what did the first year look like?',
      reach: 'organization',
      anonymousUntilAccepted: false,
      clientRequestId: randomUUID(),
    },
  })
  const askId = asked.body.askId
  if (!askId) throw new Error(`circle ask not created: ${JSON.stringify(asked.body)}`)

  // An announcement, so the school reads have content. Published by the admin
  // through the real console action, not written into the table.
  const announcement = new FormData()
  announcement.set('title', 'Parity fixture announcement')
  announcement.set('body', 'Published so the school reads have something to return.')
  announcement.set('tag', 'general')
  announcement.set('pinned', 'on')
  const published = await callAction(tenant.admin.jar, () =>
    createAnnouncementAction({}, announcement),
  )
  if (published.kind !== 'return' || !published.value.ok) {
    throw new Error(`announcement not published: ${JSON.stringify(published)}`)
  }

  // A mutual connection: gives the relationship-aware reads a non-default state
  // and gives the viewer a notification to page over.
  const organizationId = tenant.organizationId
  const requested = await callRoute<{ requestId?: string | null }>(
    viewer.jar,
    connectionRequestRoute,
    {
      path: '/api/connections/requests',
      json: {
        recipientUserId: other.userId,
        originOrganizationId: organizationId,
        introMessage: 'Connecting so the parity fixture has a real relationship.',
        clientRequestId: randomUUID(),
      },
    },
  )
  const requestId = requested.body.requestId
  if (!requestId) throw new Error(`connection request not created: ${JSON.stringify(requested.body)}`)

  const responded = await callRoute(other.jar, connectionResponseRoute, {
    path: `/api/connections/requests/${requestId}/response`,
    params: { requestId },
    json: { decision: 'accept' },
  })
  if (responded.status !== 200) {
    throw new Error(`connection not accepted: ${JSON.stringify(responded.body)}`)
  }

  // A saved notification preference, so the preferences read returns a row
  // rather than the empty default set.
  const preference = new FormData()
  preference.set('group', 'help')
  preference.set('inApp', 'on')
  preference.set('email', 'on')
  await callAction(viewer.jar, () => saveNotificationGroupAction(preference))

  await materializePendingNotifications([viewer.userId, other.userId])

  // One notification read, so `unreadOnly` actually filters something. Driven
  // through the real action rather than the graph's own markNotificationsRead
  // mutation — world-building must never use the thing under test.
  const readNotificationId = await markOneNotificationRead(viewer)

  // A member of two organizations. Built the way the product builds one: the
  // second tenant's admin invites an address that already has an account, and
  // the invite is accepted against the existing session. `signUpWithPassword`
  // refuses a known email ("Sign in on the sign-in page instead"), so the real
  // path for an existing user is /auth/callback, which calls this same
  // `acceptInvite` after exchanging the OAuth code. Only the code exchange is
  // skipped here — auth transport, not membership logic.
  const secondTenant = await bootstrapTenant(scope, { adminName: 'IT Admin Two' })
  const multiOrgMember = await createMember(
    tenant.admin.jar,
    scope.email('multiorg'),
    TEST_PASSWORD,
    { fullName: 'Parity MultiOrg', graduationYear: 2009 },
  )
  const secondInvite = await invite(secondTenant.admin.jar, {
    email: multiOrgMember.email,
    fullName: 'Parity MultiOrg',
  })
  if (!secondInvite.token) {
    throw new Error(`no second-org invite token for ${multiOrgMember.email}`)
  }
  const accepted = await repositoryAs(multiOrgMember.jar, (db) =>
    acceptInvite(secondInvite.token as string, createInviteAcceptanceRepository(db)),
  )
  if (!accepted.ok) {
    throw new Error(`second-org invite not accepted: ${JSON.stringify(accepted)}`)
  }

  return {
    tenant,
    viewer,
    other,
    stranger,
    multiOrgMember,
    secondTenant,
    viewerMembershipId: await membershipIdOf(viewer),
    otherMembershipId: await membershipIdOf(other),
    askId,
    readNotificationId,
  }
}

/**
 * Mark the viewer's oldest notification read and return its id.
 *
 * Reads the list through the repository to pick a subject, then marks it via
 * the real server action — the same pair a member's own click drives.
 */
async function markOneNotificationRead(viewer: Member): Promise<number> {
  const rows = await repositoryAs(viewer.jar, (db) =>
    createNotificationRepository(db).list({ limit: 30, unreadOnly: true }),
  )
  const target = rows.at(-1)
  if (!target) throw new Error('no unread notification to mark read')

  const form = new FormData()
  form.set('notificationId', String(target.id))
  const marked = await callAction(viewer.jar, () => markNotificationReadAction(form))
  if (marked.kind !== 'return' || !marked.value.ok) {
    throw new Error(`could not mark notification read: ${JSON.stringify(marked)}`)
  }
  return target.id
}

/**
 * Turn this world's queued `create_notification` jobs into rows.
 *
 * Notifications are materialized by the outbox worker, not by the command that
 * causes them, so a fixture that never runs the worker has an empty bell no
 * matter what it does. This drives the same claim → materialize → complete
 * sequence the production worker drives (`db/repositories/help-worker`) — the
 * service-role exception the harness already makes for invite tokens. It is
 * world-building, never one side of a diff.
 *
 * Why this loops instead of claiming one batch. `claim_outbox_jobs` is a bulk
 * RPC with no filter: it returns whatever is claimable, oldest first, and also
 * reclaims jobs whose lock has aged past 15 minutes. On a long-lived local
 * database the queue accumulates dead jobs from earlier runs, and once enough
 * of them sort ahead of ours, a single batch never reaches this run's jobs —
 * the bell stays empty and the parity case fails the anti-vacuity guard. That
 * is a fixture defect presenting as a flake, so the loop keeps claiming until
 * it has seen every recipient it is waiting for, or the queue runs dry.
 *
 * It is also a good citizen about what it touches: jobs belonging to other
 * data are released back to `pending` rather than left locked. Leaving them
 * claimed is what silts the queue up in the first place.
 */
async function materializePendingNotifications(recipientUserIds: string[]): Promise<void> {
  const pending = new Set(recipientUserIds)
  const admin = createAdminClient()
  const workerId = `parity-fixture-${process.pid}`
  const queue = createOutboxRepository(admin)
  const worker = createHelpWorkerRepository(admin)
  const now = new Date().toISOString()

  // Bounded so a pathological queue fails the fixture rather than hanging it.
  for (let batch = 0; batch < 20 && pending.size > 0; batch += 1) {
    const jobs = await queue.claim(workerId, ['create_notification'], 100)
    if (jobs.length === 0) break

    for (const job of jobs) {
      const recipient = (job.payload as { recipientUserId?: string } | null)?.recipientUserId
      if (recipient && recipientUserIds.includes(recipient)) {
        const result = await worker.materializeNotification(job.id, workerId)
        if (result.result_code === 'materialized') pending.delete(recipient)
        await queue.complete(job.id, workerId)
      } else {
        // Best-effort courtesy, never a failure mode: `retry_outbox_job`
        // answers 'failed' for a job that has exhausted its attempts, and the
        // repository wrapper asserts 'pending', so a dead leftover would
        // otherwise take the whole fixture down with it. Whether someone
        // else's stale job gets unlocked is not this suite's business.
        await queue.retry(job.id, workerId, 'released by parity fixture', now).catch(() => {})
      }
    }
  }
}
