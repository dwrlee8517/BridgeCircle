import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/db/admin'
import { provisionOrganization } from '@/lib/provisioning/provisionOrganization'

/**
 * POST /api/admin/provision-org
 *
 * Stands up a new tenant: an organization plus its first super_admin. This is
 * the one privileged entry point that bypasses the invite gate, because the
 * invite gate itself requires an admin that does not yet exist.
 *
 * Auth: shared-secret header, same pattern as the cron routes. The token lives
 * in PROVISION_SECRET (ops + the integration-test bootstrap). A public POST
 * without the token gets 401 and never touches the database.
 *
 * Intended callers: operators standing up a pilot org, and the integration
 * suite's bootstrapTenant() helper. Not reachable from any user session.
 */

const bodySchema = z.object({
  organization: z.object({
    name: z.string().trim().min(1),
    slug: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with dashes'),
    requiresAdminApproval: z.boolean().optional(),
  }),
  admin: z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(72),
    displayName: z.string().trim().optional(),
  }),
})

// provisionOrganization's typed failures → HTTP status. Caller errors (a slug
// or admin already in use) are 409; everything else is a 500 we want to see.
const CONFLICT_ERRORS = new Set(['slug_taken', 'admin_exists'])

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization')
  const expected = process.env.PROVISION_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const result = await provisionOrganization(createAdminClient(), parsed.data)
    if (!result.ok) {
      const status = CONFLICT_ERRORS.has(result.error) ? 409 : 500
      if (status === 500) {
        Sentry.captureException(new Error(`provision-org failed: ${result.error}`))
      }
      return NextResponse.json({ ok: false, error: result.error }, { status })
    }

    return NextResponse.json(
      {
        ok: true,
        organizationId: result.organizationId,
        adminUserId: result.adminUserId,
        membershipId: result.membershipId,
      },
      { status: 201 },
    )
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
