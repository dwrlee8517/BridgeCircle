import { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { Screen } from '@/components/screen'
import { Button, Card, CardDescription, CardTitle } from '@/components/ui'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, fontSize } from '@/theme/tokens'

/**
 * The Help hub. On the web this is the two-sided Ask-for-help / Give-help
 * surface (app/src/app/(member)/home-ui.tsx); the mobile hub starts with the
 * greeting and honest signposts while those flows land. Each missing flow is
 * a tracked parity gap — see parity/features.json.
 */
export default function HelpScreen() {
  const { session } = useSession()
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    supabase
      .from('base_profiles')
      .select('preferred_name, name')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = data?.preferred_name || data?.name
        setFirstName(name ? name.split(' ')[0] : null)
      })
  }, [session])

  return (
    <Screen testID="help-screen" title={firstName ? `Hi ${firstName}` : 'Help'}>
      <Card>
        <CardTitle>Ask for help</CardTitle>
        <CardDescription>
          Describe what you&rsquo;re working through and see the people in your network who can
          help. Asking from the app is on its way — for now, asks live on the web.
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>Give help</CardTitle>
        <CardDescription>
          Requests waiting on you, and your availability to help. Coming to the app next.
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
