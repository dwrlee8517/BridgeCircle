import { z } from 'zod'

const audienceSchema = z.enum(['organization', 'connections', 'self'])

function optionalText(max: number) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(max).nullable(),
  )
}

const optionalYear = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().int().min(1900).max(2100).nullable(),
)

const requiredYear = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? Number.NaN : Number(value)),
  z.number().int().min(1900, 'Use a four-digit year.').max(2100, 'Use a four-digit year.'),
)

const optionalMonth = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().int().min(1).max(12).nullable(),
)

const periodShape = {
  startYear: optionalYear,
  startMonth: optionalMonth,
  endYear: optionalYear,
  endMonth: optionalMonth,
}

type Period = {
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
}

function validatePeriod(value: Period, context: z.core.$RefinementCtx<Period>) {
  if (value.startMonth !== null && value.startYear === null) {
    context.addIssue({ code: 'custom', path: ['startMonth'], message: 'Add a start year.' })
  }
  if (value.endMonth !== null && value.endYear === null) {
    context.addIssue({ code: 'custom', path: ['endMonth'], message: 'Add an end year.' })
  }
  if (value.startYear !== null && value.endYear !== null) {
    const start = value.startYear * 12 + (value.startMonth ?? 1)
    const end = value.endYear * 12 + (value.endMonth ?? 12)
    if (end < start) {
      context.addIssue({ code: 'custom', path: ['endYear'], message: 'End must follow start.' })
    }
  }
}

const experienceSchema = z
  .object({
    employer: z.string().trim().min(1, 'Employer is required.').max(300),
    title: z.string().trim().min(1, 'Title is required.').max(300),
    description: optionalText(4000),
    ...periodShape,
  })
  .superRefine(validatePeriod)

const educationSchema = z
  .object({
    school: z.string().trim().min(1, 'School is required.').max(300),
    degree: optionalText(300),
    field: optionalText(300),
    description: optionalText(4000),
    ...periodShape,
  })
  .superRefine(validatePeriod)

const jsonExperiences = jsonField(z.array(experienceSchema).max(50))
const jsonEducation = jsonField(z.array(educationSchema).max(20))

const linkSchema = z
  .object({
    kind: z.enum(['linkedin', 'portfolio', 'website', 'social', 'email', 'other']),
    label: optionalText(80),
    value: z.string().trim().min(1).max(500),
    audience: audienceSchema,
  })
  .superRefine((link, context) => {
    if (link.kind === 'other' && !link.label) {
      context.addIssue({ code: 'custom', path: ['label'], message: 'Add a label.' })
    }
    if (link.kind === 'email') {
      if (!z.email().safeParse(link.value).success) {
        context.addIssue({ code: 'custom', path: ['value'], message: 'Enter a valid email.' })
      }
      return
    }
    if (!z.url({ protocol: /^https$/, hostname: z.regexes.domain }).safeParse(link.value).success) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Use a complete https:// link.',
      })
    }
  })

const jsonLinks = jsonField(
  z
    .array(linkSchema)
    .max(20)
    .superRefine((links, context) => {
      const seen = new Set<string>()
      links.forEach((link, index) => {
        const normalized = link.value.toLowerCase()
        if (seen.has(normalized)) {
          context.addIssue({
            code: 'custom',
            path: [index, 'value'],
            message: 'Remove duplicates.',
          })
        }
        seen.add(normalized)
      })
    }),
)

export const identityFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required.').max(200),
  preferredName: optionalText(200),
  nameOther: optionalText(200),
  graduationYear: requiredYear,
})

export const currentFormSchema = z.object({
  currentEmployer: optionalText(300),
  currentTitle: optionalText(300),
  city: optionalText(200),
  headline: optionalText(280),
  industry: optionalText(120),
})

export const aboutFormSchema = z.object({ bio: optionalText(4000) })

export const historyFormSchema = z.object({
  experiences: jsonExperiences,
  skills: jsonField(
    z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .superRefine((skills, context) => {
        const seen = new Set<string>()
        skills.forEach((skill, index) => {
          const normalized = skill.toLowerCase()
          if (seen.has(normalized)) {
            context.addIssue({ code: 'custom', path: [index], message: 'Remove duplicates.' })
          }
          seen.add(normalized)
        })
      }),
  ),
})

export const educationFormSchema = z.object({
  university: optionalText(300),
  major: optionalText(300),
  education: jsonEducation,
})

export const visibilityFormSchema = z
  .object({
    career_history: audienceSchema,
    education_history: audienceSchema,
    bio: audienceSchema,
    skills: audienceSchema,
  })
  .strict()

export const linksFormSchema = z.object({ links: jsonLinks })

export function formValues(formData: FormData, names: readonly string[]) {
  return Object.fromEntries(names.map((name) => [name, formData.get(name)]))
}

function jsonField<T>(schema: z.ZodType<T>) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return value
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }, schema)
}
