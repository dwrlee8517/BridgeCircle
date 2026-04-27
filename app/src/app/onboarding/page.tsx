import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { onboardingAction } from './actions'

export default async function OnboardingPage() {
  const session = await requireSession('/onboarding')
  const supabase = await createClient()

  const [{ data: base }, { data: membership }] = await Promise.all([
    supabase
      .from('base_profiles')
      .select(
        'name, headline, current_employer, current_title, city, university, major, linkedin_url, avatar_url',
      )
      .eq('user_id', session.userId)
      .maybeSingle(),
    supabase
      .from('organization_memberships')
      .select('id, organizations(name)')
      .eq('user_id', session.userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
  ])

  if (!membership) {
    await supabase.auth.signOut()
    redirect(
      `/sign-in?error=${encodeURIComponent(
        "We couldn't find an invite for this email. Ask your admin to send you one.",
      )}`,
    )
  }

  const [{ data: orgProfile }, { data: pref }] = await Promise.all([
    supabase
      .from('organization_profiles')
      .select('graduation_year, bio, mentoring_topics')
      .eq('organization_membership_id', membership.id)
      .maybeSingle(),
    supabase
      .from('mentorship_preferences')
      .select('is_open')
      .eq('organization_membership_id', membership.id)
      .maybeSingle(),
  ])

  const orgName =
    (membership?.organizations as { name: string } | null)?.name ?? 'your organization'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
      <Card className="bg-muted/30">
        <CardContent className="py-4 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-medium">Have a resume?</span>{' '}
            <span className="text-muted-foreground">
              Import to fill the form in faster — you can edit anything before saving.
            </span>
          </div>
          <Link
            href="/profile/import?return=/onboarding"
            className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
          >
            Import →
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to {orgName}</CardTitle>
          <CardDescription>
            A few details so other alumni can find you. You can edit any of this later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={onboardingAction}
            submitLabel="Save and continue"
            defaults={{
              name: base?.name ?? '',
              headline: base?.headline ?? '',
              city: base?.city ?? '',
              currentEmployer: base?.current_employer ?? '',
              currentTitle: base?.current_title ?? '',
              university: base?.university ?? '',
              major: base?.major ?? '',
              linkedinUrl: base?.linkedin_url ?? '',
              avatarUrl: base?.avatar_url ?? '',
              graduationYear: orgProfile?.graduation_year?.toString() ?? '',
              bio: orgProfile?.bio ?? '',
              mentoringTopics: orgProfile?.mentoring_topics?.join(', ') ?? '',
              openToMentor: pref?.is_open ?? false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
