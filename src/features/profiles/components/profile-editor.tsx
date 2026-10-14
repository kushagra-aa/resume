import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import { AppDialog } from '#/components/app-dialog'
import { AppHeader } from '#/components/app-header'
import { BackButton } from '#/components/back-button'
import { ThemeToggle } from '#/components/theme-toggle'
import { profileRepository } from '#/db/repositories/profile-repository'
import {
  contactIconComponent,
  contactIconForLink,
  contactLinkIconOptions,
  inferContactLink,
  normalizeContactUrl,
} from '#/features/profiles/contact-links'
import { ProfileSaveQueue } from '#/features/profiles/profile-save-queue'
import type {
  Award,
  Certification,
  ContactLink,
  CustomSection,
  CustomSectionItem,
  Education,
  Experience,
  Profile,
  Project,
  Publication,
  Skill,
} from '#/models/profile'
import { TokenInput } from './token-input'

const newId = () => crypto.randomUUID()

const personalLabels: Record<keyof Profile['personal'], string> = {
  fullName: 'Full name',
  headline: 'Headline',
  location: 'Location',
  email: 'Email',
  phone: 'Phone',
  website: 'Website',
  linkedin: 'LinkedIn',
  github: 'GitHub',
}

const personalInputTypes: Partial<Record<keyof Profile['personal'], string>> = {
  email: 'email',
  phone: 'tel',
}

function ContactIcon({
  label,
  url,
  icon: selectedIcon,
}: Pick<ContactLink, 'label' | 'url' | 'icon'>) {
  const icon = contactIconForLink({
    id: '',
    label,
    url,
    icon: selectedIcon,
  })
  const Icon = contactIconComponent(icon)
  return <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
}

function ContactLinkEditor({
  link,
  onChange,
  onRemove,
  onMove,
}: {
  link: ContactLink
  onChange: (link: ContactLink) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}) {
  const detected = inferContactLink(link.label, link.url)
  const selectedIconLabel = link.icon
    ? contactLinkIconOptions.find((option) => option.value === link.icon)?.label
    : detected.label
  const hasContent = Boolean(link.label.trim() || link.url.trim())
  return (
    <div className="profile-link-item">
      <span
        className="profile-link-icon"
        aria-label={`${selectedIconLabel ?? 'Link'} icon`}
      >
        <ContactIcon label={link.label} url={link.url} icon={link.icon} />
      </span>
      <div className="profile-form-grid">
        <Field
          label="Label"
          value={link.label}
          placeholder={detected.label || 'e.g. Portfolio'}
          onChange={(label) => onChange({ ...link, label })}
        />
        <Field
          label="Link"
          type="url"
          value={link.url}
          placeholder="https://example.com"
          onChange={(url) => onChange({ ...link, url })}
          onBlur={() => {
            const normalized = normalizeContactUrl(link.url)
            const label =
              link.label.trim() || inferContactLink('', normalized).label
            if (normalized !== link.url || label !== link.label)
              onChange({ ...link, url: normalized, label })
          }}
        />
        <label className="profile-field profile-link-icon-choice">
          <span>Icon</span>
          <select
            value={link.icon ?? 'auto'}
            onChange={(event) =>
              onChange({
                ...link,
                icon:
                  event.target.value === 'auto'
                    ? undefined
                    : (event.target.value as ContactLink['icon']),
              })
            }
          >
            <option value="auto">Auto-detect</option>
            {contactLinkIconOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="profile-link-actions">
        <button
          type="button"
          aria-label={`Move ${link.label || 'link'} up`}
          title="Move link up"
          onClick={() => onMove(-1)}
        >
          <ArrowUp size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Move ${link.label || 'link'} down`}
          title="Move link down"
          onClick={() => onMove(1)}
        >
          <ArrowDown size={16} aria-hidden="true" />
        </button>
        <ItemActions
          itemLabel={link.label || 'link'}
          hasContent={hasContent}
          onRemove={onRemove}
        />
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
  placeholder,
  onBlur,
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  type?: string
  placeholder?: string
  onBlur?: () => void
  className?: string
}) {
  return (
    <label className={`profile-field ${className}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          value={value}
          type={type}
          placeholder={placeholder}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

function Section({
  title,
  description,
  children,
  id,
  initiallyOpen = false,
}: {
  title: string
  description?: string
  children: ReactNode
  id?: string
  initiallyOpen?: boolean
}) {
  const [open, setOpen] = useState(initiallyOpen)
  const sectionId =
    id ?? (title === 'Custom sections' ? 'customSections' : title.toLowerCase())
  return (
    <details
      className="profile-section island-shell"
      id={`profile-section-${sectionId}`}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="profile-section-heading">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <ChevronDown
          className="profile-section-chevron"
          size={19}
          aria-hidden="true"
        />
      </summary>
      <div className="profile-section-body">{children}</div>
    </details>
  )
}

function ItemActions({
  onRemove,
  itemLabel,
  hasContent,
}: {
  onRemove: () => void
  itemLabel?: string
  hasContent?: boolean
}) {
  const label = itemLabel ?? 'item'
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <>
      <button
        className="button button-ghost profile-remove"
        type="button"
        aria-label={`Remove ${label}`}
        title={`Remove ${label}`}
        onClick={() => {
          if (hasContent === false) onRemove()
          else setConfirmOpen(true)
        }}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
      <AppDialog
        open={confirmOpen}
        title={`Remove ${label}?`}
        description="This change cannot be undone."
        tone="danger"
        onClose={() => setConfirmOpen(false)}
        actions={
          <>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={() => {
                onRemove()
                setConfirmOpen(false)
              }}
            >
              Remove
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to remove <strong>{label}</strong>?
        </p>
      </AppDialog>
    </>
  )
}

function updateAt(profile: Profile): Profile {
  return { ...profile, updatedAt: new Date().toISOString() }
}

export function ProfileEditor({ profileId }: { profileId: string }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<
    'loading' | 'saved' | 'dirty' | 'saving' | 'failed'
  >('loading')
  const [activeSection, setActiveSection] = useState('details')
  const latestProfileRef = useRef<Profile | null>(null)
  const dirtyRef = useRef(false)
  const editVersionRef = useRef(0)
  const saveQueueRef = useRef<ProfileSaveQueue | null>(null)
  if (!saveQueueRef.current)
    saveQueueRef.current = new ProfileSaveQueue((value) =>
      profileRepository.update(value),
    )
  function getSaveQueue() {
    if (!saveQueueRef.current) throw new Error('Profile save queue unavailable')
    return saveQueueRef.current
  }
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    profileRepository
      .get(profileId)
      .then((value) => {
        if (!value) setError('Profile not found.')
        setProfile(value)
        latestProfileRef.current = value
        setSaveState('saved')
      })
      .catch(() => setError('The profile could not be loaded.'))
      .finally(() => setLoading(false))
  }, [profileId])

  useEffect(() => {
    if (!profile || loading || !dirtyRef.current) return
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      const snapshot = latestProfileRef.current
      const version = editVersionRef.current
      if (!snapshot) return
      setSaveState('saving')
      void getSaveQueue()
        .save(snapshot)
        .then(() => {
          if (editVersionRef.current === version) {
            dirtyRef.current = false
            setSaveState('saved')
          }
        })
        .catch(() => setSaveState('failed'))
    }, 500)
    return () => {
      if (saveTimerRef.current !== null)
        window.clearTimeout(saveTimerRef.current)
    }
  }, [profile, loading])

  function changeProfile(change: (current: Profile) => Profile) {
    const current = latestProfileRef.current
    if (!current) return
    const next = updateAt(change(current))
    latestProfileRef.current = next
    editVersionRef.current += 1
    dirtyRef.current = true
    setSaveState('dirty')
    setProfile(next)
  }

  async function flushPendingSave(): Promise<boolean> {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    const latest = latestProfileRef.current
    const version = editVersionRef.current
    if (latest && dirtyRef.current) {
      setSaveState('saving')
      try {
        await getSaveQueue().save(latest)
        if (editVersionRef.current === version) {
          dirtyRef.current = false
          setSaveState('saved')
        }
      } catch {
        setSaveState('failed')
        return false
      }
    } else {
      try {
        await getSaveQueue().flush()
      } catch {
        setSaveState('failed')
        return false
      }
    }
    return true
  }

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null)
        window.clearTimeout(saveTimerRef.current)
      const latest = latestProfileRef.current
      if (!latest || !dirtyRef.current) return
      void getSaveQueue()
        .save(latest)
        .catch(() => undefined)
    },
    [],
  )

  const navSections = [
    ['details', 'Profile details'],
    ['personal', 'Personal information'],
    ['summary', 'Summary'],
    ['experience', 'Experience'],
    ['education', 'Education'],
    ['skills', 'Skills'],
    ['projects', 'Projects'],
    ['certifications', 'Certifications'],
    ['awards', 'Awards'],
    ['publications', 'Publications'],
    ['customSections', 'Custom sections'],
  ]

  useEffect(() => {
    if (loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible)
          setActiveSection(visible.target.id.replace('profile-section-', ''))
      },
      { rootMargin: '-110px 0px -70% 0px', threshold: [0, 0.2, 0.5] },
    )
    navSections.forEach(([id]) => {
      const section = document.getElementById(`profile-section-${id}`)
      if (section) observer.observe(section)
    })
    return () => observer.disconnect()
  }, [profileId, loading])

  function goToSection(id: string) {
    const section = document.getElementById(`profile-section-${id}`)
    if (section instanceof HTMLDetailsElement) section.open = true
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  if (loading)
    return (
      <main className="profile-page">
        <p className="dashboard-message">Loading profile…</p>
      </main>
    )
  if (!profile)
    return (
      <main className="profile-page">
        <p className="dashboard-message error">
          {error ?? 'Profile not found.'}
        </p>
      </main>
    )

  const updateExperience = (
    id: string,
    change: (item: Experience) => Experience,
  ) =>
    changeProfile((current) => ({
      ...current,
      experience: current.experience.map((item) =>
        item.id === id ? change(item) : item,
      ),
    }))
  const updateEducation = (
    id: string,
    change: (item: Education) => Education,
  ) =>
    changeProfile((current) => ({
      ...current,
      education: current.education.map((item) =>
        item.id === id ? change(item) : item,
      ),
    }))
  const updateSkill = (id: string, change: (item: Skill) => Skill) =>
    changeProfile((current) => ({
      ...current,
      skills: current.skills.map((item) =>
        item.id === id ? change(item) : item,
      ),
    }))
  const updateProject = (id: string, change: (item: Project) => Project) =>
    changeProfile((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === id ? change(item) : item,
      ),
    }))

  return (
    <main className="profile-page">
      <AppHeader
        className="profile-app-header"
        leading={
          <BackButton
            label="Dashboard"
            onClick={() =>
              void flushPendingSave().then((saved) => {
                if (saved) void navigate({ to: '/' })
              })
            }
          />
        }
      >
        <span
          className={`profile-save-state is-${saveState}`}
          aria-live="polite"
        >
          <Save size={14} aria-hidden="true" />
          <span>
            {saveState === 'loading'
              ? 'Loading…'
              : saveState === 'saved'
                ? 'Saved locally'
                : saveState === 'dirty'
                  ? 'Unsaved changes'
                  : saveState === 'saving'
                    ? 'Saving…'
                    : 'Save failed'}
          </span>
          {saveState === 'failed' ? (
            <button type="button" onClick={() => void flushPendingSave()}>
              Retry
            </button>
          ) : null}
        </span>
        <ThemeToggle />
      </AppHeader>
      <header className="profile-page-header">
        <div>
          <p className="panel-kicker">Profile</p>
          <h1>{profile.name}</h1>
        </div>
      </header>

      <div className="profile-workspace">
        <nav className="profile-section-nav" aria-label="Profile sections">
          <p className="panel-kicker">Sections</p>
          {navSections.map(([id, label]) => (
            <button
              className={activeSection === id ? 'active' : ''}
              aria-current={activeSection === id ? 'location' : undefined}
              key={id}
              type="button"
              onClick={() => goToSection(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="profile-editor-content">
          <Section
            id="details"
            title="Profile details"
            description="This name is used to identify the profile in your workspace."
            initiallyOpen
          >
            <div className="profile-form-grid">
              <Field
                label="Profile name"
                value={profile.name}
                onChange={(value) =>
                  changeProfile((current) => ({ ...current, name: value }))
                }
                className="span"
              />
            </div>
          </Section>

          <Section
            id="personal"
            title="Personal information"
            description="Contact details that can be reused across resumes."
            initiallyOpen
          >
            <div className="profile-form-grid">
              {(
                Object.keys(profile.personal).filter(
                  (key) => !['website', 'linkedin', 'github'].includes(key),
                ) as Array<keyof Profile['personal']>
              ).map((key) => (
                <Field
                  key={key}
                  label={personalLabels[key]}
                  value={profile.personal[key]}
                  type={personalInputTypes[key]}
                  onChange={(value) =>
                    changeProfile((current) => ({
                      ...current,
                      personal: { ...current.personal, [key]: value },
                    }))
                  }
                  className={key === 'fullName' ? 'span' : ''}
                />
              ))}
            </div>
            <div className="profile-links-list">
              <div className="profile-section-subheading">
                <h3>Links</h3>
                <p>Add portfolio, social, and other professional links.</p>
              </div>
              {profile.links.map((link, index) => (
                <ContactLinkEditor
                  key={link.id}
                  link={link}
                  onChange={(next) =>
                    changeProfile((current) => ({
                      ...current,
                      links: current.links.map((item) =>
                        item.id === link.id ? next : item,
                      ),
                    }))
                  }
                  onRemove={() =>
                    changeProfile((current) => ({
                      ...current,
                      links: current.links.filter(
                        (item) => item.id !== link.id,
                      ),
                    }))
                  }
                  onMove={(direction) =>
                    changeProfile((current) => {
                      const links = [...current.links]
                      const target = index + direction
                      if (target < 0 || target >= links.length) return current
                      ;[links[index], links[target]] = [
                        links[target],
                        links[index],
                      ]
                      return { ...current, links }
                    })
                  }
                />
              ))}
              <button
                className="button button-secondary"
                type="button"
                onClick={() =>
                  changeProfile((current) => ({
                    ...current,
                    links: [
                      ...current.links,
                      { id: newId(), label: '', url: '' },
                    ],
                  }))
                }
              >
                <Plus size={15} aria-hidden="true" /> Add link
              </button>
            </div>
          </Section>

          <Section
            id="summary"
            title="Summary"
            description="A short introduction or professional summary."
            initiallyOpen
          >
            <Field
              label="Summary"
              value={profile.summary}
              multiline
              onChange={(value) =>
                changeProfile((current) => ({ ...current, summary: value }))
              }
            />
          </Section>

          <Section
            id="experience"
            title="Experience"
            description="Your roles and accomplishments."
          >
            {profile.experience.map((item) => (
              <div className="profile-item" key={item.id}>
                <div className="profile-item-heading">
                  <h3>{item.role || 'New role'}</h3>
                  <ItemActions
                    itemLabel={item.role || 'experience'}
                    hasContent={Boolean(
                      item.role ||
                      item.company ||
                      item.location ||
                      item.bullets.some((bullet) => bullet.trim()),
                    )}
                    onRemove={() =>
                      changeProfile((current) => ({
                        ...current,
                        experience: current.experience.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="profile-form-grid">
                  <Field
                    label="Role"
                    value={item.role}
                    onChange={(value) =>
                      updateExperience(item.id, (entry) => ({
                        ...entry,
                        role: value,
                      }))
                    }
                    className="span"
                  />
                  <Field
                    label="Company"
                    value={item.company}
                    onChange={(value) =>
                      updateExperience(item.id, (entry) => ({
                        ...entry,
                        company: value,
                      }))
                    }
                  />
                  <Field
                    label="Location"
                    value={item.location}
                    onChange={(value) =>
                      updateExperience(item.id, (entry) => ({
                        ...entry,
                        location: value,
                      }))
                    }
                  />
                  <Field
                    label="Start date"
                    placeholder="e.g. Sep 2022"
                    value={item.startDate}
                    onChange={(value) =>
                      updateExperience(item.id, (entry) => ({
                        ...entry,
                        startDate: value,
                      }))
                    }
                  />
                  <Field
                    label="End date"
                    placeholder="e.g. Sep 2022"
                    value={item.endDate}
                    onChange={(value) =>
                      updateExperience(item.id, (entry) => ({
                        ...entry,
                        endDate: value,
                      }))
                    }
                  />
                </div>
                <label className="profile-checkbox">
                  <input
                    type="checkbox"
                    checked={item.current}
                    onChange={(event) =>
                      updateExperience(item.id, (entry) => ({
                        ...entry,
                        current: event.target.checked,
                      }))
                    }
                  />{' '}
                  Current role
                </label>
                <Field
                  label="Accomplishments (one per line)"
                  value={item.bullets.join('\n')}
                  multiline
                  onChange={(value) =>
                    updateExperience(item.id, (entry) => ({
                      ...entry,
                      bullets: value.split('\n'),
                    }))
                  }
                />
              </div>
            ))}
            <button
              className="button button-secondary"
              type="button"
              onClick={() =>
                changeProfile((current) => ({
                  ...current,
                  experience: [
                    ...current.experience,
                    {
                      id: newId(),
                      company: '',
                      role: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      bullets: [],
                    },
                  ],
                }))
              }
            >
              <Plus size={15} /> Add experience
            </button>
          </Section>

          <Section id="education" title="Education">
            {profile.education.map((item) => (
              <div className="profile-item" key={item.id}>
                <div className="profile-item-heading">
                  <h3>{item.degree || 'New education'}</h3>
                  <ItemActions
                    itemLabel={item.degree || 'education'}
                    hasContent={Boolean(
                      item.degree || item.institution || item.details,
                    )}
                    onRemove={() =>
                      changeProfile((current) => ({
                        ...current,
                        education: current.education.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="profile-form-grid">
                  <Field
                    label="Degree"
                    value={item.degree}
                    onChange={(value) =>
                      updateEducation(item.id, (entry) => ({
                        ...entry,
                        degree: value,
                      }))
                    }
                    className="span"
                  />
                  <Field
                    label="Institution"
                    value={item.institution}
                    onChange={(value) =>
                      updateEducation(item.id, (entry) => ({
                        ...entry,
                        institution: value,
                      }))
                    }
                  />
                  <Field
                    label="Location"
                    value={item.location}
                    onChange={(value) =>
                      updateEducation(item.id, (entry) => ({
                        ...entry,
                        location: value,
                      }))
                    }
                  />
                  <Field
                    label="Start date"
                    placeholder="e.g. Sep 2022"
                    value={item.startDate}
                    onChange={(value) =>
                      updateEducation(item.id, (entry) => ({
                        ...entry,
                        startDate: value,
                      }))
                    }
                  />
                  <Field
                    label="End date"
                    placeholder="e.g. Sep 2022"
                    value={item.endDate}
                    onChange={(value) =>
                      updateEducation(item.id, (entry) => ({
                        ...entry,
                        endDate: value,
                      }))
                    }
                  />
                </div>
                <Field
                  label="Details"
                  value={item.details}
                  multiline
                  onChange={(value) =>
                    updateEducation(item.id, (entry) => ({
                      ...entry,
                      details: value,
                    }))
                  }
                />
              </div>
            ))}
            <button
              className="button button-secondary"
              type="button"
              onClick={() =>
                changeProfile((current) => ({
                  ...current,
                  education: [
                    ...current.education,
                    {
                      id: newId(),
                      institution: '',
                      degree: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      details: '',
                    },
                  ],
                }))
              }
            >
              <Plus size={15} /> Add education
            </button>
          </Section>

          <Section
            id="skills"
            title="Skills"
            description="Group related skills so templates can present them clearly."
          >
            {profile.skills.map((item) => (
              <div className="profile-item profile-skill-group" key={item.id}>
                <div className="profile-item-heading">
                  <h3>{item.name || 'New skill group'}</h3>
                  <ItemActions
                    itemLabel={item.name || 'skill group'}
                    hasContent={Boolean(item.name || item.skills.some(Boolean))}
                    onRemove={() =>
                      changeProfile((current) => ({
                        ...current,
                        skills: current.skills.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="profile-skill-group-fields">
                  <Field
                    label="Group name"
                    value={item.name}
                    placeholder="e.g. Languages, Backend, Design"
                    onChange={(value) =>
                      updateSkill(item.id, (entry) => ({
                        ...entry,
                        name: value,
                      }))
                    }
                  />
                  <TokenInput
                    label="Skills"
                    values={item.skills}
                    placeholder="Add a skill"
                    onChange={(skills) =>
                      updateSkill(item.id, (entry) => ({ ...entry, skills }))
                    }
                  />
                </div>
              </div>
            ))}
            <button
              className="button button-secondary"
              type="button"
              onClick={() =>
                changeProfile((current) => ({
                  ...current,
                  skills: [
                    ...current.skills,
                    { id: newId(), name: '', skills: [] },
                  ],
                }))
              }
            >
              <Plus size={15} /> Add skill group
            </button>
          </Section>

          <Section id="projects" title="Projects">
            {profile.projects.map((item) => (
              <div className="profile-item" key={item.id}>
                <div className="profile-item-heading">
                  <h3>{item.name || 'New project'}</h3>
                  <ItemActions
                    itemLabel={item.name || 'project'}
                    hasContent={Boolean(
                      item.name ||
                      item.description ||
                      item.url ||
                      item.technologies.some(Boolean) ||
                      item.bullets.some(Boolean),
                    )}
                    onRemove={() =>
                      changeProfile((current) => ({
                        ...current,
                        projects: current.projects.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="profile-form-grid">
                  <Field
                    label="Name"
                    value={item.name}
                    onChange={(value) =>
                      updateProject(item.id, (entry) => ({
                        ...entry,
                        name: value,
                      }))
                    }
                  />
                  <Field
                    label="URL"
                    type="url"
                    value={item.url}
                    onChange={(value) =>
                      updateProject(item.id, (entry) => ({
                        ...entry,
                        url: value,
                      }))
                    }
                  />
                  <TokenInput
                    label="Technologies"
                    values={item.technologies}
                    onChange={(technologies) =>
                      updateProject(item.id, (entry) => ({
                        ...entry,
                        technologies,
                      }))
                    }
                    className="span"
                  />
                </div>
                <Field
                  label="Description"
                  value={item.description}
                  multiline
                  onChange={(value) =>
                    updateProject(item.id, (entry) => ({
                      ...entry,
                      description: value,
                    }))
                  }
                />
                <Field
                  label="Highlights (one per line)"
                  value={item.bullets.join('\n')}
                  multiline
                  onChange={(value) =>
                    updateProject(item.id, (entry) => ({
                      ...entry,
                      bullets: value.split('\n'),
                    }))
                  }
                />
              </div>
            ))}
            <button
              className="button button-secondary"
              type="button"
              onClick={() =>
                changeProfile((current) => ({
                  ...current,
                  projects: [
                    ...current.projects,
                    {
                      id: newId(),
                      name: '',
                      description: '',
                      url: '',
                      technologies: [],
                      bullets: [],
                    },
                  ],
                }))
              }
            >
              <Plus size={15} /> Add project
            </button>
          </Section>

          <OptionalSections profile={profile} changeProfile={changeProfile} />
        </div>
      </div>
    </main>
  )
}

function OptionalSections({
  profile,
  changeProfile,
}: {
  profile: Profile
  changeProfile: (change: (current: Profile) => Profile) => void
}) {
  const update = <T extends { id: string }>(
    key: 'certifications' | 'awards' | 'publications',
    id: string,
    change: (item: T) => T,
  ) =>
    changeProfile((current) => {
      const items = current[key] as Array<Certification | Award | Publication>
      return {
        ...current,
        [key]: items.map((item) =>
          item.id === id ? change(item as unknown as T) : item,
        ),
      } as Profile
    })
  const remove = (
    key: 'certifications' | 'awards' | 'publications',
    id: string,
  ) =>
    changeProfile((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== id),
    }))
  return (
    <>
      <Section title="Certifications">
        <div className="profile-form-list">
          {profile.certifications.map((item) => (
            <div className="profile-item" key={item.id}>
              <div className="profile-item-heading">
                <h3>{item.name || 'New certification'}</h3>
                <ItemActions
                  itemLabel={item.name || 'certification'}
                  hasContent={Boolean(
                    item.name || item.issuer || item.date || item.url,
                  )}
                  onRemove={() => remove('certifications', item.id)}
                />
              </div>
              <div className="profile-form-grid">
                <Field
                  label="Name"
                  value={item.name}
                  onChange={(value) =>
                    update<Certification>(
                      'certifications',
                      item.id,
                      (entry) => ({ ...entry, name: value }),
                    )
                  }
                />
                <Field
                  label="Issuer"
                  value={item.issuer}
                  onChange={(value) =>
                    update<Certification>(
                      'certifications',
                      item.id,
                      (entry) => ({ ...entry, issuer: value }),
                    )
                  }
                />
                <Field
                  label="Date"
                  placeholder="e.g. Sep 2022"
                  value={item.date}
                  onChange={(value) =>
                    update<Certification>(
                      'certifications',
                      item.id,
                      (entry) => ({ ...entry, date: value }),
                    )
                  }
                />
                <Field
                  label="URL"
                  type="url"
                  value={item.url}
                  onChange={(value) =>
                    update<Certification>(
                      'certifications',
                      item.id,
                      (entry) => ({ ...entry, url: value }),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            changeProfile((current) => ({
              ...current,
              certifications: [
                ...current.certifications,
                { id: newId(), name: '', issuer: '', date: '', url: '' },
              ],
            }))
          }
        >
          <Plus size={15} /> Add certification
        </button>
      </Section>
      <Section title="Awards">
        <div className="profile-form-list">
          {profile.awards.map((item) => (
            <div className="profile-item" key={item.id}>
              <div className="profile-item-heading">
                <h3>{item.name || 'New award'}</h3>
                <ItemActions
                  itemLabel={item.name || 'award'}
                  hasContent={Boolean(
                    item.name || item.issuer || item.date || item.description,
                  )}
                  onRemove={() => remove('awards', item.id)}
                />
              </div>
              <div className="profile-form-grid">
                <Field
                  label="Name"
                  value={item.name}
                  onChange={(value) =>
                    update<Award>('awards', item.id, (entry) => ({
                      ...entry,
                      name: value,
                    }))
                  }
                  className="span"
                />
                <Field
                  label="Issuer"
                  value={item.issuer}
                  onChange={(value) =>
                    update<Award>('awards', item.id, (entry) => ({
                      ...entry,
                      issuer: value,
                    }))
                  }
                />
                <Field
                  label="Date"
                  placeholder="e.g. Sep 2022"
                  value={item.date}
                  onChange={(value) =>
                    update<Award>('awards', item.id, (entry) => ({
                      ...entry,
                      date: value,
                    }))
                  }
                />
              </div>
              <Field
                label="Description"
                value={item.description}
                multiline
                onChange={(value) =>
                  update<Award>('awards', item.id, (entry) => ({
                    ...entry,
                    description: value,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            changeProfile((current) => ({
              ...current,
              awards: [
                ...current.awards,
                {
                  id: newId(),
                  name: '',
                  issuer: '',
                  date: '',
                  description: '',
                },
              ],
            }))
          }
        >
          <Plus size={15} /> Add award
        </button>
      </Section>
      <Section title="Publications">
        <div className="profile-form-list">
          {profile.publications.map((item) => (
            <div className="profile-item" key={item.id}>
              <div className="profile-item-heading">
                <h3>{item.title || 'New publication'}</h3>
                <ItemActions
                  itemLabel={item.title || 'publication'}
                  hasContent={Boolean(
                    item.title ||
                    item.publisher ||
                    item.date ||
                    item.url ||
                    item.description,
                  )}
                  onRemove={() => remove('publications', item.id)}
                />
              </div>
              <div className="profile-form-grid">
                <Field
                  label="Title"
                  value={item.title}
                  onChange={(value) =>
                    update<Publication>('publications', item.id, (entry) => ({
                      ...entry,
                      title: value,
                    }))
                  }
                />
                <Field
                  label="Publisher"
                  value={item.publisher}
                  onChange={(value) =>
                    update<Publication>('publications', item.id, (entry) => ({
                      ...entry,
                      publisher: value,
                    }))
                  }
                />
                <Field
                  label="Date"
                  placeholder="e.g. Sep 2022"
                  value={item.date}
                  onChange={(value) =>
                    update<Publication>('publications', item.id, (entry) => ({
                      ...entry,
                      date: value,
                    }))
                  }
                />
                <Field
                  label="URL"
                  type="url"
                  value={item.url}
                  onChange={(value) =>
                    update<Publication>('publications', item.id, (entry) => ({
                      ...entry,
                      url: value,
                    }))
                  }
                />
              </div>
              <Field
                label="Description"
                value={item.description}
                multiline
                onChange={(value) =>
                  update<Publication>('publications', item.id, (entry) => ({
                    ...entry,
                    description: value,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            changeProfile((current) => ({
              ...current,
              publications: [
                ...current.publications,
                {
                  id: newId(),
                  title: '',
                  publisher: '',
                  date: '',
                  url: '',
                  description: '',
                },
              ],
            }))
          }
        >
          <Plus size={15} /> Add publication
        </button>
      </Section>
      <Section
        title="Custom sections"
        description="Create sections for any additional career information."
      >
        <div className="profile-form-list">
          {profile.customSections.map((section) => (
            <CustomSectionEditor
              key={section.id}
              section={section}
              changeProfile={changeProfile}
            />
          ))}
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            changeProfile((current) => ({
              ...current,
              customSections: [
                ...current.customSections,
                { id: newId(), title: 'New section', items: [] },
              ],
            }))
          }
        >
          <Plus size={15} /> Add custom section
        </button>
      </Section>
    </>
  )
}

function CustomSectionEditor({
  section,
  changeProfile,
}: {
  section: CustomSection
  changeProfile: (change: (current: Profile) => Profile) => void
}) {
  const updateSection = (change: (current: CustomSection) => CustomSection) =>
    changeProfile((current) => ({
      ...current,
      customSections: current.customSections.map((item) =>
        item.id === section.id ? change(item) : item,
      ),
    }))
  const updateItem = (
    id: string,
    change: (item: CustomSectionItem) => CustomSectionItem,
  ) =>
    updateSection((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? change(item) : item,
      ),
    }))
  return (
    <div className="profile-item">
      <div className="profile-item-heading">
        <Field
          label="Section title"
          value={section.title}
          onChange={(value) =>
            updateSection((current) => ({ ...current, title: value }))
          }
        />
        <ItemActions
          itemLabel={section.title || 'custom section'}
          hasContent={Boolean(section.title || section.items.length)}
          onRemove={() =>
            changeProfile((current) => ({
              ...current,
              customSections: current.customSections.filter(
                (item) => item.id !== section.id,
              ),
            }))
          }
        />
      </div>
      {section.items.map((item) => (
        <div className="profile-subitem" key={item.id}>
          <div className="profile-form-grid">
            <Field
              label="Title"
              value={item.title}
              onChange={(value) =>
                updateItem(item.id, (entry) => ({ ...entry, title: value }))
              }
              className="span"
            />
            <Field
              label="Subtitle"
              value={item.subtitle}
              onChange={(value) =>
                updateItem(item.id, (entry) => ({ ...entry, subtitle: value }))
              }
            />
            <Field
              label="Date"
              placeholder="e.g. Sep 2022"
              value={item.date}
              onChange={(value) =>
                updateItem(item.id, (entry) => ({ ...entry, date: value }))
              }
            />
          </div>
          <Field
            label="Description"
            value={item.description}
            multiline
            onChange={(value) =>
              updateItem(item.id, (entry) => ({ ...entry, description: value }))
            }
          />
          <ItemActions
            itemLabel={item.title || 'custom section item'}
            hasContent={Boolean(
              item.title || item.subtitle || item.date || item.description,
            )}
            onRemove={() =>
              updateSection((current) => ({
                ...current,
                items: current.items.filter((entry) => entry.id !== item.id),
              }))
            }
          />
        </div>
      ))}
      <button
        className="button button-ghost"
        type="button"
        onClick={() =>
          updateSection((current) => ({
            ...current,
            items: [
              ...current.items,
              {
                id: newId(),
                title: '',
                subtitle: '',
                date: '',
                description: '',
              },
            ],
          }))
        }
      >
        <Plus size={14} /> Add item
      </button>
    </div>
  )
}
