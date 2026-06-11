import { AskStarter } from './starter'

/**
 * Children-slot fallback while the @sheet slot is active and Next can't
 * recover the previous page (e.g. soft-navigating to /ask/new from a
 * profile). The starter renders quietly behind the composer panel.
 */
export default function AskDefault() {
  return <AskStarter />
}
