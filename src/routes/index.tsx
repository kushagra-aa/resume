import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { resumeRepository } from '#/db/repositories/resume-repository'
import { createStarterDocument } from '#/features/editor/starter-content'
import { loadResumes } from '#/features/resume/services/resume-storage'
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

  useEffect(() => {
    loadResumes()
      .then((loaded) => setDocuments(sortByModifiedTime(loaded)))
      .catch(() =>
        setError('Saved resumes could not be loaded from IndexedDB.'),
      )
      .finally(() => setLoading(false))
  }, [])

  async function createResume() {
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
        <button
          className="button button-primary"
          onClick={() => void createResume()}
        >
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
              onClick={() => void createResume()}
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
    </main>
  )
}
