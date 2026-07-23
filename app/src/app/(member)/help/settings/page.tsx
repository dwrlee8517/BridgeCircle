import { redirect } from 'next/navigation'

/**
 * Compatibility route for bookmarks and older notification/profile links.
 * Settings is the sole owner of availability and topic preferences.
 */
export default function HelperSettingsCompatibilityPage() {
  redirect('/settings#helping')
}
