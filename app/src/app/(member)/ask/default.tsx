import { AskHome } from '../ask-home'

/**
 * Children-slot fallback while the @sheet slot is active and Next can't
 * recover the previous page (e.g. soft-navigating to /ask/new from a
 * profile). The merged home/ask surface renders quietly behind the
 * composer panel.
 */
export default function AskDefault() {
  return <AskHome />
}
