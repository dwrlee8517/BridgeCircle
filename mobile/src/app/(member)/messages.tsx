import { Screen } from '@/components/screen'
import { EmptyState } from '@/components/ui'

/**
 * Messages — the unified inbox (asks, connections, conversations) on the
 * web. The mobile surface is a signpost until the inbox slice lands; the
 * gap is tracked in parity/features.json so it can't quietly stay this way.
 */
export default function MessagesScreen() {
  return (
    <Screen testID="messages-screen" title="Messages">
      <EmptyState
        body="Your asks, connections, and conversations will live here. Until this lands in the app, replies happen on the web — email notifications link you straight there."
        title="On its way"
      />
    </Screen>
  )
}
