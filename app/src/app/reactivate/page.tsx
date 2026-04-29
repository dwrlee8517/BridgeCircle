import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/db/admin'
import { requireSession } from '@/lib/auth/session'
import { ReactivateForm } from './reactivate-form'

/**
 * Page shown when a self-deactivated user signs back in. The auth callback
 * redirects here when it sees no active memberships but at least one
 * self_deactivated row.
 *
 * Sanity-checks the actual state and bounces somewhere appropriate if the
 * user is in fact already active (came here by accident) or is in a
 * delete-scheduled state (handled by /cancel-delete instead).
 */
export default async function ReactivatePage() {
  const session = await requireSession()
  const admin = createAdminClient()

  const { data: userRow } = await admin
    .from('users')
    .select('delete_scheduled_for, delete_initiated_by_admin, deleted_at')
    .eq('id', session.userId)
    .maybeSingle()

  if (userRow?.deleted_at) {
    // Should never reach here — banned auth user — but bail safely if so.
    redirect('/sign-in')
  }
  if (userRow?.delete_scheduled_for && !userRow.delete_initiated_by_admin) {
    redirect('/cancel-delete')
  }

  const { data: memberships } = await admin
    .from('organization_memberships')
    .select('status')
    .eq('user_id', session.userId)

  const hasActive = memberships?.some((m) => m.status === 'active') ?? false
  const hasSelfDeactivated = memberships?.some((m) => m.status === 'self_deactivated') ?? false

  if (hasActive) redirect('/')
  if (!hasSelfDeactivated) {
    // Nothing for us to do here — let the regular signed-out / no-membership
    // flow handle it.
    redirect('/sign-in?error=no_membership')
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Your account is paused. Reactivate to get full access to the directory, mentorship, and
            messaging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReactivateForm />
        </CardContent>
      </Card>
    </div>
  )
}
