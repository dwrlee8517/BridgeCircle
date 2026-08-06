/**
 * Stand-in for `next/navigation`, aliased in vitest.integration.config.ts.
 *
 * In real Next, redirect()/notFound() halt an action by throwing a sentinel
 * the framework catches. Server actions here rely on that control flow (e.g.
 * sign-in and join redirect on success instead of returning). We reproduce it
 * with typed errors; apiClient.callAction() catches them and reports the
 * destination so tests can assert "redirected to /onboarding".
 */

export class RedirectError extends Error {
  constructor(public readonly destination: string) {
    super(`NEXT_REDIRECT:${destination}`)
    this.name = 'RedirectError'
  }
}

export class NotFoundError extends Error {
  constructor() {
    super('NEXT_NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export function isRedirectError(error: unknown): error is RedirectError {
  return error instanceof RedirectError
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}

export function redirect(destination: string): never {
  throw new RedirectError(destination)
}

export function permanentRedirect(destination: string): never {
  throw new RedirectError(destination)
}

export function notFound(): never {
  throw new NotFoundError()
}
