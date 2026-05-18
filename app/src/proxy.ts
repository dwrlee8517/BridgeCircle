import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Routes accessible without an authenticated session. Everything else gets
// bounced to /sign-in?next=<path>.
const PUBLIC_PREFIXES = ['/sign-in', '/join', '/auth']

export async function proxy(request: NextRequest) {
  // Forward the pathname as a request header so server-component layouts
  // can read it. Next.js doesn't expose pathname natively in server
  // components, and the (member) layout needs it to exempt specific routes
  // (e.g. /profile/import is reachable during onboarding via Step 2/3/4's
  // "Import from LinkedIn" link, so it must not be gated on
  // onboarding_completed_at).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request: { headers: requestHeaders } })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

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
    // Skip Next internals and static files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
