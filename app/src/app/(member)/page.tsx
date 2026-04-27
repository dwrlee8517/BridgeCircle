import { redirect } from 'next/navigation'

// Per phase-1-launch-spec.md:38, home redirects to /search until the Discover
// home ships in week 3+. Auth + onboarding gates already ran in (member)/layout.
export default function HomePage() {
  redirect('/search')
}
