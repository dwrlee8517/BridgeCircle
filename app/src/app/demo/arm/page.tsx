import { notFound } from 'next/navigation'
import { createAdminClient } from '@/db/admin'
import { createDemoWindowsRepository } from '@/db/repositories/demo-windows'
import { requireSession } from '@/lib/auth/session'
import { authorizeDemoDoor, isDemoOperator } from '@/lib/demo/gate'
import { currentDemoWindow } from '@/lib/demo/windows'
import { ArmForm } from './arm-form'

/**
 * Operator page for the demo door. Requires a real signed-in session AND an
 * allowlisted email (DEMO_ARM_EMAILS); everyone else gets a 404, the same as
 * when the gate is closed, so the page does not advertise its existence.
 */
export default async function DemoArmPage() {
  let open = false
  try {
    open = authorizeDemoDoor({
      enabled: process.env.DEMO_LOGIN_ENABLED,
      appEnv: process.env.APP_ENV,
      configuredAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    })
  } catch (error) {
    console.error('demo arm misconfiguration', error)
  }
  if (!open) notFound()

  const session = await requireSession('/demo/arm')
  if (!isDemoOperator(session.email, process.env.DEMO_ARM_EMAILS)) notFound()

  const window = await currentDemoWindow({
    repository: createDemoWindowsRepository(createAdminClient()),
    now: new Date(),
  })

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg items-center px-4 py-10">
      <ArmForm activeWindowExpiresAt={window?.expiresAt ?? null} />
    </main>
  )
}
