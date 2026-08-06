import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createClient } from '@/db/server'
import type { Session } from '@/lib/auth/session'
import { createLoaders, type Loaders } from './loaders'

export type GraphQLContext = {
  supabase: SupabaseClient<Database>
  session: Session | null
  loaders: Loaders
}

/**
 * Build a per-request GraphQL context.
 *
 * This is the security spine of the data plane: `createClient()` returns the
 * *user-scoped* Supabase client (RLS enforced from the request cookies), and
 * every resolver reads through it. Nothing here reaches for the service-role
 * admin client — that would silently bypass row security across the graph.
 *
 * It works unchanged on both entry points because both run inside a Next
 * request scope where `cookies()` is available: the Yoga route handler
 * (`/api/graphql`) and in-process execution from Server Components
 * (`execute.ts`).
 */
export async function buildContext(): Promise<GraphQLContext> {
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
