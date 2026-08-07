import SchemaBuilder from '@pothos/core'
import DataloaderPlugin from '@pothos/plugin-dataloader'
import RelayPlugin from '@pothos/plugin-relay'
import type { GraphQLContext } from './context'

/**
 * The Pothos schema builder — the single registry every entity attaches to.
 *
 * Plugins:
 * - Relay: powers the cursor `Connection`/`Edge` types that pagination lands on
 *   in Phase 1 (join tables become edges carrying relationship metadata).
 * - Dataloader: batch-loading for entity relationship fields.
 *
 * Context is `GraphQLContext`, so every resolver receives the RLS-scoped
 * Supabase client and the (nullable) session.
 */
export const builder = new SchemaBuilder<{ Context: GraphQLContext }>({
  plugins: [RelayPlugin, DataloaderPlugin],
  relay: {},
})

builder.queryType({})
// mutationType is declared by the first slice that adds a mutation — an empty
// Mutation type is invalid GraphQL.
