import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { markProfileEmbeddingDirty } from '@/lib/search/matching/indexStatus'
import {
  PRIVACY_DEFAULTS,
  PRIVACY_SECTIONS,
  type PrivacySettings,
  type PrivacySettingsInput,
} from './privacy'

export type SavePrivacyResult = { ok: true } | { ok: false; error: 'db_error'; detail?: string }

/**
 * Persist a member's privacy settings to base_profiles.privacy_settings.
 *
 * Stores only sections that differ from defaults — keeps the JSONB lean
 * and means changing the defaults later only affects users who haven't
 * explicitly opted out. The form passes every section explicitly, so we
 * don't have to merge with previous state.
 */
export async function savePrivacySettings(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: PrivacySettingsInput,
): Promise<SavePrivacyResult> {
  const minimal: PrivacySettings = {}
  for (const section of PRIVACY_SECTIONS) {
    const tier = input[section]
    if (tier && tier !== PRIVACY_DEFAULTS[section]) {
      minimal[section] = tier
    }
  }

  const { error } = await supabase
    .from('base_profiles')
    .update({ privacy_settings: minimal })
    .eq('user_id', userId)

  if (error) return { ok: false, error: 'db_error', detail: error.message }

  await markProfileEmbeddingDirty({
    userId,
    reason: 'privacy_settings',
  })

  return { ok: true }
}
