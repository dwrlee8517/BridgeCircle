/**
 * Pure signal derivation for the wizard's transparency step.
 *
 * Given an asker and helper profile pair, produce a ranked list of
 * "signals" the AI could lean on while drafting. The wizard shows these
 * to the asker before generation so they can drop one that feels off —
 * which is the brand-side defense against the LinkedIn-AI failure mode
 * (drafts that smell like AI because they leaned on something generic).
 *
 * This file is intentionally NOT `'server-only'` — it's pure data
 * shaping with no DB or LLM calls, and is callable from server
 * components or tests directly.
 */

export type SignalAskerSnapshot = {
  graduationYear: number | null
  university: string | null
  major: string | null
  city: string | null
}

export type SignalCareerEntry = {
  employer: string
  title: string | null
  startDate: string | null
  endDate: string | null
}

export type SignalHelperSnapshot = SignalAskerSnapshot & {
  bio: string | null
  mentoringTopics: string[] | null
  careerHistory: SignalCareerEntry[] | null
}

export type SignalCandidate = {
  /** Stable id used by the wizard for toggle keys. */
  id: string
  /** Short user-facing chip label. */
  label: string
  /** Sentence injected into the draft prompt when this signal is active. */
  promptText: string
  /** Coarse kind, mostly for ordering. Strong signals rank above weak. */
  kind:
    | 'career'
    | 'bio'
    | 'mentoring-topic'
    | 'shared-city'
    | 'shared-school'
    | 'shared-major'
    | 'near-cohort'
}

const BIO_OPENNESS_TRIGGERS = [
  'happy to talk',
  'happy to chat',
  'love to talk',
  'love to chat',
  'open to',
  'reach out',
  'message me',
  'mentor',
  'feel free',
  'glad to',
]

function firstYear(d: string | null): number | null {
  if (!d) return null
  const y = Number.parseInt(d.slice(0, 4), 10)
  return Number.isFinite(y) ? y : null
}

/**
 * Derive a ranked list of signals for the asker→helper pair, capped at
 * `maxCount`. Strong signals (career arc, bio note about openness,
 * mentoring topics) come first; weaker signals (shared school, major,
 * cohort window) come last and the prompt text tells the model to use
 * them only as a brief tail mention.
 *
 * Empty result is meaningful: the wizard skips the signals step entirely
 * when there's nothing concrete to surface.
 */
export function deriveSignals(
  asker: SignalAskerSnapshot,
  helper: SignalHelperSnapshot,
  maxCount = 4,
): SignalCandidate[] {
  const out: SignalCandidate[] = []

  // 1. Career arc — strongest signal when the helper has visible movement.
  if (helper.careerHistory && helper.careerHistory.length >= 2) {
    const dated = helper.careerHistory.filter((e) => firstYear(e.startDate) != null)
    const sorted = [...(dated.length >= 2 ? dated : helper.careerHistory)].sort((a, b) => {
      const ya = firstYear(a.startDate) ?? 0
      const yb = firstYear(b.startDate) ?? 0
      return ya - yb
    })
    const first = sorted[0]
    const latest = sorted[sorted.length - 1]
    if (first && latest && first.employer !== latest.employer) {
      const tail = latest.title ? ` (${latest.title})` : ''
      out.push({
        id: 'career-arc',
        label: `Their path: ${first.employer} → ${latest.employer}`,
        promptText: `Lead with the helper's career arc from ${first.employer} to ${latest.employer}${tail}.`,
        kind: 'career',
      })
    }
  }

  // 2. Bio invites contact — strong when present.
  if (helper.bio) {
    const lower = helper.bio.toLowerCase()
    if (BIO_OPENNESS_TRIGGERS.some((t) => lower.includes(t))) {
      out.push({
        id: 'bio-open',
        label: 'Their bio mentions being open to conversations',
        promptText:
          "The helper's bio explicitly invites this kind of outreach. Reference it warmly, without quoting verbatim.",
        kind: 'bio',
      })
    }
  }

  // 3. Mentoring topic — concrete, helper-authored.
  if (helper.mentoringTopics && helper.mentoringTopics.length > 0) {
    const topic = helper.mentoringTopics[0]
    if (topic) {
      out.push({
        id: 'mentoring-topic',
        label: `They mentor on: ${topic}`,
        promptText: `The helper has listed "${topic}" as something they mentor on. Reference it if it fits the asker's situation.`,
        kind: 'mentoring-topic',
      })
    }
  }

  // 4. Same city — medium signal.
  if (asker.city && helper.city && asker.city === helper.city) {
    out.push({
      id: 'shared-city',
      label: `You're both in ${asker.city}`,
      promptText: `You're both in ${asker.city}. Use only if it strengthens the ask; don't lead with it unless nothing stronger fits.`,
      kind: 'shared-city',
    })
  }

  // 5. Same university — weak (the prompt itself flags this as cold).
  if (asker.university && helper.university && asker.university === helper.university) {
    out.push({
      id: 'shared-school',
      label: `You both went to ${asker.university}`,
      promptText:
        'Shared school is a weak signal. Mention only as a brief tail; do not lead with it.',
      kind: 'shared-school',
    })
  }

  // 6. Same major — weak.
  if (asker.major && helper.major && asker.major === helper.major) {
    out.push({
      id: 'shared-major',
      label: `Same major: ${asker.major}`,
      promptText:
        'Shared major is a weak signal. Mention only as a brief tail; do not lead with it.',
      kind: 'shared-major',
    })
  }

  // 7. Near cohort — weak.
  if (asker.graduationYear && helper.graduationYear) {
    const diff = Math.abs(asker.graduationYear - helper.graduationYear)
    if (diff > 0 && diff <= 5) {
      out.push({
        id: 'near-cohort',
        label: `Same era: class of ${helper.graduationYear} / ${asker.graduationYear}`,
        promptText:
          'You graduated within a few years of each other. Mention briefly only if it strengthens the connection.',
        kind: 'near-cohort',
      })
    }
  }

  return out.slice(0, maxCount)
}
