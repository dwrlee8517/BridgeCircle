import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { ProviderName } from './types'

/**
 * Upsert profile_enrichment_settings for the given user. Writes the URL,
 * resolved username, and the provider that produced the most recent fetch.
 * Bumps last_enriched_at + last_profile_fingerprint atomically so the
 * monthly sweep skips users we just touched.
 */
export type SettingsUpsertInput = {
  userId: string
  linkedinUrl: string
  linkedinUsername: string | null
  primaryProviderName: ProviderName
  primaryProviderId: string
  fingerprintHash: string
}

export async function upsertEnrichmentSettings(
  admin: SupabaseClient<Database>,
  input: SettingsUpsertInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString()
  const { error } = await admin.from('profile_enrichment_settings').upsert(
    {
      user_id: input.userId,
      linkedin_url: input.linkedinUrl,
      linkedin_username: input.linkedinUsername,
      primary_provider_name: input.primaryProviderName,
      primary_provider_id: input.primaryProviderId,
      last_enriched_at: now,
      last_checked_at: now,
      last_profile_fingerprint: input.fingerprintHash,
      consecutive_sweep_misses: 0,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Standalone refresh-policy update. Used by the onboarding Step 5 freshness
 * consent. Creates a settings row if one doesn't exist yet (e.g. user
 * skipped the LinkedIn import but still sets a policy).
 */
export async function upsertRefreshPolicy(
  admin: SupabaseClient<Database>,
  userId: string,
  policy: 'manual_only' | 'review_before_update' | 'auto_apply_and_notify',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString()
  const { error } = await admin.from('profile_enrichment_settings').upsert(
    {
      user_id: userId,
      refresh_policy: policy,
      consented_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
