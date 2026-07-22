'use client'

import { BriefcaseBusiness, GraduationCap, Plus } from 'lucide-react'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ProfileEducation, ProfileExperience, SelfProfile } from '@/lib/profile/contracts'
import { cn } from '@/lib/utils'
import {
  initialProfileActionState,
  saveAboutAction,
  saveCurrentAction,
  saveEducationAction,
  saveHistoryAction,
} from './actions'
import {
  ActionFooter,
  DraftCard,
  DraftInput,
  DraftNumber,
  EditorPanel,
  Field,
  fieldClass,
  ProfileTimeline,
  patchAt,
  period,
  QuietEmpty,
  removeAt,
  SelfSection,
} from './self-profile-ui'

type ExperienceDraft = Omit<ProfileExperience, 'id'> & { _key: string }
type EducationDraft = Omit<ProfileEducation, 'id'> & { _key: string }

export function SelfProfileAbout({ bio }: { bio: string | null }) {
  const [editing, setEditing] = useState(false)
  const [state, action, pending] = useActionState(saveAboutAction, initialProfileActionState)
  return (
    <SelfSection title="About" onEdit={() => setEditing((value) => !value)}>
      {editing ? (
        <EditorPanel title="About you" onClose={() => setEditing(false)} compact>
          <form action={action}>
            <Label htmlFor="profile-bio">About</Label>
            <Textarea
              id="profile-bio"
              name="bio"
              maxLength={4000}
              defaultValue={bio ?? ''}
              placeholder="Share the context that helps people know when to reach out."
              className="mt-2 min-h-36 resize-none rounded-[10px]"
            />
            <ActionFooter state={state} pending={pending} />
          </form>
        </EditorPanel>
      ) : (
        <p className="max-w-[64ch] text-sm leading-[1.7] font-medium whitespace-pre-wrap text-[var(--text-secondary)]">
          {bio || 'Add a short introduction so people know you better.'}
        </p>
      )}
    </SelfSection>
  )
}

export function SelfProfileCareer({
  current,
  experiences: savedExperiences,
  skills: savedSkills,
}: {
  current: SelfProfile['current']
  experiences: ProfileExperience[]
  skills: SelfProfile['skills']
}) {
  const [editing, setEditing] = useState(false)
  const [experiences, setExperiences] = useState<ExperienceDraft[]>(() =>
    savedExperiences.map(experienceDraft),
  )
  const [skills, setSkills] = useState(() => savedSkills.map((skill) => skill.name))
  const [currentState, currentAction, currentPending] = useActionState(
    saveCurrentAction,
    initialProfileActionState,
  )
  const [historyState, historyAction, historyPending] = useActionState(
    saveHistoryAction,
    initialProfileActionState,
  )

  function toggleEditor() {
    if (!editing) {
      setExperiences(savedExperiences.map(experienceDraft))
      setSkills(savedSkills.map((skill) => skill.name))
    }
    setEditing((value) => !value)
  }

  return (
    <SelfSection title="Career" divided onEdit={toggleEditor}>
      {editing ? (
        <div className="space-y-4">
          <EditorPanel title="Current work" onClose={() => setEditing(false)} compact>
            <form action={currentAction} className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" name="currentTitle" defaultValue={current.title} />
              <Field label="Organization" name="currentEmployer" defaultValue={current.employer} />
              <Field label="Industry" name="industry" defaultValue={current.industry} />
              <Field label="Location" name="city" defaultValue={current.city} />
              <div className="sm:col-span-2">
                <Field
                  label="Headline"
                  name="headline"
                  defaultValue={current.headline}
                  maxLength={280}
                />
              </div>
              <ActionFooter state={currentState} pending={currentPending} />
            </form>
          </EditorPanel>
          <EditorPanel title="Career history and skills" onClose={() => setEditing(false)} compact>
            <form action={historyAction}>
              <input type="hidden" name="experiences" value={JSON.stringify(experiences)} />
              <input type="hidden" name="skills" value={JSON.stringify(skills)} />
              <div className="space-y-4">
                {experiences.map((experience, index) => (
                  <ExperienceFields
                    key={experience._key}
                    value={experience}
                    onChange={(patch) => setExperiences((items) => patchAt(items, index, patch))}
                    onRemove={() => setExperiences((items) => removeAt(items, index))}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setExperiences((items) => [...items, emptyExperience()])}
              >
                <Plus aria-hidden /> Add role
              </Button>
              <div className="mt-5">
                <Label htmlFor="profile-skills">Skills</Label>
                <Input
                  id="profile-skills"
                  className={cn(fieldClass, 'mt-2')}
                  value={skills.join(', ')}
                  onChange={(event) =>
                    setSkills(
                      event.target.value
                        .split(',')
                        .map((skill) => skill.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="Climate strategy, Mentoring, Product design"
                />
                <p className="mt-1.5 text-overline font-medium text-[var(--text-faint)]">
                  Separate skills with commas.
                </p>
              </div>
              <ActionFooter state={historyState} pending={historyPending} />
            </form>
          </EditorPanel>
        </div>
      ) : savedExperiences.length ? (
        <ProfileTimeline
          items={savedExperiences.map((experience) => ({
            id: experience.id,
            period: period(experience),
            title: `${experience.title} · ${experience.employer}`,
            description: experience.description,
          }))}
        />
      ) : (
        <QuietEmpty icon={BriefcaseBusiness}>Add roles you want your circle to see.</QuietEmpty>
      )}
    </SelfSection>
  )
}

export function SelfProfileEducation({
  current,
  education: savedEducation,
}: {
  current: SelfProfile['current']
  education: ProfileEducation[]
}) {
  const [editing, setEditing] = useState(false)
  const [education, setEducation] = useState<EducationDraft[]>(() =>
    savedEducation.map(educationDraft),
  )
  const [state, action, pending] = useActionState(saveEducationAction, initialProfileActionState)

  function toggleEditor() {
    if (!editing) setEducation(savedEducation.map(educationDraft))
    setEditing((value) => !value)
  }

  return (
    <SelfSection title="Education" divided onEdit={toggleEditor}>
      {editing ? (
        <EditorPanel title="Education" onClose={() => setEditing(false)} compact>
          <form action={action}>
            <input type="hidden" name="education" value={JSON.stringify(education)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary school" name="university" defaultValue={current.university} />
              <Field label="Primary field" name="major" defaultValue={current.major} />
            </div>
            <div className="mt-4 space-y-4">
              {education.map((entry, index) => (
                <EducationFields
                  key={entry._key}
                  value={entry}
                  onChange={(patch) => setEducation((items) => patchAt(items, index, patch))}
                  onRemove={() => setEducation((items) => removeAt(items, index))}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setEducation((items) => [...items, emptyEducation()])}
            >
              <Plus aria-hidden /> Add education
            </Button>
            <ActionFooter state={state} pending={pending} />
          </form>
        </EditorPanel>
      ) : savedEducation.length ? (
        <ProfileTimeline
          items={savedEducation.map((entry) => ({
            id: entry.id,
            period: period(entry),
            title: [entry.school, entry.degree, entry.field].filter(Boolean).join(' · '),
            description: entry.description,
          }))}
        />
      ) : (
        <QuietEmpty icon={GraduationCap}>Add schools that help your circle place you.</QuietEmpty>
      )}
    </SelfSection>
  )
}

function ExperienceFields({
  value,
  onChange,
  onRemove,
}: {
  value: ExperienceDraft
  onChange: (patch: Partial<ExperienceDraft>) => void
  onRemove: () => void
}) {
  return (
    <DraftCard title={value.title || 'New role'} onRemove={onRemove}>
      <div className="grid gap-3 sm:grid-cols-2">
        <DraftInput label="Title" value={value.title} onChange={(title) => onChange({ title })} />
        <DraftInput
          label="Organization"
          value={value.employer}
          onChange={(employer) => onChange({ employer })}
        />
        <PeriodFields value={value} onChange={onChange} />
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={value.description ?? ''}
            maxLength={4000}
            onChange={(event) => onChange({ description: event.target.value || null })}
            className="mt-2 min-h-24 rounded-[10px]"
          />
        </div>
      </div>
    </DraftCard>
  )
}

function EducationFields({
  value,
  onChange,
  onRemove,
}: {
  value: EducationDraft
  onChange: (patch: Partial<EducationDraft>) => void
  onRemove: () => void
}) {
  return (
    <DraftCard title={value.school || 'New school'} onRemove={onRemove}>
      <div className="grid gap-3 sm:grid-cols-2">
        <DraftInput
          label="School"
          value={value.school}
          onChange={(school) => onChange({ school })}
        />
        <DraftInput
          label="Degree"
          value={value.degree ?? ''}
          onChange={(degree) => onChange({ degree: degree || null })}
        />
        <DraftInput
          label="Field"
          value={value.field ?? ''}
          onChange={(field) => onChange({ field: field || null })}
        />
        <PeriodFields value={value} onChange={onChange} />
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={value.description ?? ''}
            maxLength={4000}
            onChange={(event) => onChange({ description: event.target.value || null })}
            className="mt-2 min-h-24 rounded-[10px]"
          />
        </div>
      </div>
    </DraftCard>
  )
}

function PeriodFields<T extends ExperienceDraft | EducationDraft>({
  value,
  onChange,
}: {
  value: T
  onChange: (patch: Partial<T>) => void
}) {
  return (
    <>
      <DraftNumber
        label="Start year"
        value={value.startYear}
        onChange={(startYear) => onChange({ startYear } as Partial<T>)}
      />
      <DraftNumber
        label="Start month"
        value={value.startMonth}
        min={1}
        max={12}
        onChange={(startMonth) => onChange({ startMonth } as Partial<T>)}
      />
      <DraftNumber
        label="End year"
        value={value.endYear}
        onChange={(endYear) => onChange({ endYear } as Partial<T>)}
      />
      <DraftNumber
        label="End month"
        value={value.endMonth}
        min={1}
        max={12}
        onChange={(endMonth) => onChange({ endMonth } as Partial<T>)}
      />
    </>
  )
}

function experienceDraft({ id, ...value }: ProfileExperience): ExperienceDraft {
  return { _key: id, ...value }
}
function educationDraft({ id, ...value }: ProfileEducation): EducationDraft {
  return { _key: id, ...value }
}
function emptyExperience(): ExperienceDraft {
  return {
    _key: crypto.randomUUID(),
    employer: '',
    title: '',
    startYear: null,
    startMonth: null,
    endYear: null,
    endMonth: null,
    description: null,
  }
}
function emptyEducation(): EducationDraft {
  return {
    _key: crypto.randomUUID(),
    school: '',
    degree: null,
    field: null,
    startYear: null,
    startMonth: null,
    endYear: null,
    endMonth: null,
    description: null,
  }
}
