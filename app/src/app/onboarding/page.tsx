import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { clearMembershipPreference } from '@/app/_lib/membership-cookie'
import { OnboardingComplete } from '@/components/onboarding/complete'
import { OnboardingShell } from '@/components/onboarding/shell'
import { StepAbout } from '@/components/onboarding/step-about'
import { StepCurrent } from '@/components/onboarding/step-current'
import { StepEducation } from '@/components/onboarding/step-education'
import { StepFastFill } from '@/components/onboarding/step-fast-fill'
import { StepHelp } from '@/components/onboarding/step-help'
import { StepPast } from '@/components/onboarding/step-past'
import { StepSayHi } from '@/components/onboarding/step-say-hi'
import { OnboardingWelcome } from '@/components/onboarding/welcome'
import { createHelpRepository } from '@/db/repositories/help'
import { createOnboardingRepository } from '@/db/repositories/onboarding'
import { createPeopleRepository } from '@/db/repositories/people'
import { createProfileImportRepository } from '@/db/repositories/profile-imports'
import { createProfileRepository } from '@/db/repositories/profiles'
import { requireSession } from '@/lib/auth/session'
import { memberDestination, selectedMembership } from '@/lib/membership/selection'
import {
  inferOnboardingStep,
  ONBOARDING_STEP_COOKIE,
  parseOnboardingStep,
} from '@/lib/onboarding/progress'
import { searchPeople } from '@/lib/people/operations'
import { displayOrgName } from '@/lib/utils'
import {
  aboutAction,
  currentAction,
  educationAction,
  fastFillAction,
  finishAction,
  helpAction,
  pastAction,
  startAction,
} from './actions'
import { startLinkedInImportAction, startResumeImportAction } from './import/actions'

type SearchParams = { step?: string; complete?: string }

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
  if (destination === 'reject-session') {
    await client.auth.signOut()
    await clearMembershipPreference()
    redirect('/sign-in?error=membership_unavailable')
  }

  const membership = selectedMembership(context)
  if (!membership) redirect('/select-circle')
  if (destination === 'pending-approval') redirect('/pending')
  if (destination === 'member-shell') {
    if (params.complete === '1') {
      return (
        <OnboardingComplete
          name={membership.profile.preferredName ?? membership.profile.displayName ?? 'Member'}
          organizationName={displayOrgName(membership.organization.name)}
        />
      )
    }
    redirect('/')
  }

  const profileResult = await createProfileRepository(client).get(membership.membershipId)
  if (!profileResult.ok) redirect('/select-circle?error=unavailable')
  const profile = profileResult.profile
  const orgName = displayOrgName(profile.membership.organization.name)

  const requiredFloorMet = !!profile.identity.displayName && !!profile.identity.graduationYear
  const [cookieStore, onboardingDraftResult] = await Promise.all([
    cookies(),
    createOnboardingRepository(client).getDraft(membership.membershipId),
  ])
  const durableStep =
    onboardingDraftResult.ok && onboardingDraftResult.draft
      ? onboardingDraftResult.draft.currentStep
      : null
  const explicitStep = parseOnboardingStep(params.step)
  const cookieStep = parseOnboardingStep(cookieStore.get(ONBOARDING_STEP_COOKIE)?.value)
  const storedStep = parseOnboardingStep(durableStep?.toString())
  if (!explicitStep && !cookieStep && !storedStep) {
    return (
      <OnboardingWelcome
        name={profile.identity.preferredName ?? profile.identity.displayName ?? 'there'}
        action={startAction}
      />
    )
  }
  const requestedStep =
    explicitStep ??
    cookieStep ??
    storedStep ??
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
      industry: profile.current.industry,
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
              We&rsquo;ve got most of this from {orgName}. Just confirm what people in your circle
              should see.
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

    case 2: {
      const pendingImport = await createProfileImportRepository(client).get(membership.membershipId)
      return (
        <OnboardingShell
          step={2}
          eyebrow="Fast fill"
          title="Bring your history in one go."
          lede="Paste your LinkedIn URL or upload a résumé and we’ll prefill the next steps for you to review. Prefer typing? Skip ahead."
        >
          <StepFastFill
            skipAction={fastFillAction}
            linkedInAction={startLinkedInImportAction}
            resumeAction={startResumeImportAction}
            linkedinRequestId={randomUUID()}
            resumeRequestId={randomUUID()}
            savedLinkedinUrl={profile.preferences.freshness.linkedinUrl}
            pendingProposalId={pendingImport?.id ?? null}
          />
        </OnboardingShell>
      )
    }

    case 3:
      return (
        <OnboardingShell
          step={3}
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

    case 4:
      return (
        <OnboardingShell
          step={4}
          eyebrow="Career"
          title="What are you doing now?"
          lede="What you’re doing today. It helps fellow alumni find you for referrals and local connections."
        >
          <StepCurrent
            defaults={{
              currentEmployer: profile.current.employer ?? '',
              currentTitle: profile.current.title ?? '',
              city: profile.current.city ?? '',
              headline: profile.current.headline ?? '',
              industry: profile.current.industry ?? '',
            }}
            action={currentAction}
          />
        </OnboardingShell>
      )

    case 5:
      return (
        <OnboardingShell
          step={5}
          eyebrow="Activities"
          title="What have you done?"
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

    case 6: {
      const avatarUrl = profile.identity.avatarPath
        ? client.storage.from('avatars').getPublicUrl(profile.identity.avatarPath).data.publicUrl
        : ''
      return (
        <OnboardingShell
          step={6}
          eyebrow="Help"
          title="How are you open to helping?"
          lede="Optional. Let fellow alumni know whether they can ask you a question. You can change this any time."
        >
          <StepHelp
            defaults={{
              avatarUrl,
              bio: profile.preferences.bio ?? '',
              openToHelp: profile.preferences.openToHelp,
              helperTopics: profile.preferences.helperTopics.map((topic) => topic.name).join(', '),
              freshnessPolicy: profile.preferences.freshness.refreshPolicy,
              hasLinkedinUrl: !!profile.preferences.freshness.linkedinUrl,
            }}
            name={profile.identity.displayName ?? ''}
            action={helpAction}
          />
        </OnboardingShell>
      )
    }

    case 7: {
      const classYear = profile.identity.graduationYear
      const helpRepository = createHelpRepository(client)
      const [peopleResult, preferences, openAsks] = await Promise.all([
        classYear
          ? searchPeople(
              {
                membershipId: membership.membershipId,
                query: null,
                scope: 'all',
                filters: {
                  industry: null,
                  classYearStart: classYear,
                  classYearEnd: classYear,
                  location: null,
                  employer: null,
                  education: null,
                  topic: null,
                },
                limit: 25,
              },
              createPeopleRepository(client),
            )
          : Promise.resolve({ status: 'invalid_input' as const }),
        helpRepository.getHelperPreferences(membership.membershipId),
        helpRepository.listGiveHelp({
          membershipId: membership.membershipId,
          arm: 'search',
          query: null,
          cursor: null,
          limit: 2,
        }),
      ])
      const classmates =
        peopleResult.status === 'ok'
          ? peopleResult.result.items
              .filter((person) => person.relationship.state === 'none')
              .map((person) => ({
                userId: person.userId,
                displayName: person.preferredName ?? person.displayName,
                headline: person.headline,
                graduationYear: person.graduationYear,
              }))
          : []
      const offerableAsks =
        preferences?.openToHelp && !preferences.pausedAt
          ? openAsks.map((ask) => ({
              id: ask.id,
              question: ask.question,
              memberLine:
                ask.asker.identity === 'identified'
                  ? `${ask.asker.displayName}${ask.asker.graduationYear ? ` · Class of ${ask.asker.graduationYear}` : ''}`
                  : 'A member in your circle',
              offered: ask.myOfferStatus === 'pending',
            }))
          : []
      return (
        <OnboardingShell
          step={7}
          eyebrow="Say hi"
          title="Start with one real thing."
          lede="You can keep a private question ready for Help. We will not publish it during onboarding."
        >
          <StepSayHi
            defaultQuestion={
              onboardingDraftResult.ok ? (onboardingDraftResult.draft?.question ?? '') : ''
            }
            organizationId={membership.organization.id}
            classmates={classmates}
            openAsks={offerableAsks}
            action={finishAction}
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
