import { redirect } from 'next/navigation'

// /admin has no dashboard of its own yet (the health overview is the next
// slice). Direct hits land on the member directory — the console's spine.
// The layout's admin gate runs first; non-admins bounce before this redirect.
export default function AdminIndexPage() {
  redirect('/admin/members')
}
