import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/screen'
import { Card, EmptyState } from '@/components/ui'
import { getMemberContextLite } from '@/lib/member-context'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, fontSize, space } from '@/theme/tokens'

type PersonItem = {
  userId: string
  name: string
  headline: string | null
  city: string | null
  openToHelp: boolean
}

/**
 * People directory — the browse slice over `api.list_people`, the same RPC
 * the web directory calls (app/src/db/repositories/people.ts). Search,
 * filters, circle scope, and profile detail are tracked parity gaps.
 */
export default function PeopleScreen() {
  const { session } = useSession()
  const [people, setPeople] = useState<PersonItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    async function load() {
      try {
        const context = await getMemberContextLite()
        if (!context.membershipId) throw new Error('No active membership')
        const { data, error: rpcError } = await supabase.schema('api').rpc('list_people', {
          p_membership_id: context.membershipId,
          p_scope: 'all',
          p_limit: 50,
        })
        if (rpcError) throw new Error(rpcError.message)
        const rows = (data ?? []) as {
          target_user_id: string
          display_name: string
          preferred_name?: string | null
          headline?: string | null
          city?: string | null
          open_to_help?: boolean
        }[]
        if (!cancelled) {
          setPeople(
            rows.map((row) => ({
              userId: row.target_user_id,
              name: row.preferred_name || row.display_name,
              headline: row.headline ?? null,
              city: row.city ?? null,
              openToHelp: row.open_to_help ?? false,
            })),
          )
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session])

  return (
    <Screen testID="people-screen" title="People">
      {error ? (
        <EmptyState body={error} title="Couldn't load the directory" />
      ) : people === null ? (
        <EmptyState body="Fetching your network." title="Loading…" />
      ) : people.length === 0 ? (
        <EmptyState
          body="As members join your circle, they'll show up here."
          title="No members to show yet"
        />
      ) : (
        <View style={styles.list} testID="people-list">
          {people.map((person) => (
            <Card key={person.userId}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{person.name}</Text>
                {person.openToHelp ? <Text style={styles.openBadge}>Open to helping</Text> : null}
              </View>
              {person.headline ? <Text style={styles.headline}>{person.headline}</Text> : null}
              {person.city ? <Text style={styles.city}>{person.city}</Text> : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { gap: space[3] },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  name: {
    color: colors.foreground,
    fontSize: fontSize.bodyLg,
    fontWeight: '600',
    flexShrink: 1,
  },
  openBadge: {
    color: colors.stateSuccess,
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  headline: {
    color: colors.foreground,
    fontSize: fontSize.bodyMd,
  },
  city: {
    color: colors.mutedForeground,
    fontSize: fontSize.caption,
  },
})
