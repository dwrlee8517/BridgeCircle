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

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
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
  openToMentor: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
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
  mentoringTopics: z.string().trim().max(500).optional().nullable(),
  skills: jsonArrayPreprocessor(z.string().trim().min(1).max(80)),
  careerHistory: jsonArrayPreprocessor(careerEntrySchema),
  educationHistory: jsonArrayPreprocessor(educationEntrySchema),
})

export type ProfileFormInput = z.infer<typeof profileFormSchema>

export function parseProfileForm(formData: FormData) {
  return profileFormSchema.safeParse({
    name: formData.get('name'),
    graduationYear: formData.get('graduationYear'),
    city: formData.get('city'),
    currentEmployer: formData.get('currentEmployer'),
    currentTitle: formData.get('currentTitle'),
    university: formData.get('university'),
    major: formData.get('major'),
    openToMentor: formData.get('openToMentor'),
    headline: formData.get('headline'),
    bio: formData.get('bio'),
    linkedinUrl: formData.get('linkedinUrl'),
    avatarUrl: formData.get('avatarUrl'),
    mentoringTopics: formData.get('mentoringTopics'),
    skills: formData.get('skills'),
    careerHistory: formData.get('careerHistory'),
    educationHistory: formData.get('educationHistory'),
  })
}
