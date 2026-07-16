import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from '../(auth)/sign-in/actions'
import { CancelForm } from './cancel-form'

export default async function CancelDeletePage() {
  const { context } = await loadMemberContext()
  if (context.accountState !== 'deletion_scheduled' || !context.deleteScheduledFor) redirect('/')
  if (context.deleteInitiatedByAdmin || context.deletedAt) redirect('/sign-in')

  const dueText = new Date(context.deleteScheduledFor).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your account is scheduled for deletion</CardTitle>
          <CardDescription>
            Your profile data is scheduled to be removed on {dueText}. You can safely cancel any
            time before finalization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CancelForm />
          <p className="text-xs text-muted-foreground">
            To continue with deletion, close this page. No further action is needed.
          </p>
        </CardContent>
      </Card>
      <form action={signOut}>
        <button type="submit" className="text-xs text-muted-foreground hover:underline">
          Sign out
        </button>
      </form>
    </div>
  )
}
