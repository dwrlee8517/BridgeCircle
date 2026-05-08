import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/db/admin'
import { requireSession } from '@/lib/auth/session'
import { signOut } from '../(auth)/sign-in/actions'
import { CancelForm } from './cancel-form'

/**
 * Shown when a user with a self-initiated pending deletion signs in. They get
 * one screen with a clear "still want to delete? then do nothing" / "cancel?
 * click here" choice.
 *
 * Admin-initiated deletions ban the auth user immediately, so those users
 * can't reach this page — they get rejected at the auth layer with a banned
 * error and stay on /sign-in.
 */
export default async function CancelDeletePage() {
  const session = await requireSession()
  const admin = createAdminClient()

  const { data: userRow } = await admin
    .from('users')
    .select('delete_scheduled_for, delete_reason, delete_initiated_by_admin, deleted_at')
    .eq('id', session.userId)
    .maybeSingle()

  if (!userRow || userRow.deleted_at) redirect('/sign-in')
  if (!userRow.delete_scheduled_for) redirect('/')
  if (userRow.delete_initiated_by_admin) {
    // Defensive: shouldn't reach this branch (banned), but if they do, send
    // them away rather than letting them try to cancel something they can't.
    redirect('/sign-in?error=admin_deactivated')
  }

  const dueDate = new Date(userRow.delete_scheduled_for)
  const dueText = dueDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  // eslint-disable-next-line react-hooks/purity -- server component, evaluated per request
  const overdue = dueDate.getTime() < Date.now()

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your account is scheduled for deletion</CardTitle>
          <CardDescription>
            {overdue
              ? `Your deletion was scheduled for ${dueText}. Your data hasn't been wiped yet — you can still recover by canceling now.`
              : `On ${dueText}, your profile data will be wiped permanently. You can cancel any time before then.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userRow.delete_reason ? (
            <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Reason you gave:</span>{' '}
              {userRow.delete_reason}
            </div>
          ) : null}
          <CancelForm />
          <p className="text-xs text-muted-foreground">
            If you want to proceed with deletion, simply close this tab — no further action is
            needed.
          </p>
        </CardContent>
      </Card>
      {/* Sign-out escape hatch. Without this, a user who lands here and
          decides not to cancel right now has no way to leave the page
          short of closing the tab. Signing out preserves the scheduled
          deletion but lets them step away cleanly. */}
      <form action={signOut}>
        <button
          type="submit"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
