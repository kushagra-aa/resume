import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import {
  ACTIVE_KEY,
  DOCUMENTS_KEY,
  newDocument,
  readDocuments,
} from '#/features/editor/components/resume-editor'
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
    try {
      setDocuments(sortByModifiedTime(readDocuments()))
    } catch {
      setError('Saved resumes could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  function persist(nextDocuments: ResumeDocument[]) {
    window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(nextDocuments))
    setDocuments(nextDocuments)
  }

  function createResume() {
    const created = newDocument(`Resume ${documents.length + 1}`)
    persist([...documents, created])
    window.localStorage.setItem(ACTIVE_KEY, created.id)
    void navigate({ to: '/editor/$resumeId', params: { resumeId: created.id } })
  }

  function openResume(document: ResumeDocument) {
    window.localStorage.setItem(ACTIVE_KEY, document.id)
    void navigate({
      to: '/editor/$resumeId',
      params: { resumeId: document.id },
    })
  }

  function renameResume(document: ResumeDocument) {
    const name = window.prompt('Resume name', document.name)?.trim()
    if (!name || name === document.name) return
    persist(
      documents.map((item) =>
        item.id === document.id
          ? { ...item, name, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  function duplicateResume(document: ResumeDocument) {
    const now = new Date().toISOString()
    const duplicate = {
      ...document,
      id: crypto.randomUUID(),
      name: `${document.name} Copy`,
      createdAt: now,
      updatedAt: now,
    }
    persist([...documents, duplicate])
  }

  function deleteResume(document: ResumeDocument) {
    if (!window.confirm(`Delete “${document.name}”?`)) return
    const remaining = documents.filter((item) => item.id !== document.id)
    persist(remaining)
    if (window.localStorage.getItem(ACTIVE_KEY) === document.id)
      window.localStorage.removeItem(ACTIVE_KEY)
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
        <button className="button button-primary" onClick={createResume}>
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
            <button className="button button-primary" onClick={createResume}>
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
                    onClick={() => renameResume(document)}
                  >
                    Rename
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => duplicateResume(document)}
                  >
                    Duplicate
                  </button>
                  <button
                    className="delete-link"
                    onClick={() => deleteResume(document)}
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
