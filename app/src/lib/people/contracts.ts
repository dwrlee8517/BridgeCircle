export type PeopleScope = 'all' | 'open_to_help' | 'in_circle'

export type PeopleFilters = {
  industry: string | null
  classYearStart: number | null
  classYearEnd: number | null
  location: string | null
  employer: string | null
  education: string | null
  topic: string | null
}

export type PeopleSearchInput = {
  membershipId: string
  query: string | null
  scope: PeopleScope
  filters: PeopleFilters
  queryEmbedding?: string | null
  limit?: number
}

export type PeopleMatchEvidence = {
  kind:
    | 'directory'
    | 'current_role'
    | 'profile'
    | 'career_history'
    | 'education_history'
    | 'bio'
    | 'skills'
    | 'helper_topics'
    | 'career_path_summary'
    | 'help_topics_summary'
  title: string | null
  organization: string | null
  sourceSection: string | null
}

export type PeopleRelationship =
  | { state: 'none'; requestId: null; conversationId: null }
  | {
      state: 'pending_outgoing' | 'pending_incoming'
      requestId: string
      conversationId: null
    }
  | { state: 'connected'; requestId: null; conversationId: string }

export type PeopleDirectoryItem = {
  membershipId: string
  userId: string
  displayName: string
  preferredName: string | null
  avatarPath: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  industry: string | null
  city: string | null
  graduationYear: number | null
  openToHelp: boolean
  helperTopics: string[]
  relationship: PeopleRelationship
  matchEvidence: PeopleMatchEvidence[]
  rankScore: number
  profileUpdatedAt: string
}

export type PeopleDirectoryResult = {
  items: PeopleDirectoryItem[]
  totalCount: number
  capped: boolean
}

export type MemberProfileExperience = {
  id: string
  employer: string
  title: string
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  description: string | null
}

export type MemberProfileEducation = {
  id: string
  school: string
  degree: string | null
  field: string | null
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  description: string | null
}

export type MemberProfileLink = {
  id: string
  kind: 'linkedin' | 'portfolio' | 'website' | 'social' | 'email' | 'other'
  label: string | null
  value: string
  audience: 'organization' | 'connections' | 'self'
}

export type MemberProfileRelationship =
  | { state: 'self'; requestId: null; conversationId: null }
  | PeopleRelationship

export type MemberProfile = {
  membershipId: string
  userId: string
  identity: {
    displayName: string
    preferredName: string | null
    avatarPath: string | null
    graduationYear: number | null
  }
  current: {
    headline: string | null
    employer: string | null
    title: string | null
    industry: string | null
    city: string | null
  }
  about: string | null
  experiences: MemberProfileExperience[]
  education: MemberProfileEducation[]
  skills: string[]
  links: MemberProfileLink[]
  help: { openToHelp: boolean; topics: string[] }
  relationship: MemberProfileRelationship
  sharedContext: Array<{
    kind: 'same_city' | 'same_school'
    value: string
  }>
  updatedAt: string
}

export type MemberProfileResult =
  | { ok: true; profile: MemberProfile }
  | { ok: false; error: 'not_available' }

export type PeopleRepository = {
  list(input: Required<PeopleSearchInput>): Promise<PeopleDirectoryResult>
  getMemberProfile(membershipId: string, userId: string): Promise<MemberProfileResult>
}
