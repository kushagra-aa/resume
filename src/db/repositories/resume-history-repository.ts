import type { ResumeDocument } from '#/models/resume'
import type { ResumeHistoryEntry } from '#/models/resume-history'
import type { StructuredResume } from '#/models/structured-resume'

import { resumeDatabase } from '../client'

const MAX_HISTORY_ENTRIES = 30
const CHECKPOINT_INTERVAL_MS = 2 * 60 * 1000

export const resumeHistoryRepository = {
  async recordBeforeUpdate(
    previous: ResumeDocument | StructuredResume,
    next: ResumeDocument | StructuredResume,
    kind: ResumeHistoryEntry['kind'],
    force = false,
  ) {
    if (JSON.stringify(previous) === JSON.stringify(next)) return

    const entries = await resumeDatabase.resumeHistory
      .where('resumeId')
      .equals(previous.id)
      .toArray()
    const latest = entries.reduce<ResumeHistoryEntry | null>(
      (currentLatest, entry) =>
        currentLatest === null || entry.createdAt > currentLatest.createdAt
          ? entry
          : currentLatest,
      null,
    )
    if (
      !force &&
      latest !== null &&
      latest.kind === kind &&
      Date.now() - Date.parse(latest.createdAt) < CHECKPOINT_INTERVAL_MS
    )
      return

    const entry: ResumeHistoryEntry = {
      id: crypto.randomUUID(),
      resumeId: previous.id,
      kind,
      name: previous.name,
      createdAt: new Date().toISOString(),
      snapshot: structuredClone(previous),
    }
    await resumeDatabase.resumeHistory.add(entry)

    const ordered = [...entries, entry].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    await Promise.all(
      ordered
        .slice(MAX_HISTORY_ENTRIES)
        .map(({ id }) => resumeDatabase.resumeHistory.delete(id)),
    )
  },

  async list(resumeId: string) {
    const entries = await resumeDatabase.resumeHistory
      .where('resumeId')
      .equals(resumeId)
      .toArray()
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async deleteByResumeId(resumeId: string) {
    const entries = await resumeDatabase.resumeHistory
      .where('resumeId')
      .equals(resumeId)
      .toArray()
    await resumeDatabase.resumeHistory.bulkDelete(entries.map(({ id }) => id))
  },
}
