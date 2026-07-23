import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'

const draftRowSchema = z.object({
  result_code: z.enum(['ok', 'empty', 'saved', 'not_available', 'invalid_input']),
  question: z.string().nullable(),
  current_step: z.number().int().min(1).max(7).nullable(),
  updated_at: z.string().nullable(),
})

export type OnboardingDraft = {
  question: string | null
  currentStep: number
  updatedAt: string
}

export type OnboardingDraftResult =
  | { ok: true; draft: OnboardingDraft | null }
  | { ok: false; error: 'not_available' | 'invalid_input' }

function parseDraftRow(row: unknown): OnboardingDraftResult {
  const parsed = draftRowSchema.parse(row)
  if (parsed.result_code === 'empty') return { ok: true, draft: null }
  if (
    (parsed.result_code === 'ok' || parsed.result_code === 'saved') &&
    parsed.current_step &&
    parsed.updated_at
  ) {
    return {
      ok: true,
      draft: {
        question: parsed.question,
        currentStep: parsed.current_step,
        updatedAt: parsed.updated_at,
      },
    }
  }
  if (parsed.result_code === 'not_available' || parsed.result_code === 'invalid_input') {
    return { ok: false, error: parsed.result_code }
  }
  throw new Error('onboardingDraft: successful result omitted required fields')
}

export function createOnboardingRepository(client: SupabaseClient<Database>) {
  return {
    async getDraft(membershipId: string): Promise<OnboardingDraftResult> {
      const { data, error } = await client
        .schema('api')
        .rpc('get_my_onboarding_draft', { p_membership_id: membershipId })
        .single()
      if (error) throw new Error(`getOnboardingDraft: ${error.message}`)
      return parseDraftRow(data)
    },

    async saveDraft(membershipId: string, question: string): Promise<OnboardingDraftResult> {
      const { data, error } = await client
        .schema('api')
        .rpc('save_my_onboarding_draft', {
          p_membership_id: membershipId,
          p_question: question,
        })
        .single()
      if (error) throw new Error(`saveOnboardingDraft: ${error.message}`)
      return parseDraftRow(data)
    },

    async clearDraft(membershipId: string): Promise<'cleared' | 'not_available'> {
      const { data, error } = await client
        .schema('api')
        .rpc('clear_my_onboarding_draft', { p_membership_id: membershipId })
      if (error) throw new Error(`clearOnboardingDraft: ${error.message}`)
      return z.enum(['cleared', 'not_available']).parse(data)
    },

    async saveProgress(membershipId: string, step: number) {
      const { data, error } = await client.schema('api').rpc('save_my_onboarding_progress', {
        p_membership_id: membershipId,
        p_step: step,
      })
      if (error) throw new Error(`saveOnboardingProgress: ${error.message}`)
      return z.enum(['saved', 'not_available', 'invalid_input']).parse(data)
    },
  }
}
