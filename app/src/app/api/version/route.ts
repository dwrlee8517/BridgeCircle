import { NextResponse } from 'next/server'

/**
 * GET /api/version — which commit is this deployment running?
 *
 * The CD pipeline (ADR 0014) polls this on the dev stage to confirm the
 * deploy it is about to integ-test is the commit it just shipped.
 *
 * GIT_SHA is stamped by the pipeline for `railway up` deploys (which have
 * no git context); RAILWAY_GIT_COMMIT_SHA covers git-connected deploys
 * during the Phase 1–2 scaffolding era. Unauthenticated on purpose: a
 * public commit SHA of an open deployment is not sensitive, and the
 * readiness check runs before any session exists.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    sha: process.env.GIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? null,
    env: process.env.APP_ENV ?? null,
  })
}
