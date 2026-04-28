import { z } from 'zod'

/**
 * The five sections a member can configure visibility for. Directory fields
 * (name / year / city / employer / title / university / major) are
 * intentionally NOT here — they are the always-org-visible directory.
 */
export const PRIVACY_SECTIONS = [
  'contact_links',
  'career_history',
  'education_history',
  'bio',
  'skills',
] as const

export type PrivacySection = (typeof PRIVACY_SECTIONS)[number]

/**
 * Three-tier visibility model. RLS already restricts profile reads to
 * org-mates, so 'org' is the broadest a member can choose; 'self' means
 * only the profile owner sees it.
 */
export const PRIVACY_TIERS = ['org', 'friends', 'self'] as const

export type PrivacyTier = (typeof PRIVACY_TIERS)[number]

/**
 * Defaults applied to any section the user hasn't explicitly configured.
 * From phase-1-spec: contact links default to friends-only, everything else
 * to org-visible.
 */
export const PRIVACY_DEFAULTS: Record<PrivacySection, PrivacyTier> = {
  contact_links: 'friends',
  career_history: 'org',
  education_history: 'org',
  bio: 'org',
  skills: 'org',
}

/** Map stored under base_profiles.privacy_settings (partial; missing → default). */
export type PrivacySettings = Partial<Record<PrivacySection, PrivacyTier>>

/**
 * The viewer's relationship to the profile owner. Computed from {isSelf,
 * isFriend} — RLS already enforces that anyone reaching this code is at
 * least an org-mate.
 */
export type ViewerKind = 'self' | 'friend' | 'orgmate'

export function deriveViewerKind(isSelf: boolean, isFriend: boolean): ViewerKind {
  if (isSelf) return 'self'
  if (isFriend) return 'friend'
  return 'orgmate'
}

/**
 * Resolve the effective tier for a section, falling back to defaults.
 */
export function effectiveTier(
  settings: PrivacySettings | null | undefined,
  section: PrivacySection,
): PrivacyTier {
  return settings?.[section] ?? PRIVACY_DEFAULTS[section]
}

/**
 * Single source of truth for visibility decisions. Returns true if the
 * viewer should see the contents of the section on this profile.
 */
export function canSeeSection(
  settings: PrivacySettings | null | undefined,
  section: PrivacySection,
  viewer: ViewerKind,
): boolean {
  if (viewer === 'self') return true
  const tier = effectiveTier(settings, section)
  if (tier === 'self') return false
  if (tier === 'friends') return viewer === 'friend'
  return true // tier === 'org' — visible to any org-mate (which includes friends)
}

/**
 * Zod for the savePrivacySettings form. Each section is optional; an
 * undefined value = "leave default", a missing key = "leave default".
 * We don't allow setting sections we don't know about — extra keys are
 * stripped via .strict() at parse time.
 */
export const privacySettingsSchema = z
  .object({
    contact_links: z.enum(PRIVACY_TIERS).optional(),
    career_history: z.enum(PRIVACY_TIERS).optional(),
    education_history: z.enum(PRIVACY_TIERS).optional(),
    bio: z.enum(PRIVACY_TIERS).optional(),
    skills: z.enum(PRIVACY_TIERS).optional(),
  })
  .strict()

export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>

/**
 * Coerce arbitrary JSON from the DB into a typed PrivacySettings, dropping
 * any unknown keys or invalid tier values. Defensive parse — we control
 * inserts so this is mostly type-narrowing, not validation.
 */
export function parseStoredPrivacySettings(raw: unknown): PrivacySettings {
  if (!raw || typeof raw !== 'object') return {}
  const result: PrivacySettings = {}
  for (const section of PRIVACY_SECTIONS) {
    const v = (raw as Record<string, unknown>)[section]
    if (v === 'org' || v === 'friends' || v === 'self') {
      result[section] = v
    }
  }
  return result
}
