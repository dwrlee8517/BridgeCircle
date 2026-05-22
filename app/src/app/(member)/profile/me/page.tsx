import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'

export default async function MyProfileRedirectPage() {
  const session = await requireSession()
  redirect(`/profile/${session.userId}`)
}
