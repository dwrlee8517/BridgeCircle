import type {
  CreateAdminSchoolEventInput,
  SchoolAnnouncementFilter,
  SchoolRepository,
  SchoolResponseIntent,
  UpdateAdminSchoolEventInput,
} from './contracts'

export function loadSchoolHome(membershipId: string, repository: SchoolRepository) {
  return repository.getHome(membershipId)
}

export function loadSchoolEvent(
  membershipId: string,
  eventId: string,
  repository: SchoolRepository,
) {
  return repository.getEvent(membershipId, eventId)
}

export function loadSchoolEventAttendees(
  membershipId: string,
  eventId: string,
  repository: SchoolRepository,
) {
  return repository.listEventAttendees(membershipId, eventId)
}

export function respondToSchoolEvent(
  membershipId: string,
  eventId: string,
  intent: SchoolResponseIntent,
  repository: SchoolRepository,
) {
  return repository.respondToEvent(membershipId, eventId, intent)
}

export function loadSchoolAnnouncements(
  membershipId: string,
  filter: SchoolAnnouncementFilter,
  repository: SchoolRepository,
) {
  return repository.listAnnouncements(membershipId, filter)
}

export function loadSchoolAnnouncement(
  membershipId: string,
  announcementId: string,
  repository: SchoolRepository,
) {
  return repository.getAnnouncement(membershipId, announcementId)
}

export function loadNewsletterIssues(membershipId: string, repository: SchoolRepository) {
  return repository.listNewsletterIssues(membershipId)
}

export function loadNewsletterIssue(
  membershipId: string,
  issueSlug: string,
  repository: SchoolRepository,
) {
  return repository.getNewsletterIssue(membershipId, issueSlug)
}

export function createAdminEvent(
  input: CreateAdminSchoolEventInput,
  repository: Pick<SchoolRepository, 'saveAdminEvent'>,
) {
  return repository.saveAdminEvent({ ...input, eventId: null })
}

export function updateAdminEvent(
  input: UpdateAdminSchoolEventInput,
  repository: Pick<SchoolRepository, 'saveAdminEvent'>,
) {
  return repository.saveAdminEvent(input)
}

export function cancelAdminEvent(
  input: { membershipId: string; eventId: string; reason: string | null },
  repository: Pick<SchoolRepository, 'cancelAdminEvent'>,
) {
  return repository.cancelAdminEvent(input.membershipId, input.eventId, input.reason)
}

export function deleteAdminEvent(
  input: { membershipId: string; eventId: string },
  repository: Pick<SchoolRepository, 'deleteAdminEvent'>,
) {
  return repository.deleteAdminEvent(input.membershipId, input.eventId)
}
