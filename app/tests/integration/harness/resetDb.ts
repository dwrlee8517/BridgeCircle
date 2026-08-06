import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createAdminClient } from '@/db/admin'
import { EMAIL_PREFIX, ORG_SLUG_PREFIX, type SeedScope } from './seedScope'

/**
 * Destroy what the tests created. Teardown is allowed direct DB access (the
 * "APIs only" rule is about *creation* — every org and account must be born
 * through a real endpoint); cleanup just has to be thorough and namespaced.
 *
 * Cascade map (v2 init migration):
 *  - Deleting an org cascades to its memberships, org profiles, admin role
 *    assignments, asks, events, and the rest of the org-scoped tree.
 *  - Deleting an auth user cascades to public.users and the user-scoped rows
 *    keyed on it (profiles, notifications, conversations, …).
 *
 * Known residue: v2 has a number of audit/moderation/analytics tables whose
 * `actor_user_id` / `organization_id` are `on delete set null` (see
 * 20260713231344_v2_init.sql). Those rows survive both deletes with null
 * columns and can no longer be matched to the run that made them. We do not
 * chase them: the list is long and drifts with the schema, and the rows are
 * inert. Local runs wipe them wholesale via `supabase db reset`; on the dev
 * target they remain as anonymous audit noise.
 */

const USERS_PAGE_SIZE = 200

function adminClient(): SupabaseClient<Database> {
  return createAdminClient()
}

/** All auth users whose email starts with `prefix` (paginated full scan). */
async function findAuthUserIds(
  admin: SupabaseClient<Database>,
  prefix: string,
): Promise<string[]> {
  const ids: string[] = []
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: USERS_PAGE_SIZE })
    if (error) throw error
    for (const user of data.users) {
      if (user.email?.toLowerCase().startsWith(prefix)) ids.push(user.id)
    }
    if (data.users.length < USERS_PAGE_SIZE) break
  }
  return ids
}

async function purge(
  admin: SupabaseClient<Database>,
  { orgSlugPrefix, emailPrefix }: { orgSlugPrefix: string; emailPrefix: string },
): Promise<void> {
  const userIds = await findAuthUserIds(admin, emailPrefix)

  // 1. Orgs (cascades org-scoped children).
  await admin.from('organizations').delete().like('slug', `${orgSlugPrefix}%`)

  // 2. Auth users (cascades public.users and user-scoped children).
  for (const id of userIds) {
    await admin.auth.admin.deleteUser(id)
  }
}

/**
 * Remove everything a single run created. Call in afterAll with the file's
 * SeedScope. Scoped to this run's id so parallel files never delete each
 * other's data.
 */
export async function teardownScope(scope: SeedScope): Promise<void> {
  await purge(adminClient(), {
    orgSlugPrefix: `${ORG_SLUG_PREFIX}${scope.runId}-`,
    emailPrefix: `${EMAIL_PREFIX}${scope.runId}-`,
  })
}

/**
 * Safety net for the Dev-DB target: purge *all* integration-test data left by
 * any run (e.g. a crash that skipped afterAll). Matches the bare it+/it-
 * markers, so it only ever touches test-owned rows. Wire into globalTeardown
 * for the dev target; harmless (and fast) on local too.
 */
export async function sweepAllTestData(): Promise<void> {
  await purge(adminClient(), {
    orgSlugPrefix: ORG_SLUG_PREFIX,
    emailPrefix: EMAIL_PREFIX,
  })
}
