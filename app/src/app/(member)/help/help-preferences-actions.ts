'use server'

import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createHelpRepository } from '@/db/repositories/help'
import { requireSession } from '@/lib/auth/session'
import { saveHelpPreferences } from '@/lib/help/operations'
import { selectedMembership } from '@/lib/membership/selection'

export type HelpPreferencesFormState = {
  ok?: boolean
  error?: string
  fieldErrors?: { topics?: string }
}

const helpPreferencesFormSchema = z.object({
  openToHelp: z.preprocess((value) => value === 'on', z.boolean()),
  topics: z.preprocess(
    (value) => (typeof value === 'string' ? value : undefined),
    z.string().optional(),
  ),
})

export async function saveHelpPreferencesAction(
  _previous: HelpPreferencesFormState,
  formData: FormData,
): Promise<HelpPreferencesFormState> {
  await requireSession('/settings')
  const parsed = helpPreferencesFormSchema.safeParse({
    openToHelp: formData.get('openToHelp'),
    topics: formData.get('topics'),
  })
  if (!parsed.success) return { error: 'Check the topics and try again.' }

  // Disabled topic controls are omitted. The domain operation owns trimming,
  // deduplication, limits, and clearing topics when availability closes.
  const topics = parsed.data.topics?.split(',') ?? []

  try {
    const { client, context } = await loadMemberContext()
    const membership = selectedMembership(context)
    if (!membership || membership.status !== 'active') {
      return { error: 'Your active circle could not be found. Refresh and try again.' }
    }

    const result = await saveHelpPreferences(
      {
        membershipId: membership.membershipId,
        openToHelp: parsed.data.openToHelp,
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
    revalidatePath('/settings')
    return { ok: true }
  } catch (error) {
    Sentry.captureException(error, { tags: { area: 'help', action: 'save_preferences' } })
    return { error: 'We could not save that. Please try again.' }
  }
}
