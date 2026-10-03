import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { resumeRepository } from '#/db/repositories/resume-repository'
import { createResumeSrcDoc } from '#/features/resume/runtime'
import type { ResumeDocument } from '#/models/resume'

export const Route = createFileRoute('/print/$resumeId')({
  component: PrintRoute,
})

function PrintRoute() {
  const { resumeId } = useParams({ strict: false })
  const navigate = useNavigate()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [resume, setResume] = useState<ResumeDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!resumeId) return
    resumeRepository
      .get(resumeId)
      .then((loaded) => {
        if (loaded) setResume(loaded)
        else setError('That resume could not be found.')
      })
      .catch(() => setError('The resume could not be loaded for printing.'))
  }, [resumeId])

  useEffect(() => {
    if (
      !resume ||
      window.sessionStorage.getItem('resume:print-on-load') !== resume.id
    )
      return
    window.sessionStorage.removeItem('resume:print-on-load')
    const timeout = window.setTimeout(() => window.print(), 150)
    return () => window.clearTimeout(timeout)
  }, [resume])

  function print() {
    // Print the dedicated route itself. Its print CSS removes the controls,
    // leaving only the isolated resume iframe in the browser print output.
    window.focus()
    window.print()
  }

  if (error || !resume)
    return (
      <main className="print-shell">
        <p className="dashboard-message">{error ?? 'Loading print preview…'}</p>
        {error ? (
          <button
            className="button button-primary"
            onClick={() => void navigate({ to: '/' })}
          >
            Back to dashboard
          </button>
        ) : null}
      </main>
    )

  return (
    <main className="print-shell">
      <div className="print-controls">
        <button
          className="button button-secondary"
          onClick={() =>
            void navigate({
              to: '/editor/$resumeId',
              params: { resumeId: resume.id },
            })
          }
        >
          Back to editor
        </button>
        <button className="button button-primary" onClick={print}>
          Print / Save PDF
        </button>
      </div>
      <iframe
        ref={frameRef}
        className="print-frame"
        title={`${resume.name} print preview`}
        sandbox="allow-scripts allow-modals"
        onLoad={() => frameRef.current?.contentWindow?.focus()}
        srcDoc={createResumeSrcDoc(resume, false, 'print')}
      />
    </main>
  )
}
