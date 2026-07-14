import { AskHome } from '../ask-home'
import { HelpModeToggle } from '../help-mode-toggle'
import { GiveHelpPanel } from './give-help-panel'

/**
 * Help is one section with two modes. Only the selected side renders, so the
 * server never pays for both the ask and give data paths in one request.
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const give = mode === 'give'

  return (
    <>
      <HelpModeToggle mode={give ? 'give' : 'ask'} />
      {give ? <GiveHelpPanel /> : <AskHome />}
    </>
  )
}
