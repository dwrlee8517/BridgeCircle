'use server'

import { revalidatePath } from 'next/cache'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createProfileRepository } from '@/db/repositories/profiles'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'
import type { ProfileCommandResult, ProfileRepository } from '@/lib/profile/contracts'
import {
  aboutFormSchema,
  currentFormSchema,
  educationFormSchema,
  formValues,
  historyFormSchema,
  identityFormSchema,
  linksFormSchema,
  visibilityFormSchema,
} from '@/lib/profile/self-profile-schemas'

export type ProfileActionState = {
  status: 'idle' | 'saved' | 'error'
  message?: string
  savedAt?: number
}

export const initialProfileActionState: ProfileActionState = { status: 'idle' }

export async function saveIdentityAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = identityFormSchema.safeParse(
    formValues(formData, ['displayName', 'preferredName', 'nameOther', 'graduationYear']),
  )
  if (!parsed.success) return invalidState(parsed.error.issues[0]?.message)
  return runProfileCommand((repository, membershipId) =>
    repository.saveIdentity(membershipId, parsed.data),
  )
}

export async function saveCurrentAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = currentFormSchema.safeParse(
    formValues(formData, ['currentEmployer', 'currentTitle', 'city', 'headline', 'industry']),
  )
  if (!parsed.success) return invalidState(parsed.error.issues[0]?.message)
  return runProfileCommand((repository, membershipId) =>
    repository.saveCurrent(membershipId, parsed.data),
  )
}

export async function saveAboutAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = aboutFormSchema.safeParse(formValues(formData, ['bio']))
  if (!parsed.success) return invalidState(parsed.error.issues[0]?.message)
  return runProfileCommand((repository, membershipId) =>
    repository.saveAbout(membershipId, parsed.data.bio),
  )
}

export async function saveHistoryAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = historyFormSchema.safeParse(formValues(formData, ['experiences', 'skills']))
  if (!parsed.success) return invalidState(parsed.error.issues[0]?.message)
  return runProfileCommand((repository, membershipId) =>
    repository.saveHistory(membershipId, parsed.data),
  )
}

export async function saveEducationAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = educationFormSchema.safeParse(
    formValues(formData, ['university', 'major', 'education']),
  )
  if (!parsed.success) return invalidState(parsed.error.issues[0]?.message)
  return runProfileCommand((repository, membershipId) =>
    repository.saveEducation(membershipId, parsed.data),
  )
}

export async function saveVisibilityAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = visibilityFormSchema.safeParse(
    formValues(formData, ['career_history', 'education_history', 'bio', 'skills']),
  )
  if (!parsed.success) return invalidState(parsed.error.issues[0]?.message)
  return runProfileCommand((repository, membershipId) =>
    repository.saveVisibility(membershipId, parsed.data),
  )
}

export async function saveLinksAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = linksFormSchema.safeParse(formValues(formData, ['links']))
  if (!parsed.success) return invalidState(parsed.error.issues[0]?.message)
  return runProfileCommand((repository, membershipId) =>
    repository.saveLinks(membershipId, parsed.data.links),
  )
}

async function runProfileCommand(
  command: (repository: ProfileRepository, membershipId: string) => Promise<ProfileCommandResult>,
): Promise<ProfileActionState> {
  const session = await requireSession('/profile/me')
  const memberState = await loadMemberContext()
  const membership = selectedMembership(memberState.context)
  if (!membership || (membership.status !== 'active' && membership.status !== 'pending')) {
    return { status: 'error', message: 'Choose an available circle, then try again.' }
  }

  const result = await command(createProfileRepository(memberState.client), membership.membershipId)
  if (result !== 'saved') return commandErrorState(result)

  revalidatePath('/people')
  revalidatePath('/profile/me')
  revalidatePath(`/profile/${session.userId}`)
  return { status: 'saved', message: 'Saved.', savedAt: Date.now() }
}

function invalidState(message?: string): ProfileActionState {
  return { status: 'error', message: message || 'Check the highlighted details and try again.' }
}

function commandErrorState(result: Exclude<ProfileCommandResult, 'saved'>): ProfileActionState {
  if (result === 'not_owned' || result === 'membership_unavailable') {
    return { status: 'error', message: 'This profile is not available in the selected circle.' }
  }
  if (result === 'profile_required') {
    return { status: 'error', message: 'Add your name before saving this section.' }
  }
  return { status: 'error', message: 'Some details need another look before they can be saved.' }
}
