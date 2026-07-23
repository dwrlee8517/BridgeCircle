import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/screen'
import { Card, EmptyState } from '@/components/ui'
import { getActiveOrganizationId } from '@/lib/org'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, fontSize, space } from '@/theme/tokens'

type PersonItem = {
  userId: string
  name: string
  headline: string | null
  city: string | null
}

/**
 * People directory — the browse slice. RLS returns only org-visible fields
 * for fellow members, matching the web read path. NL search, filters, and
 * profile detail are tracked parity gaps.
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
        const userId = session?.user.id
        if (!userId) return
        const orgId = await getActiveOrganizationId(userId)
        if (!orgId) throw new Error('No active membership')
        const { data: memberships, error: mErr } = await supabase
          .from('organization_memberships')
          .select('user_id')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .neq('user_id', userId)
          .limit(50)
        if (mErr) throw new Error(mErr.message)
        const ids = (memberships ?? []).map((m) => m.user_id)
        if (ids.length === 0) {
          if (!cancelled) setPeople([])
          return
        }
        const { data: profiles, error: pErr } = await supabase
          .from('base_profiles')
          .select('user_id, name, preferred_name, headline, city')
          .in('user_id', ids)
          .order('name', { ascending: true })
        if (pErr) throw new Error(pErr.message)
        if (!cancelled) {
          setPeople(
            (profiles ?? [])
              .filter((p) => p.preferred_name || p.name)
              .map((p) => ({
                userId: p.user_id,
                name: (p.preferred_name || p.name) as string,
                headline: p.headline,
                city: p.city,
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
              <Text style={styles.name}>{person.name}</Text>
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
  name: {
    color: colors.foreground,
    fontSize: fontSize.bodyLg,
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
