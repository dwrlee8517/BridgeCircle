/**
 * BridgeCircle design tokens for React Native.
 *
 * Source of truth: app/src/app/globals.css `:root` (Field Pro theme, ADR 0012
 * Phase B). Token NAMES are the cross-platform contract; VALUES are mid-
 * migration (Civic Editorial → Field Pro), so when globals.css changes, this
 * file changes in the same PR. Keep the keys aligned with the web role tokens
 * so a future codegen step can replace this file mechanically.
 *
 * Dark mode: the web ships a full `.dark` mirror. Mobile starts light-only;
 * the parity manifest tracks the gap (`platform.theme.dark`).
 */

export const colors = {
  /* Page canvas — grey-100 so white cards float (the Toss idiom) */
  background: '#f2f4f6',
  foreground: '#191f28',
  card: '#ffffff',
  cardForeground: '#191f28',

  primary: '#3182f6',
  primaryHover: '#1b64da',
  primaryForeground: '#ffffff',

  surfaceInk: '#191f28',
  surfaceInkForeground: '#f9fafb',

  secondary: '#f2f4f6',
  muted: '#f2f4f6',
  mutedForeground: '#6b7684',

  destructive: '#d22030',
  destructiveForeground: '#ffffff',

  border: '#e6e9ee',
  borderSubtle: '#edf0f2',
  ring: '#3182f6',

  /* Give-side lead action — green-700 fill clears AA with white text */
  actionOffer: '#0b8a57',
  actionOfferHover: '#077046',
  actionOnOffer: '#ffffff',

  accentOchre: '#c98a1a',
  accentRust: '#f04452',
  accentSage: '#0b8a57',

  stateSuccess: '#0b8a57',
  stateWarning: '#c98a1a',
  stateDanger: '#d22030',

  primaryTint: 'rgba(49, 130, 246, 0.10)',
  successTint: 'rgba(3, 178, 108, 0.10)',
  warningTint: 'rgba(201, 138, 26, 0.12)',
  dangerTint: 'rgba(240, 68, 82, 0.10)',
} as const

/* Web: --radius 10px (Phase C: controls → 12, cards → 20) */
export const radius = {
  control: 10,
  card: 10,
} as const

/* Web: --spacing scale (4px base) */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const

/* Web type scale is Pretendard via next/font; RN uses the platform system
 * font until Pretendard ships as an embedded font (parity gap tracked). */
export const fontSize = {
  caption: 13,
  bodyMd: 15,
  bodyLg: 17,
  h2: 20,
  h1: 24,
  displayMd: 28,
} as const
