import { z } from 'zod'
import { isCurrentRoleSupported } from '@/lib/enrichment/current-role'
import {
  type ApplyExtractedInput,
  applyExtractedSchema,
  type ExtractedProfile,
  extractedProfileSchema,
} from '@/lib/resume/schemas'
import type { ImportCurrentProfile } from './import-current-profile'

export const importProposalSourceSchema = z.enum(['linkdapi', 'brightdata', 'pdl', 'resume'])
export type ImportProposalSource = z.infer<typeof importProposalSourceSchema>

export const importProposalSchema = z.object({
  id: z.guid(),
  source: importProposalSourceSchema,
  status: z.enum(['pending', 'accepted', 'edited', 'declined', 'superseded', 'expired']),
  current: z.custom<ImportCurrentProfile>(),
  proposed: extractedProfileSchema,
  sourceMetadata: z.record(z.string(), z.unknown()),
  expiresAt: z.string(),
  createdAt: z.string(),
})

export type ImportProposal = z.infer<typeof importProposalSchema>

export type ImportScalarKey =
  | 'name'
  | 'headline'
  | 'city'
  | 'currentEmployer'
  | 'currentTitle'
  | 'university'
  | 'major'

export type ImportScalarChoice = { use: boolean; value: string | null }

export type ImportApplyPayload = {
  identity: {
    displayName: string
    preferredName: string | null
    nameOther: string | null
    graduationYear: number
  }
  education: {
    university: string | null
    major: string | null
    education: Array<{
      school: string
      degree: string | null
      field: string | null
      startYear: number | null
      startMonth: number | null
      endYear: number | null
      endMonth: number | null
      description: string | null
    }>
  }
  current: {
    currentEmployer: string | null
    currentTitle: string | null
    city: string | null
    headline: string | null
    industry: string | null
  }
  history: {
    experiences: Array<{
      employer: string
      title: string
      startYear: number | null
      startMonth: number | null
      endYear: number | null
      endMonth: number | null
      description: string | null
    }>
    skills: string[]
  }
}

export function parseApplySelections(raw: string): ApplyExtractedInput {
  return applyExtractedSchema.parse(JSON.parse(raw))
}

export function buildInitialScalarChoices(
  profile: ExtractedProfile,
): Record<ImportScalarKey, ImportScalarChoice> {
  const currentRoleSupported = isCurrentRoleSupported(profile)
  return {
    name: scalarChoice(profile.name),
    headline: scalarChoice(profile.headline),
    city: scalarChoice(profile.city),
    currentEmployer: scalarChoice(profile.currentEmployer, currentRoleSupported),
    currentTitle: scalarChoice(profile.currentTitle, currentRoleSupported),
    university: scalarChoice(profile.university),
    major: scalarChoice(profile.major),
  }
}

export function buildImportApplyPayload(args: {
  current: ImportCurrentProfile
  selections: ApplyExtractedInput
  preferredName: string | null
  nameOther: string | null
  graduationYear: number
  industry: string | null
}): ImportApplyPayload {
  const { current, selections } = args
  const chosen = <K extends keyof ApplyExtractedInput['scalars']>(key: K) => {
    const choice = selections.scalars[key]
    return choice.use ? emptyToNull(choice.value) : current[key]
  }

  const displayName = chosen('name') ?? current.name
  if (!displayName) throw new Error('Import apply requires a display name')

  return {
    identity: {
      displayName,
      preferredName: args.preferredName,
      nameOther: args.nameOther,
      graduationYear: args.graduationYear,
    },
    education: {
      university: chosen('university'),
      major: chosen('major'),
      education: selections.educationHistory
        .filter((entry) => entry.use)
        .map((entry) => ({
          school: entry.school,
          degree: emptyToNull(entry.degree),
          field: emptyToNull(entry.field),
          ...parsePeriodPair(entry.startDate, entry.endDate),
          description: null,
        })),
    },
    current: {
      currentEmployer: chosen('currentEmployer'),
      currentTitle: chosen('currentTitle'),
      city: chosen('city'),
      headline: chosen('headline'),
      industry: args.industry,
    },
    history: {
      experiences: selections.careerHistory
        .filter((entry) => entry.use)
        .map((entry) => ({
          employer: entry.employer,
          title: entry.title,
          ...parsePeriodPair(entry.startDate, entry.endDate),
          description: emptyToNull(entry.description),
        })),
      skills: dedupe(selections.skills.filter((skill) => skill.use).map((skill) => skill.value)),
    },
  }
}

export function currentProfileAsExtracted(current: ImportCurrentProfile): ExtractedProfile {
  return {
    name: current.name,
    headline: current.headline,
    city: current.city,
    currentEmployer: current.currentEmployer,
    currentTitle: current.currentTitle,
    university: current.university,
    major: current.major,
    careerHistory: current.careerHistory.map((entry) => ({
      employer: entry.employer,
      title: entry.title,
      startDate: entry.start_date,
      endDate: entry.end_date,
      description: entry.description,
    })),
    educationHistory: current.educationHistory.map((entry) => ({
      school: entry.school,
      degree: entry.degree,
      field: entry.field,
      startDate: entry.start_date,
      endDate: entry.end_date,
    })),
    skills: current.skills,
  }
}

function parsePeriodPair(start: string | null, end: string | null) {
  const startPeriod = parsePeriod(start)
  const endPeriod = parsePeriod(end)
  return {
    startYear: startPeriod.year,
    startMonth: startPeriod.month,
    endYear: endPeriod.year,
    endMonth: endPeriod.month,
  }
}

function parsePeriod(value: string | null) {
  if (!value) return { year: null, month: null }
  const match = /^(19\d{2}|20\d{2}|2100)(?:-(0[1-9]|1[0-2]))?$/.exec(value)
  if (!match) throw new Error(`Invalid period: ${value}`)
  return { year: Number(match[1]), month: match[2] ? Number(match[2]) : null }
}

function emptyToNull(value: string | null) {
  const trimmed = value?.trim() ?? ''
  return trimmed ? trimmed : null
}

function scalarChoice(value: string | null, supported = true): ImportScalarChoice {
  return { use: value !== null && supported, value }
}

function dedupe(values: string[]) {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = value.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
