import { useNavigate } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { AppHeader } from '#/components/app-header'
import { BackButton } from '#/components/back-button'
import { customTemplateRepository } from '#/db/repositories/custom-template-repository'
import {
  CodeEditor,
  formatSource,
  type EditorKind,
} from '#/features/editor/components/resume-editor'
import { createResumeSrcDoc } from '#/features/resume/runtime'
import { exportTemplatePackage } from '#/features/resume/source-package'
import { createTemplatePreviewDocument } from '#/features/templates/template-preview'
import type { CustomTemplate } from '#/features/templates/template-types'

export function CustomTemplateEditor({ templateId }: { templateId: string }) {
  const navigate = useNavigate()
  const [template, setTemplate] = useState<CustomTemplate | null>(null)
  const [activeEditor, setActiveEditor] = useState<EditorKind>('html')
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState('Loading…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    customTemplateRepository
      .get(templateId)
      .then((loaded) => {
        if (cancelled) return
        if (!loaded) {
          setError('That custom template could not be found.')
          return
        }
        setTemplate(loaded)
        setSaveStatus('Saved locally')
      })
      .catch(() => {
        if (!cancelled) setError('Custom templates could not be loaded.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [templateId])

  useEffect(() => {
    if (!dirty || !template) return
    setSaveStatus('Saving…')
    const timeout = window.setTimeout(() => {
      customTemplateRepository
        .update({ ...template, updatedAt: new Date().toISOString() })
        .then((saved) => {
          setTemplate(saved)
          setDirty(false)
          setSaveStatus('Saved locally')
        })
        .catch(() => setSaveStatus('Could not save'))
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [dirty, template])

  const preview = useMemo(() => {
    if (!template) return ''
    return createResumeSrcDoc(createTemplatePreviewDocument(template), false)
  }, [template])

  function update(field: 'name' | 'html' | 'css', value: string) {
    setTemplate((current) => (current ? { ...current, [field]: value } : null))
    setDirty(true)
  }

  function formatActiveSource() {
    if (!template) return
    update(activeEditor, formatSource(template[activeEditor], activeEditor))
  }

  if (loading || !template)
    return (
      <main className="app-shell">
        <p className={error ? 'dashboard-message error' : 'dashboard-message'}>
          {error ?? 'Loading custom template…'}
        </p>
        {error ? (
          <BackButton
            label="Back to templates"
            variant="primary"
            onClick={() => void navigate({ to: '/' })}
          />
        ) : null}
      </main>
    )

  return (
    <main className="app-shell">
      <AppHeader
        className="editor-header"
        leading={
          <BackButton
            label="Templates"
            onClick={() => void navigate({ to: '/' })}
          />
        }
      >
        <span className="save-status">
          <span className="status-dot" />
          {saveStatus}
        </span>
        <button
          className="button button-secondary"
          onClick={() => exportTemplatePackage(template)}
        >
          <Download size={14} /> Export template
        </button>
      </AppHeader>
      <section className="workspace" aria-label="Custom template workspace">
        <aside className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Power Mode · Custom template</p>
              <input
                className="resume-name"
                value={template.name}
                aria-label="Template name"
                onChange={(event) => update('name', event.target.value)}
              />
            </div>
          </div>
          <div
            className="editor-tabs"
            role="tablist"
            aria-label="Template source editors"
          >
            {(['html', 'css'] as const).map((kind) => (
              <button
                className={
                  activeEditor === kind ? 'editor-tab active' : 'editor-tab'
                }
                key={kind}
                onClick={() => setActiveEditor(kind)}
                role="tab"
                aria-selected={activeEditor === kind}
              >
                {kind.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="editor-wrap">
            <CodeEditor
              kind={activeEditor}
              value={template[activeEditor]}
              onChange={(value) => update(activeEditor, value)}
              onFormat={formatActiveSource}
            />
          </div>
          <div className="editor-footer">
            <p className="editor-hint">
              Edit this global template. Resumes using it will use the updated
              design; profile data remains unchanged.
            </p>
          </div>
        </aside>
        <section className="preview-panel" aria-label="Template preview">
          <div className="preview-heading">
            <div>
              <p className="panel-kicker">Sample content</p>
              <h1>Template preview</h1>
            </div>
          </div>
          <div className="preview-stage">
            <div
              className="resume-frame-shell"
              style={{ width: '168mm', height: '237.6mm' }}
            >
              <iframe
                className="resume-frame"
                style={{ height: '297mm', transform: 'scale(0.8)' }}
                title={`${template.name} sample preview`}
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
