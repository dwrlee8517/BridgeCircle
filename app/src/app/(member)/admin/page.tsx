import { redirect } from 'next/navigation'

// /admin has no dashboard of its own — the admin surfaces are siblings
// (invite, approvals, members, events, announcements, analytics). Direct
// hits on /admin redirect to invite, the same target the top-nav "Admin"
// link uses. The layout's requireAdmin() runs first; non-admins get the
// auth bounce before we redirect.
export default function AdminIndexPage() {
  redirect('/admin/invite')
}
