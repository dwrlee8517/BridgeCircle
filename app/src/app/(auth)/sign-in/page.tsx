import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { safeNextPath } from '@/lib/entry/routing'
import { SignInForm } from './sign-in-form'

type SearchParams = { next?: string; error?: string }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const session = await getSession()
  if (session) {
    redirect(safeNextPath(params.next))
  }
  return <SignInForm next={params.next ?? null} initialError={params.error ?? null} />
}
