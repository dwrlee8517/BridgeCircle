import { Screen } from '@/components/screen'
import { EmptyState } from '@/components/ui'

/**
 * Messages — the unified inbox (asks, connections, DMs) on the web. The
 * mobile surface is a signpost until the inbox slice lands; the gap is
 * tracked in parity/features.json so it can't quietly stay this way.
 */
export default function InboxScreen() {
  return (
    <Screen testID="inbox-screen" title="Messages">
      <EmptyState
        body="Your asks, connections, and direct messages will live here. Until this lands in the app, replies happen on the web — email notifications link you straight there."
        title="On its way"
      />
    </Screen>
  )
}
