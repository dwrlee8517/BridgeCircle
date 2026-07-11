import { NextResponse } from 'next/server'

/**
 * GET /api/health — liveness probe.
 *
 * Consumed by Railway's healthcheck (railway.json, CI/CD Phase 3) and the
 * post-deploy smoke gate (smoke.yml, Phase 5), which polls until `sha`
 * matches the commit it just shipped before running the suite.
 *
 * Deliberately dependency-free: no Supabase, no auth, no DB. A 200 here
 * means "this build of the Next.js server is up and serving" — nothing
 * more. The proxy matcher excludes api/health so unauthenticated probes
 * are never redirected to /sign-in and never pay the session-refresh
 * round-trip to Supabase.
 */

// Never statically prerender — the probe must execute per request.
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    // Which build is live. Railway git-triggered deploys inject
    // RAILWAY_GIT_COMMIT_SHA; CLI deploys (deploy.yml, Phase 7) set
    // COMMIT_SHA as a service variable instead.
    sha: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA ?? 'unknown',
  })
}
