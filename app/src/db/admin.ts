import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Bypasses RLS. Server-only. Use sparingly — prefer the user-scoped server client.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}
