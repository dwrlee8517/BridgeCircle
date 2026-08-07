import { createYoga } from 'graphql-yoga'
import { buildContext } from '@/graphql/context'
import { schema } from '@/graphql/schema'

/**
 * The GraphQL HTTP endpoint — the data plane's surface for client components
 * and (later) external callers. Server Components should read via in-process
 * execution (`@/graphql/execute`) rather than self-calling this route.
 *
 * Context is built per request from the same `buildContext` the in-process path
 * uses, so RLS is enforced identically on both entry points.
 */
const { handleRequest } = createYoga({
  schema,
  // Pass the request so `buildContext` can honor `Authorization: Bearer`
  // (parity harness / non-browser callers); cookie auth still works otherwise.
  context: ({ request }) => buildContext(request),
  graphqlEndpoint: '/api/graphql',
  // Next's App Router supplies the WHATWG Response; hand it to Yoga.
  fetchAPI: { Response },
})

// Wrap Yoga's handler in Next-shaped route handlers. Exporting `handleRequest`
// directly fails Next's build-time route-type validation: Yoga's
// `(request, serverContext)` signature isn't assignable to Next's
// `(NextRequest, { params })`. A thin `(request) => handleRequest(request, {})`
// wrapper satisfies Next and still hands Yoga the request its context reads.
function handle(request: Request): Response | Promise<Response> {
  return handleRequest(request, {})
}

export const GET = handle
export const POST = handle
export const OPTIONS = handle

// Resolvers read cookies (RLS), so the route must never be statically cached,
// and it needs the Node runtime for the Supabase client.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
