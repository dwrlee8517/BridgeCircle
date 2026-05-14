import { redirect } from 'next/navigation'

/**
 * Top-level /ask is no longer a member destination. People/Profile start
 * requests; Inbox owns request state after creation. Keep this page as a
 * defensive redirect in addition to next.config's permanent redirect so local
 * route handling never serves the old search-first ask surface.
 */
export default function AskIndexRedirect() {
  redirect('/inbox')
}
