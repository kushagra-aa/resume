import { History, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppDialog } from '#/components/app-dialog'
import { resumeHistoryRepository } from '#/db/repositories/resume-history-repository'
import type { ResumeHistoryEntry } from '#/models/resume-history'

export function ResumeHistoryDialog({
  resumeId,
  onRestore,
}: {
  resumeId: string
  onRestore: (entry: ResumeHistoryEntry) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ResumeHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    void resumeHistoryRepository
      .list(resumeId)
      .then(setEntries)
      .catch(() => setError('Resume history could not be loaded.'))
      .finally(() => setLoading(false))
  }, [open, resumeId])

  async function restore(entry: ResumeHistoryEntry) {
    setRestoringId(entry.id)
    setError(null)
    try {
      await onRestore(entry)
      setOpen(false)
    } catch {
      setError('This version could not be restored.')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <>
      <button
        className="button button-secondary"
        aria-label="Resume history"
        onClick={() => setOpen(true)}
      >
        <History size={14} aria-hidden="true" /> History
      </button>
      <AppDialog
        open={open}
        title="Resume history"
        description="Saved checkpoints are kept locally and remain available after restoring an older version."
        onClose={() => setOpen(false)}
      >
        {loading ? <p className="dashboard-message">Loading history…</p> : null}
        {!loading && entries.length === 0 ? (
          <p className="dashboard-muted">
            No checkpoints yet. A checkpoint is created when saved content
            changes.
          </p>
        ) : null}
        {error ? <p className="dialog-error">{error}</p> : null}
        <ol className="resume-history-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <div>
                <strong>{entry.name}</strong>
                <time dateTime={entry.createdAt}>
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </div>
              <button
                className="button button-ghost"
                disabled={restoringId !== null}
                onClick={() => void restore(entry)}
              >
                <RotateCcw size={14} aria-hidden="true" />
                {restoringId === entry.id ? 'Restoring…' : 'Restore'}
              </button>
            </li>
          ))}
        </ol>
      </AppDialog>
    </>
  )
}
