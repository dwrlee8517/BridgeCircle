/**
 * Type-only bridge to the web app's generated Supabase types. There is one
 * schema and one `pnpm db:types` output; mobile must not fork it. The import
 * is erased at compile time, so Metro never bundles anything from ../../app.
 */
export type { Database } from '../../../app/src/db/database.types'
