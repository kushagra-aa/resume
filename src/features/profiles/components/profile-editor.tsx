import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { profileRepository } from '#/db/repositories/profile-repository'
import type {
  Award,
  Certification,
  CustomSection,
  CustomSectionItem,
  Education,
  Experience,
  Profile,
  Project,
  Publication,
  Skill,
} from '#/models/profile'

const newId = () => crypto.randomUUID()

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          value={value}
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
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="profile-section island-shell">
      <div className="profile-section-heading">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}

function ItemActions({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      className="button button-ghost profile-remove"
      type="button"
      onClick={onRemove}
    >
      <Trash2 size={14} aria-hidden="true" />
      Remove
    </button>
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
  const [saveState, setSaveState] = useState('Loading…')

  useEffect(() => {
    profileRepository
      .get(profileId)
      .then((value) => {
        if (!value) setError('Profile not found.')
        setProfile(value)
      })
      .catch(() => setError('The profile could not be loaded.'))
      .finally(() => setLoading(false))
  }, [profileId])

  useEffect(() => {
    if (!profile || loading) return
    setSaveState('Saving…')
    const timeout = window.setTimeout(() => {
      profileRepository
        .update(profile)
        .then(() => setSaveState('Saved locally'))
        .catch(() => setSaveState('Could not save'))
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [profile, loading])

  function changeProfile(change: (current: Profile) => Profile) {
    setProfile((current) => (current ? updateAt(change(current)) : current))
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
      <header className="profile-page-header">
        <button
          className="button button-ghost"
          type="button"
          onClick={() => void navigate({ to: '/' })}
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </button>
        <div>
          <p className="panel-kicker">Profile</p>
          <h1>{profile.name}</h1>
        </div>
        <span className="profile-save-state">
          <Save size={14} aria-hidden="true" /> {saveState}
        </span>
      </header>

      <div className="profile-editor-content">
        <Section
          title="Profile details"
          description="This name is used to identify the profile in your workspace."
        >
          <div className="profile-form-grid">
            <Field
              label="Profile name"
              value={profile.name}
              onChange={(value) =>
                changeProfile((current) => ({ ...current, name: value }))
              }
            />
          </div>
        </Section>

        <Section
          title="Personal information"
          description="Contact details that can be reused across resumes."
        >
          <div className="profile-form-grid">
            {(
              Object.keys(profile.personal) as Array<keyof Profile['personal']>
            ).map((key) => (
              <Field
                key={key}
                label={key.replace(/([A-Z])/g, ' $1')}
                value={profile.personal[key]}
                onChange={(value) =>
                  changeProfile((current) => ({
                    ...current,
                    personal: { ...current.personal, [key]: value },
                  }))
                }
              />
            ))}
          </div>
        </Section>

        <Section
          title="Summary"
          description="A short introduction or professional summary."
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
          title="Experience"
          description="Your roles and accomplishments."
        >
          {profile.experience.map((item) => (
            <div className="profile-item" key={item.id}>
              <div className="profile-item-heading">
                <h3>{item.role || 'New role'}</h3>
                <ItemActions
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
                    bullets: [''],
                  },
                ],
              }))
            }
          >
            <Plus size={15} /> Add experience
          </button>
        </Section>

        <Section title="Education">
          {profile.education.map((item) => (
            <div className="profile-item" key={item.id}>
              <div className="profile-item-heading">
                <h3>{item.degree || 'New education'}</h3>
                <ItemActions
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
          title="Skills"
          description="Group related skills so templates can present them clearly."
        >
          {profile.skills.map((item) => (
            <div className="profile-item" key={item.id}>
              <div className="profile-item-heading">
                <h3>{item.name || 'New skill group'}</h3>
                <ItemActions
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
              <div className="profile-form-grid">
                <Field
                  label="Group name"
                  value={item.name}
                  onChange={(value) =>
                    updateSkill(item.id, (entry) => ({ ...entry, name: value }))
                  }
                />
                <Field
                  label="Skills (comma separated)"
                  value={item.skills.join(', ')}
                  onChange={(value) =>
                    updateSkill(item.id, (entry) => ({
                      ...entry,
                      skills: value
                        .split(',')
                        .map((skill) => skill.trim())
                        .filter(Boolean),
                    }))
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

        <Section title="Projects">
          {profile.projects.map((item) => (
            <div className="profile-item" key={item.id}>
              <div className="profile-item-heading">
                <h3>{item.name || 'New project'}</h3>
                <ItemActions
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
                  value={item.url}
                  onChange={(value) =>
                    updateProject(item.id, (entry) => ({
                      ...entry,
                      url: value,
                    }))
                  }
                />
                <Field
                  label="Technologies (comma separated)"
                  value={item.technologies.join(', ')}
                  onChange={(value) =>
                    updateProject(item.id, (entry) => ({
                      ...entry,
                      technologies: value
                        .split(',')
                        .map((tech) => tech.trim())
                        .filter(Boolean),
                    }))
                  }
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
                    bullets: [''],
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
                <ItemActions onRemove={() => remove('awards', item.id)} />
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
                <ItemActions onRemove={() => remove('publications', item.id)} />
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
