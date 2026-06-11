import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_OUTPUT_TOKENS = 2048

/**
 * The shape we send the LLM per candidate. Keep this lean — token cost scales
 * linearly with pool size. Anything that doesn't help thematic matching is
 * dropped (avatar, raw IDs, links).
 */
export type RerankCandidate = {
  id: string
  name: string
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  bio: string | null
  mentoringTopics: string[] | null
  careerHistory: Array<{
    employer: string
    title: string
    start_date: string | null
    end_date: string | null
    description: string | null
  }> | null
  educationHistory: Array<{
    school: string
    degree: string | null
    field: string | null
    start_date: string | null
    end_date: string | null
  }> | null
  skills: string[] | null
}

const rerankRankingSchema = z.object({
  id: z.string().min(1),
  score: z.number().min(0).max(100),
  rationale: z.string().trim().max(400),
})

const rerankResponseSchema = z.object({
  rankings: z.array(rerankRankingSchema).max(50),
})

export type RerankRanking = z.infer<typeof rerankRankingSchema>

export type RerankResult =
  | { ok: true; rankings: RerankRanking[] }
  | {
      ok: false
      error: 'no_api_key' | 'llm_call_failed' | 'invalid_response' | 'no_candidates'
      detail?: string
    }

const SYSTEM_PROMPT = `You rank alumni candidates against a member's free-text query.

You receive:
- query: what the member is looking for (free text)
- theme: a short noun phrase capturing the substantive intent (may be null)
- candidates: an array of alumni with current role + full career history + education + skills + bio + mentoring topics

Return ONLY a JSON object of this shape — no prose, no markdown fences:

{
  "rankings": [
    { "id": "<candidate.id>", "score": 0-100, "rationale": "<one sentence>" }
  ]
}

Ranking rules:
- Score is 0-100. 90+ means strong match (their past or current work directly matches the theme). 60-89 means partial / adjacent match. Below 60 means weak.
- Score EVERY candidate and return a ranking for each one — weak fits included. Low scores with honest rationales are useful: the UI shows them as longer shots, dimmed, so members can widen their search deliberately.
- READ PAST CAREER ROLES, not just current title. A candidate whose current title is "Creative Director" but who was a "Photo Editor at Vogue 2012-2014" is a STRONG match for a photography query.
- READ SKILLS AND BIO too — they often capture intent that titles don't.
- Rationale must cite the specific evidence: "Past role at Vogue Korea as Photo Editor 2012-2014" is good. "Has relevant experience" is bad.
- For weak fits, the rationale must say plainly what is missing: "Shared school context only — no startup or consulting experience" is good. Never inflate.
- Order by score descending.
- If candidates is empty, return { "rankings": [] }.
- Use the candidate id field exactly as given — do not invent ids.`

export type RerankInput = {
  query: string
  theme: string | null
  candidates: RerankCandidate[]
  limit?: number
}

/**
 * Step 3 of the NL search pipeline: thematically rerank a narrowed candidate
 * pool against the original query.
 *
 * Cost: ~50-150 tokens per candidate × pool size + ~500 system tokens. At a
 * 30-candidate pool that's ~5K input + ~1K output ≈ $0.005-0.015 per call.
 *
 * Caller should narrow the pool to <=30 candidates before calling here. The
 * scalar filter step in searchAlumni does that via score-then-slice.
 */
export async function rerankCandidates(input: RerankInput): Promise<RerankResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'no_api_key' }
  if (input.candidates.length === 0) return { ok: false, error: 'no_candidates' }

  const client = new Anthropic({ apiKey })

  const userPayload = {
    query: input.query,
    theme: input.theme,
    candidates: input.candidates,
  }

  let raw: string
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: [{ type: 'text', text: JSON.stringify(userPayload) }] },
        // Prefill `{` to nudge JSON-only output.
        { role: 'assistant', content: [{ type: 'text', text: '{' }] },
      ],
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') {
      return { ok: false, error: 'invalid_response', detail: 'no text block' }
    }
    raw = `{${block.text}`
  } catch (err) {
    return {
      ok: false,
      error: 'llm_call_failed',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalid_response', detail: 'not valid JSON' }
  }

  const validated = rerankResponseSchema.safeParse(parsed)
  if (!validated.success) {
    return {
      ok: false,
      error: 'invalid_response',
      detail: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    }
  }

  const limit = input.limit ?? 10
  const validIds = new Set(input.candidates.map((c) => c.id))
  // Dedupe by id, keeping the first (highest-scored after sort) entry —
  // with score-everything prompting the model occasionally lists a
  // candidate twice.
  const seen = new Set<string>()
  const rankings = validated.data.rankings
    .filter((r) => validIds.has(r.id))
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
    .slice(0, limit)

  return { ok: true, rankings }
}
