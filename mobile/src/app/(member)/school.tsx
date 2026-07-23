import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Screen } from '@/components/screen'
import { Card, EmptyState } from '@/components/ui'
import { getActiveOrganizationId } from '@/lib/org'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, fontSize, space } from '@/theme/tokens'

type EventItem = {
  id: string
  title: string
  location: string | null
  starts_at: string
}

type AnnouncementItem = {
  id: string
  title: string
  published_at: string | null
}

/**
 * School pulse — upcoming events + the latest announcement, read directly
 * from Supabase under RLS (the same rows the web's listEvents /
 * listAnnouncements return for this viewer). RSVP and detail screens are
 * tracked parity gaps.
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
        const userId = session?.user.id
        if (!userId) return
        const orgId = await getActiveOrganizationId(userId)
        if (!orgId) throw new Error('No active membership')
        const nowIso = new Date().toISOString()
        const [eventsRes, annRes] = await Promise.all([
          supabase
            .from('events')
            .select('id, title, location, starts_at')
            .eq('organization_id', orgId)
            .not('published_at', 'is', null)
            .gte('starts_at', nowIso)
            .order('starts_at', { ascending: true })
            .limit(20),
          supabase
            .from('announcements')
            .select('id, title, published_at')
            .eq('organization_id', orgId)
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false })
            .limit(1),
        ])
        if (eventsRes.error) throw new Error(eventsRes.error.message)
        if (annRes.error) throw new Error(annRes.error.message)
        if (!cancelled) {
          setEvents(eventsRes.data ?? [])
          setAnnouncement(annRes.data?.[0] ?? null)
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
          <Text style={styles.sectionLabel}>Latest announcement</Text>
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
                {new Date(event.starts_at).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.location ? <Text style={styles.eventLocation}>{event.location}</Text> : null}
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
