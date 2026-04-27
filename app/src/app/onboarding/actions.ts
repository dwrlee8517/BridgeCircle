'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'

export type OnboardingState = {
  error?: string
  fieldErrors?: Record<string, string>
}

const onboardingSchema = z.object({
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
  linkedinUrl: z.union([z.url(), z.literal('')]).optional().nullable(),
  avatarUrl: z.union([z.url(), z.literal('')]).optional().nullable(),
  mentoringTopics: z.string().trim().max(500).optional().nullable(),
})

export async function saveProfile(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await requireSession()
  const supabase = await createClient()

  const parsed = onboardingSchema.safeParse({
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

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const v = parsed.data
  const topics = v.mentoringTopics
    ? v.mentoringTopics.split(',').map((t) => t.trim()).filter(Boolean)
    : null

  const { error: baseErr } = await supabase
    .from('base_profiles')
    .update({
      name: v.name,
      headline: v.headline || null,
      current_employer: v.currentEmployer,
      current_title: v.currentTitle,
      city: v.city,
      university: v.university,
      major: v.major,
      linkedin_url: v.linkedinUrl || null,
      avatar_url: v.avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', session.userId)
  if (baseErr) {
    return { error: 'Could not save your profile. Try again.' }
  }

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return { error: 'No active org membership found. Contact your admin.' }
  }

  const { error: orgErr } = await supabase
    .from('organization_profiles')
    .update({
      graduation_year: v.graduationYear,
      bio: v.bio || null,
      mentoring_topics: topics,
      open_to_mentor: v.openToMentor,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_membership_id', membership.id)
  if (orgErr) {
    return { error: 'Could not save your org profile. Try again.' }
  }

  redirect('/')
}
