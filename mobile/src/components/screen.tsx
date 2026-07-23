import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowClass } from '@/lib/use-window-class'
import { colors, fontSize, space } from '@/theme/tokens'

/**
 * Standard member-screen scaffold: safe-area padding, a page title, and a
 * content column that widens with the window class (mirrors the web's
 * max-w-* containers instead of stretching full-bleed on iPad).
 */
export function Screen({
  title,
  children,
  testID,
}: {
  title: string
  children: ReactNode
  testID?: string
}) {
  const insets = useSafeAreaInsets()
  const windowClass = useWindowClass()

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + space[4],
          paddingBottom: space[12],
          maxWidth: windowClass === 'compact' ? undefined : 720,
        },
      ]}
      style={styles.root}
      testID={testID}
    >
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: space[5],
    gap: space[4],
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.displayMd,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: space[2],
  },
})
