import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import DataLoader from 'dataloader'
import type { Database } from '@/db/database.types'
import { loadMembersByIds, type MemberRecord } from '@/lib/members/loadMembersByIds'

/**
 * Per-request DataLoaders. Created fresh in `buildContext` so batching and the
 * implicit per-key cache never leak across requests — or across users, which
 * matters under RLS. Each loader delegates to a `/lib` data-access function
 * with the user-scoped client injected.
 */
export function createLoaders(supabase: SupabaseClient<Database>) {
  return {
    memberById: new DataLoader<string, MemberRecord | null>(async (ids) => {
      const byId = await loadMembersByIds(supabase, ids)
      return ids.map((id) => byId.get(id) ?? null)
    }),
  }
}

export type Loaders = ReturnType<typeof createLoaders>
