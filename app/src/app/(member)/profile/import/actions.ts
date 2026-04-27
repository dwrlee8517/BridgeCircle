'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
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
    return { error: 'Upload a PDF or DOCX file.' }
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  // Best-effort: persist to Storage so the user can re-extract later. If
  // upload fails we still try the extraction — the file isn't required for
  // anything downstream.
  const supabase = await createClient()
  await storeResumeUpload(supabase, session.userId, file.name, bytes, file.type).catch(() => null)

  const mimeType = file.type as
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
      return "We couldn't read the resume cleanly. Try a different file."
    default:
      return 'Extraction failed. Try again.'
  }
}
