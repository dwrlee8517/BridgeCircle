import { generateDemoToken, hashDemoToken, tokenHashesEqual } from '@/lib/demo/token'

/** Durations the arm page offers. Anything else is rejected. */
export const DEMO_WINDOW_DURATION_MINUTES = [30, 120, 480] as const
export type DemoWindowDuration = (typeof DEMO_WINDOW_DURATION_MINUTES)[number]

export type DemoWindowRecord = {
  id: string
  tokenHash: string
  expiresAt: string
  createdAt: string
}

/**
 * Persistence + session side effects, injected per the /lib discipline.
 * The production implementation wraps the service-role admin client
 * (db/repositories/demo-windows.ts).
 */
export type DemoWindowsRepository = {
  insertWindow(input: { tokenHash: string; expiresAt: Date; armedByUserId: string }): Promise<void>
  /** Windows with revoked_at null and expires_at in the future. */
  activeWindows(now: Date): Promise<DemoWindowRecord[]>
  /** Marks every unexpired window revoked. */
  revokeAllWindows(now: Date): Promise<void>
  /** Ends auth sessions for all demo-org members (api.demo_revoke_sessions). */
  revokeDemoSessions(): Promise<void>
}

export function parseDemoWindowDuration(value: unknown): DemoWindowDuration | null {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN
  const match = DEMO_WINDOW_DURATION_MINUTES.find((duration) => duration === parsed)
  return match ?? null
}

/**
 * Opens a new window: closes any previous one, boots lingering demo sessions,
 * and mints a fresh token. The plaintext token is returned exactly once — the
 * caller shows it in the shareable link and it is never recoverable later.
 */
export async function armDemoWindow(input: {
  repository: DemoWindowsRepository
  now: Date
  durationMinutes: DemoWindowDuration
  armedByUserId: string
}): Promise<{ token: string; expiresAt: Date }> {
  const { repository, now, durationMinutes, armedByUserId } = input

  await repository.revokeAllWindows(now)
  await repository.revokeDemoSessions()

  const { token, tokenHash } = generateDemoToken()
  const expiresAt = new Date(now.getTime() + durationMinutes * 60_000)
  await repository.insertWindow({ tokenHash, expiresAt, armedByUserId })

  return { token, expiresAt }
}

/** Closes the door immediately and boots current demo sessions. */
export async function closeDemoWindow(input: {
  repository: DemoWindowsRepository
  now: Date
}): Promise<void> {
  await input.repository.revokeAllWindows(input.now)
  await input.repository.revokeDemoSessions()
}

/** True only when an open window exists whose token matches. */
export async function validateDemoEntry(input: {
  repository: DemoWindowsRepository
  now: Date
  token: string
}): Promise<boolean> {
  const { repository, now, token } = input
  if (token.length < 16 || token.length > 128) return false

  const candidateHash = hashDemoToken(token)
  const windows = await repository.activeWindows(now)
  return windows.some((window) => tokenHashesEqual(window.tokenHash, candidateHash))
}

/** The soonest-expiring open window, for the arm page status display. */
export async function currentDemoWindow(input: {
  repository: DemoWindowsRepository
  now: Date
}): Promise<DemoWindowRecord | null> {
  const windows = await input.repository.activeWindows(input.now)
  if (windows.length === 0) return null
  return windows.reduce((soonest, window) =>
    window.expiresAt < soonest.expiresAt ? window : soonest,
  )
}
