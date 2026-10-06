import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { AppHeader } from '#/components/app-header'
import { BackButton } from '#/components/back-button'
import { resumeRepository } from '#/db/repositories/resume-repository'
import { createResumeSrcDoc } from '#/features/resume/runtime'
import { loadStructuredResumeDocument } from '#/features/resumes/structured-renderer'
import type { ResumeDocument } from '#/models/resume'

const A4_PAGE_HEIGHT_PX = 1123

export const Route = createFileRoute('/print/$resumeId')({
  component: PrintRoute,
})

function PrintRoute() {
  const { resumeId } = useParams({ strict: false })
  const navigate = useNavigate()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [resume, setResume] = useState<ResumeDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [frameHeight, setFrameHeight] = useState<number | null>(null)
  const pageCount = Math.max(
    1,
    Math.ceil((frameHeight ?? A4_PAGE_HEIGHT_PX) / A4_PAGE_HEIGHT_PX),
  )

  useEffect(() => {
    setFrameLoaded(false)
    setFrameHeight(null)
  }, [resumeId])

  useEffect(() => {
    if (!resumeId) return
    ;(resumeId.startsWith('structured-')
      ? loadStructuredResumeDocument(resumeId.slice('structured-'.length))
      : resumeRepository.get(resumeId)
    )
      .then((loaded) => {
        if (loaded) setResume(loaded)
        else setError('That resume could not be found.')
      })
      .catch(() => setError('The resume could not be loaded for printing.'))
  }, [resumeId])

  useEffect(() => {
    const onPreviewMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== frameRef.current?.contentWindow) return
      if (!event.data || typeof event.data !== 'object') return
      const data = event.data as { type?: unknown; height?: unknown }
      if (
        data.type !== 'resume-preview-height' ||
        typeof data.height !== 'number' ||
        !Number.isFinite(data.height)
      )
        return
      setFrameHeight(Math.max(A4_PAGE_HEIGHT_PX, Math.min(data.height, 20000)))
    }
    window.addEventListener('message', onPreviewMessage)
    return () => window.removeEventListener('message', onPreviewMessage)
  }, [])

  useEffect(() => {
    if (
      !resume ||
      !frameLoaded ||
      frameHeight === null ||
      window.sessionStorage.getItem('resume:print-on-load') !== resume.id
    )
      return
    window.sessionStorage.removeItem('resume:print-on-load')
    const timeout = window.setTimeout(() => printResume(), 150)
    return () => window.clearTimeout(timeout)
  }, [frameHeight, frameLoaded, resume])

  function printResume() {
    const frameWindow = frameRef.current?.contentWindow
    if (frameWindow) {
      frameWindow.postMessage({ type: 'resume-print' }, '*')
      return
    }
    window.print()
  }

  if (error || !resume)
    return (
      <main className="print-shell">
        <p className="dashboard-message">{error ?? 'Loading print preview…'}</p>
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
    <main className="print-shell">
      <AppHeader
        className="print-controls"
        showBrand={false}
        leading={
          <div className="print-context">
            <BackButton
              label="Back to editor"
              onClick={() => {
                if (resumeId?.startsWith('structured-')) {
                  void navigate({
                    to: '/structured/$resumeId',
                    params: { resumeId: resumeId.slice('structured-'.length) },
                  })
                } else {
                  void navigate({
                    to: '/editor/$resumeId',
                    params: { resumeId: resume.id },
                  })
                }
              }}
            />
            <span className="print-page-count">
              A4 · {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </span>
          </div>
        }
      >
        <button className="button button-primary" onClick={printResume}>
          Print / Save PDF
        </button>
      </AppHeader>
      <iframe
        ref={frameRef}
        className="print-frame"
        title={`${resume.name} print preview`}
        sandbox="allow-scripts allow-modals"
        onLoad={() => {
          frameRef.current?.contentWindow?.focus()
          setFrameLoaded(true)
        }}
        style={{ height: `${297 * pageCount}mm` }}
        srcDoc={createResumeSrcDoc(resume, true, 'print')}
      />
    </main>
  )
}
