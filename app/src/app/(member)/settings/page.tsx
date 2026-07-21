import Link from 'next/link'
import { signOut } from '@/app/(auth)/sign-in/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form-message'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSettingsRepository } from '@/db/repositories/settings'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { NOTIFICATION_GROUPS } from '@/lib/settings/notification-groups'
import {
  changeEmailAction,
  downloadExportAction,
  requestExportAction,
  saveCommunicationAction,
  saveNotificationGroupAction,
  scheduleDeletionAction,
  unblockMemberAction,
} from './actions'
import { settingsSavedMessage } from './settings-messages'

type SearchParams = { saved?: string; error?: string }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [session, params] = await Promise.all([requireSession('/settings'), searchParams])
  const client = await createClient()
  const repository = createSettingsRepository(client)
  const [authUser, preferences, communication, blocked, accountExport] = await Promise.all([
    client.auth.getUser(),
    repository.listNotificationPreferences(),
    repository.getCommunicationPreferences(),
    repository.listBlockedMembers(),
    repository.getExport(),
  ])
  const currentEmail = authUser.data.user?.email ?? session.email
  const pendingEmail = authUser.data.user?.new_email ?? null
  const savedMessage = settingsSavedMessage(params.saved, currentEmail, pendingEmail)

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
      <div>
        <p className="bc-section-kicker">Your account</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose how BridgeCircle reaches you and manage your account safely.
        </p>
      </div>

      {savedMessage ? (
        <FormMessage tone="success" className="rounded-xl bg-success-tint px-4 py-3">
          {savedMessage}
        </FormMessage>
      ) : null}
      {params.error ? (
        <FormMessage tone="error" className="rounded-xl bg-danger-tint px-4 py-3">
          That change could not be saved. Please try again.
        </FormMessage>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in as {currentEmail}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form action={changeEmailAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="email">New email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={pendingEmail ?? currentEmail}
                aria-describedby={pendingEmail ? 'pending-email-change' : undefined}
              />
            </div>
            <FormSubmitButton variant="outline" pendingLabel="Changing…">
              Change email
            </FormSubmitButton>
          </form>
          {pendingEmail ? (
            <div
              id="pending-email-change"
              className="rounded-xl bg-[var(--surface-inset)] px-4 py-3"
            >
              <p className="text-sm font-semibold">Email change awaiting confirmation</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Confirm {pendingEmail} from your email. Until then, keep signing in with{' '}
                {currentEmail}.
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <form action={requestExportAction}>
              <FormSubmitButton variant="outline" pendingLabel="Requesting…">
                Request data export
              </FormSubmitButton>
            </form>
            <form action={signOut}>
              <FormSubmitButton variant="outline" pendingLabel="Signing out…">
                Sign out
              </FormSubmitButton>
            </form>
          </div>
          {accountExport ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--surface-inset)] px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{exportStatusTitle(accountExport.status)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {exportStatusDescription(accountExport.status)}
                </p>
              </div>
              {accountExport.status === 'ready' ? (
                <form action={downloadExportAction}>
                  <FormSubmitButton size="sm" variant="ghost" pendingLabel="Preparing…">
                    Download
                  </FormSubmitButton>
                </form>
              ) : null}
              {accountExport.status === 'queued' || accountExport.status === 'processing' ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href="/settings">Refresh status</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Bell and email choices are stored for each exact event type.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {NOTIFICATION_GROUPS.map((group) => {
            const rows = group.types.map((type) => preferences.find((item) => item.type === type))
            const inApp = rows.every((row) => row?.inAppEnabled ?? true)
            const email = rows.every((row) => row?.emailEnabled ?? true)
            return (
              <form
                key={group.id}
                action={saveNotificationGroupAction}
                className="space-y-3 px-6 py-4"
              >
                <input type="hidden" name="group" value={group.id} />
                <div>
                  <p className="text-sm font-semibold">{group.label}</p>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-sm">
                  <label className="flex items-center gap-2">
                    <input name="inApp" type="checkbox" defaultChecked={inApp} /> Bell
                  </label>
                  <label className="flex items-center gap-2">
                    <input name="email" type="checkbox" defaultChecked={email} /> Email
                  </label>
                  <FormSubmitButton
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    pendingLabel="Saving…"
                  >
                    Save
                  </FormSubmitButton>
                </div>
              </form>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>School communication</CardTitle>
          <CardDescription>Newsletters are separate from app notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveCommunicationAction} className="flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2 text-sm">
              <input
                name="newsletter"
                type="checkbox"
                defaultChecked={communication.schoolNewsletterEmailEnabled}
              />
              Email me the school newsletter
            </label>
            <FormSubmitButton size="sm" variant="outline" pendingLabel="Saving…">
              Save
            </FormSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Help and safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button asChild variant="outline">
            <Link href="/help/settings">Help availability</Link>
          </Button>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Blocked members</p>
            {blocked.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blocked members.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {blocked.map((person) => (
                  <li
                    key={person.userId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="text-sm">{person.displayName}</span>
                    <form action={unblockMemberAction}>
                      <input type="hidden" name="userId" value={person.userId} />
                      <FormSubmitButton size="sm" variant="ghost" pendingLabel="Unblocking…">
                        Unblock
                      </FormSubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-state-danger/25">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            You have seven days to cancel before deletion is finalized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={scheduleDeletionAction}>
            <FormSubmitButton variant="destructive" pendingLabel="Scheduling…">
              Schedule account deletion
            </FormSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function exportStatusTitle(status: 'queued' | 'processing' | 'ready' | 'failed' | 'expired') {
  switch (status) {
    case 'queued':
      return 'Your export is queued'
    case 'processing':
      return 'Your export is being prepared'
    case 'ready':
      return 'Your export is ready'
    case 'failed':
      return 'Your export needs another try'
    case 'expired':
      return 'Your export link expired'
  }
}

function exportStatusDescription(status: 'queued' | 'processing' | 'ready' | 'failed' | 'expired') {
  switch (status) {
    case 'queued':
      return 'You can leave this page. It will keep working in the background.'
    case 'processing':
      return 'This usually takes less than a minute.'
    case 'ready':
      return 'The private download link expires after seven days.'
    case 'failed':
      return 'Request a new export when you’re ready.'
    case 'expired':
      return 'Request a new export to create a fresh private download.'
  }
}
