import { z } from 'zod'

// Shape of one career-history entry as it lives in the DB JSONB column.
// The field editor serializes a JSON-stringified array of these shapes into
// a hidden form input; we parse it back here.
const careerEntrySchema = z.object({
  employer: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  startDate: z.string().trim().max(10).nullable(),
  endDate: z.string().trim().max(10).nullable(),
  description: z.string().trim().max(1000).nullable(),
})

const educationEntrySchema = z.object({
  school: z.string().trim().min(1).max(200),
  degree: z.string().trim().max(200).nullable(),
  field: z.string().trim().max(200).nullable(),
  startDate: z.string().trim().max(10).nullable(),
  endDate: z.string().trim().max(10).nullable(),
})

// Helper: a hidden form input ships JSON-stringified arrays. Pre-process
// from string → parsed value, then run the array schema. Empty / missing
// inputs default to []. Invalid JSON or shape errors surface as field
// errors on the form.
function jsonArrayPreprocessor<T>(itemSchema: z.ZodType<T>) {
  return z.preprocess((raw) => {
    if (raw === null || raw === undefined || raw === '') return []
    if (typeof raw !== 'string') return raw
    try {
      return JSON.parse(raw)
    } catch {
      return undefined // makes the array schema error out below
    }
  }, z.array(itemSchema).max(50))
}

// Reusable graduation-year shape — 4-digit string → number, range-checked.
const graduationYearField = z
  .string()
  .min(4)
  .max(4)
  .regex(/^\d{4}$/, 'Graduation year must be 4 digits.')
  .transform(Number)
  .refine((n) => n >= 1900 && n <= 2100, 'Graduation year out of range.')

// Optional URL: accepts an empty string OR a valid URL. Used for fields like
// linkedinUrl and avatarUrl where the form may submit "" when the user
// hasn't filled in anything.
const optionalUrl = z
  .union([z.url(), z.literal('')])
  .optional()
  .nullable()

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  preferredName: z.string().trim().max(120).optional().nullable(),
  nameOther: z.string().trim().max(200).optional().nullable(),
  graduationYear: z
    .string()
    .min(4)
    .max(4)
    .regex(/^\d{4}$/, 'Graduation year must be 4 digits.')
    .transform(Number)
    .refine((n) => n >= 1900 && n <= 2100, 'Graduation year out of range.'),
  city: z.string().trim().min(1, 'City is required.'),
  currentEmployer: z.string().trim().min(1, 'Current employer is required.'),
  currentTitle: z.string().trim().min(1, 'Current title is required.'),
  university: z.string().trim().min(1, 'University is required.'),
  major: z.string().trim().min(1, 'Major is required.'),
  headline: z.string().trim().max(200).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  linkedinUrl: z
    .union([z.url(), z.literal('')])
    .optional()
    .nullable(),
  avatarUrl: z
    .union([z.url(), z.literal('')])
    .optional()
    .nullable(),
  skills: jsonArrayPreprocessor(z.string().trim().min(1).max(80)),
  careerHistory: jsonArrayPreprocessor(careerEntrySchema),
  educationHistory: jsonArrayPreprocessor(educationEntrySchema),
})

export type ProfileFormInput = z.infer<typeof profileFormSchema>

export function parseProfileForm(formData: FormData) {
  return profileFormSchema.safeParse({
    name: formData.get('name'),
    preferredName: formData.get('preferredName'),
    nameOther: formData.get('nameOther'),
    graduationYear: formData.get('graduationYear'),
    city: formData.get('city'),
    currentEmployer: formData.get('currentEmployer'),
    currentTitle: formData.get('currentTitle'),
    university: formData.get('university'),
    major: formData.get('major'),
    headline: formData.get('headline'),
    bio: formData.get('bio'),
    linkedinUrl: formData.get('linkedinUrl'),
    avatarUrl: formData.get('avatarUrl'),
    skills: formData.get('skills'),
    careerHistory: formData.get('careerHistory'),
    educationHistory: formData.get('educationHistory'),
  })
}

// =============================================================================
// Onboarding step schemas. Each one validates only the fields its step
// touches, so a partial save can succeed without filling the rest of the
// profile. The /onboarding page submits these one at a time; final completion
// (step 5) sets users.onboarding_completed_at.
//
// Required floors per the spec:
//   - Step 1: name + graduationYear are min(1). Everything else is optional
//     across all steps so users can skip steps 2–4 entirely without breaking
//     validation. This is the most permissive end of the spectrum.
// =============================================================================

// Step 1 — About you. Minimum identity to be in the directory.
export const onboardingAboutSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  preferredName: z.string().trim().max(120).optional().nullable(),
  nameOther: z.string().trim().max(200).optional().nullable(),
  graduationYear: graduationYearField,
})
export type OnboardingAboutInput = z.infer<typeof onboardingAboutSchema>

export function parseOnboardingAbout(formData: FormData) {
  return onboardingAboutSchema.safeParse({
    name: formData.get('name'),
    preferredName: formData.get('preferredName'),
    nameOther: formData.get('nameOther'),
    graduationYear: formData.get('graduationYear'),
  })
}

// Step 2 — Education. All optional; user can skip the entire step.
export const onboardingEducationSchema = z.object({
  university: z.string().trim().max(200).optional().nullable(),
  major: z.string().trim().max(200).optional().nullable(),
  educationHistory: jsonArrayPreprocessor(educationEntrySchema),
})
export type OnboardingEducationInput = z.infer<typeof onboardingEducationSchema>

export function parseOnboardingEducation(formData: FormData) {
  return onboardingEducationSchema.safeParse({
    university: formData.get('university'),
    major: formData.get('major'),
    educationHistory: formData.get('educationHistory'),
  })
}

// Step 3 — Where you are now. All optional.
export const onboardingCurrentSchema = z.object({
  currentEmployer: z.string().trim().max(200).optional().nullable(),
  currentTitle: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  headline: z.string().trim().max(200).optional().nullable(),
  linkedinUrl: optionalUrl,
})
export type OnboardingCurrentInput = z.infer<typeof onboardingCurrentSchema>

export function parseOnboardingCurrent(formData: FormData) {
  return onboardingCurrentSchema.safeParse({
    currentEmployer: formData.get('currentEmployer'),
    currentTitle: formData.get('currentTitle'),
    city: formData.get('city'),
    headline: formData.get('headline'),
    linkedinUrl: formData.get('linkedinUrl'),
  })
}

// Step 4 — Where you've been. Career history (and optionally skills).
export const onboardingPastSchema = z.object({
  careerHistory: jsonArrayPreprocessor(careerEntrySchema),
  skills: jsonArrayPreprocessor(z.string().trim().min(1).max(80)),
})
export type OnboardingPastInput = z.infer<typeof onboardingPastSchema>

export function parseOnboardingPast(formData: FormData) {
  return onboardingPastSchema.safeParse({
    careerHistory: formData.get('careerHistory'),
    skills: formData.get('skills'),
  })
}

// Step 5 — How you can help. Avatar lives here per the user's preference to
// keep step 1 light. Availability defaults to false so it is an explicit opt-in.
export const onboardingHelpSchema = z.object({
  openToHelp: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
  helperTopics: z.string().trim().max(500).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  avatarUrl: optionalUrl,
  /**
   * How BridgeCircle handles ongoing LinkedIn freshness for this member.
   * Defaulted to review_before_update per spec — emails proposed changes
   * monthly and waits for confirmation. The other options are explicit:
   * manual_only disables the sweep entirely; auto_apply_and_notify is opt-in
   * silent updates. See docs/architecture/profile-enrichment.md.
   */
  freshnessPolicy: z
    .enum(['manual_only', 'review_before_update', 'auto_apply_and_notify'])
    .default('review_before_update'),
})
export type OnboardingHelpInput = z.infer<typeof onboardingHelpSchema>

export function parseOnboardingHelp(formData: FormData) {
  return onboardingHelpSchema.safeParse({
    openToHelp: formData.get('openToHelp'),
    helperTopics: formData.get('helperTopics'),
    bio: formData.get('bio'),
    avatarUrl: formData.get('avatarUrl'),
    freshnessPolicy: formData.get('freshnessPolicy'),
  })
}
