import { useEffect, useRef, type ReactNode } from 'react'

type AppDialogProps = {
  open: boolean
  title: string
  description?: string
  icon?: ReactNode
  tone?: 'default' | 'danger'
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
}

export function AppDialog({
  open,
  title,
  description,
  icon,
  tone = 'default',
  onClose,
  children,
  actions,
}: AppDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const focusTimeout = window.setTimeout(() => dialogRef.current?.focus(), 0)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimeout)
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null

  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-dialog-title`
  const descriptionId = `${titleId}-description`

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={`app-dialog island-shell app-dialog-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="app-dialog-header">
          <div className="app-dialog-heading">
            {icon ? <span className="app-dialog-icon">{icon}</span> : null}
            <div>
              <p className="panel-kicker">ResuMe</p>
              <h2 id={titleId}>{title}</h2>
              {description ? <p id={descriptionId}>{description}</p> : null}
            </div>
          </div>
          <button
            className="dialog-close"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="app-dialog-content">{children}</div>
        {actions ? <div className="dialog-actions">{actions}</div> : null}
      </div>
    </div>
  )
}
