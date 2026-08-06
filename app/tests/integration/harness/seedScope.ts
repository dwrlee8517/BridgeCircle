import { randomUUID } from 'node:crypto'

/**
 * Namespacing for everything a test creates.
 *
 * Two rules make one shared database safe to create-and-destroy against:
 *
 *  1. Every seeded row carries a run-scoped, recognizable marker — emails
 *     start with EMAIL_PREFIX, org slugs with ORG_SLUG_PREFIX, both embedding
 *     a per-run id. Two runs (or two tests) can never collide, and the app's
 *     own org isolation means tenants seeded by different tests can't see each
 *     other's data even on shared local Supabase.
 *
 *  2. The markers are greppable, so resetDb's sweep can find and purge any
 *     leftovers from a crashed run — the backstop for the Dev-DB target.
 */

export const EMAIL_PREFIX = 'it+'
export const ORG_SLUG_PREFIX = 'it-'
export const EMAIL_DOMAIN = 'bridgecircle.test'

function shortRunId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 10)
}

export class SeedScope {
  readonly runId: string
  private counter = 0

  constructor(runId?: string) {
    this.runId = runId ?? shortRunId()
  }

  private nextSuffix(): string {
    const n = this.counter
    this.counter += 1
    return n.toString(36)
  }

  /** A unique, sweep-recognizable email, e.g. it+ab12cd34ef-admin-0@bridgecircle.test */
  email(label = 'user'): string {
    return `${EMAIL_PREFIX}${this.runId}-${label}-${this.nextSuffix()}@${EMAIL_DOMAIN}`
  }

  /** A unique, sweep-recognizable org slug, e.g. it-ab12cd34ef-0 */
  slug(): string {
    return `${ORG_SLUG_PREFIX}${this.runId}-${this.nextSuffix()}`
  }

  orgName(label = 'Org'): string {
    return `IT ${this.runId} ${label}`
  }
}
