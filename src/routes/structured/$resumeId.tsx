import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronDown, Code2, Download, Printer, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppHeader } from '#/components/app-header'
import { BackButton } from '#/components/back-button'
import { ResumeHistoryDialog } from '#/components/resume-history-dialog'
import { ThemeToggle } from '#/components/theme-toggle'
import { profileRepository } from '#/db/repositories/profile-repository'
import { resumeRepository } from '#/db/repositories/resume-repository'
import { structuredResumeRepository } from '#/db/repositories/structured-resume-repository'
import { resumeHistoryRepository } from '#/db/repositories/resume-history-repository'
import { inferContactLink } from '#/features/profiles/contact-links'
import { createResumeSrcDoc } from '#/features/resume/runtime'
import { exportResumePackage } from '#/features/resume/source-package'
import {
  createStructuredResume,
  defaultSectionOrderForTemplate,
} from '#/features/resumes/create-structured-resume'
import { renderStructuredResume } from '#/features/resumes/structured-renderer'
import { parseStructuredResume } from '#/schemas/structured-resume'
import { createTemplatePreviewDocument } from '#/features/templates/template-preview'
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

function sectionOrderGroup(templateId: string, section: ProfileSectionKey) {
  if (templateId !== 'modern') return 'page'
  return [
    'summary',
    'skills',
    'education',
    'certifications',
    'awards',
    'publications',
  ].includes(section)
    ? 'aside'
    : 'main'
}

function getSortableItems(profile: Profile, section: ProfileSectionKey) {
  switch (section) {
    case 'personal':
      return profile.links.map((item) => ({
        id: item.id,
        label: item.label || item.url || 'Contact link',
      }))
    case 'experience':
      return profile.experience.map((item) => ({
        id: item.id,
        label: item.role || item.company || 'Experience',
      }))
    case 'education':
      return profile.education.map((item) => ({
        id: item.id,
        label: item.degree || item.institution || 'Education',
      }))
    case 'skills':
      return profile.skills.map((item) => ({
        id: item.id,
        label: item.name || 'Skill group',
      }))
    case 'projects':
      return profile.projects.map((item) => ({
        id: item.id,
        label: item.name || 'Project',
      }))
    case 'certifications':
      return profile.certifications.map((item) => ({
        id: item.id,
        label: item.name || item.issuer || 'Certification',
      }))
    case 'awards':
      return profile.awards.map((item) => ({
        id: item.id,
        label: item.name || item.issuer || 'Award',
      }))
    case 'publications':
      return profile.publications.map((item) => ({
        id: item.id,
        label: item.title || item.publisher || 'Publication',
      }))
    case 'customSections':
      return profile.customSections.map((item) => ({
        id: item.id,
        label: item.title || 'Custom section',
      }))
    case 'summary':
      return []
  }
}

export const Route = createFileRoute('/structured/$resumeId')({
  component: StructuredResumeBuilder,
})

function StructuredResumeBuilder() {
  const { resumeId } = Route.useParams()
  const navigate = useNavigate()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const exportMenuRef = useRef<HTMLDetailsElement>(null)
  const draggedSectionRef = useRef<ProfileSectionKey | null>(null)
  const draggedItemRef = useRef<string | null>(null)
  const [resume, setResume] = useState<StructuredResume | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState('Loading…')
  const [frameHeight, setFrameHeight] = useState(1123)
  const [mobilePanel, setMobilePanel] = useState<'edit' | 'preview'>('edit')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateFilter, setTemplateFilter] = useState<
    'all' | 'built-in' | 'custom'
  >('all')
  const [orderItemsSection, setOrderItemsSection] =
    useState<ProfileSectionKey>('experience')
  const [templateSectionOpen, setTemplateSectionOpen] = useState(true)

  useEffect(() => {
    function closeExportMenu(event: PointerEvent) {
      const menu = exportMenuRef.current
      if (menu?.open && !menu.contains(event.target as Node))
        menu.removeAttribute('open')
    }

    function handleExportMenuKeydown(event: KeyboardEvent) {
      const menu = exportMenuRef.current
      if (event.key !== 'Escape' || !menu?.open) return
      menu.removeAttribute('open')
      menu.querySelector('summary')?.focus()
    }

    document.addEventListener('pointerdown', closeExportMenu)
    document.addEventListener('keydown', handleExportMenuKeydown)
    return () => {
      document.removeEventListener('pointerdown', closeExportMenu)
      document.removeEventListener('keydown', handleExportMenuKeydown)
    }
  }, [])

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
  const visibleTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase()
    return templates.filter((item) => {
      const isCustom = item.id.startsWith('custom-')
      return (
        (templateFilter === 'all' ||
          (templateFilter === 'custom' ? isCustom : !isCustom)) &&
        (!query ||
          `${item.name} ${item.description}`.toLowerCase().includes(query))
      )
    })
  }, [templateFilter, templateSearch, templates])

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
      customization: {
        ...current.customization,
        sectionOrder: defaultSectionOrderForTemplate(next.id),
      },
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
  function setSectionTitle(section: ProfileSectionKey, value: string) {
    updateResume((current) => ({
      ...current,
      customization: {
        ...current.customization,
        sectionTitles: {
          ...current.customization.sectionTitles,
          [section]: value,
        },
      },
    }))
  }
  function reorderSection(section: ProfileSectionKey, direction: -1 | 1) {
    updateResume((current) => {
      const order = [
        ...(current.customization.sectionOrder ??
          defaultSectionOrderForTemplate(current.templateId)),
      ]
      const index = order.indexOf(section)
      const nextIndex = index + direction
      if (
        index < 0 ||
        nextIndex < 0 ||
        nextIndex >= order.length ||
        sectionOrderGroup(current.templateId, order[nextIndex]!) !==
          sectionOrderGroup(current.templateId, section)
      )
        return current
      ;[order[index], order[nextIndex]] = [order[nextIndex]!, order[index]!]
      return {
        ...current,
        customization: { ...current.customization, sectionOrder: order },
      }
    })
  }
  function reorderItems(
    section: ProfileSectionKey,
    itemIds: string[],
    itemId: string,
    direction: -1 | 1,
  ) {
    updateResume((current) => {
      const savedOrder = current.customization.itemOrder?.[section] ?? itemIds
      const order = [
        ...savedOrder,
        ...itemIds.filter((id) => !savedOrder.includes(id)),
      ]
      const index = order.indexOf(itemId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length)
        return current
      ;[order[index], order[nextIndex]] = [order[nextIndex]!, order[index]!]
      return {
        ...current,
        customization: {
          ...current.customization,
          itemOrder: { ...current.customization.itemOrder, [section]: order },
        },
      }
    })
  }
  function moveSection(section: ProfileSectionKey, target: ProfileSectionKey) {
    updateResume((current) => {
      if (
        section === target ||
        sectionOrderGroup(current.templateId, section) !==
          sectionOrderGroup(current.templateId, target)
      )
        return current
      const order = [
        ...(current.customization.sectionOrder ??
          defaultSectionOrderForTemplate(current.templateId)),
      ]
      const from = order.indexOf(section)
      const to = order.indexOf(target)
      if (from < 0 || to < 0) return current
      order.splice(to, 0, order.splice(from, 1)[0]!)
      return {
        ...current,
        customization: { ...current.customization, sectionOrder: order },
      }
    })
  }
  function moveItem(
    section: ProfileSectionKey,
    itemIds: string[],
    itemId: string,
    targetId: string,
  ) {
    updateResume((current) => {
      const savedOrder = current.customization.itemOrder?.[section] ?? itemIds
      const order = [
        ...savedOrder,
        ...itemIds.filter((id) => !savedOrder.includes(id)),
      ]
      const from = order.indexOf(itemId)
      const to = order.indexOf(targetId)
      if (from < 0 || to < 0 || from === to) return current
      order.splice(to, 0, order.splice(from, 1)[0]!)
      return {
        ...current,
        customization: {
          ...current.customization,
          itemOrder: { ...current.customization.itemOrder, [section]: order },
        },
      }
    })
  }
  async function openPowerModeCopy() {
    if (!renderedDocument || !resume) return
    const now = new Date().toISOString()
    const sourceCopy: ResumeDocument = {
      ...renderedDocument,
      id: crypto.randomUUID(),
      name: `${resume.name} — Power Mode`,
      createdAt: now,
      updatedAt: now,
    }
    try {
      await resumeRepository.create(sourceCopy)
      void navigate({
        to: '/editor/$resumeId',
        params: { resumeId: sourceCopy.id },
      })
    } catch {
      setError('A Power Mode source copy could not be created.')
    }
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
        <div className="builder-save-cluster">
          <ResumeHistoryDialog
            resumeId={resume.id}
            onRestore={async (entry) => {
              const restored = parseStructuredResume(entry.snapshot)
              if (restored.id !== resume.id)
                throw new Error('History entry belongs to another resume.')
              await resumeHistoryRepository.recordBeforeUpdate(
                resume,
                restored,
                'structured',
                true,
              )
              const saved = await structuredResumeRepository.update({
                ...restored,
                updatedAt: new Date().toISOString(),
              })
              setResume(saved)
              setSaveState('Saved locally')
            }}
          />
          <span className="save-status" data-state={saveState}>
            <span className="status-dot" />
            {saveState}
          </span>
        </div>
        <details className="builder-export-menu" ref={exportMenuRef}>
          <summary className="button button-secondary">
            <Download size={14} aria-hidden="true" /> Export
            <ChevronDown size={13} aria-hidden="true" />
          </summary>
          <div className="builder-export-popover" aria-label="Export options">
            <button
              onClick={(event) => {
                downloadSource(renderedDocument, 'html')
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              <Download size={14} aria-hidden="true" /> HTML source
            </button>
            <button
              onClick={(event) => {
                downloadSource(renderedDocument, 'css')
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              <Download size={14} aria-hidden="true" /> CSS source
            </button>
            <button
              onClick={(event) => {
                exportResumePackage(renderedDocument)
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              <Download size={14} aria-hidden="true" /> ZIP package
            </button>
            <button
              title="Create an independent HTML/CSS source copy. Future Easy Mode changes will not update this copy."
              onClick={(event) => {
                void openPowerModeCopy()
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              <Code2 size={14} aria-hidden="true" /> Edit source copy
            </button>
          </div>
        </details>
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
        <ThemeToggle />
      </AppHeader>

      <div
        className="structured-builder-layout"
        data-mobile-panel={mobilePanel}
      >
        <nav className="builder-mobile-tabs" aria-label="Builder panels">
          <button
            aria-pressed={mobilePanel === 'edit'}
            onClick={() => setMobilePanel('edit')}
          >
            Edit content
          </button>
          <button
            aria-pressed={mobilePanel === 'preview'}
            onClick={() => setMobilePanel('preview')}
          >
            Preview
          </button>
        </nav>
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
          <details
            className="builder-section-list builder-template-section"
            open={templateSectionOpen}
            onToggle={(event) =>
              setTemplateSectionOpen(event.currentTarget.open)
            }
          >
            <summary>
              <span>Choose a template</span>
              <ChevronDown size={17} aria-hidden="true" />
            </summary>
            <label className="template-search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search templates</span>
              <input
                value={templateSearch}
                onChange={(event) => setTemplateSearch(event.target.value)}
                placeholder="Search templates"
              />
            </label>
            <div className="template-filter" aria-label="Filter templates">
              {(['all', 'built-in', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  aria-pressed={templateFilter === filter}
                  onClick={() => setTemplateFilter(filter)}
                >
                  {filter === 'all'
                    ? 'All'
                    : filter === 'built-in'
                      ? 'Built-in'
                      : 'Custom'}
                </button>
              ))}
            </div>
            <div className="template-gallery">
              {visibleTemplates.map((item) => {
                const preview = createTemplatePreviewDocument(item)
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
                      {item.id.startsWith('custom-')
                        ? 'Custom template'
                        : `Built-in · v${item.version}`}
                    </span>
                  </button>
                )
              })}
              {visibleTemplates.length === 0 ? (
                <p className="template-controls-empty">
                  No templates match this search.
                </p>
              ) : null}
            </div>
          </details>

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
            <details className="section-title-customization">
              <summary>Customize section headings</summary>
              {(
                Object.entries(sectionLabels) as Array<
                  [ProfileSectionKey, string]
                >
              )
                .filter(([section]) => section !== 'personal')
                .map(([section, label]) => (
                  <label key={section}>
                    {label}
                    <input
                      value={resume.customization.sectionTitles[section] ?? ''}
                      placeholder={label}
                      onChange={(event) =>
                        setSectionTitle(section, event.target.value)
                      }
                    />
                  </label>
                ))}
            </details>
            <details className="section-title-customization">
              <summary>Reorder sections</summary>
              <p className="builder-item-description">
                Sections stay within their template column.
              </p>
              <ol className="builder-order-list">
                {(
                  resume.customization.sectionOrder ??
                  defaultSectionOrderForTemplate(resume.templateId)
                ).map((section, index, order) => {
                  const group = sectionOrderGroup(resume.templateId, section)
                  const canMoveUp =
                    index > 0 &&
                    sectionOrderGroup(resume.templateId, order[index - 1]!) ===
                      group
                  const canMoveDown =
                    index < order.length - 1 &&
                    sectionOrderGroup(resume.templateId, order[index + 1]!) ===
                      group
                  return (
                    <li
                      key={section}
                      draggable
                      onDragStart={(event) => {
                        draggedSectionRef.current = section
                        event.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        const dragged = draggedSectionRef.current
                        if (dragged) moveSection(dragged, section)
                        draggedSectionRef.current = null
                      }}
                    >
                      <span>{sectionLabels[section]}</span>
                      <span className="builder-order-actions">
                        <button
                          type="button"
                          aria-label={`Move ${sectionLabels[section]} up`}
                          disabled={!canMoveUp}
                          onClick={() => reorderSection(section, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${sectionLabels[section]} down`}
                          disabled={!canMoveDown}
                          onClick={() => reorderSection(section, 1)}
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </details>
            <details className="section-title-customization">
              <summary>Reorder items</summary>
              <label>
                Section
                <select
                  value={orderItemsSection}
                  onChange={(event) =>
                    setOrderItemsSection(
                      event.target.value as ProfileSectionKey,
                    )
                  }
                >
                  {(Object.keys(sectionLabels) as ProfileSectionKey[])
                    .filter(
                      (section) => getSortableItems(profile, section).length,
                    )
                    .map((section) => (
                      <option key={section} value={section}>
                        {sectionLabels[section]}
                      </option>
                    ))}
                </select>
              </label>
              <ol className="builder-order-list">
                {(() => {
                  const items = getSortableItems(profile, orderItemsSection)
                  const savedOrder =
                    resume.customization.itemOrder?.[orderItemsSection] ?? []
                  const order = [
                    ...savedOrder,
                    ...items
                      .map((item) => item.id)
                      .filter((id) => !savedOrder.includes(id)),
                  ]
                  const itemById = new Map(items.map((item) => [item.id, item]))
                  return order.flatMap((id, index) => {
                    const item = itemById.get(id)
                    if (!item) return []
                    return (
                      <li
                        key={id}
                        draggable
                        onDragStart={(event) => {
                          draggedItemRef.current = id
                          event.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault()
                          const dragged = draggedItemRef.current
                          if (dragged)
                            moveItem(
                              orderItemsSection,
                              items.map((value) => value.id),
                              dragged,
                              id,
                            )
                          draggedItemRef.current = null
                        }}
                      >
                        <span>{item.label}</span>
                        <span className="builder-order-actions">
                          <button
                            type="button"
                            aria-label={`Move ${item.label} up`}
                            disabled={index === 0}
                            onClick={() =>
                              reorderItems(
                                orderItemsSection,
                                items.map((value) => value.id),
                                id,
                                -1,
                              )
                            }
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${item.label} down`}
                            disabled={index === order.length - 1}
                            onClick={() =>
                              reorderItems(
                                orderItemsSection,
                                items.map((value) => value.id),
                                id,
                                1,
                              )
                            }
                          >
                            ↓
                          </button>
                        </span>
                      </li>
                    )
                  })
                })()}
              </ol>
            </details>
            <section className="builder-content-section">
              <VisibilityCheckbox
                label={sectionLabels.personal}
                checked={resume.selection.sections.personal}
                onChange={(checked) => setSectionVisible('personal', checked)}
              />
              {resume.selection.sections.personal ? (
                <div className="builder-nested-list">
                  {(
                    Object.entries(profile.personal).filter(
                      ([key]) =>
                        !['website', 'linkedin', 'github'].includes(key),
                    ) as Array<[keyof Profile['personal'], string]>
                  ).map(([key, value]) => (
                    <VisibilityCheckbox
                      key={key}
                      nested
                      label={`${key.replace(/([A-Z])/g, ' $1').toUpperCase()}${value ? ` · ${value}` : ''}`}
                      checked={itemIsVisible('personal', key)}
                      onChange={(checked) =>
                        setItemVisible('personal', key, checked)
                      }
                    />
                  ))}
                  {profile.links.map((link) => {
                    const site = inferContactLink(link.label, link.url)
                    const selectionKey = `link:${link.id}`
                    return (
                      <VisibilityCheckbox
                        key={link.id}
                        nested
                        label={`${site.icon === 'link' ? '↗' : site.label} · ${link.label || site.label}${link.url ? ` · ${link.url}` : ''}`}
                        checked={itemIsVisible('personal', selectionKey)}
                        onChange={(checked) =>
                          setItemVisible('personal', selectionKey, checked)
                        }
                      />
                    )
                  })}
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
