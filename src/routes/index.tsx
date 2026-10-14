import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  Copy,
  Download,
  EllipsisVertical,
  FilePlus,
  Pencil,
  Plus,
  Trash,
  TriangleAlert,
  Upload,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AppDialog } from '#/components/app-dialog'
import { AppHeader } from '#/components/app-header'
import { ThemeToggle } from '#/components/theme-toggle'
import { createResumeSrcDoc } from '#/features/resume/runtime'
import { resumeRepository } from '#/db/repositories/resume-repository'
import { structuredResumeRepository } from '#/db/repositories/structured-resume-repository'
import { customTemplateRepository } from '#/db/repositories/custom-template-repository'
import {
  createBlankDocument,
  createStarterDocument,
} from '#/features/templates/starter-template'
import { loadResumes } from '#/features/resume/services/resume-storage'
import {
  exportTemplatePackage,
  importResumePackage,
  importTemplatePackage,
} from '#/features/resume/source-package'
import { renderTemplate } from '#/features/templates/template-renderer'
import { loadTemplates } from '#/features/templates/template-service'
import {
  duplicateTemplate,
  renameCustomTemplate,
} from '#/features/templates/custom-template-service'
import { createTemplatePreviewDocument } from '#/features/templates/template-preview'
import { createEmptyProfile } from '#/features/profiles/profile-defaults'
import {
  exportProfilePackage,
  importProfilePackage,
} from '#/features/profiles/profile-package'
import { createStructuredResume } from '#/features/resumes/create-structured-resume'
import { createResumeCopyName } from '#/features/resume/duplicate-name'
import { profileRepository } from '#/db/repositories/profile-repository'
import type { ResumeTemplate } from '#/features/templates/template-types'
import type { CustomTemplate } from '#/features/templates/template-types'
import type { Profile } from '#/models/profile'
import type { StructuredResume } from '#/models/structured-resume'
import type { ResumeDocument } from '#/models/resume'

export const Route = createFileRoute('/')({ component: Dashboard })

function formatModifiedTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function sortByModifiedTime(documents: ResumeDocument[]) {
  return [...documents].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<ResumeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [powerModeCreate, setPowerModeCreate] = useState(false)
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const templateImportInputRef = useRef<HTMLInputElement>(null)
  const profileImportInputRef = useRef<HTMLInputElement>(null)
  const [renameTarget, setRenameTarget] = useState<ResumeDocument | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResumeDocument | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profileDeleteTarget, setProfileDeleteTarget] =
    useState<Profile | null>(null)
  const [structuredResumes, setStructuredResumes] = useState<
    StructuredResume[]
  >([])
  const [activeTab, setActiveTab] = useState<
    'resumes' | 'profiles' | 'templates'
  >('resumes')
  const [showStructuredCreate, setShowStructuredCreate] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [structuredRenameTarget, setStructuredRenameTarget] =
    useState<StructuredResume | null>(null)
  const [structuredRenameValue, setStructuredRenameValue] = useState('')
  const [structuredDeleteTarget, setStructuredDeleteTarget] =
    useState<StructuredResume | null>(null)
  const [templateRenameTarget, setTemplateRenameTarget] =
    useState<CustomTemplate | null>(null)
  const [templateRenameValue, setTemplateRenameValue] = useState('')
  const [templateDeleteTarget, setTemplateDeleteTarget] =
    useState<CustomTemplate | null>(null)

  useEffect(() => {
    loadResumes()
      .then((loaded) => setDocuments(sortByModifiedTime(loaded)))
      .catch(() =>
        setError('Saved resumes could not be loaded from IndexedDB.'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'templates') return
    setTemplatesLoading(true)
    loadTemplates()
      .then(setTemplates)
      .catch(() => setError('Templates could not be loaded.'))
      .finally(() => setTemplatesLoading(false))
  }, [activeTab])

  useEffect(() => {
    profileRepository
      .list()
      .then(setProfiles)
      .catch(() => setError('Profiles could not be loaded from IndexedDB.'))
      .finally(() => setProfilesLoading(false))
  }, [])

  useEffect(() => {
    structuredResumeRepository
      .list()
      .then(setStructuredResumes)
      .catch(() => setError('Structured resumes could not be loaded.'))
  }, [])

  useEffect(() => {
    if (!openMenuId) return
    const closeMenu = () => setOpenMenuId(null)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openMenuId])

  async function openCreateDialog() {
    setPowerModeCreate(false)
    setShowCreateDialog(true)
    if (templates.length || templatesLoading) return
    setTemplatesLoading(true)
    try {
      setTemplates(await loadTemplates())
    } catch {
      setError('Templates could not be loaded.')
    } finally {
      setTemplatesLoading(false)
    }
  }

  async function openStructuredCreateDialog() {
    setSelectedProfileId(profiles[0]?.id ?? '')
    setSelectedTemplateId((current) => current || templates[0]?.id || '')
    setShowStructuredCreate(true)
    if (templates.length || templatesLoading) return
    setTemplatesLoading(true)
    try {
      const loaded = await loadTemplates()
      setTemplates(loaded)
      setSelectedTemplateId((current) => current || loaded[0]?.id || '')
    } catch {
      setError('Templates could not be loaded.')
    } finally {
      setTemplatesLoading(false)
    }
  }

  async function createStructured() {
    const profile = profiles.find((item) => item.id === selectedProfileId)
    if (!profile || !selectedTemplateId) return
    try {
      const created = await structuredResumeRepository.create(
        createStructuredResume(profile, selectedTemplateId),
      )
      setStructuredResumes((current) => [created, ...current])
      setShowStructuredCreate(false)
      setActiveTab('resumes')
    } catch {
      setError('The structured resume could not be created.')
    }
  }

  async function renameStructuredResume() {
    if (!structuredRenameTarget) return
    const name = structuredRenameValue.trim()
    if (!name) return
    try {
      const updated = await structuredResumeRepository.update({
        ...structuredRenameTarget,
        name,
        updatedAt: new Date().toISOString(),
      })
      setStructuredResumes((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setStructuredRenameTarget(null)
    } catch {
      setError('The resume could not be renamed.')
    }
  }

  async function duplicateStructuredResume(resume: StructuredResume) {
    try {
      const duplicate = await structuredResumeRepository.duplicate(
        resume,
        createResumeCopyName(resume.name, [
          ...documents.map((item) => item.name),
          ...structuredResumes.map((item) => item.name),
        ]),
      )
      setStructuredResumes((current) => [duplicate, ...current])
    } catch {
      setError('The resume could not be duplicated.')
    }
  }

  async function deleteStructuredResume() {
    if (!structuredDeleteTarget) return
    try {
      await structuredResumeRepository.delete(structuredDeleteTarget.id)
      setStructuredResumes((current) =>
        current.filter((item) => item.id !== structuredDeleteTarget.id),
      )
      setStructuredDeleteTarget(null)
    } catch {
      setError('The resume could not be deleted.')
    }
  }

  async function duplicateTemplateForEditing(template: ResumeTemplate) {
    try {
      const created = await duplicateTemplate(template)
      setTemplates((current) => [created, ...current])
      void navigate({
        to: '/templates/$templateId',
        params: { templateId: created.id },
      })
    } catch {
      setError('The template could not be duplicated.')
    }
  }

  async function importCustomTemplate(file: File) {
    try {
      const imported = await importTemplatePackage(file)
      const availableTemplates = await loadTemplates()
      setTemplates(availableTemplates)
      const existingNames = new Set(
        availableTemplates.map((template) => template.name.toLocaleLowerCase()),
      )
      let name = imported.name
      if (existingNames.has(name.toLocaleLowerCase())) {
        const baseName = `${name} (Imported)`
        name = baseName
        let copy = 2
        while (existingNames.has(name.toLocaleLowerCase())) {
          name = `${baseName} ${copy}`
          copy += 1
        }
      }
      const saved = await customTemplateRepository.create({
        ...imported,
        name,
      })
      setTemplates((current) => [saved, ...current])
      void navigate({
        to: '/templates/$templateId',
        params: { templateId: saved.id },
      })
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'The custom template could not be imported.',
      )
    }
  }

  async function saveTemplateName() {
    if (!templateRenameTarget) return
    try {
      const updated = await renameCustomTemplate(
        templateRenameTarget,
        templateRenameValue,
      )
      setTemplates((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setTemplateRenameTarget(null)
    } catch (renameError) {
      setError(
        renameError instanceof Error
          ? renameError.message
          : 'The template could not be renamed.',
      )
    }
  }

  async function deleteCustomTemplate() {
    if (!templateDeleteTarget) return
    const usageCount = structuredResumes.filter(
      (resume) => resume.templateId === templateDeleteTarget.id,
    ).length
    if (usageCount > 0) {
      setError(
        `This template is used by ${usageCount} resume${usageCount === 1 ? '' : 's'}. Reassign those resumes before deleting it.`,
      )
      setTemplateDeleteTarget(null)
      return
    }
    try {
      await customTemplateRepository.delete(templateDeleteTarget.id)
      setTemplates((current) =>
        current.filter((item) => item.id !== templateDeleteTarget.id),
      )
      setTemplateDeleteTarget(null)
    } catch {
      setError('The custom template could not be deleted.')
    }
  }

  async function createBlankResume() {
    try {
      const created = createBlankDocument('Resume ' + (documents.length + 1))
      await resumeRepository.create(created)
      void navigate({
        to: '/editor/$resumeId',
        params: { resumeId: created.id },
      })
    } catch {
      setError('The new resume could not be created.')
    }
  }

  async function createStarterResume() {
    try {
      const created = createStarterDocument('Resume ' + (documents.length + 1))
      await resumeRepository.create(created)
      setShowCreateDialog(false)
      void navigate({
        to: '/editor/$resumeId',
        params: { resumeId: created.id },
      })
    } catch {
      setError('The starter resume could not be created.')
    }
  }

  async function createFromTemplate(template: ResumeTemplate) {
    try {
      const created = createStarterDocument(template.name)
      const generated = {
        ...created,
        html: renderTemplate(template.html, template.defaults),
        css: template.css,
      }
      await resumeRepository.create(generated)
      setShowCreateDialog(false)
      void navigate({
        to: '/editor/$resumeId',
        params: { resumeId: generated.id },
      })
    } catch {
      setError('The resume could not be created from that template.')
    }
  }

  async function importPackage(file: File) {
    try {
      const imported = await importResumePackage(file)
      await resumeRepository.create(imported)
      setDocuments((current) => sortByModifiedTime([...current, imported]))
      void navigate({
        to: '/editor/$resumeId',
        params: { resumeId: imported.id },
      })
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'The source package could not be imported.',
      )
    }
  }

  function openResume(document: ResumeDocument) {
    void navigate({
      to: '/editor/$resumeId',
      params: { resumeId: document.id },
    })
  }

  function openRenameDialog(document: ResumeDocument) {
    setRenameTarget(document)
    setRenameValue(document.name)
    setRenameError(null)
  }

  async function renameResume() {
    if (!renameTarget) return
    const name = renameValue.trim()
    if (!name) {
      setRenameError('Enter a name for this resume.')
      return
    }
    if (name === renameTarget.name) {
      setRenameTarget(null)
      return
    }
    try {
      const updated = {
        ...renameTarget,
        name,
        updatedAt: new Date().toISOString(),
      }
      await resumeRepository.update(updated)
      setDocuments((current) =>
        sortByModifiedTime(
          current.map((item) => (item.id === renameTarget.id ? updated : item)),
        ),
      )
      setRenameTarget(null)
    } catch {
      setRenameError('The resume could not be renamed.')
    }
  }

  async function duplicateResume(document: ResumeDocument) {
    try {
      const duplicate = await resumeRepository.duplicate(
        document,
        createResumeCopyName(document.name, [
          ...documents.map((item) => item.name),
          ...structuredResumes.map((item) => item.name),
        ]),
      )
      setDocuments((current) => sortByModifiedTime([...current, duplicate]))
    } catch {
      setError('The resume could not be duplicated.')
    }
  }

  async function deleteResume() {
    if (!deleteTarget) return
    try {
      await resumeRepository.delete(deleteTarget.id)
      setDocuments((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      )
      setDeleteTarget(null)
    } catch {
      setError('The resume could not be deleted.')
    }
  }

  async function createProfile() {
    try {
      const created = await profileRepository.create(
        createEmptyProfile(`Profile ${profiles.length + 1}`),
      )
      setProfiles((current) => [created, ...current])
      void navigate({
        to: '/profiles/$profileId',
        params: { profileId: created.id },
      })
    } catch {
      setError('The profile could not be created.')
    }
  }

  async function duplicateProfile(profile: Profile) {
    try {
      const duplicate = await profileRepository.duplicate(profile)
      setProfiles((current) => [duplicate, ...current])
    } catch {
      setError('The profile could not be duplicated.')
    }
  }

  async function importProfile(file: File) {
    try {
      const imported = await importProfilePackage(file)
      await profileRepository.create(imported)
      setProfiles((current) => [imported, ...current])
      setActiveTab('profiles')
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'The profile package could not be imported.',
      )
    }
  }

  function downloadProfile(profile: Profile) {
    const url = URL.createObjectURL(
      new Blob([exportProfilePackage(profile)], {
        type: 'application/json;charset=utf-8',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `${profile.name.trim().replace(/\s+/g, '-').toLowerCase()}.resume-profile.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function deleteProfile() {
    if (!profileDeleteTarget) return
    try {
      await profileRepository.delete(profileDeleteTarget.id)
      setProfiles((current) =>
        current.filter((item) => item.id !== profileDeleteTarget.id),
      )
      setProfileDeleteTarget(null)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'The profile could not be deleted.',
      )
    }
  }

  return (
    <main className="dashboard-shell">
      <AppHeader className="dashboard-header">
        <ThemeToggle />
        <input
          ref={importInputRef}
          className="sr-only"
          type="file"
          accept=".zip,application/zip"
          aria-label="Import source package"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void importPackage(file)
          }}
        />
        <button
          className="button button-secondary"
          onClick={() => importInputRef.current?.click()}
        >
          <Upload size={15} aria-hidden="true" />
          Import ZIP
        </button>
        <button className="button button-primary" onClick={openCreateDialog}>
          <FilePlus size={15} aria-hidden="true" />
          Create resume
        </button>
        <button
          className="button button-secondary"
          onClick={() => void createProfile()}
        >
          <UserRound size={15} aria-hidden="true" />
          New profile
        </button>
      </AppHeader>

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        <div className="dashboard-intro">
          <p className="panel-kicker">Your workspace</p>
          <h1 id="dashboard-title">My resumes</h1>
          <p>Keep each version separate, editable, and under your control.</p>
        </div>

        <nav className="dashboard-tabs" aria-label="Workspace sections">
          {(['resumes', 'profiles', 'templates'] as const).map((tab) => (
            <button
              key={tab}
              className={`dashboard-tab${activeTab === tab ? ' active' : ''}`}
              aria-current={activeTab === tab ? 'page' : undefined}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'resumes'
                ? 'Resumes'
                : tab === 'profiles'
                  ? 'Profiles'
                  : 'Custom templates'}
            </button>
          ))}
          {activeTab === 'resumes' ? (
            <button
              className="button button-primary dashboard-tab-action"
              onClick={() => void openStructuredCreateDialog()}
            >
              <Plus size={15} aria-hidden="true" /> Create from profile
            </button>
          ) : null}
          {activeTab === 'profiles' ? (
            <>
              <input
                ref={profileImportInputRef}
                className="sr-only"
                type="file"
                accept=".json,application/json"
                aria-label="Import profile JSON"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void importProfile(file)
                }}
              />
              <button
                className="button button-secondary dashboard-tab-action"
                onClick={() => profileImportInputRef.current?.click()}
              >
                <Upload size={15} aria-hidden="true" /> Import profile
              </button>
              <button
                className="button button-primary dashboard-tab-action"
                onClick={() => void createProfile()}
              >
                <UserRound size={15} aria-hidden="true" /> New profile
              </button>
            </>
          ) : null}
          {activeTab === 'templates' ? (
            <>
              <input
                ref={templateImportInputRef}
                className="sr-only"
                type="file"
                accept=".zip,application/zip"
                aria-label="Import custom template package"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void importCustomTemplate(file)
                }}
              />
              <button
                className="button button-primary dashboard-tab-action"
                onClick={() => templateImportInputRef.current?.click()}
              >
                <Upload size={15} aria-hidden="true" /> Import template
              </button>
            </>
          ) : null}
        </nav>

        {loading ? <p className="dashboard-message">Loading resumes…</p> : null}
        {error ? <p className="dashboard-message error">{error}</p> : null}
        {activeTab === 'profiles' ? (
          <section
            className="dashboard-section"
            aria-labelledby="profiles-title"
          >
            <div className="dashboard-section-heading">
              <div>
                <p className="panel-kicker">Reusable career data</p>
                <h2 id="profiles-title">Profiles</h2>
              </div>
              <button
                className="button button-secondary"
                onClick={() => void createProfile()}
              >
                <Plus size={15} aria-hidden="true" /> Add profile
              </button>
            </div>
            {profilesLoading ? (
              <p className="dashboard-message">Loading profiles…</p>
            ) : null}
            {!profilesLoading && profiles.length === 0 ? (
              <p className="dashboard-muted">
                Create a profile once, then reuse it across multiple resumes.
              </p>
            ) : null}
            <div className="profile-card-grid">
              {profiles.map((profile) => (
                <article className="profile-card island-shell" key={profile.id}>
                  <button
                    className="profile-card-main"
                    onClick={() =>
                      void navigate({
                        to: '/profiles/$profileId',
                        params: { profileId: profile.id },
                      })
                    }
                  >
                    <UserRound size={18} aria-hidden="true" />
                    <span>
                      <strong>{profile.name}</strong>
                      <small>
                        {profile.personal.fullName || 'No personal details yet'}
                      </small>
                    </span>
                  </button>
                  <div className="profile-card-actions">
                    <button
                      className="button button-ghost"
                      onClick={() =>
                        void navigate({
                          to: '/profiles/$profileId',
                          params: { profileId: profile.id },
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="button button-ghost"
                      onClick={() => void duplicateProfile(profile)}
                    >
                      Duplicate
                    </button>
                    <button
                      className="button button-ghost"
                      onClick={() => downloadProfile(profile)}
                    >
                      <Download size={14} aria-hidden="true" /> Export JSON
                    </button>
                    <button
                      className="button button-ghost profile-danger-action"
                      onClick={() => setProfileDeleteTarget(profile)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {activeTab === 'resumes' &&
        !loading &&
        documents.length === 0 &&
        structuredResumes.length === 0 ? (
          <div className="dashboard-empty island-shell">
            <h2>No resumes yet</h2>
            <p>Create a blank resume to get started.</p>
            <button
              className="button button-primary"
              onClick={openCreateDialog}
            >
              Create your first resume
            </button>
          </div>
        ) : null}
        {activeTab === 'resumes' && structuredResumes.length > 0 ? (
          <section
            className="dashboard-section"
            aria-labelledby="structured-resumes-title"
          >
            <div className="dashboard-section-heading">
              <div>
                <p className="panel-kicker">Profile based</p>
                <h2 id="structured-resumes-title">Resumes</h2>
              </div>
            </div>
            <div className="resume-card-grid">
              {structuredResumes.map((resume) => {
                const profile = profiles.find(
                  (item) => item.id === resume.profileId,
                )
                return (
                  <article className="resume-card island-shell" key={resume.id}>
                    <div className="resume-card-body">
                      <p className="resume-card-kicker">
                        Structured resume · {profile?.name ?? 'Missing profile'}
                      </p>
                      <h2 title={resume.name}>{resume.name}</h2>
                      <p className="resume-card-meta">
                        Modified {formatModifiedTime(resume.updatedAt)}
                      </p>
                    </div>
                    <div className="profile-card-actions">
                      <button
                        className="button button-primary"
                        onClick={() =>
                          void navigate({
                            to: '/structured/$resumeId',
                            params: { resumeId: resume.id },
                          })
                        }
                      >
                        Preview / Export
                      </button>
                      <button
                        className="button button-ghost"
                        onClick={() => {
                          setStructuredRenameTarget(resume)
                          setStructuredRenameValue(resume.name)
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="button button-ghost"
                        onClick={() => void duplicateStructuredResume(resume)}
                      >
                        Duplicate
                      </button>
                      <button
                        className="button button-ghost profile-danger-action"
                        onClick={() => setStructuredDeleteTarget(resume)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}
        {activeTab === 'resumes' && documents.length > 0 ? (
          <div className="resume-card-grid">
            {documents.map((document) => (
              <article
                className="resume-card island-shell cursor-pointer"
                key={document.id}
                onClick={() => openResume(document)}
              >
                <div className="resume-card-body">
                  <p className="resume-card-kicker">Power Mode · HTML/CSS</p>
                  <h2 title={document.name}>{document.name}</h2>
                  <p className="resume-card-meta">
                    Modified {formatModifiedTime(document.updatedAt)}
                  </p>
                </div>
                <div className="resume-card-actions">
                  <button className="p-0! button button-ghost">
                    Open <ArrowRightIcon size={14} />
                  </button>
                  <div
                    className="resume-card-menu"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      className="icon-button card-menu-trigger"
                      aria-label={`More actions for ${document.name}`}
                      aria-expanded={openMenuId === document.id}
                      title="More actions"
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === document.id ? null : document.id,
                        )
                      }
                    >
                      <EllipsisVertical size={18} aria-hidden="true" />
                    </button>
                    {openMenuId === document.id ? (
                      <div className="card-menu-popover" role="menu">
                        <button
                          className="card-menu-item"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            openRenameDialog(document)
                          }}
                        >
                          <Pencil size={15} aria-hidden="true" />
                          Rename
                        </button>
                        <button
                          className="card-menu-item"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            void duplicateResume(document)
                          }}
                        >
                          <Copy size={15} aria-hidden="true" />
                          Duplicate
                        </button>
                        <button
                          className="card-menu-item card-menu-item-danger"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            setDeleteTarget(document)
                          }}
                        >
                          <Trash size={15} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {activeTab === 'templates' ? (
          <section className="template-library" aria-label="Template library">
            <div className="template-library-heading">
              <div>
                <p className="panel-kicker">Template library</p>
                <h2>Built-in and custom templates</h2>
                <p>
                  Built-in templates are read-only. Duplicate one to customize
                  it.
                </p>
              </div>
            </div>
            {templatesLoading ? (
              <p className="dashboard-message">Loading templates…</p>
            ) : templates.length ? (
              <div className="template-library-grid">
                {templates.map((template) => {
                  const custom = template.id.startsWith('custom-')
                    ? (template as CustomTemplate)
                    : null
                  const preview = createTemplatePreviewDocument(template)
                  return (
                    <article
                      className="template-library-card"
                      key={template.id}
                    >
                      <div className="template-library-preview">
                        <iframe
                          title={`${template.name} sample`}
                          sandbox="allow-scripts"
                          tabIndex={-1}
                          srcDoc={createResumeSrcDoc(preview, false)}
                        />
                      </div>
                      <div className="template-library-card-body">
                        <div className="template-library-card-heading">
                          <div>
                            <h3>{template.name}</h3>
                            <p>{template.description}</p>
                          </div>
                          <span>
                            {custom
                              ? 'Custom'
                              : `Built-in · v${template.version}`}
                          </span>
                        </div>
                        <div className="template-library-actions">
                          {custom ? (
                            <>
                              <button
                                className="button button-primary"
                                onClick={() =>
                                  void navigate({
                                    to: '/templates/$templateId',
                                    params: { templateId: custom.id },
                                  })
                                }
                              >
                                Edit HTML/CSS
                              </button>
                              <button
                                className="button button-ghost"
                                onClick={() => {
                                  setTemplateRenameTarget(custom)
                                  setTemplateRenameValue(custom.name)
                                }}
                              >
                                Rename
                              </button>
                              <button
                                className="button button-ghost"
                                onClick={() => exportTemplatePackage(custom)}
                              >
                                Export
                              </button>
                              <button
                                className="button button-ghost profile-danger-action"
                                onClick={() => setTemplateDeleteTarget(custom)}
                              >
                                Delete
                              </button>
                            </>
                          ) : null}
                          <button
                            className="button button-secondary"
                            onClick={() =>
                              void duplicateTemplateForEditing(template)
                            }
                          >
                            <Copy size={14} aria-hidden="true" /> Duplicate
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="dashboard-empty island-shell">
                <h2>No templates available</h2>
                <p>Check the built-in template assets and try again.</p>
              </div>
            )}
          </section>
        ) : null}
      </section>

      <AppDialog
        open={showStructuredCreate}
        title="Create a resume from a profile"
        description="The resume stores its own template and content selections. Your profile stays unchanged."
        onClose={() => setShowStructuredCreate(false)}
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => setShowStructuredCreate(false)}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              disabled={
                !profiles.length ||
                !templates.length ||
                !selectedProfileId ||
                !selectedTemplateId
              }
              onClick={() => void createStructured()}
            >
              Create resume
            </button>
          </>
        }
      >
        {profiles.length === 0 ? (
          <p className="dashboard-message">
            Create a profile before creating a structured resume.
          </p>
        ) : (
          <label className="dialog-field">
            Profile
            <select
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {templatesLoading ? (
          <p className="dashboard-message">Loading templates…</p>
        ) : templates.length ? (
          <label className="dialog-field">
            Template
            <select
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="dashboard-message">No templates are available.</p>
        )}
      </AppDialog>

      <AppDialog
        open={Boolean(structuredRenameTarget)}
        title="Rename resume"
        description="Choose a name for this profile based resume."
        onClose={() => setStructuredRenameTarget(null)}
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => setStructuredRenameTarget(null)}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              onClick={() => void renameStructuredResume()}
            >
              Save name
            </button>
          </>
        }
      >
        <label className="dialog-field">
          Resume name
          <input
            autoFocus
            value={structuredRenameValue}
            onChange={(event) => setStructuredRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void renameStructuredResume()
            }}
          />
        </label>
      </AppDialog>

      <AppDialog
        open={Boolean(structuredDeleteTarget)}
        title="Delete resume?"
        description="This removes the saved resume configuration. The profile remains unchanged."
        icon={<TriangleAlert size={20} aria-hidden="true" />}
        tone="danger"
        onClose={() => setStructuredDeleteTarget(null)}
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => setStructuredDeleteTarget(null)}
            >
              Keep resume
            </button>
            <button
              className="button button-danger"
              onClick={() => void deleteStructuredResume()}
            >
              Delete resume
            </button>
          </>
        }
      >
        <p className="dialog-confirmation-name">
          {structuredDeleteTarget?.name}
        </p>
      </AppDialog>

      <AppDialog
        open={Boolean(profileDeleteTarget)}
        title="Delete profile?"
        description="This removes the locally saved career profile."
        icon={<TriangleAlert size={20} aria-hidden="true" />}
        tone="danger"
        onClose={() => setProfileDeleteTarget(null)}
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => setProfileDeleteTarget(null)}
            >
              Keep profile
            </button>
            <button
              className="button button-danger"
              disabled={structuredResumes.some(
                (resume) => resume.profileId === profileDeleteTarget?.id,
              )}
              onClick={() => void deleteProfile()}
            >
              Delete profile
            </button>
          </>
        }
      >
        <div className="dialog-warning">
          <strong>This action cannot be undone.</strong>
          <span>
            {structuredResumes.some(
              (resume) => resume.profileId === profileDeleteTarget?.id,
            )
              ? 'Delete this profile’s linked resumes first.'
              : 'This action cannot be undone.'}
          </span>
        </div>
        <p className="dialog-confirmation-name">{profileDeleteTarget?.name}</p>
      </AppDialog>

      <AppDialog
        open={showCreateDialog}
        title={
          powerModeCreate ? 'Create in Power Mode' : 'Choose how to create'
        }
        description={
          powerModeCreate
            ? 'Choose a starting document for direct HTML/CSS editing.'
            : 'Pick the editing experience that suits this resume.'
        }
        onClose={() => {
          setShowCreateDialog(false)
          setPowerModeCreate(false)
        }}
      >
        {!powerModeCreate ? (
          <>
            <button
              className="template-option"
              onClick={() => {
                setShowCreateDialog(false)
                void openStructuredCreateDialog()
              }}
            >
              <strong>Resume Builder</strong>
              <span>
                Use a profile, choose a template, and customize your resume
                visually.
              </span>
            </button>
            <button
              className="template-option"
              onClick={() => setPowerModeCreate(true)}
            >
              <strong>Power Mode</strong>
              <span>
                Create or customize a resume directly with HTML and CSS.
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              className="button button-ghost create-mode-back"
              onClick={() => setPowerModeCreate(false)}
            >
              ← Back to editing mode
            </button>
            <button
              className="template-option"
              onClick={() => void createBlankResume()}
            >
              <strong>Blank document</strong>
              <span>Start with empty HTML and CSS.</span>
            </button>
            <button
              className="template-option"
              onClick={() => void createStarterResume()}
            >
              <strong>Starter resume</strong>
              <span>Start with editable sample resume content.</span>
            </button>
            {templatesLoading ? (
              <p className="dashboard-message">Loading templates…</p>
            ) : (
              templates.map((template) => (
                <button
                  className="template-option"
                  key={template.id}
                  onClick={() => void createFromTemplate(template)}
                >
                  <strong>{template.name}</strong>
                  <span>{template.description}</span>
                </button>
              ))
            )}
          </>
        )}
      </AppDialog>

      <AppDialog
        open={Boolean(renameTarget)}
        title="Rename resume"
        description="Choose a clear name so you can find this version later."
        onClose={() => setRenameTarget(null)}
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => setRenameTarget(null)}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              onClick={() => void renameResume()}
            >
              Save name
            </button>
          </>
        }
      >
        <label className="dialog-field">
          Resume name
          <input
            autoFocus
            value={renameValue}
            onChange={(event) => {
              setRenameValue(event.target.value)
              setRenameError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void renameResume()
            }}
          />
        </label>
        {renameError ? <p className="dialog-error">{renameError}</p> : null}
      </AppDialog>

      <AppDialog
        open={Boolean(deleteTarget)}
        title="Delete resume?"
        description="This removes the locally saved resume."
        icon={<TriangleAlert size={20} aria-hidden="true" />}
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Keep resume
            </button>
            <button
              className="button button-danger"
              onClick={() => void deleteResume()}
            >
              Delete resume
            </button>
          </>
        }
      >
        <div className="dialog-warning">
          <strong>This action cannot be undone.</strong>
          <span>You can keep the resume if you are not sure.</span>
        </div>
        <p className="dialog-confirmation-name">{deleteTarget?.name}</p>
      </AppDialog>

      <AppDialog
        open={Boolean(templateRenameTarget)}
        title="Rename custom template"
        description="The template name is global and is shared by resumes that use it."
        onClose={() => setTemplateRenameTarget(null)}
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => setTemplateRenameTarget(null)}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              onClick={() => void saveTemplateName()}
            >
              Save name
            </button>
          </>
        }
      >
        <label className="dialog-field">
          Template name
          <input
            autoFocus
            value={templateRenameValue}
            onChange={(event) => setTemplateRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void saveTemplateName()
            }}
          />
        </label>
      </AppDialog>

      <AppDialog
        open={Boolean(templateDeleteTarget)}
        title="Delete custom template?"
        description="This removes the global custom template. Built-in templates cannot be deleted."
        icon={<TriangleAlert size={20} aria-hidden="true" />}
        tone="danger"
        onClose={() => setTemplateDeleteTarget(null)}
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() => setTemplateDeleteTarget(null)}
            >
              Keep template
            </button>
            <button
              className="button button-danger"
              disabled={structuredResumes.some(
                (resume) => resume.templateId === templateDeleteTarget?.id,
              )}
              onClick={() => void deleteCustomTemplate()}
            >
              Delete template
            </button>
          </>
        }
      >
        <div className="dialog-warning">
          <strong>This action cannot be undone.</strong>
          <span>
            {structuredResumes.some(
              (resume) => resume.templateId === templateDeleteTarget?.id,
            )
              ? 'This template is in use. Reassign its resumes before deleting it.'
              : 'This template is not used by any profile-based resumes.'}
          </span>
        </div>
        <p className="dialog-confirmation-name">{templateDeleteTarget?.name}</p>
      </AppDialog>
    </main>
  )
}
