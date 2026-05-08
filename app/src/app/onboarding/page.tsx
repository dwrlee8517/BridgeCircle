import { redirect } from 'next/navigation'
import { OnboardingShell, TOTAL_STEPS } from '@/components/onboarding/shell'
import { StepAbout } from '@/components/onboarding/step-about'
import { StepCurrent } from '@/components/onboarding/step-current'
import { StepEducation } from '@/components/onboarding/step-education'
import { StepHelp } from '@/components/onboarding/step-help'
import { StepPast } from '@/components/onboarding/step-past'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { displayOrgName } from '@/lib/utils'
import { aboutAction, currentAction, educationAction, helpAction, pastAction } from './actions'

type SearchParams = { step?: string }

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

/**
 * Onboarding page router. Reads `?step=1..5` and renders the appropriate
 * step component inside the shared shell.
 *
 * Routing rules:
 *   - Anyone with users.onboarding_completed_at set → redirect to /. They've
 *     already finished onboarding; further fields go through /profile/edit.
 *   - No active membership row → sign out + redirect to /sign-in (the user
 *     somehow got here without a valid invite acceptance).
 *   - Step out of range (or missing) → default to 1.
 *   - Step ≥ 2 but name/grad year still missing → force back to step 1.
 *     Step 1 is the only required step; you can't skip it.
 *
 * The user can navigate forward and backward freely between steps 1–5
 * (after passing step 1) — query-param based state means browser back +
 * forward both work natively.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession('/onboarding')
  const params = await searchParams
  const supabase = await createClient()

  // Onboarding completion gate. Use the admin client because users.row is
  // protected by RLS and the regular client doesn't always include the
  // signed-in user's own row in selects depending on policy shape.
  const admin = createAdminClient()
  const { data: userRow } = await admin
    .from('users')
    .select('onboarding_completed_at')
    .eq('id', session.userId)
    .maybeSingle()
  if (userRow?.onboarding_completed_at) redirect('/')

  const [{ data: base }, { data: membership }] = await Promise.all([
    supabase
      .from('base_profiles')
      .select(
        'name, preferred_name, name_other, headline, current_employer, current_title, city, university, major, linkedin_url, avatar_url, skills, career_history, education_history',
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
      `/sign-in?error=${encodeURIComponent("We couldn't find an invite for this email. Ask your admin to send you one.")}`,
    )
  }

  const [{ data: orgProfile }, { data: pref }] = await Promise.all([
    supabase
      .from('organization_profiles')
      .select('graduation_year, bio, mentoring_topics')
      .eq('organization_membership_id', membership.id)
      .maybeSingle(),
    supabase
      .from('helper_preferences')
      .select('open_to_mentorship')
      .eq('organization_membership_id', membership.id)
      .maybeSingle(),
  ])

  const orgName = displayOrgName((membership.organizations as { name: string } | null)?.name)

  // Step coercion. Always force step 1 if the required floor (name +
  // grad year) is not yet set.
  const requiredFloorMet = !!base?.name && !!orgProfile?.graduation_year
  const requestedStep = clampStep(params.step)
  const step = requiredFloorMet ? requestedStep : 1

  const firstName = base?.name?.split(' ')[0] ?? null

  switch (step) {
    case 1:
      return (
        <OnboardingShell
          step={1}
          eyebrow={firstName ? `Welcome, ${firstName}` : 'Welcome'}
          title={`Let's set up your ${orgName} profile.`}
          lede={
            <>
              We&rsquo;ve got most of this from {orgName}. Just confirm what fellow alumni should
              see.
            </>
          }
        >
          <StepAbout
            defaults={{
              name: base?.name ?? '',
              preferredName: base?.preferred_name ?? '',
              nameOther: base?.name_other ?? '',
              graduationYear: orgProfile?.graduation_year?.toString() ?? '',
            }}
            action={aboutAction}
          />
        </OnboardingShell>
      )

    case 2:
      return (
        <OnboardingShell
          step={2}
          eyebrow="Education"
          title="Where you studied."
          lede={
            <>
              Your school and major. Other alumni often search by university or major when
              they&rsquo;re looking for someone to ask.
            </>
          }
        >
          <StepEducation
            defaults={{
              university: base?.university ?? '',
              major: base?.major ?? '',
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
            action={educationAction}
          />
        </OnboardingShell>
      )

    case 3:
      return (
        <OnboardingShell
          step={3}
          eyebrow="Today"
          title="Where you are now."
          lede={
            <>
              What you&rsquo;re doing today. Keeps you findable for referrals and local connections.
            </>
          }
        >
          <StepCurrent
            defaults={{
              currentEmployer: base?.current_employer ?? '',
              currentTitle: base?.current_title ?? '',
              city: base?.city ?? '',
              headline: base?.headline ?? '',
              linkedinUrl: base?.linkedin_url ?? '',
            }}
            action={currentAction}
          />
        </OnboardingShell>
      )

    case 4:
      return (
        <OnboardingShell
          step={4}
          eyebrow="Past experience"
          title="Where you've been."
          lede={
            <>
              Past roles are how mentors get matched on the harder questions —{' '}
              <em>&ldquo;someone who worked in fintech before teaching.&rdquo;</em> Drop your resume
              to fill it in fast.
            </>
          }
        >
          <StepPast
            defaults={{
              careerHistory: ((base?.career_history as DbCareerEntry[] | null) ?? []).map((e) => ({
                employer: e.employer,
                title: e.title,
                startDate: e.start_date ?? null,
                endDate: e.end_date ?? null,
                description: e.description ?? null,
              })),
              skills: base?.skills ?? [],
            }}
            action={pastAction}
            importReturnTo={`/profile/import?return=${encodeURIComponent('/onboarding?step=4')}`}
          />
        </OnboardingShell>
      )

    case 5:
      return (
        <OnboardingShell
          step={5}
          eyebrow="The last bit"
          title="How you can help."
          lede={
            <>
              Optional. If you want fellow alumni to be able to ask you questions, turn this on. You
              can change it any time.
            </>
          }
        >
          <StepHelp
            defaults={{
              avatarUrl: base?.avatar_url ?? '',
              bio: orgProfile?.bio ?? '',
              openToMentor: pref?.open_to_mentorship ?? false,
              mentoringTopics: orgProfile?.mentoring_topics?.join(', ') ?? '',
            }}
            name={base?.name ?? ''}
            action={helpAction}
          />
        </OnboardingShell>
      )

    default:
      // Should never hit because clampStep guarantees 1..TOTAL_STEPS.
      redirect('/onboarding?step=1')
  }
}

function clampStep(raw: string | undefined): number {
  if (!raw) return 1
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n) || n < 1) return 1
  if (n > TOTAL_STEPS) return TOTAL_STEPS
  return n
}
