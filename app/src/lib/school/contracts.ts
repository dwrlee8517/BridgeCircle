export type SchoolEventFormat = 'in_person' | 'online' | 'hybrid'
export type SchoolEventPhase = 'upcoming' | 'changed' | 'cancelled' | 'past'
export type SchoolRsvpStatus = 'none' | 'going' | 'waitlisted' | 'offered' | 'not_going'
export type SchoolAnnouncementTag = 'mentorship' | 'hiring' | 'reunion' | 'general'
export type SchoolAnnouncementFilter = 'all' | SchoolAnnouncementTag

export type SchoolEventCard = {
  id: string
  slug: string
  status: 'published' | 'cancelled'
  phase: SchoolEventPhase
  category: string
  title: string
  summary: string | null
  format: SchoolEventFormat
  timeZone: string
  campus: 'palos_verdes' | 'songdo' | 'other' | 'online'
  startsAt: string
  endsAt: string | null
  locationName: string | null
  hostName: string
  capacity: number | null
  spotsLeft: number | null
  allowWaitlist: boolean
  viewerRsvp: SchoolRsvpStatus
  offerExpiresAt: string | null
  goingCount: number
  circleGoingCount: number
  changedAt: string | null
  changeNote: string | null
  cancellationNote: string | null
  joinUrl: string | null
}

export type SchoolEventDetail = SchoolEventCard & {
  description: string | null
  locationAddress: string | null
  mapsUrl: string | null
  hostUserId: string | null
  schedule: Array<{ id: number; position: number; startsAt: string | null; label: string }>
  facts: Array<{
    id: number
    position: number
    label: string
    value: string
    linkLabel: string | null
    linkUrl: string | null
  }>
}

export type SchoolAnnouncementSummary = {
  id: string
  tag: SchoolAnnouncementTag
  title: string
  summary: string
  pinned: boolean
  publishedAt: string
  unread: boolean
}

export type SchoolAnnouncement = {
  id: string
  tag: SchoolAnnouncementTag
  title: string
  body: string
  pinned: boolean
  publishedAt: string
  authorName: string | null
}

export type NewsletterSummary = {
  id: string
  slug: string
  issueNumber: number
  title: string
  summary: string | null
  publishedAt: string
}

export type NewsletterIssue = NewsletterSummary & {
  sections: Array<{
    id: number
    position: number
    heading: string
    body: string
    linkLabel: string | null
    linkUrl: string | null
  }>
}

export type SchoolHome = {
  organization: { id: string; name: string }
  events: SchoolEventCard[]
  announcements: SchoolAnnouncementSummary[]
  latestNewsletter: NewsletterSummary | null
}

export type SchoolEventAttendees = {
  totalCount: number
  hiddenCount: number
  items: Array<{
    membershipId: string
    userId: string
    displayName: string
    preferredName: string | null
    avatarPath: string | null
    graduationYear: number | null
    inCircle: boolean
  }>
}

export type SchoolResponseIntent =
  | 'going'
  | 'not_going'
  | 'join_waitlist'
  | 'accept_offer'
  | 'pass_offer'

export type SchoolResponseResult =
  | 'going'
  | 'waitlisted'
  | 'not_going'
  | 'full'
  | 'not_open'
  | 'not_available'
  | 'not_offered'
  | 'offer_expired'

export type AdminSchoolEvent = {
  id: string
  status: 'draft' | 'published' | 'cancelled'
  title: string
  summary: string | null
  description: string | null
  category: string
  format: SchoolEventFormat
  timeZone: string
  campus: 'palos_verdes' | 'songdo' | 'other' | 'online'
  location: string | null
  locationAddress: string | null
  mapsUrl: string | null
  joinUrl: string | null
  joinWindowMinutes: number
  hostName: string | null
  startsAt: string
  endsAt: string | null
  capacity: number | null
  allowWaitlist: boolean
  changeNote: string | null
  schedule: Array<{ startsAt: string | null; label: string }>
  facts: Array<{
    label: string
    value: string
    linkLabel: string | null
    linkUrl: string | null
  }>
  goingCount: number
  waitlistCount: number
}

export type SaveAdminSchoolEventInput = {
  membershipId: string
  eventId: string | null
  title: string
  summary: string
  description: string | null
  category: string
  format: SchoolEventFormat
  timeZone: string
  campus: AdminSchoolEvent['campus']
  startsAt: string
  endsAt: string
  locationName: string | null
  locationAddress: string | null
  mapsUrl: string | null
  joinUrl: string | null
  joinWindowMinutes: number
  hostName: string
  capacity: number | null
  allowWaitlist: boolean
  changeNote: string | null
  schedule: Array<{ startsAt: string | null; label: string }>
  facts: Array<{
    label: string
    value: string
    linkLabel: string | null
    linkUrl: string | null
  }>
}

export type AdminSchoolEventFields = Omit<SaveAdminSchoolEventInput, 'membershipId' | 'eventId'>

export type CreateAdminSchoolEventInput = AdminSchoolEventFields & {
  membershipId: string
}

export type UpdateAdminSchoolEventInput = AdminSchoolEventFields & {
  membershipId: string
  eventId: string
}

export type AdminSchoolAnnouncement = {
  id: string
  tag: SchoolAnnouncementTag
  title: string
  body: string
  pinned: boolean
  publishedAt: string | null
}

export type SchoolRepository = {
  getHome(membershipId: string): Promise<SchoolHome | null>
  getEvent(membershipId: string, eventId: string): Promise<SchoolEventDetail | null>
  listEventAttendees(membershipId: string, eventId: string): Promise<SchoolEventAttendees | null>
  respondToEvent(
    membershipId: string,
    eventId: string,
    intent: SchoolResponseIntent,
  ): Promise<SchoolResponseResult>
  listAnnouncements(
    membershipId: string,
    tag: SchoolAnnouncementFilter,
  ): Promise<SchoolAnnouncementSummary[] | null>
  getAnnouncement(membershipId: string, announcementId: string): Promise<SchoolAnnouncement | null>
  markAnnouncementRead(
    membershipId: string,
    announcementId: string,
  ): Promise<'read' | 'not_available'>
  listNewsletterIssues(membershipId: string): Promise<NewsletterSummary[] | null>
  getNewsletterIssue(membershipId: string, issueSlug: string): Promise<NewsletterIssue | null>
  getAdminEvents(membershipId: string): Promise<AdminSchoolEvent[] | null>
  saveAdminEvent(
    input: SaveAdminSchoolEventInput,
  ): Promise<'created' | 'updated' | 'past_start' | 'invalid_input' | 'cancelled' | 'not_available'>
  cancelAdminEvent(
    membershipId: string,
    eventId: string,
    reason: string | null,
  ): Promise<'cancelled' | 'already_cancelled' | 'not_available'>
  deleteAdminEvent(
    membershipId: string,
    eventId: string,
  ): Promise<'deleted' | 'has_responses' | 'not_available'>
  getAdminAnnouncements(membershipId: string): Promise<AdminSchoolAnnouncement[] | null>
  publishAdminAnnouncement(input: {
    membershipId: string
    title: string
    body: string
    tag: SchoolAnnouncementTag
    pinned: boolean
  }): Promise<'published' | 'invalid_input' | 'not_available'>
}
