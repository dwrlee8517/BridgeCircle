import { Screen } from '@/components/screen'
import { Card, CardDescription, CardTitle } from '@/components/ui'

/**
 * Help — get-help / give-help. On the web this is the two-mode surface at
 * /help (search, matches, Ask the circle, give-side queue). The mobile
 * surface is an honest signpost while those flows land; each is a tracked
 * parity gap in parity/features.json.
 */
export default function HelpScreen() {
  return (
    <Screen testID="help-screen" title="Help">
      <Card>
        <CardTitle>Get help</CardTitle>
        <CardDescription>
          Describe what you&rsquo;re working through and see the people in your circle who can help.
          Asking from the app is on its way — for now, asks live on the web.
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>Give help</CardTitle>
        <CardDescription>
          Requests waiting on you, and your availability to help. Coming to the app next.
        </CardDescription>
      </Card>
    </Screen>
  )
}
