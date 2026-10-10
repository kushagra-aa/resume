import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Download, Printer } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppHeader } from '#/components/app-header'
import { BackButton } from '#/components/back-button'
import { ThemeToggle } from '#/components/theme-toggle'
import { profileRepository } from '#/db/repositories/profile-repository'
import { structuredResumeRepository } from '#/db/repositories/structured-resume-repository'
import { createResumeSrcDoc } from '#/features/resume/runtime'
import { exportResumePackage } from '#/features/resume/source-package'
import { createStructuredResume } from '#/features/resumes/create-structured-resume'
import { renderStructuredResume } from '#/features/resumes/structured-renderer'
import { renderTemplate } from '#/features/templates/template-renderer'
import { loadTemplates } from '#/features/templates/template-service'
import type { ResumeTemplate } from '#/features/templates/template-types'
import type { Profile } from '#/models/profile'
import type { ResumeDocument } from '#/models/resume'
import type {
  ProfileSectionKey,
  StructuredResume,
} from '#/models/structured-resume'

const sectionLabels: Record<ProfileSectionKey, string> = {
  personal: 'Personal information',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards',
  publications: 'Publications',
  customSections: 'Custom sections',
}

function downloadSource(resume: ResumeDocument, type: 'html' | 'css') {
  const value = type === 'html' ? resume.html : resume.css
  const url = URL.createObjectURL(
    new Blob([value], { type: 'text/plain;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `${resume.name.trim().replace(/\s+/g, '-').toLowerCase()}.${type}`
  link.click()
  URL.revokeObjectURL(url)
}

function createTemplatePreview(template: ResumeTemplate): ResumeDocument {
  const defaults = template.defaults
  const collection = (key: string) =>
    Array.isArray(defaults[key]) ? (defaults[key] as unknown[]) : []
  const asItems = (items: unknown[]) =>
    items.map((item) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? {
            ...(item as Record<string, unknown>),
            bullets: Array.isArray((item as Record<string, unknown>).bullets)
              ? ((item as Record<string, unknown>).bullets as unknown[]).map(
                  (bullet) =>
                    typeof bullet === 'string' ? { value: bullet } : bullet,
                )
              : [],
          }
        : item,
    )
  const data = {
    ...defaults,
    experience: asItems(collection('experience')),
    projects: asItems(collection('projects')),
    skills: collection('skills').map((skill) =>
      typeof skill === 'string' ? { value: skill, group: '' } : skill,
    ),
    sectionTitles: {
      summary: 'Profile',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      projects: 'Projects',
      certifications: 'Certifications',
      awards: 'Awards',
      publications: 'Publications',
      customSections: 'Additional',
    },
    sectionVisibility: {
      personal: true,
      summary: Boolean(defaults.summary),
      experience: collection('experience').length > 0,
      education: Boolean(defaults.education),
      skills: collection('skills').length > 0,
      projects: collection('projects').length > 0,
      certifications: collection('certifications').length > 0,
      awards: collection('awards').length > 0,
      publications: collection('publications').length > 0,
      customSections: collection('customSections').length > 0,
    },
  }
  return {
    id: `template-preview-${template.id}`,
    name: `${template.name} template preview`,
    html: renderTemplate(template.html, data),
    css: template.css,
    createdAt: '',
    updatedAt: '',
  }
}

function VisibilityCheckbox({
  label,
  checked,
  onChange,
  nested = false,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  nested?: boolean
}) {
  return (
    <label className={`builder-checkbox${nested ? ' nested' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export const Route = createFileRoute('/structured/$resumeId')({
  component: StructuredResumeBuilder,
})

function StructuredResumeBuilder() {
  const { resumeId } = Route.useParams()
  const navigate = useNavigate()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [resume, setResume] = useState<StructuredResume | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState('Loading…')
  const [frameHeight, setFrameHeight] = useState(1123)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      structuredResumeRepository.get(resumeId),
      profileRepository.list(),
      loadTemplates(),
    ])
      .then(([loadedResume, loadedProfiles, loadedTemplates]) => {
        if (cancelled) return
        if (!loadedResume) {
          setError('That resume could not be found.')
          return
        }
        setResume(loadedResume)
        setProfiles(loadedProfiles)
        setTemplates(loadedTemplates)
        setSaveState('Saved locally')
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : 'The resume could not be loaded.',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [resumeId])

  useEffect(() => {
    const onHeight = (event: MessageEvent<unknown>) => {
      if (
        event.source !== frameRef.current?.contentWindow ||
        !event.data ||
        typeof event.data !== 'object'
      )
        return
      const data = event.data as { type?: unknown; height?: unknown }
      if (
        data.type === 'resume-preview-height' &&
        typeof data.height === 'number' &&
        Number.isFinite(data.height)
      )
        setFrameHeight(Math.max(1123, Math.min(data.height, 20000)))
    }
    window.addEventListener('message', onHeight)
    return () => window.removeEventListener('message', onHeight)
  }, [])

  const profile = profiles.find((item) => item.id === resume?.profileId) ?? null
  const template =
    templates.find((item) => item.id === resume?.templateId) ?? null
  const renderedDocument = useMemo(
    () =>
      profile && resume && template
        ? renderStructuredResume(profile, resume, template)
        : null,
    [profile, resume, template],
  )

  useEffect(() => {
    if (!resume || loading) return
    setSaveState('Saving…')
    const timeout = window.setTimeout(() => {
      structuredResumeRepository
        .update({ ...resume, updatedAt: new Date().toISOString() })
        .then(() => setSaveState('Saved locally'))
        .catch(() => setSaveState('Could not save'))
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [resume, loading])

  function updateResume(
    change: (current: StructuredResume) => StructuredResume,
  ) {
    setResume((current) => (current ? change(current) : current))
  }
  function setSectionVisible(section: ProfileSectionKey, visible: boolean) {
    updateResume((current) => ({
      ...current,
      selection: {
        ...current.selection,
        sections: { ...current.selection.sections, [section]: visible },
      },
    }))
  }
  function setItemVisible(
    section: ProfileSectionKey,
    id: string,
    visible: boolean,
  ) {
    updateResume((current) => ({
      ...current,
      selection: {
        ...current.selection,
        items: {
          ...current.selection.items,
          [section]: { ...current.selection.items[section], [id]: visible },
        },
      },
    }))
  }
  function setBulletVisible(
    section: 'experience' | 'projects',
    parentId: string,
    bulletId: string,
    visible: boolean,
  ) {
    updateResume((current) => ({
      ...current,
      selection: {
        ...current.selection,
        bullets: {
          ...current.selection.bullets,
          [section]: {
            ...current.selection.bullets[section],
            [parentId]: {
              ...current.selection.bullets[section][parentId],
              [bulletId]: visible,
            },
          },
        },
      },
    }))
  }
  function changeProfile(profileId: string) {
    const nextProfile = profiles.find((item) => item.id === profileId)
    if (!nextProfile) return
    updateResume((current) => ({
      ...current,
      profileId,
      selection: createStructuredResume(
        nextProfile,
        current.templateId,
        current.name,
      ).selection,
    }))
  }
  function itemIsVisible(section: ProfileSectionKey, id: string) {
    return resume?.selection.items[section]?.[id] !== false
  }
  function chooseTemplate(next: ResumeTemplate) {
    updateResume((current) => ({
      ...current,
      templateId: next.id,
      templateConfiguration: Object.fromEntries(
        next.controls.map((control) => [control.key, control.defaultValue]),
      ),
    }))
  }
  function setTemplateConfiguration(key: string, value: string | number) {
    updateResume((current) => ({
      ...current,
      templateConfiguration: {
        ...current.templateConfiguration,
        [key]: value,
      },
    }))
  }

  if (loading || !resume || !profile || !template || !renderedDocument)
    return (
      <main className="app-shell">
        <p className={error ? 'dashboard-message error' : 'dashboard-message'}>
          {error ??
            (loading
              ? 'Loading resume builder…'
              : 'The profile or template could not be loaded.')}
        </p>
        {error ? (
          <BackButton
            label="Back to dashboard"
            variant="primary"
            onClick={() => void navigate({ to: '/' })}
          />
        ) : null}
      </main>
    )

  return (
    <main className="structured-builder-shell">
      <AppHeader
        className="structured-builder-header"
        leading={
          <BackButton
            label="Dashboard"
            onClick={() => void navigate({ to: '/' })}
          />
        }
      >
        <span className="save-status">
          <span className="status-dot" />
          {saveState}
        </span>
        <ThemeToggle />
        <button
          className="button button-secondary"
          onClick={() => downloadSource(renderedDocument, 'html')}
        >
          <Download size={14} /> HTML
        </button>
        <button
          className="button button-secondary"
          onClick={() => downloadSource(renderedDocument, 'css')}
        >
          <Download size={14} /> CSS
        </button>
        <button
          className="button button-secondary"
          onClick={() => exportResumePackage(renderedDocument)}
        >
          <Download size={14} /> ZIP
        </button>
        <button
          className="button button-primary"
          onClick={() =>
            void navigate({
              to: '/print/$resumeId',
              params: { resumeId: `structured-${resume.id}` },
            })
          }
        >
          <Printer size={14} /> Print / PDF
        </button>
      </AppHeader>

      <div className="structured-builder-layout">
        <aside
          className="builder-controls"
          aria-label="Resume content and template controls"
        >
          <div className="builder-title-block">
            <p className="panel-kicker">Easy Mode</p>
            <label className="builder-name-field">
              Resume name
              <input
                value={resume.name}
                onChange={(event) =>
                  updateResume((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label className="builder-select-field">
            Profile
            <select
              value={resume.profileId}
              onChange={(event) => changeProfile(event.target.value)}
            >
              {profiles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button button-ghost builder-edit-profile"
            onClick={() =>
              void navigate({
                to: '/profiles/$profileId',
                params: { profileId: resume.profileId },
              })
            }
          >
            Edit profile details
          </button>
          <div className="builder-section-list">
            <h2>Choose a template</h2>
            <div className="template-gallery">
              {templates.map((item) => {
                const preview = createTemplatePreview(item)
                return (
                  <button
                    className={`template-card${item.id === template.id ? ' selected' : ''}`}
                    key={item.id}
                    type="button"
                    aria-pressed={item.id === template.id}
                    onClick={() => chooseTemplate(item)}
                  >
                    <span className="template-card-preview" aria-hidden="true">
                      <iframe
                        title=""
                        sandbox="allow-scripts"
                        tabIndex={-1}
                        srcDoc={createResumeSrcDoc(preview)}
                      />
                    </span>
                    <span className="template-card-name">{item.name}</span>
                    <span className="template-card-description">
                      {item.description}
                    </span>
                    <span className="template-card-version">
                      Built-in · v{item.version}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="builder-section-list">
            <h2>Customize appearance</h2>
            {template.controls.length ? (
              template.controls.map((control) => {
                const value =
                  resume.templateConfiguration[control.key] ??
                  control.defaultValue
                return (
                  <label className="template-control" key={control.key}>
                    <span>{control.label}</span>
                    {control.type === 'select' ? (
                      <select
                        value={String(value)}
                        onChange={(event) =>
                          setTemplateConfiguration(
                            control.key,
                            event.target.value,
                          )
                        }
                      >
                        {control.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : control.type === 'color' ? (
                      <input
                        type="color"
                        value={String(value)}
                        onChange={(event) =>
                          setTemplateConfiguration(
                            control.key,
                            event.target.value,
                          )
                        }
                      />
                    ) : (
                      <span className="template-range-control">
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          step={control.step}
                          value={Number(value)}
                          onChange={(event) =>
                            setTemplateConfiguration(
                              control.key,
                              Number(event.target.value),
                            )
                          }
                        />
                        <output>
                          {value}
                          {control.unit ? ` ${control.unit}` : ''}
                        </output>
                      </span>
                    )}
                  </label>
                )
              })
            ) : (
              <p className="template-controls-empty">
                This template has no visual settings. Its design is unchanged.
              </p>
            )}
          </div>

          <div className="builder-section-list">
            <h2>Choose what to include</h2>
            <section className="builder-content-section">
              <VisibilityCheckbox
                label={sectionLabels.personal}
                checked={resume.selection.sections.personal}
                onChange={(checked) => setSectionVisible('personal', checked)}
              />
              {resume.selection.sections.personal ? (
                <div className="builder-nested-list">
                  {(
                    Object.entries(profile.personal) as Array<
                      [keyof Profile['personal'], string]
                    >
                  ).map(([key, value]) => (
                    <VisibilityCheckbox
                      key={key}
                      nested
                      label={`${key.replace(/([A-Z])/g, ' $1')}${value ? ` · ${value}` : ''}`}
                      checked={itemIsVisible('personal', key)}
                      onChange={(checked) =>
                        setItemVisible('personal', key, checked)
                      }
                    />
                  ))}
                </div>
              ) : null}
            </section>
            <section className="builder-content-section">
              <VisibilityCheckbox
                label={sectionLabels.summary}
                checked={resume.selection.sections.summary}
                onChange={(checked) => setSectionVisible('summary', checked)}
              />
              {resume.selection.sections.summary ? (
                <p className="builder-item-description">
                  {profile.summary || 'No summary added to this profile.'}
                </p>
              ) : null}
            </section>

            <CollectionSection
              title={sectionLabels.experience}
              section="experience"
              enabled={resume.selection.sections.experience}
              onSectionChange={setSectionVisible}
            >
              {profile.experience.map((item) => (
                <div className="builder-entry" key={item.id}>
                  <VisibilityCheckbox
                    label={`${item.role || 'Role'}${item.company ? ` · ${item.company}` : ''}`}
                    checked={itemIsVisible('experience', item.id)}
                    onChange={(checked) =>
                      setItemVisible('experience', item.id, checked)
                    }
                  />
                  {itemIsVisible('experience', item.id) ? (
                    <div className="builder-nested-list">
                      {item.bullets.map((bullet, index) => {
                        const id = `${item.id}-bullet-${index}`
                        return (
                          <VisibilityCheckbox
                            key={id}
                            nested
                            label={bullet || `Bullet ${index + 1}`}
                            checked={
                              resume.selection.bullets.experience[item.id]?.[
                                id
                              ] !== false
                            }
                            onChange={(checked) =>
                              setBulletVisible(
                                'experience',
                                item.id,
                                id,
                                checked,
                              )
                            }
                          />
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </CollectionSection>

            <CollectionSection
              title={sectionLabels.education}
              section="education"
              enabled={resume.selection.sections.education}
              onSectionChange={setSectionVisible}
            >
              {profile.education.map((item) => (
                <VisibilityCheckbox
                  key={item.id}
                  label={`${item.degree || 'Education'}${item.institution ? ` · ${item.institution}` : ''}`}
                  checked={itemIsVisible('education', item.id)}
                  onChange={(checked) =>
                    setItemVisible('education', item.id, checked)
                  }
                />
              ))}
            </CollectionSection>

            <CollectionSection
              title={sectionLabels.skills}
              section="skills"
              enabled={resume.selection.sections.skills}
              onSectionChange={setSectionVisible}
            >
              {profile.skills.map((group) => (
                <div className="builder-entry" key={group.id}>
                  <VisibilityCheckbox
                    label={group.name || 'Skills'}
                    checked={itemIsVisible('skills', group.id)}
                    onChange={(checked) =>
                      setItemVisible('skills', group.id, checked)
                    }
                  />
                  {itemIsVisible('skills', group.id) ? (
                    <div className="builder-nested-list">
                      {group.skills.map((skill, index) => {
                        const id = `${group.id}:skill:${index}`
                        return (
                          <VisibilityCheckbox
                            key={id}
                            nested
                            label={skill}
                            checked={itemIsVisible('skills', id)}
                            onChange={(checked) =>
                              setItemVisible('skills', id, checked)
                            }
                          />
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </CollectionSection>

            <CollectionSection
              title={sectionLabels.projects}
              section="projects"
              enabled={resume.selection.sections.projects}
              onSectionChange={setSectionVisible}
            >
              {profile.projects.map((item) => (
                <div className="builder-entry" key={item.id}>
                  <VisibilityCheckbox
                    label={item.name || 'Project'}
                    checked={itemIsVisible('projects', item.id)}
                    onChange={(checked) =>
                      setItemVisible('projects', item.id, checked)
                    }
                  />
                  {itemIsVisible('projects', item.id) ? (
                    <div className="builder-nested-list">
                      {item.bullets.map((bullet, index) => {
                        const id = `${item.id}-bullet-${index}`
                        return (
                          <VisibilityCheckbox
                            key={id}
                            nested
                            label={bullet || `Highlight ${index + 1}`}
                            checked={
                              resume.selection.bullets.projects[item.id]?.[
                                id
                              ] !== false
                            }
                            onChange={(checked) =>
                              setBulletVisible('projects', item.id, id, checked)
                            }
                          />
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </CollectionSection>

            <SimpleCollection
              title={sectionLabels.certifications}
              section="certifications"
              items={profile.certifications.map((item) => ({
                id: item.id,
                label: item.name || item.issuer || 'Certification',
              }))}
              resume={resume}
              onSectionChange={setSectionVisible}
              onItemChange={setItemVisible}
            />
            <SimpleCollection
              title={sectionLabels.awards}
              section="awards"
              items={profile.awards.map((item) => ({
                id: item.id,
                label: item.name || item.issuer || 'Award',
              }))}
              resume={resume}
              onSectionChange={setSectionVisible}
              onItemChange={setItemVisible}
            />
            <SimpleCollection
              title={sectionLabels.publications}
              section="publications"
              items={profile.publications.map((item) => ({
                id: item.id,
                label: item.title || item.publisher || 'Publication',
              }))}
              resume={resume}
              onSectionChange={setSectionVisible}
              onItemChange={setItemVisible}
            />
            <CollectionSection
              title={sectionLabels.customSections}
              section="customSections"
              enabled={resume.selection.sections.customSections}
              onSectionChange={setSectionVisible}
            >
              {profile.customSections.map((section) => (
                <div className="builder-entry" key={section.id}>
                  <VisibilityCheckbox
                    label={section.title || 'Custom section'}
                    checked={itemIsVisible('customSections', section.id)}
                    onChange={(checked) =>
                      setItemVisible('customSections', section.id, checked)
                    }
                  />
                  {itemIsVisible('customSections', section.id) ? (
                    <div className="builder-nested-list">
                      {section.items.map((item) => {
                        const id = `${section.id}:${item.id}`
                        return (
                          <VisibilityCheckbox
                            key={id}
                            nested
                            label={item.title || item.subtitle || 'Item'}
                            checked={itemIsVisible('customSections', id)}
                            onChange={(checked) =>
                              setItemVisible('customSections', id, checked)
                            }
                          />
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </CollectionSection>
          </div>
        </aside>

        <section className="builder-preview" aria-label="Live resume preview">
          <div className="builder-preview-heading">
            <div>
              <p className="panel-kicker">Live preview</p>
              <h1>{resume.name}</h1>
            </div>
            <span>{template.name}</span>
          </div>
          <div className="builder-preview-stage">
            <div
              className="builder-paper"
              style={{ height: `${frameHeight}px` }}
            >
              <iframe
                ref={frameRef}
                title={`${resume.name} live preview`}
                sandbox="allow-scripts"
                srcDoc={createResumeSrcDoc(renderedDocument)}
                style={{ height: `${frameHeight}px` }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function CollectionSection({
  title,
  section,
  enabled,
  onSectionChange,
  children,
}: {
  title: string
  section: ProfileSectionKey
  enabled: boolean
  onSectionChange: (section: ProfileSectionKey, checked: boolean) => void
  children: ReactNode
}) {
  return (
    <section className="builder-content-section">
      <VisibilityCheckbox
        label={title}
        checked={enabled}
        onChange={(checked) => onSectionChange(section, checked)}
      />
      {enabled ? <div className="builder-nested-list">{children}</div> : null}
    </section>
  )
}

function SimpleCollection({
  title,
  section,
  items,
  resume,
  onSectionChange,
  onItemChange,
}: {
  title: string
  section: 'certifications' | 'awards' | 'publications'
  items: Array<{ id: string; label: string }>
  resume: StructuredResume
  onSectionChange: (section: ProfileSectionKey, checked: boolean) => void
  onItemChange: (
    section: ProfileSectionKey,
    id: string,
    checked: boolean,
  ) => void
}) {
  const enabled = resume.selection.sections[section]
  return (
    <section className="builder-content-section">
      <VisibilityCheckbox
        label={title}
        checked={enabled}
        onChange={(checked) => onSectionChange(section, checked)}
      />
      {enabled ? (
        <div className="builder-nested-list">
          {items.map((item) => (
            <VisibilityCheckbox
              key={item.id}
              nested
              label={item.label}
              checked={resume.selection.items[section]?.[item.id] !== false}
              onChange={(checked) => onItemChange(section, item.id, checked)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
