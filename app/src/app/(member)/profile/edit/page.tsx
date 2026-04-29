import Link from 'next/link'
import { ProfileForm } from '@/components/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'
import { editProfileAction } from './actions'
import { DangerZone } from './danger-zone'
import { PrivacyForm } from './privacy-form'

export default async function EditProfilePage() {
  const session = await requireSession()
  const supabase = await createClient()
  // Pass the viewer = self so getProfile returns unredacted data — we need
  // the real values to populate the edit form.
  const profile = await getProfile(supabase, session.userId, session.userId)

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Could not load your profile.</p>
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
              <CardTitle>Edit profile</CardTitle>
              <CardDescription>
                Update your details. Required fields are marked with *.
              </CardDescription>
            </div>
            <Link
              href="/profile/import"
              className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
            >
              Refresh from resume →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={editProfileAction}
            submitLabel="Save changes"
            defaults={{
              name: profile.name ?? '',
              headline: profile.headline ?? '',
              city: profile.city ?? '',
              currentEmployer: profile.currentEmployer ?? '',
              currentTitle: profile.currentTitle ?? '',
              university: profile.university ?? '',
              major: profile.major ?? '',
              linkedinUrl: profile.linkedinUrl ?? '',
              avatarUrl: profile.avatarUrl ?? '',
              graduationYear: profile.graduationYear?.toString() ?? '',
              bio: profile.bio ?? '',
              mentoringTopics: profile.mentoringTopics?.join(', ') ?? '',
              openToMentor: profile.openToMentor,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Control who sees each part of your profile. Saves separately from the form above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrivacyForm initial={profile.privacySettings} />
        </CardContent>
      </Card>

      <DangerZone />
    </div>
  )
}
