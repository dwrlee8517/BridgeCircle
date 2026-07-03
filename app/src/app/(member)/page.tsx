import { AskHome } from './ask-home'
import { GiveHelpPanel } from './help/give-help-panel'
import { HelpModeToggle } from './help-mode-toggle'

/**
 * The Help hub — one front door for both sides of the network. A segmented
 * toggle flips between asking for help (the demand side, `AskHome`) and
 * giving help (the supply side, `GiveHelpPanel`, formerly /help). Ask is the
 * default — it's the wedge, and where most members land. `/help` and the
 * mode links funnel here; only the active side fetches, so there's no
 * double-load.
 */
export default async function HomePage({
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
