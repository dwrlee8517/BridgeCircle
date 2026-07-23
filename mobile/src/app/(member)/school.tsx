import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/screen'
import { Card, EmptyState } from '@/components/ui'
import { getMemberContextLite } from '@/lib/member-context'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, fontSize, space } from '@/theme/tokens'

type EventItem = {
  id: string
  title: string
  startsAt: string
  locationName: string | null
  hostName: string | null
}

type AnnouncementItem = {
  id: string
  title: string
  pinned: boolean
}

/**
 * School pulse — the mobile face of `api.get_school_home`, the same RPC the
 * web School hub calls (app/src/db/repositories/school.ts). Event detail,
 * RSVP, announcements archive, and newsletters are tracked parity gaps.
 */
export default function SchoolScreen() {
  const { session } = useSession()
  const [events, setEvents] = useState<EventItem[] | null>(null)
  const [announcement, setAnnouncement] = useState<AnnouncementItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    async function load() {
      try {
        const context = await getMemberContextLite()
        if (!context.membershipId) throw new Error('No active membership')
        const { data, error: rpcError } = await supabase
          .schema('api')
          .rpc('get_school_home', { p_membership_id: context.membershipId })
        if (rpcError) throw new Error(rpcError.message)
        const home = data as {
          resultCode: string
          events?: {
            id: string
            title: string
            startsAt: string
            locationName?: string | null
            hostName?: string | null
          }[]
          announcements?: { id: string; title: string; pinned: boolean }[]
        }
        if (home.resultCode !== 'ok') throw new Error('School is not available for this circle')
        if (!cancelled) {
          setEvents(
            (home.events ?? []).map((e) => ({
              id: e.id,
              title: e.title,
              startsAt: e.startsAt,
              locationName: e.locationName ?? null,
              hostName: e.hostName ?? null,
            })),
          )
          setAnnouncement(home.announcements?.[0] ?? null)
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
    <Screen testID="school-screen" title="School">
      {announcement ? (
        <Card testID="latest-announcement">
          <Text style={styles.sectionLabel}>
            {announcement.pinned ? 'Pinned announcement' : 'Latest announcement'}
          </Text>
          <Text style={styles.announcementTitle}>{announcement.title}</Text>
        </Card>
      ) : null}

      <Text style={styles.sectionHeading}>Upcoming events</Text>
      {error ? (
        <EmptyState body={error} title="Couldn't load events" />
      ) : events === null ? (
        <EmptyState body="Fetching what's coming up." title="Loading…" />
      ) : events.length === 0 ? (
        <EmptyState
          body="When your school publishes an event, it shows up here."
          title="Nothing scheduled yet"
        />
      ) : (
        <View style={styles.list} testID="events-list">
          {events.map((event) => (
            <Card key={event.id}>
              <Text style={styles.eventDate}>
                {new Date(event.startsAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.locationName ? (
                <Text style={styles.eventLocation}>{event.locationName}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.caption,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  announcementTitle: {
    color: colors.foreground,
    fontSize: fontSize.bodyLg,
    fontWeight: '600',
  },
  sectionHeading: {
    color: colors.foreground,
    fontSize: fontSize.h2,
    fontWeight: '700',
    marginTop: space[2],
  },
  list: { gap: space[3] },
  eventDate: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  eventTitle: {
    color: colors.foreground,
    fontSize: fontSize.bodyLg,
    fontWeight: '600',
  },
  eventLocation: {
    color: colors.mutedForeground,
    fontSize: fontSize.bodyMd,
  },
})
