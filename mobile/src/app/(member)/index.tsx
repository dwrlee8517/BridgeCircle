import { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { Screen } from '@/components/screen'
import { Button, Card, CardDescription, CardTitle } from '@/components/ui'
import { getMemberContextLite } from '@/lib/member-context'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, fontSize } from '@/theme/tokens'

/**
 * Home — the mobile face of the web dashboard (`api.get_home_native` feeds
 * the web's pure-composition Home). The mobile hub starts with the greeting
 * and honest signposts while the dashboard slices land; each missing slice
 * is a tracked parity gap — see parity/features.json.
 */
export default function HomeScreen() {
  const { session } = useSession()
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    getMemberContextLite()
      .then((context) => {
        if (cancelled) return
        const name = context.preferredName || context.displayName
        setFirstName(name ? name.split(' ')[0] : null)
      })
      .catch(() => {
        // Greeting is decorative — the neutral title is fine if this fails.
      })
    return () => {
      cancelled = true
    }
  }, [session])

  return (
    <Screen testID="home-screen" title={firstName ? `Welcome back, ${firstName}.` : 'Home'}>
      <Card>
        <CardTitle>Your circle, in your pocket</CardTitle>
        <CardDescription>
          Browse people, see what your school is up to, and keep an eye on your conversations. Asks,
          offers, and messages are coming to the app — until then, those live on the web.
        </CardDescription>
      </Card>
      <Button onPress={() => supabase.auth.signOut()} title="Sign out" variant="outline" />
      <Text style={styles.footnote}>Signed in as {session?.user.email}</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  footnote: {
    color: colors.mutedForeground,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
})
