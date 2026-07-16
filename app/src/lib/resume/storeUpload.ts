import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

const BUCKET = 'resumes'

export type StoreUploadResult =
  | { ok: true; storagePath: string }
  | { ok: false; error: 'upload_failed'; detail?: string }

/**
 * Upload to one stable onboarding path. A retry replaces the prior private
 * source file instead of leaving abandoned timestamped objects behind.
 * Bucket policies (see migration) limit users to their own folder; the
 * folder path here matches that constraint.
 */
export async function storeResumeUpload(
  supabase: SupabaseClient<Database>,
  userId: string,
  _fileName: string,
  bytes: Buffer,
  contentType: string,
): Promise<StoreUploadResult> {
  const extension = contentType === 'application/pdf' ? 'pdf' : 'docx'
  const path = `${userId}/imports/onboarding-resume.${extension}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true })

  if (error) {
    return { ok: false, error: 'upload_failed', detail: error.message }
  }
  return { ok: true, storagePath: path }
}
