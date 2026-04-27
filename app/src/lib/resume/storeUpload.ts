import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

const BUCKET = 'resumes'
const SAFE_FILENAME = /[^a-zA-Z0-9._-]+/g

export type StoreUploadResult =
  | { ok: true; storagePath: string }
  | { ok: false; error: 'upload_failed'; detail?: string }

/**
 * Upload bytes to resumes/<userId>/<timestamp>-<safeName>.{ext}.
 * Bucket policies (see migration) limit users to their own folder; the
 * folder path here matches that constraint.
 */
export async function storeResumeUpload(
  supabase: SupabaseClient<Database>,
  userId: string,
  fileName: string,
  bytes: Buffer,
  contentType: string,
): Promise<StoreUploadResult> {
  const safeName = fileName.replace(SAFE_FILENAME, '_').slice(0, 80) || 'resume'
  const path = `${userId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false })

  if (error) {
    return { ok: false, error: 'upload_failed', detail: error.message }
  }
  return { ok: true, storagePath: path }
}
