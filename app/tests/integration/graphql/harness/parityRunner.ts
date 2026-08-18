import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createClient } from '@/db/server'
import { executeGraphQL } from '@/graphql/execute'
import type { CookieJar } from '../../harness/cookieJar'
import { runWithJar } from '../../harness/cookieJar'

/**
 * The two sides of a parity diff, both bound to the SAME identity.
 *
 * `docs/architecture/graphql-parity.md` specifies GraphQL over HTTP with a
 * bearer token. We run it in-process instead, for the reason the whole
 * integration tier exists (tests/integration/README.md): importing and calling
 * the real functions is what lets v8 record their coverage, and firing HTTP at
 * a dev server would instrument nothing. In-process is also the path the
 * cutover actually takes — Server Components read through `executeGraphQL`,
 * not through `/api/graphql`. The bearer path is covered separately in
 * authBoundary.int.test.ts so the documented external contract stays honest.
 *
 * Both helpers run inside `runWithJar`, so `cookies()` resolves to that user's
 * session and every Supabase client built underneath is user-scoped. Neither
 * side may touch the service-role client — that would bypass RLS and make the
 * comparison meaningless.
 */

export function graphqlAs<T = Record<string, unknown>>(
  jar: CookieJar,
  document: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return runWithJar(jar, () => executeGraphQL<T>(document, variables))
}

export function repositoryAs<T>(
  jar: CookieJar,
  fn: (db: SupabaseClient<Database>) => Promise<T>,
): Promise<T> {
  return runWithJar(jar, async () => fn(await createClient()))
}
