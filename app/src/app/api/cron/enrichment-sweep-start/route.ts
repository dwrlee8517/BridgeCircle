import { type NextRequest, NextResponse } from 'next/server'
import { startSweep } from '@/lib/enrichment/sweep'

/**
 * POST /api/cron/enrichment-sweep-start
 *
 * Triggered monthly by Supabase pg_cron via `net.http_post`. Kicks off a
 * Bright Data snapshot for all eligible members. The poll route drains the
 * snapshot once it's ready (separate 5-min cron).
 *
 * Auth: shared-secret header. pg_cron passes the token from a Supabase Vault
 * secret. Public POSTs without the token get 401.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization')
  const expected = process.env.SUPABASE_FUNCTIONS_INTERNAL_TOKEN
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const result = await startSweep()
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    jobId: result.jobId,
    memberCount: result.memberCount,
    snapshotId: result.snapshotId,
  })
}
