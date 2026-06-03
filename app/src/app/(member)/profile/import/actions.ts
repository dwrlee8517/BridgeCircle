'use server'

import * as Sentry from '@sentry/nextjs'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { fetchForOnboarding } from '@/lib/enrichment/onboardingFetch'
import { upsertEnrichmentSettings } from '@/lib/enrichment/persistSettings'
import { applyExtractedToProfile } from '@/lib/resume/applyToProfile'
import { extractFromResume } from '@/lib/resume/extract'
import {
  type ApplyExtractedInput,
  applyExtractedSchema,
  type ExtractedProfile,
} from '@/lib/resume/schemas'
import { storeResumeUpload } from '@/lib/resume/storeUpload'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
])

export type ExtractState = {
  profile?: ExtractedProfile
  error?: string
}

export async function extractFromUploadAction(
  _prev: ExtractState,
  formData: FormData,
): Promise<ExtractState> {
  const session = await requireSession()
  const file = formData.get('file')

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'No file uploaded.' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'File is too large (5MB max).' }
  }
  if (!ACCEPTED_MIME.has(file.type)) {
    return { error: 'Upload a PDF, DOCX, or PNG file.' }
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  // Best-effort: persist to Storage so the user can re-extract later. If
  // upload fails we still try the extraction — the file isn't required for
  // anything downstream.
  const supabase = await createClient()
  await storeResumeUpload(supabase, session.userId, file.name, bytes, file.type).catch((err) => {
    Sentry.captureException(err, {
      extra: { scope: 'resume-upload-store', userId: session.userId, fileName: file.name },
    })
    return null
  })

  const mimeType = file.type as
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'image/png'
  const result = await extractFromResume({ mimeType, bytes })

  if (!result.ok) {
    return { error: extractErrorMessage(result.error) }
  }

  // Audit log via admin client (writing here keeps RLS simple).
  try {
    const admin = createAdminClient()
    await admin.from('audit_log').insert({
      actor_id: session.userId,
      action: 'resume.extracted',
      target_type: 'user',
      target_id: session.userId,
    })
  } catch {
    // Audit failures shouldn't block the user.
  }

  return { profile: result.profile }
}

/**
 * LinkedIn URL → ExtractedProfile via lib/enrichment.
 *
 * Walks the configured primary (LinkdAPI by default) then falls back to PDL,
 * persisting one profile_enrichment_runs row per attempt. On success, also
 * upserts profile_enrichment_settings so the monthly sweep has somewhere to
 * track this user from. Returns the same ExtractState shape as the resume
 * upload action so the confirm UI doesn't have to branch on source.
 */
export async function extractFromLinkedInAction(
  _prev: ExtractState,
  formData: FormData,
): Promise<ExtractState> {
  const session = await requireSession()
  const raw = formData.get('linkedinUrl')

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { error: 'Paste your LinkedIn URL.' }
  }

  const url = raw.trim()
  if (!/linkedin\.com\/in\//i.test(url) && !/^[a-z0-9-]+$/i.test(url)) {
    return { error: "That doesn't look like a LinkedIn profile URL." }
  }

  // Pull identity fields so PDL fallback can keep trying when URL lookup
  // misses — useful for alumni with sparse LinkedIn presence.
  const supabase = await createClient()
  const { data: base } = await supabase
    .from('base_profiles')
    .select('name')
    .eq('user_id', session.userId)
    .maybeSingle()
  const email = session.email ?? null

  const result = await fetchForOnboarding({
    userId: session.userId,
    url,
    identity:
      base?.name && email
        ? { name: base.name, email, gradYear: new Date().getFullYear() }
        : undefined,
  })

  if (!result.ok) {
    Sentry.captureMessage('linkedin_enrichment_failed', {
      level: 'info',
      extra: { userId: session.userId, attempts: result.attempts },
    })
    return { error: linkedinErrorMessage(result.attempts) }
  }

  // Side-effect 1: write the URL onto base_profiles so subsequent onboarding
  // steps can render it as the default. Use the user client — RLS allows it.
  await supabase
    .from('base_profiles')
    .update({ linkedin_url: url, updated_at: new Date().toISOString() })
    .eq('user_id', session.userId)

  // Side-effect 2: upsert profile_enrichment_settings (service-role write —
  // only admin client can insert here since users can read but not write
  // their own row). Sweep targeting reads from this table.
  const admin = createAdminClient()
  const settingsResult = await upsertEnrichmentSettings(admin, {
    userId: session.userId,
    linkedinUrl: url,
    linkedinUsername: result.linkedinUsername,
    primaryProviderName: result.provider,
    primaryProviderId: result.providerRecordId,
    fingerprintHash: result.fingerprintHash,
  })
  if (!settingsResult.ok) {
    // Don't block the user on a settings write — the proposal can still go
    // through; we just log and move on.
    Sentry.captureMessage('enrichment_settings_upsert_failed', {
      level: 'warning',
      extra: { userId: session.userId, error: settingsResult.error },
    })
  }

  return { profile: result.profile }
}

function linkedinErrorMessage(attempts: Array<{ provider: string; error: string }>): string {
  const lastErr = attempts[attempts.length - 1]?.error ?? ''
  if (attempts.every((a) => a.error.includes('not_found'))) {
    return "We couldn't find that LinkedIn profile. Double-check the URL is correct, or skip and fill manually."
  }
  if (lastErr.includes('rate_limited')) {
    return 'LinkedIn lookup is temporarily busy. Try again in a minute, or skip and fill manually.'
  }
  if (lastErr.includes('no_api_key')) {
    return 'LinkedIn import is not configured. Ask the admin.'
  }
  return "We couldn't import from that LinkedIn URL. Try again, or fill the fields manually."
}

export type ApplyState = {
  error?: string
}

export async function applyExtractedAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const session = await requireSession()
  const raw = formData.get('selections')
  const ret = formData.get('return')
  const returnTo = typeof ret === 'string' && ret.startsWith('/') ? ret : null

  if (typeof raw !== 'string' || raw.length === 0) {
    return { error: 'Nothing to apply.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Could not read your selections.' }
  }

  const validated = applyExtractedSchema.safeParse(parsed)
  if (!validated.success) {
    return { error: 'Selections were not valid.' }
  }

  const supabase = await createClient()
  const result = await applyExtractedToProfile(
    supabase,
    session.userId,
    validated.data as ApplyExtractedInput,
  )

  if (!result.ok) {
    return { error: 'Could not apply changes. Try again.' }
  }

  redirect(returnTo ?? `/profile/${session.userId}`)
}

function extractErrorMessage(err: string): string {
  switch (err) {
    case 'no_api_key':
      return 'Resume import is not configured (missing API key). Ask the admin.'
    case 'docx_parse_failed':
      return 'Could not read that DOCX file — try saving it as PDF and re-uploading.'
    case 'llm_call_failed':
      return 'The extraction service is temporarily unavailable. Try again in a minute.'
    case 'invalid_response':
      return "We couldn't read that resume cleanly. Try a different file or format."
    default:
      return 'Extraction failed. Try again.'
  }
}
