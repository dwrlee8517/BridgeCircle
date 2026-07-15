'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createProfileRepository } from '@/db/repositories/profiles'
import { track } from '@/lib/analytics/track'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'
import { ONBOARDING_STEP_COOKIE, type OnboardingStep } from '@/lib/onboarding/progress'
import {
  markOnboardingComplete,
  saveOnboardingAbout,
  saveOnboardingCurrent,
  saveOnboardingEducation,
  saveOnboardingHelp,
  saveOnboardingPast,
} from '@/lib/profile/savePartialProfile'
import {
  parseOnboardingAbout,
  parseOnboardingCurrent,
  parseOnboardingEducation,
  parseOnboardingHelp,
  parseOnboardingPast,
} from '@/lib/profile/schemas'

type StepState = {
  error?: string
  fieldErrors?: Record<string, string>
  skipped?: boolean
}

function fieldErrorsFromZod(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    // PropertyKey is string | number | symbol; Zod uses string/number in
    // practice, but the type is broad. Map to string for the joined path.
    const path = issue.path.map((p) => String(p)).join('.')
    if (!fieldErrors[path]) fieldErrors[path] = issue.message
  }
  return fieldErrors
}

function isSkip(formData: FormData) {
  return formData.get('skip') === '1'
}

async function rememberStep(step: OnboardingStep) {
  const cookieStore = await cookies()
  cookieStore.set(ONBOARDING_STEP_COOKIE, String(step), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

async function clearRememberedStep() {
  const cookieStore = await cookies()
  cookieStore.delete(ONBOARDING_STEP_COOKIE)
}

// --- Step 1: About you (cannot skip) ----------------------------------

export async function aboutAction(_prev: StepState, formData: FormData): Promise<StepState> {
  const session = await requireSession()
  const parsed = parseOnboardingAbout(formData)
  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    }
  }

  const { repository, membershipId } = await profileContext()
  const result = await saveOnboardingAbout(repository, membershipId, parsed.data)
  if (!result.ok) {
    if (result.error === 'no_membership') {
      redirect('/select-circle?error=unavailable')
    }
    return { error: 'Could not save. Try again.' }
  }
  track({ type: 'onboarding_step_completed', userId: session.userId, step: 1 })
  await rememberStep(2)
  redirect('/onboarding?step=2')
}

// --- Step 2: Education -------------------------------------------------

export async function educationAction(_prev: StepState, formData: FormData): Promise<StepState> {
  const session = await requireSession()
  if (isSkip(formData)) {
    track({ type: 'onboarding_skipped', userId: session.userId, step: 2 })
    await rememberStep(3)
    redirect('/onboarding?step=3')
  }

  const parsed = parseOnboardingEducation(formData)
  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    }
  }

  const { repository, membershipId } = await profileContext()
  const result = await saveOnboardingEducation(repository, membershipId, parsed.data)
  if (!result.ok) return { error: 'Could not save. Try again.' }
  track({ type: 'onboarding_step_completed', userId: session.userId, step: 2 })
  await rememberStep(3)
  redirect('/onboarding?step=3')
}

// --- Step 3: Current ---------------------------------------------------

export async function currentAction(_prev: StepState, formData: FormData): Promise<StepState> {
  const session = await requireSession()
  if (isSkip(formData)) {
    track({ type: 'onboarding_skipped', userId: session.userId, step: 3 })
    await rememberStep(4)
    redirect('/onboarding?step=4')
  }

  const parsed = parseOnboardingCurrent(formData)
  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    }
  }

  const { repository, membershipId } = await profileContext()
  const result = await saveOnboardingCurrent(repository, membershipId, parsed.data)
  if (!result.ok) return { error: 'Could not save. Try again.' }
  track({ type: 'onboarding_step_completed', userId: session.userId, step: 3 })
  await rememberStep(4)
  redirect('/onboarding?step=4')
}

// --- Step 4: Past ------------------------------------------------------

export async function pastAction(_prev: StepState, formData: FormData): Promise<StepState> {
  const session = await requireSession()
  if (isSkip(formData)) {
    track({ type: 'onboarding_skipped', userId: session.userId, step: 4 })
    await rememberStep(5)
    redirect('/onboarding?step=5')
  }

  const parsed = parseOnboardingPast(formData)
  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    }
  }

  const { repository, membershipId } = await profileContext()
  const result = await saveOnboardingPast(repository, membershipId, parsed.data)
  if (!result.ok) return { error: 'Could not save. Try again.' }
  track({ type: 'onboarding_step_completed', userId: session.userId, step: 4 })
  await rememberStep(5)
  redirect('/onboarding?step=5')
}

// --- Step 5: Help (final — sets onboarding_completed_at) --------------

export async function helpAction(_prev: StepState, formData: FormData): Promise<StepState> {
  const session = await requireSession()
  const { repository, membershipId, membershipStatus } = await profileContext()

  if (isSkip(formData)) {
    // Skipping the final step still completes onboarding — the user
    // chose not to fill in mentoring/avatar fields right now. They can
    // do so from Help settings later.
    const saveResult = await saveOnboardingHelp(repository, membershipId, {
      openToHelp: boolFromForm(formData.get('openToHelp')),
      helperTopics: null,
      bio: null,
      avatarUrl: null,
      freshnessPolicy: freshnessPolicyFromForm(formData),
    })
    if (!saveResult.ok) return { error: 'Could not save. Try again.' }

    const finishResult = await markOnboardingComplete(repository, membershipId)
    if (!finishResult.ok) return { error: 'Could not save. Try again.' }
    track({ type: 'onboarding_skipped', userId: session.userId, step: 5 })
    track({ type: 'onboarding_finished', userId: session.userId, skippedFinal: true })
    await clearRememberedStep()
    redirect(membershipStatus === 'pending' ? '/onboarding' : '/')
  }

  const parsed = parseOnboardingHelp(formData)
  if (!parsed.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    }
  }

  const result = await saveOnboardingHelp(repository, membershipId, parsed.data)
  if (!result.ok) {
    if (result.error === 'no_membership') {
      redirect('/select-circle?error=unavailable')
    }
    return { error: 'Could not save. Try again.' }
  }

  const finishResult = await markOnboardingComplete(repository, membershipId)
  if (!finishResult.ok) return { error: 'Could not save. Try again.' }
  track({ type: 'onboarding_step_completed', userId: session.userId, step: 5 })
  track({ type: 'onboarding_finished', userId: session.userId, skippedFinal: false })
  await clearRememberedStep()
  redirect(membershipStatus === 'pending' ? '/onboarding' : '/')
}

async function profileContext() {
  const { client, context } = await loadMemberContext()
  if (context.requiresCircleChoice) redirect('/select-circle')
  const membership = selectedMembership(context)
  if (!membership || (membership.status !== 'active' && membership.status !== 'pending')) {
    redirect('/select-circle?error=unavailable')
  }
  return {
    repository: createProfileRepository(client),
    membershipId: membership.membershipId,
    membershipStatus: membership.status,
  }
}

function boolFromForm(value: FormDataEntryValue | null): boolean {
  return value === 'on' || value === 'true'
}

function freshnessPolicyFromForm(
  formData: FormData,
): 'manual_only' | 'review_before_update' | 'auto_apply_and_notify' {
  const raw = formData.get('freshnessPolicy')
  if (raw === 'manual_only' || raw === 'review_before_update' || raw === 'auto_apply_and_notify') {
    return raw
  }
  return 'review_before_update'
}
