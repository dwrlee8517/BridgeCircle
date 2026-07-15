'use server'

import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createHelpRepository } from '@/db/repositories/help'
import { saveHelpPreferences } from '@/lib/help/operations'
import { selectedMembership } from '@/lib/membership/selection'

export type HelpPreferencesFormState = {
  ok?: boolean
  error?: string
  fieldErrors?: { topics?: string }
}

export async function saveHelpPreferencesAction(
  _previous: HelpPreferencesFormState,
  formData: FormData,
): Promise<HelpPreferencesFormState> {
  const openToHelp = formData.get('openToHelp') === 'on'
  const topicsValue = formData.get('topics')
  if (openToHelp && typeof topicsValue !== 'string') {
    return { error: 'Check the topics and try again.' }
  }

  // Disabled form controls are omitted from FormData. Closing availability
  // intentionally clears topics, so absence is valid only in the closed state.
  const topics = openToHelp && typeof topicsValue === 'string' ? topicsValue.split(',') : []
  if (topics.length > 5) {
    return {
      error: 'Choose up to five topics.',
      fieldErrors: { topics: 'Use commas to separate no more than five topics.' },
    }
  }

  try {
    const { client, context } = await loadMemberContext()
    const membership = selectedMembership(context)
    if (!membership || membership.status !== 'active') {
      return { error: 'Your active circle could not be found. Refresh and try again.' }
    }

    const result = await saveHelpPreferences(
      {
        membershipId: membership.membershipId,
        openToHelp,
        topics,
      },
      createHelpRepository(client),
    )

    if (result.status !== 'saved') {
      return {
        error:
          result.status === 'invalid_input'
            ? 'Choose up to five topics, each under 100 characters.'
            : 'Those preferences are not available right now. Refresh and try again.',
        fieldErrors:
          result.status === 'invalid_input'
            ? { topics: 'Use up to five topics, each under 100 characters.' }
            : undefined,
      }
    }

    revalidatePath('/help')
    revalidatePath('/help/settings')
    return { ok: true }
  } catch (error) {
    Sentry.captureException(error, { tags: { area: 'help', action: 'save_preferences' } })
    return { error: 'We could not save that. Please try again.' }
  }
}
