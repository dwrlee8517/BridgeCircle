import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * Dynamic config wrapper over app.json. Its only job is to feed Supabase
 * connection values into `extra` so the runtime client (src/lib/supabase.ts)
 * can read them via expo-constants. Accepts either EXPO_PUBLIC_* names or the
 * web app's NEXT_PUBLIC_* names, so the same Doppler project works for both:
 *
 *   doppler run -p bridgecircle -c dev_personal -- pnpm start
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'BridgeCircle',
  slug: config.slug ?? 'bridgecircle',
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
})
