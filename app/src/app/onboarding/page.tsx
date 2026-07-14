import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { clearMembershipPreference } from '@/app/_lib/membership-cookie'
import { OnboardingShell } from '@/components/onboarding/shell'
import { StepAbout } from '@/components/onboarding/step-about'
import { StepCurrent } from '@/components/onboarding/step-current'
import { StepEducation } from '@/components/onboarding/step-education'
import { StepHelp } from '@/components/onboarding/step-help'
import { StepPast } from '@/components/onboarding/step-past'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { createProfileRepository } from '@/db/repositories/profiles'
import { requireSession } from '@/lib/auth/session'
import { memberDestination, selectedMembership } from '@/lib/membership/selection'
import {
  inferOnboardingStep,
  ONBOARDING_STEP_COOKIE,
  parseOnboardingStep,
} from '@/lib/onboarding/progress'
import { displayOrgName } from '@/lib/utils'
import { aboutAction, currentAction, educationAction, helpAction, pastAction } from './actions'

type SearchParams = { step?: string }

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireSession('/onboarding')
  const [params, { client, context }] = await Promise.all([searchParams, loadMemberContext()])
  const destination = memberDestination(context)

  if (destination === 'cancel-delete') redirect('/cancel-delete')
  if (destination === 'select-circle') redirect('/select-circle')
  if (destination === 'member-shell') redirect('/')
  if (destination === 'reject-session') {
    await client.auth.signOut()
    await clearMembershipPreference()
    redirect('/sign-in?error=membership_unavailable')
  }

  const membership = selectedMembership(context)
  if (!membership) redirect('/select-circle')
  if (destination === 'pending-approval') {
    return <PendingApproval orgName={displayOrgName(membership.organization.name)} />
  }

  const profileResult = await createProfileRepository(client).get(membership.membershipId)
  if (!profileResult.ok) redirect('/select-circle?error=unavailable')
  const profile = profileResult.profile
  const orgName = displayOrgName(profile.membership.organization.name)

  const requiredFloorMet = !!profile.identity.displayName && !!profile.identity.graduationYear
  const cookieStore = await cookies()
  const requestedStep =
    parseOnboardingStep(params.step) ??
    parseOnboardingStep(cookieStore.get(ONBOARDING_STEP_COOKIE)?.value) ??
    inferOnboardingStep({
      name: profile.identity.displayName,
      graduationYear: profile.identity.graduationYear,
      university: profile.current.university,
      major: profile.current.major,
      educationHistory: profile.education,
      currentEmployer: profile.current.employer,
      currentTitle: profile.current.title,
      city: profile.current.city,
      headline: profile.current.headline,
      linkedinUrl: profile.current.linkedinUrl,
      careerHistory: profile.experiences,
      skills: profile.skills.map((skill) => skill.name),
    })
  const step = requiredFloorMet ? requestedStep : 1
  const firstName = profile.identity.displayName?.split(' ')[0] ?? null

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
              name: profile.identity.displayName ?? '',
              preferredName: profile.identity.preferredName ?? '',
              nameOther: profile.identity.nameOther ?? '',
              graduationYear: profile.identity.graduationYear?.toString() ?? '',
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
              university: profile.current.university ?? '',
              major: profile.current.major ?? '',
              educationHistory: profile.education.map((entry) => ({
                school: entry.school,
                degree: entry.degree,
                field: entry.field,
                startDate: formatPeriod(entry.startYear, entry.startMonth),
                endDate: formatPeriod(entry.endYear, entry.endMonth),
              })),
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
          lede="What you’re doing today. It helps fellow alumni find you for referrals and local connections."
        >
          <StepCurrent
            defaults={{
              currentEmployer: profile.current.employer ?? '',
              currentTitle: profile.current.title ?? '',
              city: profile.current.city ?? '',
              headline: profile.current.headline ?? '',
              linkedinUrl: profile.current.linkedinUrl ?? '',
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
          lede="Past roles help the right people find one another for the harder questions."
        >
          <StepPast
            defaults={{
              careerHistory: profile.experiences.map((entry) => ({
                employer: entry.employer,
                title: entry.title,
                startDate: formatPeriod(entry.startYear, entry.startMonth),
                endDate: formatPeriod(entry.endYear, entry.endMonth),
                description: entry.description,
              })),
              skills: profile.skills.map((skill) => skill.name),
            }}
            action={pastAction}
          />
        </OnboardingShell>
      )

    case 5: {
      const avatarUrl = profile.identity.avatarPath
        ? client.storage.from('avatars').getPublicUrl(profile.identity.avatarPath).data.publicUrl
        : ''
      return (
        <OnboardingShell
          step={5}
          eyebrow="The last bit"
          title="How you can help."
          lede="Optional. Let fellow alumni know whether they can ask you a question. You can change this any time."
        >
          <StepHelp
            defaults={{
              avatarUrl,
              bio: profile.preferences.bio ?? '',
              openToMentor: profile.preferences.openToHelp,
              mentoringTopics: profile.preferences.helperTopics
                .map((topic) => topic.name)
                .join(', '),
              freshnessPolicy: profile.preferences.freshness.refreshPolicy,
              hasLinkedinUrl: !!(
                profile.preferences.freshness.linkedinUrl ?? profile.current.linkedinUrl
              ),
            }}
            name={profile.identity.displayName ?? ''}
            action={helpAction}
          />
        </OnboardingShell>
      )
    }
  }
}

function formatPeriod(year: number | null, month: number | null): string | null {
  if (!year) return null
  return month ? `${year}-${String(month).padStart(2, '0')}` : String(year)
}

async function signOutFromPendingApproval() {
  'use server'

  const { client } = await loadMemberContext()
  await client.auth.signOut()
  await clearMembershipPreference()
  redirect('/sign-in')
}

function PendingApproval({ orgName }: { orgName: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-10 sm:px-8 sm:py-14">
      <Wordmark />
      <section className="mt-20 space-y-5">
        <p className="text-kicker font-semibold uppercase tracking-hero text-muted-foreground">
          Approval pending
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your {orgName} profile is ready.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Your profile setup is saved. A circle admin is reviewing your membership, and you’ll be
          able to enter as soon as it’s approved.
        </p>
        <form action={signOutFromPendingApproval}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </section>
    </main>
  )
}
