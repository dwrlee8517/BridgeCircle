import { MemberProfileContent } from '@/app/(member)/profile/[id]/member-profile-content'

export default async function InterceptedProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <MemberProfileContent id={id} presentation="overlay" />
}
