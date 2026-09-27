import { useNavigate, useParams } from '@tanstack/react-router'

import { useEffect, useMemo, useRef, useState } from 'react'

import { resumeRepository } from '#/db/repositories/resume-repository'
import { createStarterDocument } from '#/features/editor/starter-content'
import { loadResumes } from '#/features/resume/services/resume-storage'
import { createResumeSrcDoc } from '#/features/resume/runtime'
import type { ResumeDocument } from '#/models/resume'

type EditorKind = 'html' | 'css'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightSource(source: string, kind: EditorKind) {
  const pattern =
    kind === 'html'
      ? /(<!--[\s\S]*?-->|<\/?[a-z][^>]*>|"[^"\n]*"|'[^'\n]*')/gi
      : /(\/\*[\s\S]*?\*\/|"[^"\n]*"|'[^'\n]*'|#[0-9a-f]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|mm|%|vh|vw)?\b)/gi
  return source
    .split(pattern)
    .map((part, index) => {
      if (!part) return ''
      const escaped = escapeHtml(part)
      const isToken = index % 2 === 1
      return isToken ? `<span class="syntax-token">${escaped}</span>` : escaped
    })
    .join('')
}

function validateSource(source: string, kind: EditorKind): string[] {
  const errors: string[] = []
  if (kind === 'html' && typeof window !== 'undefined') {
    const parsed = new DOMParser().parseFromString(source, 'text/html')
    if (parsed.querySelector('parsererror'))
      errors.push('HTML could not be parsed.')
  }
  let balance = 0
  for (const character of source) {
    if (character === '{') balance += 1
    if (character === '}') balance -= 1
    if (balance < 0) break
  }
  if (kind === 'css' && balance !== 0) errors.push('CSS braces are unbalanced.')
  if (
    kind === 'html' &&
    (source.match(/</g) ?? []).length !== (source.match(/>/g) ?? []).length
  )
    errors.push('HTML tags appear to be incomplete.')
  return errors
}

function CodeEditor({
  kind,
  value,
  onChange,
}: {
  kind: EditorKind
  value: string
  onChange: (value: string) => void
}) {
  const highlightRef = useRef<HTMLPreElement>(null)
  const errors = useMemo(() => validateSource(value, kind), [kind, value])
  function syncScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = event.currentTarget.scrollTop
      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
  }
  return (
    <>
      <div className="code-editor">
        <pre
          ref={highlightRef}
          className="code-highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: `${highlightSource(value, kind)}\n`,
          }}
        />
        <textarea
          className="source-editor"
          spellCheck={false}
          value={value}
          onScroll={syncScroll}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div
        className={
          errors.length ? 'editor-validation invalid' : 'editor-validation'
        }
      >
        {errors.length ? errors.join(' ') : `${kind.toUpperCase()} looks valid`}
      </div>
    </>
  )
}

export function ResumeEditor() {
  const { resumeId } = useParams({ strict: false })
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<ResumeDocument[]>([])
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [activeEditor, setActiveEditor] = useState<EditorKind>('html')
  const [zoom, setZoom] = useState(0.8)
  const [previewHeight, setPreviewHeight] = useState(1123)
  const [stageWidth, setStageWidth] = useState(720)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const previewStageRef = useRef<HTMLDivElement>(null)
  const resume = documents.find((item) => item.id === resumeId)
  const pageCount = Math.max(1, Math.ceil(previewHeight / 1123))
  const fittedZoom = Math.min(zoom, Math.max(0.35, stageWidth / 794))

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    loadResumes()
      .then((loaded) => {
        if (cancelled) return
        setDocuments(loaded)
        if (!loaded.some((item) => item.id === resumeId))
          setError('That resume could not be found.')
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Resumes could not be loaded from local storage.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [resumeId])

  useEffect(() => {
    if (!dirty || !resume) return
    const timeout = window.setTimeout(() => {
      const updated = { ...resume, updatedAt: new Date().toISOString() }
      resumeRepository
        .update(updated)
        .then(() => {
          setDocuments((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          )
          setSavedAt(new Date())
          setDirty(false)
        })
        .catch(() => setError('Your changes could not be saved.'))
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [dirty, resume])

  useEffect(() => {
    const stage = previewStageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setStageWidth(entry.contentRect.width)
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onPreviewMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== previewRef.current?.contentWindow) return
      if (!event.data || typeof event.data !== 'object') return
      const data = event.data as { type?: unknown; height?: unknown }
      if (
        data.type !== 'resume-preview-height' ||
        typeof data.height !== 'number' ||
        !Number.isFinite(data.height)
      )
        return
      setPreviewHeight(Math.max(1123, Math.min(data.height, 20000)))
    }
    window.addEventListener('message', onPreviewMessage)
    return () => window.removeEventListener('message', onPreviewMessage)
  }, [])

  useEffect(
    () => setPreviewHeight(1123),
    [resume?.id, resume?.html, resume?.css],
  )

  const preview = useMemo(
    () => (resume ? createResumeSrcDoc(resume) : ''),
    [resume],
  )

  function update(field: 'html' | 'css' | 'name', value: string) {
    setDocuments((current) =>
      current.map((item) =>
        item.id === resume?.id ? { ...item, [field]: value } : item,
      ),
    )
    setDirty(true)
  }

  async function createResume() {
    const created = createStarterDocument('Resume ' + (documents.length + 1))
    await resumeRepository.create(created)
    void navigate({ to: '/editor/$resumeId', params: { resumeId: created.id } })
  }

  async function deleteResume() {
    if (!resume || !window.confirm('Delete “' + resume.name + '”?')) return
    await resumeRepository.delete(resume.id)
    void navigate({ to: '/' })
  }

  async function resetResume() {
    if (!resume || !window.confirm('Reset this resume to the starter content?'))
      return
    const reset = { ...createStarterDocument(resume.name), id: resume.id }
    await resumeRepository.update(reset)
    setDocuments((current) =>
      current.map((item) => (item.id === reset.id ? reset : item)),
    )
    setSavedAt(new Date())
    setDirty(false)
  }

  function exportSource(extension: 'html' | 'css') {
    if (!resume) return
    const content = extension === 'html' ? resume.html : resume.css
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download =
      resume.name.toLowerCase().replace(/\\s+/g, '-') + '.' + extension
    link.click()
    URL.revokeObjectURL(url)
  }

  function printResume() {
    if (resume)
      void navigate({ to: '/print/$resumeId', params: { resumeId: resume.id } })
  }

  if (loading)
    return (
      <main className="app-shell">
        <p className="dashboard-message">Loading resume…</p>
      </main>
    )

  if (error || !resume)
    return (
      <main className="app-shell">
        <p className="dashboard-message error">
          {error ?? 'Resume not found.'}
        </p>
        <button
          className="button button-primary"
          onClick={() => void navigate({ to: '/' })}
        >
          Back to dashboard
        </button>
      </main>
    )

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark">R</span>
          <div>
            <p className="brand-name">ResuMe</p>
            <p className="brand-caption">Your work, in your words.</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="save-status">
            <span className="status-dot" />
            {savedAt
              ? `Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Ready'}
          </span>
          <button className="button button-quiet" onClick={resetResume}>
            Reset
          </button>
          <button
            className="button button-secondary"
            onClick={() => exportSource('html')}
          >
            Export HTML
          </button>
          <button className="button button-primary" onClick={printResume}>
            Print / PDF
          </button>
        </div>
      </header>
      <section className="workspace" aria-label="Resume workspace">
        <aside className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Workspace</p>
              <input
                className="resume-name"
                value={resume.name}
                aria-label="Resume name"
                onChange={(event) => update('name', event.target.value)}
              />
            </div>
            <button className="export-link" onClick={() => exportSource('css')}>
              Export CSS
            </button>
          </div>
          <div className="resume-list" aria-label="Saved resumes">
            {documents.map((item) => (
              <button
                key={item.id}
                className={
                  item.id === resume.id
                    ? 'resume-list-item active'
                    : 'resume-list-item'
                }
                onClick={() =>
                  void navigate({
                    to: '/editor/$resumeId',
                    params: { resumeId: item.id },
                  })
                }
              >
                {item.name}
              </button>
            ))}
            <button className="new-resume" onClick={() => void createResume()}>
              + New resume
            </button>
          </div>
          <div
            className="editor-tabs"
            role="tablist"
            aria-label="Source editors"
          >
            <button
              className={
                activeEditor === 'html' ? 'editor-tab active' : 'editor-tab'
              }
              onClick={() => setActiveEditor('html')}
              role="tab"
              aria-selected={activeEditor === 'html'}
            >
              HTML
            </button>
            <button
              className={
                activeEditor === 'css' ? 'editor-tab active' : 'editor-tab'
              }
              onClick={() => setActiveEditor('css')}
              role="tab"
              aria-selected={activeEditor === 'css'}
            >
              CSS
            </button>
          </div>
          <div className="editor-wrap">
            <label htmlFor="source-editor" className="sr-only">
              {activeEditor.toUpperCase()} source
            </label>
            <CodeEditor
              kind={activeEditor}
              value={resume[activeEditor]}
              onChange={(value) => update(activeEditor, value)}
            />
          </div>
          <div className="editor-footer">
            <p className="editor-hint">
              Edit source directly. Changes save locally.
            </p>
            <button className="delete-link" onClick={deleteResume}>
              Delete resume
            </button>
          </div>
        </aside>
        <section className="preview-panel">
          <div className="preview-heading">
            <div>
              <p className="panel-kicker">Live preview</p>
              <h1>Paper view</h1>
            </div>
            <div className="preview-controls">
              <span className="page-label">
                A4 · {pageCount} {pageCount === 1 ? 'page' : 'pages'}
              </span>
              <button
                className="zoom-button"
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="zoom-value">{Math.round(zoom * 100)}%</span>
              <button
                className="zoom-button"
                onClick={() => setZoom((value) => Math.min(1.2, value + 0.1))}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          <div
            className="preview-stage"
            ref={previewStageRef}
            style={{ '--page-count': pageCount } as React.CSSProperties}
          >
            <div
              className="resume-frame-shell"
              style={{
                width: `${210 * fittedZoom}mm`,
                height: `${297 * pageCount * fittedZoom}mm`,
              }}
            >
              <iframe
                ref={previewRef}
                title="Resume preview"
                className="resume-frame"
                style={{
                  height: `${297 * pageCount}mm`,
                  transform: `scale(${fittedZoom})`,
                }}
                sandbox="allow-scripts"
                srcDoc={preview}
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
