import { Redirect } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Card, CardDescription, CardTitle, ErrorNote, Field, Label } from '@/components/ui'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, fontSize, space } from '@/theme/tokens'

/**
 * Email/password sign-in. Copy mirrors the web sign-in card
 * (app/src/app/(auth)/sign-in/sign-in-form.tsx) — same voice, same promise.
 * Google OAuth and invite-based join are tracked as parity gaps; new members
 * onboard on the web first.
 */
export default function SignInScreen() {
  const { session, loading } = useSession()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!loading && session) {
    return <Redirect href="/" />
  }

  async function signIn() {
    setPending(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setPending(false)
    if (signInError) {
      // Same message the web action shows — don't leak which half was wrong.
      setError('Invalid email or password.')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + space[12], paddingBottom: insets.bottom + space[6] },
        ]}
        keyboardShouldPersistTaps="handled"
        testID="sign-in-screen"
      >
        <Text style={styles.kicker}>Verified school circle</Text>
        <Text style={styles.wordmark}>BridgeCircle</Text>

        <Card style={styles.card}>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your verified school circle.</CardDescription>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <View style={styles.fieldGroup}>
            <Label>Email</Label>
            <Field
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              testID="sign-in-email"
              value={email}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Label>Password</Label>
            <Field
              autoComplete="current-password"
              onChangeText={setPassword}
              secureTextEntry
              testID="sign-in-password"
              value={password}
            />
          </View>

          <Button onPress={signIn} pending={pending} title="Sign in" />

          <Text style={styles.footnote}>
            New here? BridgeCircle is invite-only — your school sends the invitation email. Accept
            it on the web first, then sign in here.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: space[5],
    gap: space[2],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  kicker: {
    color: colors.mutedForeground,
    fontSize: fontSize.caption,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  wordmark: {
    color: colors.foreground,
    fontSize: fontSize.displayMd,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: space[6],
  },
  card: { gap: space[4] },
  fieldGroup: { gap: 0 },
  footnote: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space[4],
    color: colors.mutedForeground,
    fontSize: fontSize.caption,
    lineHeight: 19,
    textAlign: 'center',
  },
})
