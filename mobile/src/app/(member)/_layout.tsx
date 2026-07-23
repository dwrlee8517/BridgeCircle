import { Redirect } from 'expo-router'
import { Tabs } from 'expo-router/js-tabs'
import { ActivityIndicator, View } from 'react-native'
import { MemberTabBar, RAIL_WIDTH } from '@/components/member-shell'
import { useSession } from '@/lib/session'
import { useWindowClass } from '@/lib/use-window-class'
import { colors } from '@/theme/tokens'

/**
 * Authenticated member shell. Tab order mirrors MEMBER_NAV_LINKS in
 * app/src/app/(member)/nav-links.ts — Help · People · School · Messages.
 * If the web nav changes, change this in the same PR (the parity manifest's
 * shell.navigation feature is the tripwire).
 */
export default function MemberLayout() {
  const { session, loading } = useSession()
  const windowClass = useWindowClass()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }
  if (!session) {
    return <Redirect href="/sign-in" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
          paddingLeft: windowClass === 'expanded' ? RAIL_WIDTH : 0,
        },
      }}
      tabBar={(props) => <MemberTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Help' }} />
      <Tabs.Screen name="people" options={{ title: 'People' }} />
      <Tabs.Screen name="school" options={{ title: 'School' }} />
      <Tabs.Screen name="inbox" options={{ title: 'Messages' }} />
    </Tabs>
  )
}
