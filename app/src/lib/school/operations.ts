import type { SchoolAnnouncementFilter, SchoolRepository, SchoolResponseIntent } from './contracts'

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
