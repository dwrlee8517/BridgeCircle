import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database, Json } from '@/db/database.types'
import type {
  CompleteOnboardingResult,
  ProfileCommandResult,
  ProfileReadResult,
  ProfileRepository,
  SelfProfile,
} from '@/lib/profile/contracts'

const nullableText = z.string().nullable()
const nullableInteger = z.number().int().nullable()
const periodSchema = {
  startYear: nullableInteger,
  startMonth: nullableInteger,
  endYear: nullableInteger,
  endMonth: nullableInteger,
}

const selfProfileSchema = z.object({
  membership: z.object({
    id: z.guid(),
    status: z.enum(['active', 'pending', 'rejected', 'revoked']),
    organization: z.object({ id: z.guid(), name: z.string(), slug: z.string() }),
  }),
  identity: z.object({
    displayName: nullableText,
    preferredName: nullableText,
    nameOther: nullableText,
    graduationYear: nullableInteger,
    avatarPath: nullableText,
  }),
  current: z.object({
    headline: nullableText,
    employer: nullableText,
    title: nullableText,
    city: nullableText,
    university: nullableText,
    major: nullableText,
    linkedinUrl: nullableText,
  }),
  education: z.array(
    z.object({
      id: z.guid(),
      school: z.string(),
      degree: nullableText,
      field: nullableText,
      ...periodSchema,
      description: nullableText,
    }),
  ),
  experiences: z.array(
    z.object({
      id: z.guid(),
      employer: z.string(),
      title: z.string(),
      ...periodSchema,
      description: nullableText,
    }),
  ),
  skills: z.array(z.object({ name: z.string() })),
  visibility: z.record(z.string(), z.enum(['organization', 'connections', 'self'])),
  preferences: z.object({
    bio: nullableText,
    openToHelp: z.boolean(),
    helperTopics: z.array(z.object({ name: z.string() })),
    freshness: z.object({
      linkedinUrl: nullableText,
      refreshPolicy: z.enum(['manual_only', 'review_before_update', 'auto_apply_and_notify']),
      refreshInterval: z.enum(['monthly', 'quarterly']),
      consentedAt: nullableText,
    }),
  }),
})

const commandResultSchema = z.enum([
  'saved',
  'not_owned',
  'membership_unavailable',
  'profile_required',
  'invalid_identity',
  'invalid_education',
  'invalid_current',
  'invalid_history',
  'invalid_preferences',
  'invalid_avatar_path',
])

const profileRowSchema = z.object({
  result_code: z.enum(['ok', 'not_found']),
  profile: z.unknown().nullable(),
})

const completeRowSchema = z.object({
  result_code: z.enum([
    'completed',
    'not_owned',
    'membership_unavailable',
    'account_unavailable',
    'incomplete_profile',
  ]),
  completed_at: z.string().nullable(),
})

export function parseSelfProfile(value: unknown): SelfProfile {
  return selfProfileSchema.parse(value)
}

export function parseProfileRow(value: unknown): ProfileReadResult {
  const row = profileRowSchema.parse(value)
  if (row.result_code === 'not_found') return { ok: false, error: 'not_found' }
  if (!row.profile) throw new Error('getMyProfile: ok result omitted profile')
  return { ok: true, profile: parseSelfProfile(row.profile) }
}

export function createProfileRepository(client: SupabaseClient<Database>): ProfileRepository {
  function commandResult(
    data: unknown,
    error: { message: string } | null,
    name: string,
  ): ProfileCommandResult {
    if (error) throw new Error(`${name}: ${error.message}`)
    return commandResultSchema.parse(data)
  }

  return {
    async get(membershipId) {
      const { data, error } = await client
        .schema('api')
        .rpc('get_my_profile', { p_membership_id: membershipId })
        .single()
      if (error) throw new Error(`getMyProfile: ${error.message}`)
      return parseProfileRow(data)
    },

    async saveIdentity(membershipId, input) {
      const { data, error } = await client.schema('api').rpc('save_profile_identity', {
        p_membership_id: membershipId,
        p_display_name: input.displayName,
        p_preferred_name: input.preferredName ?? '',
        p_name_other: input.nameOther ?? '',
        p_graduation_year: input.graduationYear,
      })
      return commandResult(data, error, 'saveProfileIdentity')
    },

    async saveEducation(membershipId, input) {
      const education: Json = input.education.map((entry) => ({ ...entry }))
      const { data, error } = await client.schema('api').rpc('save_profile_education', {
        p_membership_id: membershipId,
        p_university: input.university ?? '',
        p_major: input.major ?? '',
        p_education: education,
      })
      return commandResult(data, error, 'saveProfileEducation')
    },

    async saveCurrent(membershipId, input) {
      const { data, error } = await client.schema('api').rpc('save_profile_current', {
        p_membership_id: membershipId,
        p_current_employer: input.currentEmployer ?? '',
        p_current_title: input.currentTitle ?? '',
        p_city: input.city ?? '',
        p_headline: input.headline ?? '',
        p_linkedin_url: input.linkedinUrl ?? '',
      })
      return commandResult(data, error, 'saveProfileCurrent')
    },

    async saveHistory(membershipId, input) {
      const experiences: Json = input.experiences.map((entry) => ({ ...entry }))
      const { data, error } = await client.schema('api').rpc('save_profile_history', {
        p_membership_id: membershipId,
        p_experiences: experiences,
        p_skills: input.skills,
      })
      return commandResult(data, error, 'saveProfileHistory')
    },

    async savePreferences(membershipId, input) {
      const { data, error } = await client.schema('api').rpc('save_profile_preferences', {
        p_membership_id: membershipId,
        p_bio: input.bio ?? '',
        p_open_to_help: input.openToHelp,
        p_topics: input.topics,
        p_linkedin_url: input.linkedinUrl ?? '',
        p_refresh_policy: input.refreshPolicy,
        p_refresh_interval: input.refreshInterval,
        p_freshness_consent: input.freshnessConsent,
      })
      return commandResult(data, error, 'saveProfilePreferences')
    },

    async setAvatarPath(membershipId, avatarPath) {
      const { data, error } = await client.schema('api').rpc('set_my_avatar_path', {
        p_membership_id: membershipId,
        p_avatar_path: avatarPath ?? '',
      })
      return commandResult(data, error, 'setMyAvatarPath')
    },

    async completeOnboarding(membershipId): Promise<CompleteOnboardingResult> {
      const { data, error } = await client
        .schema('api')
        .rpc('complete_onboarding', { p_membership_id: membershipId })
        .single()
      if (error) throw new Error(`completeOnboarding: ${error.message}`)
      const row = completeRowSchema.parse(data)
      if (row.result_code === 'completed' && row.completed_at) {
        return { ok: true, completedAt: row.completed_at }
      }
      if (row.result_code === 'completed') {
        throw new Error('completeOnboarding: completed result omitted timestamp')
      }
      return { ok: false, error: row.result_code }
    },
  }
}
