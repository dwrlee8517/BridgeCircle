import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { SignInForm } from './sign-in-form'

type SearchParams = { next?: string }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const session = await getSession()
  if (session) {
    redirect(params.next?.startsWith('/') ? params.next : '/')
  }
  return <SignInForm next={params.next ?? null} />
}
