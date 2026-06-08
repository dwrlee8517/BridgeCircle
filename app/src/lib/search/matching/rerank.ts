import 'server-only'
import type { CareerEntry, EducationEntry } from '../searchAlumni'
import type { HybridCandidate } from './hybridMerge'
import { VoyageClient } from './voyage'

export type HybridRerankResult =
  | { ok: true; scores: Map<string, number> }
  | { ok: false; error: 'rerank_failed'; detail?: string }

export async function rerankHybridCandidates(input: {
  query: string
  candidates: HybridCandidate[]
  limit: number
  voyage?: VoyageClient
}): Promise<HybridRerankResult> {
  if (input.candidates.length === 0) {
    return { ok: true, scores: new Map() }
  }

  const voyage = input.voyage ?? new VoyageClient()
  const documents = input.candidates.slice(0, input.limit).map((candidate) => ({
    id: candidate.hit.userId,
    text: candidateRerankDocument(candidate),
  }))

  const result = await voyage.rerank(input.query, documents, documents.length)
  if (!result.ok) {
    return {
      ok: false,
      error: 'rerank_failed',
      detail: `${result.error}${result.detail ? `: ${result.detail}` : ''}`,
    }
  }

  return {
    ok: true,
    scores: new Map(result.value.map((score) => [score.id, score.score])),
  }
}

export function candidateRerankDocument(candidate: HybridCandidate): string {
  const h = candidate.hit
  const facts = [
    h.name ? `Name: ${h.name}` : null,
    h.headline ? `Headline: ${h.headline}` : null,
    h.currentTitle && h.currentEmployer
      ? `Current role: ${h.currentTitle} at ${h.currentEmployer}`
      : h.currentTitle
        ? `Current title: ${h.currentTitle}`
        : h.currentEmployer
          ? `Current employer: ${h.currentEmployer}`
          : null,
    h.city ? `City: ${h.city}` : null,
    h.university ? `University: ${h.university}` : null,
    h.major ? `Major: ${h.major}` : null,
    h.graduationYear ? `Class year: ${h.graduationYear}` : null,
    h.bio ? `Bio: ${h.bio}` : null,
    h.mentoringTopics?.length ? `Mentoring topics: ${h.mentoringTopics.join(', ')}` : null,
    h.skills?.length ? `Skills: ${h.skills.join(', ')}` : null,
    formatCareer(h.careerHistory),
    formatEducation(h.educationHistory),
    candidate.rawEvidence.length
      ? `Matched raw evidence: ${candidate.rawEvidence.join(' | ')}`
      : null,
  ].filter(Boolean)

  return facts.join('\n')
}

function formatCareer(history: CareerEntry[] | null) {
  if (!history?.length) return null
  return `Career history: ${history
    .slice(0, 5)
    .map((entry) =>
      [entry.title ? `${entry.title} at ${entry.employer}` : entry.employer, entry.description]
        .filter(Boolean)
        .join(' - '),
    )
    .join('; ')}`
}

function formatEducation(history: EducationEntry[] | null) {
  if (!history?.length) return null
  return `Education history: ${history
    .slice(0, 5)
    .map((entry) => [entry.school, entry.degree, entry.field].filter(Boolean).join(', '))
    .join('; ')}`
}
