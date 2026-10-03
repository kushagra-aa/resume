import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { resumeRepository } from '#/db/repositories/resume-repository'
import { createStarterDocument } from '#/features/editor/starter-content'
import { loadResumes } from '#/features/resume/services/resume-storage'
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

  useEffect(() => {
    loadResumes()
      .then((loaded) => setDocuments(sortByModifiedTime(loaded)))
      .catch(() =>
        setError('Saved resumes could not be loaded from IndexedDB.'),
      )
      .finally(() => setLoading(false))
  }, [])

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
      const created = createStarterDocument('Resume ' + (documents.length + 1))
      await resumeRepository.create(created)
      void navigate({
        to: '/editor/$resumeId',
        params: { resumeId: created.id },
      })
    } catch {
      setError('The new resume could not be created.')
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

  function openResume(document: ResumeDocument) {
    void navigate({
      to: '/editor/$resumeId',
      params: { resumeId: document.id },
    })
  }

  async function renameResume(document: ResumeDocument) {
    const name = window.prompt('Resume name', document.name)?.trim()
    if (!name || name === document.name) return
    try {
      const updated = {
        ...document,
        name,
        updatedAt: new Date().toISOString(),
      }
      await resumeRepository.update(updated)
      setDocuments((current) =>
        sortByModifiedTime(
          current.map((item) => (item.id === document.id ? updated : item)),
        ),
      )
    } catch {
      setError('The resume could not be renamed.')
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

  async function deleteResume(document: ResumeDocument) {
    if (!window.confirm(`Delete “${document.name}”?`)) return
    try {
      await resumeRepository.delete(document.id)
      setDocuments((current) =>
        current.filter((item) => item.id !== document.id),
      )
    } catch {
      setError('The resume could not be deleted.')
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div className="brand-lockup">
          <span className="brand-mark">R</span>
          <div>
            <p className="brand-name">ResuMe</p>
            <p className="brand-caption">Your work, in your words.</p>
          </div>
        </div>
        <button className="button button-primary" onClick={openCreateDialog}>
          + Create resume
        </button>
      </header>

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        <div className="dashboard-intro">
          <p className="panel-kicker">Your workspace</p>
          <h1 id="dashboard-title">My resumes</h1>
          <p>Keep each version separate, editable, and under your control.</p>
        </div>

        {loading ? <p className="dashboard-message">Loading resumes…</p> : null}
        {error ? <p className="dashboard-message error">{error}</p> : null}
        {!loading && !error && documents.length === 0 ? (
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
        {!loading && !error && documents.length > 0 ? (
          <div className="resume-card-grid">
            {documents.map((document) => (
              <article className="resume-card island-shell" key={document.id}>
                <div>
                  <p className="resume-card-kicker">Resume</p>
                  <h2>{document.name}</h2>
                  <p className="resume-card-meta">
                    Modified {formatModifiedTime(document.updatedAt)}
                  </p>
                </div>
                <div className="resume-card-actions">
                  <button
                    className="button button-primary"
                    onClick={() => openResume(document)}
                  >
                    Open
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => void renameResume(document)}
                  >
                    Rename
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => void duplicateResume(document)}
                  >
                    Duplicate
                  </button>
                  <button
                    className="delete-link"
                    onClick={() => void deleteResume(document)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {showCreateDialog ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="template-dialog island-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-dialog-title"
          >
            <div className="template-dialog-header">
              <div>
                <p className="panel-kicker">New resume</p>
                <h2 id="template-dialog-title">Choose a starting point</h2>
              </div>
              <button
                className="button button-quiet"
                aria-label="Close template chooser"
                onClick={() => setShowCreateDialog(false)}
              >
                Close
              </button>
            </div>
            <button
              className="template-option"
              onClick={() => void createBlankResume()}
            >
              <strong>Blank starter</strong>
              <span>Start with the current editable starter resume.</span>
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
          </section>
        </div>
      ) : null}
    </main>
  )
}
