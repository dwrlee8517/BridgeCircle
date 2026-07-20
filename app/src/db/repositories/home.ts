import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type { HomeNative, HomeRepository, SaveAskOutcomeShareResult } from '@/lib/home/contracts'

const timestamp = z.string().refine((value) => Number.isFinite(Date.parse(value)))
const unavailableSchema = z.object({ resultCode: z.literal('not_available') }).strict()
const recognitionSchema = z
  .object({
    membershipId: z.uuid(),
    userId: z.uuid(),
    displayName: z.string().min(1),
    preferredName: z.string().min(1).nullable(),
    avatarPath: z.string().nullable(),
    graduationYear: z.number().int().nullable(),
    title: z.string().min(1),
    employer: z.string().min(1),
    startedAt: timestamp,
  })
  .strict()
const outcomeSchema = z
  .object({
    askId: z.uuid(),
    outcomeNote: z.string().min(1).max(2_000),
    sharedAt: timestamp,
    identityMode: z.enum(['anonymous', 'identified']),
    askerName: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    helperName: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null),
  })
  .strict()
  .superRefine((value, context) => {
    const hasBothNames = Boolean(value.askerName && value.helperName)
    if (value.identityMode === 'identified' && !hasBothNames) {
      context.addIssue({
        code: 'custom',
        message: 'identified outcome requires both participant names',
      })
    }
    if (value.identityMode === 'anonymous' && (value.askerName || value.helperName)) {
      context.addIssue({
        code: 'custom',
        message: 'anonymous outcome must not include participant names',
      })
    }
  })
const homeNativeSchema = z
  .object({
    resultCode: z.literal('ok'),
    weeklyPulse: z
      .object({
        newMembers: z.number().int().nonnegative(),
        refreshedProfiles: z.number().int().nonnegative(),
      })
      .strict(),
    recognition: recognitionSchema.nullable(),
    outcomeStory: outcomeSchema.nullable(),
  })
  .strict()
const saveRowSchema = z
  .object({
    result_code: z.enum(['saved', 'invalid_input', 'not_available']),
    ask_id: z.uuid().nullable(),
    share_story: z.boolean(),
    share_identity: z.boolean(),
  })
  .strict()

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`Home ${operation} transport failed${code}`)
}

export function parseHomeNative(value: unknown): HomeNative | null {
  const parsed = z.union([unavailableSchema, homeNativeSchema]).parse(value)
  if (parsed.resultCode === 'not_available') return null
  return {
    weeklyPulse: parsed.weeklyPulse,
    recognition: parsed.recognition,
    outcomeStory: parsed.outcomeStory,
  }
}

export function parseSaveAskOutcomeShare(value: unknown): SaveAskOutcomeShareResult {
  const parsed = saveRowSchema.parse(value)
  if (parsed.result_code === 'saved') {
    if (!parsed.ask_id) throw new Error('Home outcome share contract violated: saved without Ask')
    return {
      status: 'saved',
      askId: parsed.ask_id,
      shareStory: parsed.share_story,
      shareIdentity: parsed.share_identity,
    }
  }
  if (parsed.share_story || parsed.share_identity) {
    throw new Error('Home outcome share contract violated: denial included consent')
  }
  return {
    status: parsed.result_code,
    askId: parsed.ask_id,
    shareStory: false,
    shareIdentity: false,
  }
}

export function createHomeRepository(client: SupabaseClient<Database>): HomeRepository {
  return {
    async getNative(membershipId) {
      const { data, error } = await client
        .schema('api')
        .rpc('get_home_native', { p_membership_id: membershipId })
      if (error) transportError('getNative', error)
      return parseHomeNative(data)
    },

    async saveAskOutcomeShare(input) {
      const { data, error } = await client
        .schema('api')
        .rpc('save_ask_outcome_share', {
          p_ask_id: input.askId,
          p_share_story: input.shareStory,
          p_share_identity: input.shareIdentity,
        })
        .single()
      if (error) transportError('saveAskOutcomeShare', error)
      return parseSaveAskOutcomeShare(data)
    },
  }
}
