import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from '../(auth)/sign-in/actions'
import { Button } from '@/components/ui/button'

// Per phase-1-launch-spec.md:38, home should redirect to /search until the
// Discover home ships in week 3+. Search isn't built yet, so for now this
// is a placeholder that confirms the auth + onboarding gates work end-to-end.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to BridgeCircle</CardTitle>
          <CardDescription>
            You're signed in and your profile is set up. Search and discovery features land in
            the next pull request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
