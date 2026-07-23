import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowClass } from '@/lib/use-window-class'
import { colors, fontSize, space } from '@/theme/tokens'

/**
 * Adaptive navigation chrome for the member shell. Mirrors the web:
 * MEMBER_NAV_LINKS renders as a bottom tab bar on phones
 * (app/src/app/(member)/member-tab-bar.tsx) and as inline nav on wide
 * screens (member-nav.tsx). Here: compact/medium → bottom tab bar,
 * expanded (iPad landscape, per parity/window-classes.json) → left rail.
 *
 * The rail is the same component so the route list can never fork between
 * form factors.
 */
export const RAIL_WIDTH = 220

export function MemberTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const windowClass = useWindowClass()
  const insets = useSafeAreaInsets()
  const expanded = windowClass === 'expanded'

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key]
    const label = options.title ?? route.name
    const focused = state.index === index
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      })
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name)
      }
    }
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        key={route.key}
        onPress={onPress}
        style={[
          expanded ? styles.railItem : styles.barItem,
          focused && (expanded ? styles.railItemActive : null),
        ]}
        testID={`nav-${route.name === 'index' ? 'home' : route.name}`}
      >
        <Text
          style={[
            expanded ? styles.railLabel : styles.barLabel,
            focused && (expanded ? styles.railLabelActive : styles.barLabelActive),
          ]}
        >
          {label}
        </Text>
      </Pressable>
    )
  })

  if (expanded) {
    return (
      <View style={[styles.rail, { paddingTop: insets.top + space[6] }]} testID="nav-rail">
        <Text style={styles.railWordmark}>BridgeCircle</Text>
        <View style={styles.railItems}>{items}</View>
      </View>
    )
  }

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space[2]) }]}
      testID="nav-tab-bar"
    >
      {items}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space[2],
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space[2],
  },
  barLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.caption,
    fontWeight: '500',
  },
  barLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  /* Expanded: left rail on the ink surface, mirroring the web sidebar tokens */
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: RAIL_WIDTH,
    backgroundColor: colors.surfaceInk,
    paddingHorizontal: space[4],
    gap: space[8],
  },
  railWordmark: {
    color: colors.surfaceInkForeground,
    fontSize: fontSize.bodyLg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  railItems: {
    gap: space[1],
  },
  railItem: {
    paddingVertical: space[3],
    paddingHorizontal: space[3],
    borderRadius: 8,
  },
  railItemActive: {
    backgroundColor: 'rgba(249, 250, 251, 0.12)',
  },
  railLabel: {
    color: 'rgba(249, 250, 251, 0.68)',
    fontSize: fontSize.bodyMd,
    fontWeight: '500',
  },
  railLabelActive: {
    color: colors.surfaceInkForeground,
    fontWeight: '700',
  },
})
