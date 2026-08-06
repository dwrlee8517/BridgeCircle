import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createClient, createClientWithToken } from '@/db/server'
import type { Session } from '@/lib/auth/session'
import { createLoaders, type Loaders } from './loaders'

export type GraphQLContext = {
  supabase: SupabaseClient<Database>
  session: Session | null
  loaders: Loaders
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
 * This is the security spine of the data plane: the Supabase client is always
 * *user-scoped* (RLS enforced), and every resolver reads through it. Nothing
 * here reaches for the service-role admin client — that would silently bypass
 * row security across the graph.
 *
 * Two auth paths, both RLS-scoped:
 * - `Authorization: Bearer <token>` on the request → a token client. This is
 *   how non-browser callers and the parity test harness authenticate as a
 *   specific user against `/api/graphql`.
 * - Otherwise → the cookie client. This is the browser and in-process
 *   execution from Server Components (`execute.ts`), which passes no request.
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
    return { supabase, session, loaders: createLoaders(supabase) }
  }

  const supabase = await createClient()
  // Same shape as lib/auth/session.getSession, derived from the client we just
  // built so a GraphQL request makes one auth round-trip, not two.
  const { data, error } = await supabase.auth.getUser()
  const session: Session | null =
    error || !data.user || !data.user.email
      ? null
      : { userId: data.user.id, email: data.user.email }

  return { supabase, session, loaders: createLoaders(supabase) }
}
