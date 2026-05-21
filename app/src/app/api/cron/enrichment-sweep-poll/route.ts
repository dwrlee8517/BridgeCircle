import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { pollSweep } from '@/lib/enrichment/sweep'

/**
 * POST /api/cron/enrichment-sweep-poll
 *
 * Triggered every 5 minutes by Supabase pg_cron. Drains any pending sweep
 * snapshots whose Bright Data data has landed and emits proposals / auto-
 * applies for each eligible record.
 *
 * Auth: shared-secret header, same as enrichment-sweep-start.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization')
  const expected = process.env.SUPABASE_FUNCTIONS_INTERNAL_TOKEN
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await pollSweep()
    if (!result.ok) {
      Sentry.captureException(new Error(`enrichment-sweep-poll failed: ${result.error}`))
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
    }

    return NextResponse.json(result)
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
