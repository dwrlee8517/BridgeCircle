import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SessionProvider } from '@/lib/session'
import { colors } from '@/theme/tokens'

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(member)" />
        <Stack.Screen name="sign-in" />
      </Stack>
    </SessionProvider>
  )
}
