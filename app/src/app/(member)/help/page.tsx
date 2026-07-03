import { redirect } from 'next/navigation'

/**
 * /help folded into the home Help hub (single page, ask/give toggle). This
 * route now lands on the give side of that hub. The nav points at `/`; this
 * redirect keeps old links, notifications, and bookmarks working.
 */
export default function HelpRedirect() {
  redirect('/?mode=give')
}
