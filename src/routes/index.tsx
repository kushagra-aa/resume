import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  Copy,
  EllipsisVertical,
  FilePlus,
  Pencil,
  Trash,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AppDialog } from '#/components/app-dialog'
import { AppHeader } from '#/components/app-header'
import { ThemeToggle } from '#/components/theme-toggle'
import { resumeRepository } from '#/db/repositories/resume-repository'
import {
  createBlankDocument,
  createStarterDocument,
} from '#/features/templates/starter-template'
import { loadResumes } from '#/features/resume/services/resume-storage'
import { importResumePackage } from '#/features/resume/source-package'
import { renderTemplate } from '#/features/templates/template-renderer'
import { loadTemplates } from '#/features/templates/template-service'
import type { ResumeTemplate } from '#/features/templates/template-types'
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
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [renameTarget, setRenameTarget] = useState<ResumeDocument | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResumeDocument | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    loadResumes()
      .then((loaded) => setDocuments(sortByModifiedTime(loaded)))
      .catch(() =>
        setError('Saved resumes could not be loaded from IndexedDB.'),
      )
      .finally(() => setLoading(false))
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
      const duplicate = await resumeRepository.duplicate(document)
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
      </AppHeader>

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        <div className="dashboard-intro">
          <p className="panel-kicker">Your workspace</p>
          <h1 id="dashboard-title">My resumes</h1>
          <p>Keep each version separate, editable, and under your control.</p>
        </div>

        {loading ? <p className="dashboard-message">Loading resumes…</p> : null}
        {error ? <p className="dashboard-message error">{error}</p> : null}
        {!loading && documents.length === 0 ? (
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
        {!loading && documents.length > 0 ? (
          <div className="resume-card-grid">
            {documents.map((document) => (
              <article
                className="resume-card island-shell cursor-pointer"
                key={document.id}
                onClick={() => openResume(document)}
              >
                <div className="resume-card-body">
                  <p className="resume-card-kicker">Resume</p>
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
      </section>

      <AppDialog
        open={showCreateDialog}
        title="Choose a starting point"
        description="New resume"
        onClose={() => setShowCreateDialog(false)}
      >
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
    </main>
  )
}
