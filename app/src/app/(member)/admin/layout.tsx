import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <>
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2 text-sm">
          <span className="font-medium text-muted-foreground">Admin</span>
          <nav className="flex gap-3">
            <Link href="/admin/invite" className="hover:underline">
              Invite
            </Link>
            <Link href="/admin/members" className="hover:underline">
              Members
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </>
  )
}
