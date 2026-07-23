import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  MemberProfile,
  MemberProfileResult,
  PeopleDirectoryItem,
  PeopleDirectoryResult,
  PeopleRepository,
} from '@/lib/people/contracts'

const timestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)))
const nullableText = z.string().nullable()
const nullableInteger = z.number().int().nullable()
const evidenceKindSchema = z.enum([
  'directory',
  'current_role',
  'profile',
  'career_history',
  'education_history',
  'bio',
  'skills',
  'helper_topics',
  'career_path_summary',
  'help_topics_summary',
])
const evidenceSchema = z
  .object({
    kind: evidenceKindSchema,
    title: nullableText.optional().default(null),
    organization: nullableText.optional().default(null),
    sourceSection: nullableText.optional().default(null),
  })
  .strict()

const peopleRowSchema = z
  .object({
    target_membership_id: z.uuid(),
    target_user_id: z.uuid(),
    display_name: z.string().trim().min(1),
    preferred_name: nullableText,
    avatar_path: nullableText,
    headline: nullableText,
    current_employer: nullableText,
    current_title: nullableText,
    industry: nullableText,
    city: nullableText,
    graduation_year: nullableInteger,
    open_to_help: z.boolean(),
    helper_topics: z.array(z.string().trim().min(1)),
    relationship_state: z.enum(['none', 'pending_outgoing', 'pending_incoming', 'connected']),
    pending_request_id: z.uuid().nullable(),
    conversation_id: z.uuid().nullable(),
    match_evidence: z.array(evidenceSchema).max(4),
    total_count: z.number().int().nonnegative(),
    rank_score: z.number().finite(),
    profile_updated_at: timestampSchema,
  })
  .strict()

const periodSchema = {
  startYear: nullableInteger,
  startMonth: nullableInteger,
  endYear: nullableInteger,
  endMonth: nullableInteger,
}
const memberProfileSchema = z
  .object({
    membershipId: z.uuid(),
    userId: z.uuid(),
    identity: z
      .object({
        displayName: z.string().trim().min(1),
        preferredName: nullableText,
        avatarPath: nullableText,
        graduationYear: nullableInteger,
      })
      .strict(),
    current: z
      .object({
        headline: nullableText,
        employer: nullableText,
        title: nullableText,
        industry: nullableText,
        city: nullableText,
      })
      .strict(),
    about: nullableText,
    experiences: z.array(
      z
        .object({
          id: z.uuid(),
          employer: z.string().trim().min(1),
          title: z.string().trim().min(1),
          ...periodSchema,
          description: nullableText,
        })
        .strict(),
    ),
    education: z.array(
      z
        .object({
          id: z.uuid(),
          school: z.string().trim().min(1),
          degree: nullableText,
          field: nullableText,
          ...periodSchema,
          description: nullableText,
        })
        .strict(),
    ),
    skills: z.array(z.string().trim().min(1)),
    links: z.array(
      z
        .object({
          id: z.uuid(),
          kind: z.enum(['linkedin', 'portfolio', 'website', 'social', 'email', 'other']),
          label: nullableText,
          value: z.string().trim().min(1),
          audience: z.enum(['organization', 'connections', 'self']),
        })
        .strict(),
    ),
    help: z.object({ openToHelp: z.boolean(), topics: z.array(z.string().trim().min(1)) }).strict(),
    relationship: z
      .object({
        state: z.enum(['self', 'none', 'pending_outgoing', 'pending_incoming', 'connected']),
        requestId: z.uuid().nullable(),
        conversationId: z.uuid().nullable(),
      })
      .strict(),
    sharedContext: z.array(
      z.object({ kind: z.enum(['same_city', 'same_school']), value: z.string().min(1) }).strict(),
    ),
    updatedAt: timestampSchema,
  })
  .strict()

const memberProfileRowSchema = z
  .object({
    result_code: z.enum(['ok', 'not_available']),
    profile: z.unknown().nullable(),
  })
  .strict()

function contractError(operation: string, detail: string): never {
  throw new Error(`People ${operation} contract violated: ${detail}`)
}

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`People ${operation} transport failed${code}`)
}

function relationship(row: z.infer<typeof peopleRowSchema>): PeopleDirectoryItem['relationship'] {
  if (row.relationship_state === 'connected') {
    if (!row.conversation_id || row.pending_request_id) {
      return contractError('directory', 'connected row has inconsistent durable IDs')
    }
    return { state: 'connected', requestId: null, conversationId: row.conversation_id }
  }
  if (
    row.relationship_state === 'pending_incoming' ||
    row.relationship_state === 'pending_outgoing'
  ) {
    if (!row.pending_request_id || row.conversation_id) {
      return contractError('directory', 'pending row has inconsistent durable IDs')
    }
    return {
      state: row.relationship_state,
      requestId: row.pending_request_id,
      conversationId: null,
    }
  }
  if (row.pending_request_id || row.conversation_id) {
    return contractError('directory', 'unconnected row included durable relationship IDs')
  }
  return { state: 'none', requestId: null, conversationId: null }
}

export function parsePeopleRow(value: unknown): PeopleDirectoryItem & { totalCount: number } {
  const row = peopleRowSchema.parse(value)
  return {
    membershipId: row.target_membership_id,
    userId: row.target_user_id,
    displayName: row.display_name,
    preferredName: row.preferred_name,
    avatarPath: row.avatar_path,
    headline: row.headline,
    currentEmployer: row.current_employer,
    currentTitle: row.current_title,
    industry: row.industry,
    city: row.city,
    graduationYear: row.graduation_year,
    openToHelp: row.open_to_help,
    helperTopics: row.helper_topics,
    relationship: relationship(row),
    matchEvidence: row.match_evidence,
    rankScore: row.rank_score,
    profileUpdatedAt: row.profile_updated_at,
    totalCount: row.total_count,
  }
}

function validateMemberProfileRelationship(profile: MemberProfile): MemberProfile {
  const { state, requestId, conversationId } = profile.relationship
  if (state === 'connected') {
    if (!conversationId || requestId) {
      return contractError('profile', 'connected profile has inconsistent durable IDs')
    }
  } else if (state === 'pending_incoming' || state === 'pending_outgoing') {
    if (!requestId || conversationId) {
      return contractError('profile', 'pending profile has inconsistent durable IDs')
    }
  } else if (requestId || conversationId) {
    return contractError('profile', 'unconnected profile included durable relationship IDs')
  }
  return profile
}

export function parseMemberProfileRow(value: unknown): MemberProfileResult {
  const row = memberProfileRowSchema.parse(value)
  if (row.result_code === 'not_available') {
    if (row.profile) return contractError('profile', 'unavailable result included a profile')
    return { ok: false, error: 'not_available' }
  }
  if (!row.profile) return contractError('profile', 'ok result omitted a profile')
  const profile = memberProfileSchema.parse(row.profile) as MemberProfile
  return { ok: true, profile: validateMemberProfileRelationship(profile) }
}

export function createPeopleRepository(memberClient: SupabaseClient<Database>): PeopleRepository {
  return {
    async list(input): Promise<PeopleDirectoryResult> {
      const { data, error } = await memberClient.schema('api').rpc('list_people', {
        p_membership_id: input.membershipId,
        p_query: input.query ?? undefined,
        p_scope: input.scope,
        p_industry: input.filters.industry ?? undefined,
        p_class_year_start: input.filters.classYearStart ?? undefined,
        p_class_year_end: input.filters.classYearEnd ?? undefined,
        p_location: input.filters.location ?? undefined,
        p_employer: input.filters.employer ?? undefined,
        p_education: input.filters.education ?? undefined,
        p_topic: input.filters.topic ?? undefined,
        p_query_embedding: input.queryEmbedding ?? undefined,
        p_limit: input.limit,
      })
      if (error) transportError('list', error)
      const parsed = z.array(z.unknown()).parse(data).map(parsePeopleRow)
      const totals = new Set(parsed.map((item) => item.totalCount))
      if (totals.size > 1) return contractError('directory', 'rows disagree on total count')
      const totalCount = parsed.at(0)?.totalCount ?? 0
      const items = parsed.map(({ totalCount: _totalCount, ...item }) => item)
      return {
        items,
        totalCount,
        capped: totalCount > items.length && items.length === input.limit,
      }
    },

    async getMemberProfile(membershipId, userId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('get_member_profile', {
          p_membership_id: membershipId,
          p_target_user_id: userId,
        })
        .single()
      if (error) transportError('getMemberProfile', error)
      return parseMemberProfileRow(data)
    },
  }
}
