import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/db/server'
import { draftAsk } from '@/lib/asks/draftAsk'
import { askCommitmentSchema, askTypeSchema, draftVariantSchema } from '@/lib/asks/schemas'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'

const bodySchema = z.object({
  helperId: z.uuid(),
  askType: askTypeSchema,
  userText: z.string().max(2000).optional(),
  variant: draftVariantSchema.optional().nullable(),
  context: z.string().max(2000).optional().nullable(),
  // Signal sentences from the guided flow's mentions / evidence step.
  // Capped to keep the prompt bounded; the flows surface at most a
  // handful of candidates plus the asker's own additions.
  signals: z.array(z.string().max(400)).max(8).optional().nullable(),
  // The pace picked in the mentorship flow — the note names it plainly.
  commitment: askCommitmentSchema.optional().nullable(),
})

/**
 * POST /api/asks/draft — generate a first-draft ask body via Claude Haiku.
 *
 * The route is the thinnest shell allowed by the /lib discipline: parse
 * input → check auth → fetch the two profiles → hand the structured
 * personae to draftAsk → JSON-respond. All prompt + Anthropic logic lives
 * in lib/asks/draftAsk.ts so it stays testable and framework-agnostic.
 *
 * Privacy: the helper profile is fetched through getProfile with the
 * asker as viewerId, so the same redaction rules that apply to viewing
 * the profile apply to what feeds the draft. The model only sees
 * directory-tier attributes (name / role / employer / city / school /
 * mentoring topics) — never the asker's private friends-only fields.
 */
export async function POST(req: Request) {
  const session = await requireSession()
  const supabase = await createClient()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', detail: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (parsed.data.helperId === session.userId) {
    return NextResponse.json({ error: 'self_request' }, { status: 400 })
  }

  const [helperProfile, askerProfile] = await Promise.all([
    getProfile(supabase, parsed.data.helperId, session.userId),
    getProfile(supabase, session.userId, session.userId),
  ])

  if (!helperProfile || !askerProfile) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const result = await draftAsk({
    askType: parsed.data.askType,
    userText: parsed.data.userText,
    variant: parsed.data.variant ?? null,
    context: parsed.data.context ?? null,
    signals: parsed.data.signals ?? null,
    commitment: parsed.data.commitment ?? null,
    asker: {
      name: askerProfile.name,
      graduationYear: askerProfile.graduationYear,
      headline: askerProfile.headline,
      bio: askerProfile.bio,
      currentTitle: askerProfile.currentTitle,
      currentEmployer: askerProfile.currentEmployer,
      city: askerProfile.city,
      university: askerProfile.university,
      major: askerProfile.major,
    },
    helper: {
      name: helperProfile.name,
      graduationYear: helperProfile.graduationYear,
      headline: helperProfile.headline,
      bio: helperProfile.bio,
      currentTitle: helperProfile.currentTitle,
      currentEmployer: helperProfile.currentEmployer,
      city: helperProfile.city,
      university: helperProfile.university,
      major: helperProfile.major,
      mentoringTopics: helperProfile.mentoringTopics,
      // Privacy is already applied by getProfile — careerHistory is null
      // when the helper has redacted it, which the drafter handles fine.
      careerHistory:
        helperProfile.careerHistory?.map((e) => ({
          employer: e.employer,
          title: e.title,
          startDate: e.start_date,
          endDate: e.end_date,
        })) ?? null,
    },
  })

  if (!result.ok) {
    // 503 for upstream failures (no key / API down) — these are recoverable
    // from the user's POV (just type the ask manually). 400 for invalid
    // input was handled above.
    // Surface to server logs so dev-time failures are debuggable; the
    // detail field can contain the upstream error message which is too
    // long for the flow's tiny error slot.
    console.error('[asks/draft] draftAsk failed', {
      error: result.error,
      detail: result.detail,
      askType: parsed.data.askType,
      hasContext: !!parsed.data.context,
      signalCount: parsed.data.signals?.length ?? 0,
    })
    // Capture to Sentry too — these are infra failures (no API key, Anthropic
    // down, model error). The global onRequestError handler doesn't fire here
    // because we caught the failure and mapped it to a 503 ourselves.
    Sentry.captureException(new Error(`draftAsk failed: ${result.error}`), {
      extra: {
        scope: 'asks-draft-route',
        error: result.error,
        detail: result.detail,
        askType: parsed.data.askType,
        hasContext: !!parsed.data.context,
        signalCount: parsed.data.signals?.length ?? 0,
      },
    })
    return NextResponse.json({ error: result.error, detail: result.detail }, { status: 503 })
  }

  return NextResponse.json({
    helpNeeded: result.helpNeeded,
    reason: result.reason,
    coach: result.coach,
  })
}
