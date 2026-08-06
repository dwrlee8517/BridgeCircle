import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createClient, createClientWithToken } from '@/db/server'
import type { Session } from '@/lib/auth/session'

export type GraphQLContext = {
  supabase: SupabaseClient<Database>
  session: Session | null
}

function bearerToken(request?: Request): string | null {
  const header = request?.headers.get('authorization')
  if (!header) return null
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : null
}

/**
 * Build a per-request GraphQL context.
 *
 * The security spine of the data plane: the Supabase client is always
 * *user-scoped* (RLS enforced), and every resolver reads through it — via the
 * v2 `db/repositories/*` functions, never the service-role admin client.
 *
 * Two RLS-scoped auth paths:
 * - `Authorization: Bearer <token>` → a token client (non-browser callers and
 *   the parity test harness authenticating as a specific user).
 * - Otherwise → the cookie client (browser + in-process execution from Server
 *   Components via `execute.ts`, which passes no request).
 */
export async function buildContext(request?: Request): Promise<GraphQLContext> {
  const token = bearerToken(request)

  if (token) {
    const supabase = createClientWithToken(token)
    const { data, error } = await supabase.auth.getUser(token)
    const session: Session | null =
      error || !data.user || !data.user.email
        ? null
        : { userId: data.user.id, email: data.user.email }
    return { supabase, session }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  const session: Session | null =
    error || !data.user || !data.user.email
      ? null
      : { userId: data.user.id, email: data.user.email }

  return { supabase, session }
}
