import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { getHelperPreference } from '@/lib/asks/preferences'
import { requireSession } from '@/lib/auth/session'
import { SettingsForm } from './settings-form'

export default async function HelperSettingsPage() {
  const session = await requireSession()
  const supabase = await createClient()
  const pref = await getHelperPreference(supabase, session.userId)

  if (!pref) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-muted-foreground">
          You need an active organization membership to set helper preferences.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link
        href={`/profile/${session.userId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to profile
      </Link>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Helper settings</CardTitle>
              <CardDescription>
                Choose how you&apos;d like to help — quick advice, ongoing mentorship, or both.
              </CardDescription>
            </div>
            {pref.pausedAt ? <Badge variant="outline">Paused while away</Badge> : null}
          </div>
        </CardHeader>
        <CardContent>
          {pref.pausedAt ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              You were auto-paused after 14 days without responding to a request. Saving any change
              here will lift the pause.
            </p>
          ) : null}
          <SettingsForm
            defaults={{
              openToAdvice: pref.openToAdvice,
              openToMentorship: pref.openToMentorship,
              topics: pref.topics.join(', '),
              screeningPrompt: pref.screeningPrompt ?? '',
              maxActiveMentees: pref.maxActiveMentees,
              maxPendingRequests: pref.maxPendingRequests,
            }}
            activeMenteeCount={pref.activeMenteeCount}
            pendingRequestCount={pref.pendingRequestCount}
          />
        </CardContent>
      </Card>
    </div>
  )
}
