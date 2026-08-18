import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** 32 random bytes, base64url — the shareable secret in the demo link. */
export function generateDemoToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashDemoToken(token) }
}

/** Only sha256 hex digests are stored; the plaintext token lives in the link. */
export function hashDemoToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function tokenHashesEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8')
  const bufferB = Buffer.from(b, 'utf8')
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}
