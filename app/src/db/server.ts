import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for server client')
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Component context — middleware handles refresh.
        }
      },
    },
  })
}

/**
 * Build a user-scoped client from a Supabase access token instead of cookies.
 *
 * Used by the GraphQL endpoint when a request carries `Authorization: Bearer
 * <token>` (non-browser callers and the parity test harness). The bearer JWT is
 * the user identity PostgREST enforces RLS against, so this is still a
 * *user-scoped* client — never the service-role admin client. Validate the
 * token with `auth.getUser(token)` before trusting the identity.
 */
export function createClientWithToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for token client')
  }

  return createServerClient<Database>(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
