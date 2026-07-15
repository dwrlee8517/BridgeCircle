export type MembershipStatus = 'active' | 'pending' | 'rejected' | 'revoked'

export type ProfileEducation = {
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

export type ProfileExperience = {
  id: string
  employer: string
  title: string
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  description: string | null
}

export type ProfileContactLink = {
  id: string
  kind: 'linkedin' | 'portfolio' | 'website' | 'social' | 'email' | 'other'
  label: string | null
  value: string
  audience: 'organization' | 'connections' | 'self'
}

export type ProfileContactLinkCommand = Omit<ProfileContactLink, 'id'>

export type SelfProfile = {
  membership: {
    id: string
    status: MembershipStatus
    organization: { id: string; name: string; slug: string }
  }
  identity: {
    displayName: string | null
    preferredName: string | null
    nameOther: string | null
    graduationYear: number | null
    avatarPath: string | null
  }
  current: {
    headline: string | null
    employer: string | null
    title: string | null
    industry: string | null
    city: string | null
    university: string | null
    major: string | null
  }
  education: ProfileEducation[]
  experiences: ProfileExperience[]
  skills: { name: string }[]
  visibility: Record<string, 'organization' | 'connections' | 'self'>
  links: ProfileContactLink[]
  preferences: {
    bio: string | null
    openToHelp: boolean
    helperTopics: { name: string }[]
    freshness: {
      linkedinUrl: string | null
      refreshPolicy: 'manual_only' | 'review_before_update' | 'auto_apply_and_notify'
      refreshInterval: 'monthly' | 'quarterly'
      consentedAt: string | null
    }
  }
}

export type ProfileReadResult =
  | { ok: true; profile: SelfProfile }
  | { ok: false; error: 'not_found' }

export type ProfileCommandResult =
  | 'saved'
  | 'not_owned'
  | 'membership_unavailable'
  | 'profile_required'
  | 'invalid_identity'
  | 'invalid_education'
  | 'invalid_current'
  | 'invalid_about'
  | 'invalid_history'
  | 'invalid_visibility'
  | 'invalid_links'
  | 'invalid_preferences'
  | 'invalid_avatar_path'

export type CompleteOnboardingResult =
  | { ok: true; completedAt: string }
  | {
      ok: false
      error: 'not_owned' | 'membership_unavailable' | 'account_unavailable' | 'incomplete_profile'
    }

export type EducationCommand = {
  school: string
  degree: string | null
  field: string | null
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  description: string | null
}

export type ExperienceCommand = {
  employer: string
  title: string
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  description: string | null
}

export type ProfileRepository = {
  get(membershipId: string): Promise<ProfileReadResult>
  saveIdentity(
    membershipId: string,
    input: {
      displayName: string
      preferredName: string | null
      nameOther: string | null
      graduationYear: number
    },
  ): Promise<ProfileCommandResult>
  saveEducation(
    membershipId: string,
    input: { university: string | null; major: string | null; education: EducationCommand[] },
  ): Promise<ProfileCommandResult>
  saveCurrent(
    membershipId: string,
    input: {
      currentEmployer: string | null
      currentTitle: string | null
      city: string | null
      headline: string | null
      industry: string | null
    },
  ): Promise<ProfileCommandResult>
  saveHistory(
    membershipId: string,
    input: { experiences: ExperienceCommand[]; skills: string[] },
  ): Promise<ProfileCommandResult>
  saveAbout(membershipId: string, bio: string | null): Promise<ProfileCommandResult>
  saveVisibility(
    membershipId: string,
    visibility: Record<string, 'organization' | 'connections' | 'self'>,
  ): Promise<ProfileCommandResult>
  saveLinks(membershipId: string, links: ProfileContactLinkCommand[]): Promise<ProfileCommandResult>
  savePreferences(
    membershipId: string,
    input: {
      bio: string | null
      openToHelp: boolean
      topics: string[]
      linkedinUrl: string | null
      refreshPolicy: 'manual_only' | 'review_before_update' | 'auto_apply_and_notify'
      refreshInterval: 'monthly' | 'quarterly'
      freshnessConsent: boolean
    },
  ): Promise<ProfileCommandResult>
  setAvatarPath(membershipId: string, avatarPath: string | null): Promise<ProfileCommandResult>
  completeOnboarding(membershipId: string): Promise<CompleteOnboardingResult>
}

export type AvatarStorageRepository = {
  upload(path: string, file: File): Promise<{ ok: true } | { ok: false; error: string }>
  publicUrl(path: string): string
}
