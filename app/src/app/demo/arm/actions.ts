'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/db/admin'
import { createDemoWindowsRepository } from '@/db/repositories/demo-windows'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession, type Session } from '@/lib/auth/session'
import { authorizeDemoDoor, isDemoOperator } from '@/lib/demo/gate'
import { armDemoWindow, closeDemoWindow, parseDemoWindowDuration } from '@/lib/demo/windows'

export type DemoArmState = {
  error?: string
  link?: string
  expiresAt?: string
}

/**
 * Same fail-closed posture as the door route: gate must be open and the
 * signed-in user must be an allowlisted operator, re-checked inside every
 * action rather than trusted from the page render.
 */
async function requireDemoOperator(): Promise<Session | null> {
  try {
    const open = authorizeDemoDoor({
      enabled: process.env.DEMO_LOGIN_ENABLED,
      appEnv: process.env.APP_ENV,
      configuredAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    })
    if (!open) return null
  } catch (error) {
    console.error('demo arm misconfiguration', error)
    return null
  }

  const session = await requireSession('/demo/arm')
  if (!isDemoOperator(session.email, process.env.DEMO_ARM_EMAILS)) return null
  return session
}

export async function armDemo(_prev: DemoArmState, formData: FormData): Promise<DemoArmState> {
  const session = await requireDemoOperator()
  if (!session) return { error: 'Not available.' }

  const duration = parseDemoWindowDuration(formData.get('duration'))
  if (!duration) return { error: 'Pick one of the offered durations.' }

  const { token, expiresAt } = await armDemoWindow({
    repository: createDemoWindowsRepository(createAdminClient()),
    now: new Date(),
    durationMinutes: duration,
    armedByUserId: session.userId,
  })

  const origin = await getAppOrigin()
  revalidatePath('/demo/arm')
  return {
    link: `${origin}/demo?k=${token}`,
    expiresAt: expiresAt.toISOString(),
  }
}

export async function closeDemo(_prev: DemoArmState): Promise<DemoArmState> {
  const session = await requireDemoOperator()
  if (!session) return { error: 'Not available.' }

  await closeDemoWindow({
    repository: createDemoWindowsRepository(createAdminClient()),
    now: new Date(),
  })
  revalidatePath('/demo/arm')
  return {}
}
