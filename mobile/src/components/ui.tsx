import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewProps,
} from 'react-native'
import { colors, fontSize, radius, space } from '@/theme/tokens'

/**
 * Minimal owned primitives mirroring the web's shadcn set (Card, Button,
 * Input, Label). Same role-token vocabulary, RN implementation. Grow this
 * file feature-by-feature — don't import a component kit (the web owns its
 * primitives; mobile does too).
 */

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.cardTitle}>{children}</Text>
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <Text style={styles.cardDescription}>{children}</Text>
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.mutedForeground} style={styles.input} {...props} />
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  pending = false,
}: {
  title: string
  onPress: () => void
  variant?: 'primary' | 'outline'
  disabled?: boolean
  pending?: boolean
}) {
  const inactive = disabled || pending
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonOutline,
        pressed && variant === 'primary' && { backgroundColor: colors.primaryHover },
        inactive && { opacity: 0.6 },
      ]}
    >
      {pending ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.primaryForeground : colors.primary}
        />
      ) : (
        <Text style={variant === 'primary' ? styles.buttonPrimaryText : styles.buttonOutlineText}>
          {title}
        </Text>
      )}
    </Pressable>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <View style={styles.errorNote}>
      <Text style={styles.errorNoteText}>{children}</Text>
    </View>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space[5],
    gap: space[2],
  },
  cardTitle: {
    color: colors.cardForeground,
    fontSize: fontSize.h1,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardDescription: {
    color: colors.mutedForeground,
    fontSize: fontSize.bodyMd,
    lineHeight: 21,
  },
  label: {
    color: colors.foreground,
    fontSize: fontSize.caption,
    fontWeight: '600',
    marginBottom: space[1],
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: space[3],
    height: 44,
    fontSize: fontSize.bodyMd,
    color: colors.foreground,
  },
  button: {
    height: 44,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonOutline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPrimaryText: {
    color: colors.primaryForeground,
    fontSize: fontSize.bodyMd,
    fontWeight: '600',
  },
  buttonOutlineText: {
    color: colors.foreground,
    fontSize: fontSize.bodyMd,
    fontWeight: '600',
  },
  errorNote: {
    backgroundColor: colors.dangerTint,
    borderRadius: radius.control,
    padding: space[3],
  },
  errorNoteText: {
    color: colors.destructive,
    fontSize: fontSize.caption,
  },
  empty: {
    padding: space[6],
    alignItems: 'center',
    gap: space[2],
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: fontSize.bodyLg,
    fontWeight: '600',
  },
  emptyBody: {
    color: colors.mutedForeground,
    fontSize: fontSize.bodyMd,
    textAlign: 'center',
    lineHeight: 21,
  },
})
