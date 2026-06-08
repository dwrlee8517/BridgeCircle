import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import {
  buildProfileEmbeddingChunks,
  type ProfileEmbeddingChunk,
  type ProfileForChunking,
  type SemanticPassageGenerator,
} from './chunks'
import { generateSemanticProfilePassages } from './semanticPassages'
import { vectorLiteral } from './vectorRetrieval'
import { VoyageClient } from './voyage'

export type IndexProfileForAskMatchingInput = {
  organizationId: string
  userId: string
  organizationMembershipId?: string
  reason: string
  dryRun?: boolean
}

export type IndexProfileForAskMatchingOptions = {
  admin?: SupabaseClient<Database>
  voyage?: VoyageClient
  semanticPassageGenerator?: SemanticPassageGenerator
}

export type IndexProfileResult =
  | {
      ok: true
      organizationId: string
      userId: string
      organizationMembershipId: string
      dryRun: boolean
      chunksTotal: number
      rawChunks: number
      syntheticChunks: number
      reusedChunks: number
      embeddedChunks: number
      deletedChunks: number
      warnings: string[]
    }
  | {
      ok: false
      organizationId: string
      userId: string
      organizationMembershipId?: string
      error: 'no_active_membership' | 'profile_missing' | 'db_error' | 'embedding_failed'
      detail?: string
      warnings: string[]
    }

type ExistingChunkRow = Pick<
  Database['public']['Tables']['profile_embedding_chunks']['Row'],
  | 'id'
  | 'chunk_kind'
  | 'source_section'
  | 'visibility_tier'
  | 'content_hash'
  | 'synthetic_prompt_version'
  | 'embedding_model'
  | 'embedding_dim'
>

const EMBEDDING_BATCH_SIZE = 32

export async function indexProfileForAskMatching(
  input: IndexProfileForAskMatchingInput,
  options: IndexProfileForAskMatchingOptions = {},
): Promise<IndexProfileResult> {
  const admin = options.admin ?? createAdminClient()
  const voyage = options.voyage ?? new VoyageClient()
  const warnings: string[] = []

  const profileResult = await loadProfileForAskIndexing(admin, input)
  if (!profileResult.ok) {
    return { ...profileResult, warnings }
  }

  const profile = profileResult.profile
  const chunks = input.dryRun
    ? await buildProfileEmbeddingChunks(profile)
    : await buildProfileEmbeddingChunks(profile, async (semanticInput) => {
        if (options.semanticPassageGenerator) {
          return options.semanticPassageGenerator(semanticInput)
        }
        const result = await generateSemanticProfilePassages(semanticInput)
        if (!result.ok) {
          warnings.push(`semantic_passage_failed:${result.error}`)
          return []
        }
        return result.passages
      })

  const existing = await loadExistingChunks(admin, profile)
  if (!existing.ok) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: profile.organizationMembershipId,
      error: 'db_error',
      detail: existing.detail,
      warnings,
    }
  }

  const plan = planEmbeddingChunkChanges(chunks, existing.rows)

  if (input.dryRun) {
    return successResult(profile, chunks, {
      dryRun: true,
      reusedChunks: plan.reusedChunks,
      embeddedChunks: plan.chunksToEmbed.length,
      deletedChunks: plan.staleIds.length,
      warnings: [...warnings, ...plan.warnings],
    })
  }

  const embeddings = await embedChunks(voyage, plan.chunksToEmbed)
  if (!embeddings.ok) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: profile.organizationMembershipId,
      error: 'embedding_failed',
      detail: embeddings.detail,
      warnings: [...warnings, ...plan.warnings],
    }
  }

  const inserted = await insertNewChunks(admin, plan.chunksToEmbed, embeddings.values)
  if (!inserted.ok) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: profile.organizationMembershipId,
      error: 'db_error',
      detail: inserted.detail,
      warnings: [...warnings, ...plan.warnings],
    }
  }

  const deleted = await deleteStaleChunks(admin, plan.staleIds)
  if (!deleted.ok) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: profile.organizationMembershipId,
      error: 'db_error',
      detail: deleted.detail,
      warnings: [...warnings, ...plan.warnings],
    }
  }

  return successResult(profile, chunks, {
    dryRun: false,
    reusedChunks: plan.reusedChunks,
    embeddedChunks: plan.chunksToEmbed.length,
    deletedChunks: plan.staleIds.length,
    warnings: [...warnings, ...plan.warnings],
  })
}

export function planEmbeddingChunkChanges(
  desiredChunks: ProfileEmbeddingChunk[],
  existingRows: ExistingChunkRow[],
) {
  const exactExisting = new Set(existingRows.map(existingExactKey))
  const storageExisting = new Set(existingRows.map(existingStorageKey))
  const desiredStorage = new Set(desiredChunks.map(chunkStorageKey))
  const chunksToEmbed: ProfileEmbeddingChunk[] = []
  const warnings: string[] = []
  let reusedChunks = 0

  for (const chunk of desiredChunks) {
    const exactKey = chunkExactKey(chunk)
    const storageKey = chunkStorageKey(chunk)
    if (exactExisting.has(exactKey)) {
      reusedChunks += 1
      continue
    }
    if (storageExisting.has(storageKey)) {
      // The current DB uniqueness contract does not include prompt version, so
      // keep the existing embedding when content/model/dimension already match.
      reusedChunks += 1
      warnings.push(`prompt_version_metadata_mismatch:${chunk.sourceSection}`)
      continue
    }
    chunksToEmbed.push(chunk)
  }

  const staleIds = existingRows
    .filter((row) => !desiredStorage.has(existingStorageKey(row)))
    .map((row) => row.id)

  return {
    chunksToEmbed,
    staleIds,
    reusedChunks,
    warnings,
  }
}

export async function loadActiveIndexableMemberships(
  admin: SupabaseClient<Database>,
  input: { organizationId?: string; userId?: string; limit?: number } = {},
) {
  let query = admin
    .from('organization_memberships')
    .select('id, user_id, organization_id')
    .eq('status', 'active')
    .limit(Math.max(1, Math.min(input.limit ?? 5000, 5000)))

  if (input.organizationId) query = query.eq('organization_id', input.organizationId)
  if (input.userId) query = query.eq('user_id', input.userId)

  const { data, error } = await query
  if (error) throw new Error(`active memberships: ${error.message}`)
  return data ?? []
}

async function loadProfileForAskIndexing(
  admin: SupabaseClient<Database>,
  input: IndexProfileForAskMatchingInput,
): Promise<
  | { ok: true; profile: ProfileForChunking }
  | {
      ok: false
      organizationId: string
      userId: string
      organizationMembershipId?: string
      error: 'no_active_membership' | 'profile_missing' | 'db_error'
      detail?: string
    }
> {
  let membershipQuery = admin
    .from('organization_memberships')
    .select('id, user_id, organization_id')
    .eq('organization_id', input.organizationId)
    .eq('user_id', input.userId)
    .eq('status', 'active')
    .limit(1)

  if (input.organizationMembershipId) {
    membershipQuery = membershipQuery.eq('id', input.organizationMembershipId)
  }

  const { data: membership, error: membershipError } = await membershipQuery.maybeSingle()
  if (membershipError) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: input.organizationMembershipId,
      error: 'db_error',
      detail: membershipError.message,
    }
  }
  if (!membership) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: input.organizationMembershipId,
      error: 'no_active_membership',
    }
  }

  const [{ data: base, error: baseError }, { data: orgProfile, error: orgError }] =
    await Promise.all([
      admin
        .from('base_profiles')
        .select(
          'user_id, name, preferred_name, headline, current_employer, current_title, city, university, major, career_history, education_history, skills, privacy_settings',
        )
        .eq('user_id', input.userId)
        .maybeSingle(),
      admin
        .from('organization_profiles')
        .select('organization_membership_id, graduation_year, bio, mentoring_topics')
        .eq('organization_membership_id', membership.id)
        .maybeSingle(),
    ])

  if (baseError) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: membership.id,
      error: 'db_error',
      detail: baseError.message,
    }
  }
  if (orgError) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: membership.id,
      error: 'db_error',
      detail: orgError.message,
    }
  }
  if (!base?.name) {
    return {
      ok: false,
      organizationId: input.organizationId,
      userId: input.userId,
      organizationMembershipId: membership.id,
      error: 'profile_missing',
    }
  }

  return {
    ok: true,
    profile: {
      userId: membership.user_id,
      organizationId: membership.organization_id,
      organizationMembershipId: membership.id,
      name: base.name,
      preferredName: base.preferred_name,
      headline: base.headline,
      currentEmployer: base.current_employer,
      currentTitle: base.current_title,
      city: base.city,
      university: base.university,
      major: base.major,
      graduationYear: orgProfile?.graduation_year ?? null,
      bio: orgProfile?.bio ?? null,
      mentoringTopics: orgProfile?.mentoring_topics ?? null,
      careerHistory: (base.career_history as ProfileForChunking['careerHistory']) ?? null,
      educationHistory: (base.education_history as ProfileForChunking['educationHistory']) ?? null,
      skills: base.skills ?? null,
      privacySettings: base.privacy_settings,
    },
  }
}

async function loadExistingChunks(admin: SupabaseClient<Database>, profile: ProfileForChunking) {
  const { data, error } = await admin
    .from('profile_embedding_chunks')
    .select(
      'id, chunk_kind, source_section, visibility_tier, content_hash, synthetic_prompt_version, embedding_model, embedding_dim',
    )
    .eq('organization_id', profile.organizationId)
    .eq('user_id', profile.userId)

  if (error) return { ok: false as const, detail: error.message }
  return { ok: true as const, rows: data ?? [] }
}

async function embedChunks(voyage: VoyageClient, chunks: ProfileEmbeddingChunk[]) {
  const values: number[][] = []
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE)
    const result = await voyage.embed(
      batch.map((chunk) => chunk.content),
      'document',
    )
    if (!result.ok) {
      return {
        ok: false as const,
        detail: `${result.error}${result.detail ? ` ${result.detail}` : ''}`,
      }
    }
    values.push(...result.value)
  }
  return { ok: true as const, values }
}

async function insertNewChunks(
  admin: SupabaseClient<Database>,
  chunks: ProfileEmbeddingChunk[],
  embeddings: number[][],
) {
  if (chunks.length === 0) return { ok: true as const }

  const rows = chunks.map((chunk, index) => ({
    organization_id: chunk.organizationId,
    user_id: chunk.userId,
    organization_membership_id: chunk.organizationMembershipId,
    chunk_kind: chunk.chunkKind,
    source_section: chunk.sourceSection,
    visibility_tier: chunk.visibilityTier,
    content: chunk.content,
    content_hash: chunk.contentHash,
    synthetic_prompt_version: chunk.syntheticPromptVersion,
    embedding_model: chunk.embeddingModel,
    embedding_dim: chunk.embeddingDim,
    embedding: vectorLiteral(embeddings[index]),
  }))

  const { error } = await admin.from('profile_embedding_chunks').insert(rows)
  if (error) return { ok: false as const, detail: error.message }
  return { ok: true as const }
}

async function deleteStaleChunks(admin: SupabaseClient<Database>, staleIds: string[]) {
  if (staleIds.length === 0) return { ok: true as const }
  const { error } = await admin.from('profile_embedding_chunks').delete().in('id', staleIds)
  if (error) return { ok: false as const, detail: error.message }
  return { ok: true as const }
}

function successResult(
  profile: ProfileForChunking,
  chunks: ProfileEmbeddingChunk[],
  metrics: {
    dryRun: boolean
    reusedChunks: number
    embeddedChunks: number
    deletedChunks: number
    warnings: string[]
  },
): IndexProfileResult {
  return {
    ok: true,
    organizationId: profile.organizationId,
    userId: profile.userId,
    organizationMembershipId: profile.organizationMembershipId,
    dryRun: metrics.dryRun,
    chunksTotal: chunks.length,
    rawChunks: chunks.filter((chunk) => chunk.chunkKind === 'raw').length,
    syntheticChunks: chunks.filter((chunk) => chunk.chunkKind === 'synthetic').length,
    reusedChunks: metrics.reusedChunks,
    embeddedChunks: metrics.embeddedChunks,
    deletedChunks: metrics.deletedChunks,
    warnings: metrics.warnings,
  }
}

function existingExactKey(row: ExistingChunkRow) {
  return [existingStorageKey(row), row.synthetic_prompt_version ?? ''].join(':')
}

function existingStorageKey(row: ExistingChunkRow) {
  return [
    row.chunk_kind,
    row.source_section,
    row.visibility_tier,
    row.content_hash,
    row.embedding_model,
    row.embedding_dim,
  ].join(':')
}

function chunkExactKey(chunk: ProfileEmbeddingChunk) {
  return [chunkStorageKey(chunk), chunk.syntheticPromptVersion ?? ''].join(':')
}

function chunkStorageKey(chunk: ProfileEmbeddingChunk) {
  return [
    chunk.chunkKind,
    chunk.sourceSection,
    chunk.visibilityTier,
    chunk.contentHash,
    chunk.embeddingModel,
    chunk.embeddingDim,
  ].join(':')
}
