import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Bypasses RLS. Server-only. Use sparingly — prefer the user-scoped server client.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }
  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
