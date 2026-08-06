import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * A per-"browser" cookie store.
 *
 * Server actions authenticate by reading and writing cookies through Next's
 * `cookies()` helper: `supabase.auth.signInWithPassword` writes the session
 * cookies, and every later `createClient()` reads them back to recover the
 * user. In-process we replace `next/headers` (see shims/next-headers.ts) with
 * a shim that returns the CookieJar bound to the current async context, so a
 * real Supabase session survives across action calls exactly as it would
 * across HTTP requests in the same browser — no faked JWTs.
 *
 * One jar == one signed-in identity. Give each test user their own jar.
 */

type StoredCookie = {
  name: string
  value: string
  options?: Record<string, unknown>
}

// Next's cookies().set accepts either (name, value, options) or a single
// { name, value, ...options } object. @supabase/ssr uses the 3-arg form via
// src/db/server.ts, but we accept both so any caller shape works.
type CookieObject = { name: string; value: string } & Record<string, unknown>

export class CookieJar {
  private store = new Map<string, StoredCookie>()

  getAll(): Array<{ name: string; value: string }> {
    return [...this.store.values()].map(({ name, value }) => ({ name, value }))
  }

  get(name: string): { name: string; value: string } | undefined {
    const c = this.store.get(name)
    return c ? { name: c.name, value: c.value } : undefined
  }

  set(
    nameOrCookie: string | CookieObject,
    value?: string,
    options?: Record<string, unknown>,
  ): void {
    if (typeof nameOrCookie === 'object') {
      const { name, value: cookieValue, ...rest } = nameOrCookie
      this.store.set(name, { name, value: cookieValue, options: rest })
      return
    }
    this.store.set(nameOrCookie, { name: nameOrCookie, value: value ?? '', options })
  }

  delete(name: string): void {
    this.store.delete(name)
  }

  /** True once a Supabase auth cookie is present — i.e. this jar is signed in. */
  hasSession(): boolean {
    for (const name of this.store.keys()) {
      if (name.startsWith('sb-') && name.includes('auth-token')) return true
    }
    return false
  }
}

const jarContext = new AsyncLocalStorage<CookieJar>()

/**
 * Run `fn` with `jar` bound as the ambient cookie store. Any `cookies()` call
 * (and therefore any Supabase server client) created inside `fn` — across
 * awaits — reads and writes this jar. This is how apiClient drives an action
 * "as" a particular user.
 */
export function runWithJar<T>(jar: CookieJar, fn: () => Promise<T>): Promise<T> {
  return jarContext.run(jar, fn)
}

/** The jar bound to the current async context, or null outside runWithJar. */
export function currentJar(): CookieJar | null {
  return jarContext.getStore() ?? null
}
