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
        'name, headline, current_employer, current_title, city, university, major, linkedin_url, avatar_url, skills, career_history, education_history',
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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Member Profile
        </p>
        <h1
          className="bc-fraunces mt-2 text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-[44px]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          Welcome to {orgName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Add the details that help other alumni find you for referrals, mentorship, and local
          connection.
        </p>
      </div>

      <Card className="mb-5 bg-muted/30">
        <CardContent className="flex items-center justify-between gap-3 py-4">
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
      <Card className="shadow-[0_4px_20px_-4px_rgba(19,27,46,0.06)]">
        <CardHeader>
          <CardTitle
            className="bc-fraunces text-2xl font-bold tracking-[-0.02em]"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
          >
            Build Your Member Profile
          </CardTitle>
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
              skills: base?.skills ?? [],
              careerHistory: ((base?.career_history as DbCareerEntry[] | null) ?? []).map((e) => ({
                employer: e.employer,
                title: e.title,
                startDate: e.start_date ?? null,
                endDate: e.end_date ?? null,
                description: e.description ?? null,
              })),
              educationHistory: ((base?.education_history as DbEducationEntry[] | null) ?? []).map(
                (e) => ({
                  school: e.school,
                  degree: e.degree ?? null,
                  field: e.field ?? null,
                  startDate: e.start_date ?? null,
                  endDate: e.end_date ?? null,
                }),
              ),
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// Local types for the JSONB columns. The DB stores snake_case fields; the
// form expects camelCase. The mapping happens inline in `defaults`.
type DbCareerEntry = {
  employer: string
  title: string
  start_date: string | null
  end_date: string | null
  description: string | null
}
type DbEducationEntry = {
  school: string
  degree: string | null
  field: string | null
  start_date: string | null
  end_date: string | null
}
