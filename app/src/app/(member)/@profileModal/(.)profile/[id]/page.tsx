import { MemberProfileContent } from '@/app/(member)/profile/[id]/member-profile-content'
import { HardNavigate } from './hard-navigate'

export default async function InterceptedProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // `/profile/me` is the self-profile page, not a member id — the dynamic
  // interceptor still captures it on soft navigation. Hand it back to a full
  // page load instead of resolving "me" as a userId (which 404s).
  if (id === 'me') return <HardNavigate href="/profile/me" />

  return <MemberProfileContent id={id} presentation="overlay" />
}
