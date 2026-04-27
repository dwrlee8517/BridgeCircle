import { z } from 'zod'

// What Claude returns. Validated after the call to catch any LLM drift.
export const careerEntrySchema = z.object({
  employer: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  startDate: z.string().trim().max(10).nullable(), // YYYY or YYYY-MM
  endDate: z.string().trim().max(10).nullable(),
  description: z.string().trim().max(1000).nullable(),
})

export const educationEntrySchema = z.object({
  school: z.string().trim().min(1).max(200),
  degree: z.string().trim().max(200).nullable(),
  field: z.string().trim().max(200).nullable(),
  startDate: z.string().trim().max(10).nullable(),
  endDate: z.string().trim().max(10).nullable(),
})

export const extractedProfileSchema = z.object({
  name: z.string().trim().max(200).nullable(),
  headline: z.string().trim().max(300).nullable(),
  city: z.string().trim().max(200).nullable(),
  currentEmployer: z.string().trim().max(200).nullable(),
  currentTitle: z.string().trim().max(200).nullable(),
  university: z.string().trim().max(200).nullable(),
  major: z.string().trim().max(200).nullable(),
  careerHistory: z.array(careerEntrySchema).max(50),
  educationHistory: z.array(educationEntrySchema).max(20),
  skills: z.array(z.string().trim().min(1).max(80)).max(80),
})

export type CareerEntry = z.infer<typeof careerEntrySchema>
export type EducationEntry = z.infer<typeof educationEntrySchema>
export type ExtractedProfile = z.infer<typeof extractedProfileSchema>

// What the confirm form submits. Each field carries a `use` flag plus the
// (possibly user-edited) value.
const scalarChoiceSchema = z.object({
  use: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
  value: z.string().trim().max(300).nullable(),
})

const careerChoiceSchema = z.object({
  use: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
  employer: z.string().trim().max(200),
  title: z.string().trim().max(200),
  startDate: z.string().trim().max(10).nullable(),
  endDate: z.string().trim().max(10).nullable(),
  description: z.string().trim().max(1000).nullable(),
})

const educationChoiceSchema = z.object({
  use: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
  school: z.string().trim().max(200),
  degree: z.string().trim().max(200).nullable(),
  field: z.string().trim().max(200).nullable(),
  startDate: z.string().trim().max(10).nullable(),
  endDate: z.string().trim().max(10).nullable(),
})

const skillChoiceSchema = z.object({
  use: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
  value: z.string().trim().min(1).max(80),
})

export const applyExtractedSchema = z.object({
  scalars: z.object({
    name: scalarChoiceSchema,
    headline: scalarChoiceSchema,
    city: scalarChoiceSchema,
    currentEmployer: scalarChoiceSchema,
    currentTitle: scalarChoiceSchema,
    university: scalarChoiceSchema,
    major: scalarChoiceSchema,
  }),
  careerHistory: z.array(careerChoiceSchema).max(50),
  educationHistory: z.array(educationChoiceSchema).max(20),
  skills: z.array(skillChoiceSchema).max(80),
})

export type ApplyExtractedInput = z.infer<typeof applyExtractedSchema>
