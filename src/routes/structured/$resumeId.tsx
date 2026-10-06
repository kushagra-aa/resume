import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Download, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppHeader } from '#/components/app-header'
import { BackButton } from '#/components/back-button'
import { ThemeToggle } from '#/components/theme-toggle'
import { createResumeSrcDoc } from '#/features/resume/runtime'
import { exportResumePackage } from '#/features/resume/source-package'
import { loadStructuredResumeDocument } from '#/features/resumes/structured-renderer'
import type { ResumeDocument } from '#/models/resume'

export const Route = createFileRoute('/structured/$resumeId')({
  component: StructuredResumePreview,
})

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

function StructuredResumePreview() {
  const { resumeId } = Route.useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState<ResumeDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStructuredResumeDocument(resumeId)
      .then((loaded) => {
        if (loaded) setResume(loaded)
        else setError('That resume could not be found.')
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'The resume could not be loaded.',
        ),
      )
  }, [resumeId])

  if (!resume)
    return (
      <main className="print-shell">
        <p className={error ? 'dashboard-message error' : 'dashboard-message'}>
          {error ?? 'Loading resume preview…'}
        </p>
        <BackButton
          label="Back to dashboard"
          variant="primary"
          onClick={() => void navigate({ to: '/' })}
        />
      </main>
    )

  return (
    <main className="print-shell">
      <AppHeader
        className="print-controls"
        showBrand={false}
        leading={
          <BackButton
            label="Dashboard"
            onClick={() => void navigate({ to: '/' })}
          />
        }
      >
        <ThemeToggle />
        <button
          className="button button-secondary"
          onClick={() => downloadSource(resume, 'html')}
        >
          <Download size={14} /> HTML
        </button>
        <button
          className="button button-secondary"
          onClick={() => downloadSource(resume, 'css')}
        >
          <Download size={14} /> CSS
        </button>
        <button
          className="button button-secondary"
          onClick={() => exportResumePackage(resume)}
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
      <iframe
        className="print-frame structured-preview-frame"
        title={`${resume.name} preview`}
        sandbox="allow-scripts"
        srcDoc={createResumeSrcDoc(resume)}
      />
    </main>
  )
}
