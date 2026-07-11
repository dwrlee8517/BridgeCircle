import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Routes accessible without an authenticated session. Everything else gets
// bounced to /sign-in?next=<path>. /reset-password/update is intentionally
// NOT public — the recovery link signs the user in via /auth/callback first.
// /api/version is the CD readiness probe (ADR 0014) — CI polls it with no
// session, and it exposes only the running commit SHA.
const PUBLIC_PREFIXES = ['/sign-in', '/join', '/auth', '/reset-password', '/api/version']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for proxy client')
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next()
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Refresh session cookie if expired. Returns the JWT-derived user — fast,
  // no DB call. (Real auth gating still happens in (member)/layout.tsx; the
  // proxy only does an optimistic redirect for unauthenticated requests.)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!user && !isPublic) {
    const next = pathname + (search ?? '')
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.search = `?next=${encodeURIComponent(next)}`
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Skip Next internals, static files, and the liveness probe.
    // api/health must stay out of the proxy entirely: Railway's healthcheck
    // and the post-deploy smoke gate probe it without a session, and a
    // redirect to /sign-in would read as "unhealthy". Skipping the matcher
    // (rather than adding a PUBLIC_PREFIXES entry) also spares the probe
    // the per-request session-refresh call to Supabase.
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
