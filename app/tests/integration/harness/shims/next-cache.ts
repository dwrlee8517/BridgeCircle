/**
 * Stand-in for `next/cache`, aliased in vitest.integration.config.ts.
 *
 * There is no App Router cache in-process, so revalidation is a no-op — but we
 * record the calls so a test can assert that a mutation asked the right path
 * to revalidate, if it cares to.
 */

export type RevalidationCall = { kind: 'path' | 'tag'; value: string }

const calls: RevalidationCall[] = []

export function revalidatePath(path: string): void {
  calls.push({ kind: 'path', value: path })
}

export function revalidateTag(tag: string): void {
  calls.push({ kind: 'tag', value: tag })
}

/** Test helper: revalidation calls recorded so far. */
export function recordedRevalidations(): readonly RevalidationCall[] {
  return calls
}

/** Test helper: clear the recorded revalidations (call in beforeEach). */
export function clearRevalidations(): void {
  calls.length = 0
}
