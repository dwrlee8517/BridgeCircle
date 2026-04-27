import { z } from 'zod'

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
  openToMentor: z.preprocess(
    (v) => v === 'on' || v === 'true' || v === true,
    z.boolean(),
  ),
  headline: z.string().trim().max(200).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  linkedinUrl: z.union([z.url(), z.literal('')]).optional().nullable(),
  avatarUrl: z.union([z.url(), z.literal('')]).optional().nullable(),
  mentoringTopics: z.string().trim().max(500).optional().nullable(),
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
  })
}
