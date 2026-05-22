import Link from 'next/link'
import { AvatarUploader } from '@/components/avatar-uploader'
import { ProfileForm } from '@/components/profile-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'
import { FreshnessReviewCard } from '../../help-network-ui'
import { editProfileAction, refreshFromLinkedInAction } from './actions'
import { DangerZone } from './danger-zone'
import { PrivacyForm } from './privacy-form'

type SearchParams = { refresh?: string; saved?: string }

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const params = await searchParams
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

  const hasLinkedinUrl = !!profile.linkedinUrl
  const refreshBanner = refreshBannerFor(params.refresh)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link
        href={`/profile/${session.userId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to profile
      </Link>
      {refreshBanner ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            refreshBanner.tone === 'ok'
              ? 'border-accent-sage/25 bg-accent-sage/10 text-foreground'
              : 'border-accent-ochre/25 bg-accent-ochre/10 text-foreground'
          }`}
        >
          {refreshBanner.message}
        </div>
      ) : null}
      <FreshnessReviewCard />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Edit profile</CardTitle>
              <CardDescription>
                Update your details. Required fields are marked with *.
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              {/* "Update from LinkedIn" is a form-submit (server action) rather
                  than a Link because it kicks off the live fetch + diff
                  pipeline on the server. Disabled when no URL is on file —
                  link to import flow in that case so the user can paste one. */}
              {hasLinkedinUrl ? (
                <form action={refreshFromLinkedInAction}>
                  <Button type="submit" variant="outline" size="sm" className="whitespace-nowrap">
                    Update from LinkedIn
                  </Button>
                </form>
              ) : (
                <Link
                  href="/profile/import?source=linkedin&return=/profile/edit"
                  className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
                >
                  Import from LinkedIn →
                </Link>
              )}
              <Link
                href="/profile/import"
                className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
              >
                Refresh from resume →
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-accent/30 p-4">
            <AvatarUploader initialAvatarUrl={profile.avatarUrl} initialName={profile.name} />
          </div>
          <ProfileForm
            action={editProfileAction}
            submitLabel="Save changes"
            defaults={{
              name: profile.name ?? '',
              preferredName: profile.preferredName ?? '',
              nameOther: profile.nameOther ?? '',
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
              skills: profile.skills ?? [],
              careerHistory: (profile.careerHistory ?? []).map((e) => ({
                employer: e.employer,
                title: e.title,
                startDate: e.start_date ?? null,
                endDate: e.end_date ?? null,
                description: e.description ?? null,
              })),
              educationHistory: (profile.educationHistory ?? []).map((e) => ({
                school: e.school,
                degree: e.degree ?? null,
                field: e.field ?? null,
                startDate: e.start_date ?? null,
                endDate: e.end_date ?? null,
              })),
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

function refreshBannerFor(
  code: string | undefined,
): { tone: 'ok' | 'warn'; message: string } | null {
  switch (code) {
    case 'none':
      return {
        tone: 'ok',
        message: 'We checked LinkedIn — nothing to update since your last refresh.',
      }
    case 'no-url':
      return {
        tone: 'warn',
        message: 'Add a LinkedIn URL on your profile before requesting an update.',
      }
    case 'failed':
      return {
        tone: 'warn',
        message: "We couldn't reach LinkedIn just now. Try again in a minute.",
      }
    case 'rejected':
      return {
        tone: 'warn',
        message: 'LinkedIn returned something we couldn’t use safely. Try again later.',
      }
    case 'error':
      return {
        tone: 'warn',
        message: 'Something went wrong while updating from LinkedIn. Try again.',
      }
    default:
      return null
  }
}
