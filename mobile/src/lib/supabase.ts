import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import type { Database } from '../db/types'

/**
 * Native Supabase client. Unlike the web app (cookie sessions via
 * @supabase/ssr), the native app holds a token session persisted in
 * AsyncStorage; every query runs on-device under RLS — the same policies
 * that gate the web app's per-user server clients.
 *
 * URL/key come from app.config.ts `extra`, which accepts either EXPO_PUBLIC_*
 * or the web app's NEXT_PUBLIC_* names so `doppler run` works unchanged.
 */
const extra = Constants.expoConfig?.extra as
  | { supabaseUrl?: string; supabasePublishableKey?: string }
  | undefined

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Start with Doppler (doppler run -p bridgecircle -c dev_personal -- pnpm start) or set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.`,
    )
  }
  return value
}

export const supabase = createClient<Database>(
  required(extra?.supabaseUrl, 'Supabase URL'),
  required(extra?.supabasePublishableKey, 'Supabase publishable key'),
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // No URL-based session detection on native — OAuth lands via deep link
      // and is exchanged explicitly when Google sign-in ships.
      detectSessionInUrl: false,
    },
  },
)
