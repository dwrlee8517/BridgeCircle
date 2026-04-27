import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { OnboardingForm } from './onboarding-form'

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

  let orgProfile: {
    graduation_year: number | null
    bio: string | null
    mentoring_topics: string[] | null
    open_to_mentor: boolean | null
  } | null = null
  if (membership) {
    const { data } = await supabase
      .from('organization_profiles')
      .select('graduation_year, bio, mentoring_topics, open_to_mentor')
      .eq('organization_membership_id', membership.id)
      .maybeSingle()
    orgProfile = data
  }

  const orgName =
    (membership?.organizations as { name: string } | null)?.name ?? 'your organization'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to {orgName}</CardTitle>
          <CardDescription>
            A few details so other alumni can find you. You can edit any of this later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm
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
              openToMentor: orgProfile?.open_to_mentor ?? false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
