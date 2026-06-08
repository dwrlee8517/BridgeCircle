import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { SearchHit } from '../searchAlumni'
import { askMatchingExplanations } from './config'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_OUTPUT_TOKENS = 1000

export type MatchExplanationInput = {
  query: string
  hit: SearchHit
  evidence: string[]
}

export type MatchExplanation = {
  userId: string
  rationale: string
}

const explanationSchema = z.object({
  explanations: z
    .array(
      z.object({
        id: z.string().min(1),
        rationale: z.string().trim().min(1).max(400),
      }),
    )
    .max(10),
})

const SYSTEM_PROMPT = `You write short match explanations for BridgeCircle.

Use only the raw visible evidence provided. Do not cite generated profile passages.
Return JSON only:
{
  "explanations": [
    { "id": "<candidate id>", "rationale": "<one sentence citing concrete evidence>" }
  ]
}`

export async function explainMatches(
  query: string,
  inputs: MatchExplanationInput[],
): Promise<MatchExplanation[]> {
  if (askMatchingExplanations() !== 'haiku_polish') {
    return inputs.map((input) => ({
      userId: input.hit.userId,
      rationale: templatedExplanation(input),
    }))
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return inputs.map((input) => ({
      userId: input.hit.userId,
      rationale: templatedExplanation(input),
    }))
  }

  const client = new Anthropic({ apiKey })
  const payload = {
    query,
    candidates: inputs.map((input) => ({
      id: input.hit.userId,
      name: input.hit.name,
      currentTitle: input.hit.currentTitle,
      currentEmployer: input.hit.currentEmployer,
      city: input.hit.city,
      university: input.hit.university,
      major: input.hit.major,
      graduationYear: input.hit.graduationYear,
      evidence: input.evidence.slice(0, 6),
    })),
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: [{ type: 'text', text: JSON.stringify(payload) }] },
        { role: 'assistant', content: [{ type: 'text', text: '{' }] },
      ],
    })
    const block = response.content[0]
    if (!block || block.type !== 'text') throw new Error('no text block')
    const parsed = explanationSchema.parse(JSON.parse(`{${block.text}`))
    const byId = new Map(parsed.explanations.map((e) => [e.id, e.rationale]))
    return inputs.map((input) => ({
      userId: input.hit.userId,
      rationale: byId.get(input.hit.userId) ?? templatedExplanation(input),
    }))
  } catch {
    return inputs.map((input) => ({
      userId: input.hit.userId,
      rationale: templatedExplanation(input),
    }))
  }
}

export function templatedExplanation(input: MatchExplanationInput): string {
  const concrete = input.evidence.find((item) => item.trim().length > 0)
  if (concrete) return concrete
  if (input.hit.reason) return input.hit.reason
  const role =
    input.hit.currentTitle && input.hit.currentEmployer
      ? `${input.hit.currentTitle} at ${input.hit.currentEmployer}`
      : input.hit.currentTitle || input.hit.currentEmployer
  if (role) return `${role} in your BridgeCircle network.`
  return 'In your BridgeCircle network.'
}
