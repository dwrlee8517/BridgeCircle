import 'server-only'
import { graphql } from 'graphql'
import { buildContext } from './context'
import { schema } from './schema'

/**
 * Execute an operation against the schema *in-process*, with no HTTP hop.
 *
 * This is how Server Components read from the graph: same Node process, same
 * request scope (so `cookies()` → the RLS client still works), zero network
 * round-trip to our own endpoint. The HTTP route at `/api/graphql` is for
 * client components and external callers.
 */
export async function executeGraphQL<TData = Record<string, unknown>>(
  source: string,
  variableValues?: Record<string, unknown>,
): Promise<TData> {
  const result = await graphql({
    schema,
    source,
    contextValue: await buildContext(),
    variableValues,
  })
  if (result.errors?.length) {
    throw new Error(`GraphQL execution failed: ${result.errors.map((e) => e.message).join('; ')}`)
  }
  return result.data as TData
}
