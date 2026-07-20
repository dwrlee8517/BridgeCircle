import { MemberProfileContent } from './member-profile-content'

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <MemberProfileContent id={id} presentation="page" />
}
