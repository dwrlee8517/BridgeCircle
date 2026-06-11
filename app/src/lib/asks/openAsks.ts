import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * Standing asks — member-side operations. A member can leave one ask open
 * per org when live matching found no strong fit; the background sweep
 * (openAskSweep.ts) re-matches as the pool changes. The short TTL plus
 * explicit member action is the staleness defense: asks close on their own,
 * and helper goodwill is never spent on a resolved situation.
 */

export const OPEN_ASK_TTL_DAYS = 14
export const OPEN_ASK_MIN_LENGTH = 10
export const OPEN_ASK_MAX_LENGTH = 400

export type OpenAsk = {
  id: string
  question: string
  createdAt: string
  expiresAt: string
}

export type CreateOpenAskResult =
  | { ok: true; openAsk: OpenAsk }
  | { ok: false; error: 'invalid_question' | 'already_open' | 'insert_failed' }

export async function createOpenAsk(
  supabase: SupabaseClient<Database>,
  {
    userId,
    organizationId,
    question,
    now = new Date(),
  }: { userId: string; organizationId: string; question: string; now?: Date },
): Promise<CreateOpenAskResult> {
  const trimmed = question.trim()
  if (trimmed.length < OPEN_ASK_MIN_LENGTH || trimmed.length > OPEN_ASK_MAX_LENGTH) {
    return { ok: false, error: 'invalid_question' }
  }

  const expiresAt = new Date(now.getTime() + OPEN_ASK_TTL_DAYS * 24 * 60 * 60 * 1000)
  const { data, error } = await supabase
    .from('open_asks')
    .insert({
      user_id: userId,
      organization_id: organizationId,
      question: trimmed,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, question, created_at, expires_at')
    .single()

  if (error) {
    // 23505 = the partial unique index: one live standing ask per member.
    if (error.code === '23505') return { ok: false, error: 'already_open' }
    return { ok: false, error: 'insert_failed' }
  }

  return {
    ok: true,
    openAsk: {
      id: data.id,
      question: data.question,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    },
  }
}

/** The member's live standing ask, if any. Fails soft (null) so the ask
 * surfaces keep working in environments where the migration hasn't landed. */
export async function getOpenAskForUser(
  supabase: SupabaseClient<Database>,
  { userId }: { userId: string },
): Promise<OpenAsk | null> {
  const { data, error } = await supabase
    .from('open_asks')
    .select('id, question, created_at, expires_at')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id,
    question: data.question,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  }
}

/** Bare count for the honesty line on the asker's open-ask row. Match rows
 * are service-role only (no client RLS policies) — identities, scores, and
 * rationales never reach the asker through this path; admin client required. */
export async function countOpenAskMatches(
  admin: SupabaseClient<Database>,
  { openAskId }: { openAskId: string },
): Promise<number> {
  const { count, error } = await admin
    .from('open_ask_matches')
    .select('id', { count: 'exact', head: true })
    .eq('open_ask_id', openAskId)

  if (error) return 0
  return count ?? 0
}

export async function closeOpenAsk(
  supabase: SupabaseClient<Database>,
  {
    userId,
    openAskId,
    reason,
    now = new Date(),
  }: { userId: string; openAskId: string; reason: 'member_closed' | 'resolved'; now?: Date },
): Promise<boolean> {
  const { error, count } = await supabase
    .from('open_asks')
    .update(
      { status: 'closed', close_reason: reason, closed_at: now.toISOString() },
      { count: 'exact' },
    )
    .eq('id', openAskId)
    .eq('user_id', userId)
    .eq('status', 'open')

  return !error && (count ?? 0) > 0
}
